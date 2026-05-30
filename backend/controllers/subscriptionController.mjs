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
    
    console.log('YooKassa webhook received:', event.object?.id, 'status:', event.object?.status);
    
    if (event.object && event.object.status === 'succeeded') {
      const yookassaPaymentId = event.object.id;
      const metadata = event.object.metadata || {};
      
      let subscription = await Subscription.findOne({ yookassaPaymentId: yookassaPaymentId });
      
      if (!subscription && metadata.internalPaymentId) {
        subscription = await Subscription.findOne({ paymentId: metadata.internalPaymentId });
      }
      
      if (!subscription && metadata.subscriptionId) {
        subscription = await Subscription.findById(metadata.subscriptionId);
      }
      
      if (subscription && subscription.status !== 'active' && subscription.status !== 'cancelled') {
        const now = new Date();
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 30);
        
        subscription.status = 'active';
        subscription.startDate = now;
        subscription.endDate = endDate;
        
        if (!subscription.paymentHistory) {
          subscription.paymentHistory = [];
        }
        
        subscription.paymentHistory.push({
          paymentId: yookassaPaymentId,
          amount: event.object.amount?.value || PLAN_PRICES[subscription.plan],
          status: 'succeeded',
          date: now,
          receipt: event.object.receipt_registration || {}
        });
        
        await subscription.save();
        console.log('Subscription activated via webhook:', subscription._id);
        
        const user = await User.findById(subscription.user);
        if (user) {
          user.hasPremiumAccess = true;
          user.subscriptionEndsAt = endDate;
          user.subscription = subscription._id;
          await user.save();
          console.log('User updated:', user.email);
        }
      }
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ received: true });
  }
};

// Проверка статуса платежа
export const checkPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user._id;
    
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
    
    if (subscription.yookassaPaymentId && subscription.status !== 'active' && subscription.status !== 'cancelled') {
      try {
        const response = await axios.get(
          `${YOOKASSA_API_URL}/payments/${subscription.yookassaPaymentId}`,
          { headers: getYookassaAuth() }
        );
        
        const yookassaPayment = response.data;
        
        if (yookassaPayment.status === 'succeeded') {
          const now = new Date();
          const endDate = new Date(now);
          endDate.setDate(endDate.getDate() + 30);
          
          subscription.status = 'active';
          subscription.startDate = now;
          subscription.endDate = endDate;
          
          subscription.paymentHistory.push({
            paymentId: subscription.yookassaPaymentId,
            amount: yookassaPayment.amount.value,
            status: 'succeeded',
            date: now,
            receipt: {}
          });
          
          await subscription.save();
          
          const user = await User.findById(subscription.user);
          if (user) {
            user.hasPremiumAccess = true;
            user.subscriptionEndsAt = endDate;
            user.subscription = subscription._id;
            await user.save();
          }
        }
      } catch (yookassaError) {
        console.error('Error checking YooKassa payment:', yookassaError.message);
      }
    }
    
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

