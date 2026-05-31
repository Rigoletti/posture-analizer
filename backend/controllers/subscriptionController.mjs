import Subscription from '../models/Subscription.mjs';
import User from '../models/User.mjs';
import crypto from 'crypto';
import axios from 'axios';

// Конфигурация ЮKassa
const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;
const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3';

// Базовые цены подписок
const PLAN_PRICES = {
  basic: 299,
  premium: 599
};

// Получение базовой авторизации для ЮKassa
const getYookassaAuth = () => {
  const auth = Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64');
  return {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json'
  };
};

// Функция для активации подписки
const activateSubscription = async (subscription, paymentData) => {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 30);
  
  const oldStatus = subscription.status;
  
  subscription.status = 'active';
  subscription.startDate = now;
  subscription.endDate = endDate;
  
  if (!subscription.paymentHistory) {
    subscription.paymentHistory = [];
  }
  
  subscription.paymentHistory.push({
    paymentId: paymentData.id || subscription.yookassaPaymentId,
    amount: paymentData.amount?.value || PLAN_PRICES[subscription.plan],
    status: 'succeeded',
    date: now,
    receipt: paymentData.receipt_registration || {}
  });
  
  await subscription.save();
  console.log('Subscription activated:', {
    id: subscription._id,
    oldStatus,
    newStatus: subscription.status,
    endDate
  });
  
  // Обновляем пользователя
  const user = await User.findById(subscription.user);
  if (user) {
    user.hasPremiumAccess = true;
    user.subscriptionEndsAt = endDate;
    user.subscription = subscription._id;
    await user.save();
    console.log('User updated:', {
      userId: user._id,
      email: user.email,
      hasPremiumAccess: user.hasPremiumAccess,
      subscriptionEndsAt: user.subscriptionEndsAt
    });
  }
  
  return true;
};

// Создание платежа для подписки
export const createPayment = async (req, res) => {
  try {
    const { plan, returnUrl } = req.body;
    const userId = req.user._id;
    
    console.log('Creating YooKassa payment for user:', userId, 'plan:', plan);
    
    if (!PLAN_PRICES[plan]) {
      return res.status(400).json({
        success: false,
        error: 'Неверный тариф подписки'
      });
    }
    
    const price = PLAN_PRICES[plan];
    const planName = plan === 'basic' ? 'Базовый' : 'Премиум';
    const idempotenceKey = crypto.randomUUID();
    
    let subscription = await Subscription.findOne({ user: userId });
    const internalPaymentId = crypto.randomUUID();
    
    if (!subscription) {
      subscription = new Subscription({
        user: userId,
        plan: plan,
        status: 'pending',
        paymentId: internalPaymentId,
        startDate: null,
        endDate: null,
        paymentHistory: []
      });
    } else {
      subscription.plan = plan;
      subscription.paymentId = internalPaymentId;
      subscription.status = 'pending';
      if (!subscription.paymentHistory) {
        subscription.paymentHistory = [];
      }
    }
    
    await subscription.save();
    
    const successUrl = returnUrl || `${process.env.CLIENT_URL}/profile/subscription/success`;
    
    const paymentData = {
      amount: {
        value: price.toFixed(2),
        currency: 'RUB'
      },
      payment_method_data: {
        type: 'bank_card'
      },
      confirmation: {
        type: 'redirect',
        return_url: successUrl
      },
      description: `Подписка "${planName}" на 30 дней`,
      metadata: {
        userId: userId.toString(),
        subscriptionId: subscription._id.toString(),
        plan: plan,
        internalPaymentId: internalPaymentId
      },
      capture: true
    };
    
    const response = await axios.post(
      `${YOOKASSA_API_URL}/payments`,
      paymentData,
      {
        headers: {
          ...getYookassaAuth(),
          'Idempotence-Key': idempotenceKey
        }
      }
    );
    
    const yookassaPayment = response.data;
    
    subscription.yookassaPaymentId = yookassaPayment.id;
    await subscription.save();
    
    res.status(200).json({
      success: true,
      data: {
        paymentId: yookassaPayment.id,
        confirmationUrl: yookassaPayment.confirmation.confirmation_url,
        amount: price,
        plan: plan
      }
    });
    
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при создании платежа: ' + (error.response?.data?.description || error.message)
    });
  }
};