// Получение информации о подписке (с принудительной синхронизацией, но НЕ перезаписываем cancelled)
export const getMySubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('Getting subscription for user:', userId);
    
    // Находим пользователя
    let user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }
    
    // Находим подписку
    let subscription = await Subscription.findOne({ user: userId });
    
    const now = new Date();
    let needsUserSave = false;
    
    if (subscription) {
      console.log('Found subscription:', {
        id: subscription._id,
        status: subscription.status,
        endDate: subscription.endDate,
        plan: subscription.plan
      });
      
      // НЕ меняем статус cancelled на active!
      // Если подписка отменена, оставляем её отмененной
      if (subscription.status === 'cancelled') {
        console.log('Subscription is cancelled, keeping status cancelled');
        
        // Но проверяем, активна ли она по дате для отображения
        const isActiveByDate = subscription.endDate && new Date(subscription.endDate) > now;
        
        if (isActiveByDate && user.hasPremiumAccess !== true) {
          // Пользователь должен иметь доступ до окончания срока
          user.hasPremiumAccess = true;
          needsUserSave = true;
          console.log('Setting user premium access to true for cancelled subscription (still active until end date)');
        }
      } 
      // Для неотмененных подписок выполняем синхронизацию
      else if (subscription.status !== 'cancelled') {
        // Проверяем, активна ли подписка по дате
        const isActiveByDate = subscription.endDate && new Date(subscription.endDate) > now;
        
        // Если подписка активна по дате, но статус не active - исправляем
        if (isActiveByDate && subscription.status !== 'active') {
          subscription.status = 'active';
          await subscription.save();
          console.log('Fixed subscription status to active');
        }
        
        // Если подписка не активна по дате, но статус active - исправляем
        if (!isActiveByDate && subscription.status === 'active') {
          subscription.status = 'expired';
          await subscription.save();
          console.log('Fixed subscription status to expired');
        }
      }
      
      // СИНХРОНИЗАЦИЯ С ПОЛЬЗОВАТЕЛЕМ (только если подписка не отменена или отменена но активна)
      if (subscription.endDate && new Date(subscription.endDate) > now) {
        if (!user.hasPremiumAccess || !user.subscriptionEndsAt || new Date(user.subscriptionEndsAt).getTime() !== new Date(subscription.endDate).getTime()) {
          user.hasPremiumAccess = true;
          user.subscriptionEndsAt = subscription.endDate;
          user.subscription = subscription._id;
          needsUserSave = true;
          console.log('Synced user from subscription: hasPremiumAccess=true, endDate=', subscription.endDate);
        }
      } else if (subscription.endDate && new Date(subscription.endDate) <= now && subscription.status !== 'cancelled') {
        // Если подписка истекла и не отменена, отключаем доступ
        if (user.hasPremiumAccess) {
          user.hasPremiumAccess = false;
          needsUserSave = true;
          console.log('Subscription expired, disabling user premium access');
        }
      }
    } else {
      console.log('No subscription found in DB');
    }
    
    // Проверяем пользователя на наличие активной подписки без объекта в БД
    if (!subscription && user.hasPremiumAccess && user.subscriptionEndsAt && new Date(user.subscriptionEndsAt) > now) {
      // Создаем подписку из данных пользователя
      subscription = new Subscription({
        user: userId,
        plan: 'premium',
        status: 'active',
        startDate: new Date(),
        endDate: user.subscriptionEndsAt,
        paymentHistory: []
      });
      await subscription.save();
      user.subscription = subscription._id;
      await user.save();
      console.log('Created missing subscription from user data');
      needsUserSave = false;
    }
    
    // Сохраняем изменения пользователя
    if (needsUserSave) {
      await user.save();
    }
    
    // Обновляем пользователя в ответе (перезагружаем из БД)
    const updatedUser = await User.findById(userId).populate('subscription');
    subscription = updatedUser.subscription;
    
    let hasActiveSubscription = false;
    let remainingDays = 0;
    let currentPlan = null;
    
    if (subscription) {
      // Для отмененной подписки проверяем только дату
      if (subscription.status === 'cancelled') {
        if (subscription.endDate) {
          const endDate = new Date(subscription.endDate);
          if (endDate > now) {
            hasActiveSubscription = true;
            remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            console.log('Cancelled subscription still active until', endDate);
          }
        }
        currentPlan = subscription.plan;
      } else {
        hasActiveSubscription = subscription.isActive();
        remainingDays = subscription.getRemainingDays();
        currentPlan = subscription.plan;
      }
    }
    
    // ФИНАЛЬНАЯ ПРОВЕРКА через пользователя
    const finalUserHasAccess = updatedUser.hasPremiumAccess === true && 
      updatedUser.subscriptionEndsAt && new Date(updatedUser.subscriptionEndsAt) > now;
    
    if (finalUserHasAccess && !hasActiveSubscription) {
      hasActiveSubscription = true;
      remainingDays = Math.ceil((new Date(updatedUser.subscriptionEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      currentPlan = subscription?.plan || 'premium';
      console.log('User has premium access, forcing hasActiveSubscription=true');
    }
    
    console.log('Final state:', {
      hasActiveSubscription,
      remainingDays,
      currentPlan,
      subscriptionStatus: subscription?.status,
      userHasPremiumAccess: updatedUser.hasPremiumAccess,
      userSubscriptionEndsAt: updatedUser.subscriptionEndsAt
    });
    
    const subscriptionData = subscription ? {
      id: subscription._id,
      plan: subscription.plan,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      paymentHistory: subscription.paymentHistory || [],
      autoRenew: subscription.autoRenew,
      remainingDays: remainingDays,
      hasActiveSubscription: hasActiveSubscription
    } : {
      hasActiveSubscription: hasActiveSubscription,
      remainingDays: remainingDays,
      endDate: updatedUser.subscriptionEndsAt
    };
    
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
        subscription: subscriptionData,
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
    
    console.log('=== CANCEL SUBSCRIPTION REQUEST ===');
    console.log('User ID:', userId);
    
    // Находим подписку пользователя
    let subscription = await Subscription.findOne({ user: userId });
    
    if (!subscription) {
      console.log('No subscription found for user');
      return res.status(404).json({
        success: false,
        error: 'Подписка не найдена'
      });
    }
    
    console.log('Subscription found:', {
      id: subscription._id,
      status: subscription.status,
      endDate: subscription.endDate,
      plan: subscription.plan
    });
    
    // Если подписка уже отменена
    if (subscription.status === 'cancelled') {
      console.log('Subscription already cancelled');
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
    
    // Находим пользователя
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }
    
    const now = new Date();
    let canCancel = false;
    
    // Проверяем, можно ли отменить подписку
    if (subscription.status === 'active') {
      // Активная подписка - можно отменить
      canCancel = true;
      console.log('Active subscription - can cancel');
    } else if (subscription.status === 'pending') {
      // Ожидающая подписка - можно отменить
      canCancel = true;
      console.log('Pending subscription - can cancel');
    } else {
      console.log('Subscription status:', subscription.status, '- cannot cancel');
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
    
    // Отменяем подписку
    const oldStatus = subscription.status;
    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    await subscription.save();
    
    console.log('Subscription cancelled:', {
      id: subscription._id,
      oldStatus: oldStatus,
      newStatus: subscription.status,
      endDate: subscription.endDate
    });
    
    // Обновляем пользователя - отключаем премиум доступ
    // НО оставляем subscriptionEndsAt, чтобы пользователь знал до какого числа был доступ
    user.hasPremiumAccess = false;
    await user.save();
    console.log('User updated - premium access disabled, endDate remains:', user.subscriptionEndsAt);
    
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
    const subscription = await Subscription.findOne({ user: userId });
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Подписка не найдена'
      });
    }
    
    const now = new Date();
    
    // Для отмененной подписки не меняем hasPremiumAccess
    if (subscription.status === 'cancelled') {
      const isActiveByDate = subscription.endDate && new Date(subscription.endDate) > now;
      user.hasPremiumAccess = isActiveByDate;
      console.log('Cancelled subscription - hasPremiumAccess set to:', isActiveByDate);
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
        subscriptionStatus: subscription.status
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