// Webhook для ЮKassa
export const yookassaWebhook = async (req, res) => {
  try {
    const event = req.body;
    
    console.log('YooKassa webhook received:', JSON.stringify(event, null, 2));
    
    // Обрабатываем разные типы событий
    if (event.type === 'payment.succeeded' || (event.object && event.object.status === 'succeeded')) {
      const payment = event.object || event;
      const yookassaPaymentId = payment.id;
      const metadata = payment.metadata || {};
      
      console.log('Processing successful payment:', yookassaPaymentId);
      
      // Ищем подписку по разным полям
      let subscription = await Subscription.findOne({ yookassaPaymentId: yookassaPaymentId });
      
      if (!subscription && metadata.internalPaymentId) {
        subscription = await Subscription.findOne({ paymentId: metadata.internalPaymentId });
      }
      
      if (!subscription && metadata.subscriptionId) {
        subscription = await Subscription.findById(metadata.subscriptionId);
      }
      
      if (!subscription && metadata.userId) {
        subscription = await Subscription.findOne({ user: metadata.userId });
      }
      
      if (!subscription) {
        // Пробуем найти по paymentId в истории
        subscription = await Subscription.findOne({
          'paymentHistory.paymentId': yookassaPaymentId
        });
      }
      
      if (subscription) {
        console.log('Found subscription:', subscription._id, 'Current status:', subscription.status);
        
        // Активируем подписку только если она не активна и не отменена
        if (subscription.status !== 'active' && subscription.status !== 'cancelled') {
          await activateSubscription(subscription, payment);
          console.log('Subscription activated successfully via webhook');
        } else {
          console.log('Subscription already active or cancelled, skipping activation');
        }
      } else {
        console.log('No subscription found for payment:', yookassaPaymentId);
        
        // Если подписка не найдена, но есть userId в metadata, создаем новую
        if (metadata.userId) {
          console.log('Creating new subscription for user:', metadata.userId);
          
          const user = await User.findById(metadata.userId);
          if (user) {
            const plan = metadata.plan || 'premium';
            const newSubscription = new Subscription({
              user: metadata.userId,
              plan: plan,
              status: 'active',
              yookassaPaymentId: yookassaPaymentId,
              paymentId: metadata.internalPaymentId || crypto.randomUUID(),
              startDate: new Date(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              paymentHistory: [{
                paymentId: yookassaPaymentId,
                amount: payment.amount?.value || PLAN_PRICES[plan],
                status: 'succeeded',
                date: new Date(),
                receipt: {}
              }]
            });
            
            await newSubscription.save();
            
            user.hasPremiumAccess = true;
            user.subscriptionEndsAt = newSubscription.endDate;
            user.subscription = newSubscription._id;
            await user.save();
            
            console.log('Created new subscription from webhook');
          }
        }
      }
    } else if (event.type === 'payment.waiting_for_capture') {
      console.log('Payment waiting for capture:', event.object?.id);
      // Опционально: можно обработать ожидание подтверждения
    } else {
      console.log('Unhandled webhook event type:', event.type);
    }
    
    // Всегда возвращаем 200, даже при ошибках
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Всегда возвращаем 200, чтобы ЮKassa не повторял отправку
    res.status(200).json({ received: true, error: error.message });
  }
};

// Проверка статуса платежа
export const checkPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user._id;
    
    console.log('Checking payment status for:', paymentId, 'User:', userId);
    
    let subscription = await Subscription.findOne({ 
      $or: [
        { paymentId: paymentId },
        { yookassaPaymentId: paymentId }
      ],
      user: userId 
    });
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Платеж не найден'
      });
    }
    
    console.log('Found subscription:', subscription._id, 'Status:', subscription.status);
    
    // Проверяем статус в ЮKassa, если подписка не активна
    if (subscription.yookassaPaymentId && subscription.status !== 'active' && subscription.status !== 'cancelled') {
      try {
        const response = await axios.get(
          `${YOOKASSA_API_URL}/payments/${subscription.yookassaPaymentId}`,
          { headers: getYookassaAuth() }
        );
        
        const yookassaPayment = response.data;
        console.log('YooKassa payment status:', yookassaPayment.status);
        
        // Обрабатываем разные статусы
        if (yookassaPayment.status === 'succeeded') {
          await activateSubscription(subscription, yookassaPayment);
          console.log('Subscription activated via status check');
        } else if (yookassaPayment.status === 'waiting_for_capture') {
          // Платеж ожидает подтверждения, возможно нужно подождать
          console.log('Payment waiting for capture, will check again later');
        }
      } catch (yookassaError) {
        console.error('Error checking YooKassa payment:', yookassaError.message);
      }
    }
    
    // Обновляем подписку после возможной активации
    subscription = await Subscription.findById(subscription._id);
    
    const isActive = subscription.isActive();
    const remainingDays = subscription.getRemainingDays();
    
    res.status(200).json({
      success: true,
      data: {
        paymentStatus: subscription.status === 'active' ? 'succeeded' : subscription.status,
        subscriptionStatus: subscription.status,
        isActive: isActive,
        endDate: subscription.endDate,
        remainingDays: remainingDays,
        plan: subscription.plan
      }
    });
  } catch (error) {
    console.error('Check payment status error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при проверке статуса платежа: ' + error.message
    });
  }
};

// Получение информации о подписке
export const getMySubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('Getting subscription for user:', userId);
    
    let user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }
    
    let subscription = await Subscription.findOne({ user: userId });
    const now = new Date();
    let needsUpdate = false;
    
    // Проверяем и обновляем статус подписки через ЮKassa если нужно
    if (subscription && subscription.yookassaPaymentId && subscription.status === 'pending') {
      try {
        const response = await axios.get(
          `${YOOKASSA_API_URL}/payments/${subscription.yookassaPaymentId}`,
          { headers: getYookassaAuth() }
        );
        
        if (response.data.status === 'succeeded') {
          await activateSubscription(subscription, response.data);
          subscription = await Subscription.findById(subscription._id);
          console.log('Subscription activated during getMySubscription');
        }
      } catch (error) {
        console.error('Error checking payment during getMySubscription:', error.message);
      }
    }
    
    if (subscription) {
      console.log('Found subscription:', {
        id: subscription._id,
        status: subscription.status,
        endDate: subscription.endDate,
        plan: subscription.plan
      });
      
      // Синхронизируем статус
      if (subscription.status !== 'cancelled') {
        const isActiveByDate = subscription.endDate && new Date(subscription.endDate) > now;
        
        if (isActiveByDate && subscription.status !== 'active') {
          subscription.status = 'active';
          needsUpdate = true;
          console.log('Fixed subscription status to active');
        }
        
        if (!isActiveByDate && subscription.status === 'active') {
          subscription.status = 'expired';
          needsUpdate = true;
          console.log('Fixed subscription status to expired');
        }
      }
      
      if (needsUpdate) {
        await subscription.save();
      }
      
      // Синхронизируем с пользователем
      if (subscription.endDate && new Date(subscription.endDate) > now && subscription.status !== 'cancelled') {
        if (!user.hasPremiumAccess || !user.subscriptionEndsAt || 
            new Date(user.subscriptionEndsAt).getTime() !== new Date(subscription.endDate).getTime()) {
          user.hasPremiumAccess = true;
          user.subscriptionEndsAt = subscription.endDate;
          user.subscription = subscription._id;
          await user.save();
          console.log('Synced user from subscription');
        }
      } else if (subscription.endDate && new Date(subscription.endDate) <= now && subscription.status !== 'cancelled') {
        if (user.hasPremiumAccess) {
          user.hasPremiumAccess = false;
          await user.save();
          console.log('Disabled user premium access');
        }
      }
    }
    
    // Обновляем пользователя
    const updatedUser = await User.findById(userId).populate('subscription');
    subscription = updatedUser.subscription;
    
    let hasActiveSubscription = false;
    let remainingDays = 0;
    let currentPlan = null;
    
    if (subscription) {
      if (subscription.status === 'cancelled') {
        if (subscription.endDate) {
          const endDate = new Date(subscription.endDate);
          if (endDate > now) {
            hasActiveSubscription = true;
            remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          }
        }
        currentPlan = subscription.plan;
      } else {
        hasActiveSubscription = subscription.isActive();
        remainingDays = subscription.getRemainingDays();
        currentPlan = subscription.plan;
      }
    }
    
    // Финальная проверка через пользователя
    const finalUserHasAccess = updatedUser.hasPremiumAccess === true && 
      updatedUser.subscriptionEndsAt && new Date(updatedUser.subscriptionEndsAt) > now;
    
    if (finalUserHasAccess && !hasActiveSubscription) {
      hasActiveSubscription = true;
      remainingDays = Math.ceil((new Date(updatedUser.subscriptionEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      currentPlan = subscription?.plan || 'premium';
      console.log('User has premium access, forcing hasActiveSubscription=true');
    }
    
    const availablePlans = [
      {
        id: 'basic',
        name: 'Базовый',
        price: 299,
        description: 'Базовый доступ к функциям приложения на 30 дней',
        features: [
          'До 30 сеансов в месяц',
          'Базовая статистика осанки',
          'Сохранение истории измерений (30 дней)',
          'Основные рекомендации',
          'Email поддержка'
        ]
      },
      {
        id: 'premium',
        name: 'Премиум',
        price: 599,
        description: 'Полный доступ ко всем функциям приложения на 30 дней',
        features: [
          'Неограниченное количество сеансов',
          'Детальная статистика осанки',
          'Сохранение истории измерений',
          'Персональные рекомендации',
          'Расширенная аналитика',
          'Экспорт данных в PDF',
          'Приоритетная поддержка'
        ]
      }
    ];
    
    res.status(200).json({
      success: true,
      data: {
        subscription: subscription ? {
          id: subscription._id,
          plan: subscription.plan,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          paymentHistory: subscription.paymentHistory || [],
          autoRenew: subscription.autoRenew,
          remainingDays: remainingDays,
          hasActiveSubscription: hasActiveSubscription
        } : null,
        availablePlans: availablePlans,
        hasActiveSubscription: hasActiveSubscription,
        currentPlan: currentPlan
      }
    });
  } catch (error) {
    console.error('Get my subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении информации о подписке: ' + error.message
    });
  }
};

// Отмена подписки
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('Cancel subscription for user:', userId);
    
    let subscription = await Subscription.findOne({ user: userId });
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Подписка не найдена'
      });
    }
    
    if (subscription.status === 'cancelled') {
      return res.status(200).json({
        success: true,
        alreadyCancelled: true,
        message: 'Подписка уже отменена',
        data: {
          status: subscription.status,
          endDate: subscription.endDate
        }
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }
    
    const now = new Date();
    let canCancel = false;
    
    if (subscription.status === 'active' || subscription.status === 'pending') {
      canCancel = true;
    }
    
    if (!canCancel) {
      return res.status(200).json({
        success: true,
        alreadyCancelled: true,
        message: 'Подписка не может быть отменена',
        data: {
          status: subscription.status,
          endDate: subscription.endDate
        }
      });
    }
    
    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    await subscription.save();
    
    // Не отключаем доступ сразу, только отключаем автопродление
    // user.hasPremiumAccess оставляем true до окончания срока
    
    const endDateStr = subscription.endDate 
      ? new Date(subscription.endDate).toLocaleDateString('ru-RU')
      : 'неизвестно';
    
    res.status(200).json({
      success: true,
      message: `Подписка отменена. Доступ к платным функциям сохранится до ${endDateStr}`,
      data: {
        status: subscription.status,
        endDate: subscription.endDate,
        remainingDays: subscription.endDate ? subscription.getRemainingDays() : 0
      }
    });
    
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при отмене подписки: ' + error.message
    });
  }
};

// Принудительная синхронизация подписки пользователя
export const syncUserSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('Syncing subscription for user:', userId);
    
    const user = await User.findById(userId);
    let subscription = await Subscription.findOne({ user: userId });
    
    // Если подписка в статусе pending, проверяем платеж
    if (subscription && subscription.status === 'pending' && subscription.yookassaPaymentId) {
      try {
        const response = await axios.get(
          `${YOOKASSA_API_URL}/payments/${subscription.yookassaPaymentId}`,
          { headers: getYookassaAuth() }
        );
        
        if (response.data.status === 'succeeded') {
          await activateSubscription(subscription, response.data);
          subscription = await Subscription.findById(subscription._id);
          console.log('Subscription activated during sync');
        }
      } catch (error) {
        console.error('Error checking payment during sync:', error.message);
      }
    }
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Подписка не найдена'
      });
    }
    
    const now = new Date();
    
    if (subscription.status === 'cancelled') {
      const isActiveByDate = subscription.endDate && new Date(subscription.endDate) > now;
      user.hasPremiumAccess = isActiveByDate;
    } else {
      const isActive = subscription.endDate && new Date(subscription.endDate) > now && subscription.status === 'active';
      user.hasPremiumAccess = isActive;
    }
    
    user.subscriptionEndsAt = subscription.endDate;
    user.subscription = subscription._id;
    await user.save();
    
    console.log('Synced user:', {
      hasPremiumAccess: user.hasPremiumAccess,
      subscriptionEndsAt: user.subscriptionEndsAt,
      subscriptionStatus: subscription.status
    });
    
    res.status(200).json({
      success: true,
      message: 'Данные подписки синхронизированы',
      data: {
        hasPremiumAccess: user.hasPremiumAccess,
        subscriptionEndsAt: user.subscriptionEndsAt,
        subscriptionStatus: subscription.status,
        subscription: subscription
      }
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка синхронизации: ' + error.message
    });
  }
};

export default {
  createPayment,
  checkPaymentStatus,
  getMySubscription,
  cancelSubscription,
  yookassaWebhook,
  syncUserSubscription
};