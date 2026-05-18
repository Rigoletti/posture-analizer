import Subscription from '../models/Subscription.mjs';
import User from '../models/User.mjs';
import crypto from 'crypto';

// Создание платежа для подписки
export const createPayment = async (req, res) => {
  try {
    const { plan, returnUrl } = req.body;
    const userId = req.user._id;
    
    console.log('Creating payment for user:', userId, 'plan:', plan);
    
    // Проверяем, что plan = 'premium' (только одна подписка)
    if (plan !== 'premium') {
      return res.status(400).json({
        success: false,
        error: 'Доступен только премиум тариф'
      });
    }
    
    // Цена подписки
    const price = 599;
    
    // Генерируем уникальный ID платежа
    const paymentId = crypto.randomUUID();
    
    // Проверяем, существует ли уже подписка у пользователя
    let subscription = await Subscription.findOne({ user: userId });
    
    if (!subscription) {
      // Создаем новую подписку
      subscription = new Subscription({
        user: userId,
        plan: 'premium',
        status: 'pending',
        paymentId: paymentId,
        startDate: null,
        endDate: null,
        paymentHistory: []
      });
    } else {
      // Обновляем существующую подписку
      subscription.paymentId = paymentId;
      subscription.status = 'pending';
      if (!subscription.paymentHistory) {
        subscription.paymentHistory = [];
      }
    }
    
    await subscription.save();
    console.log('Subscription created/updated:', subscription._id, 'status:', subscription.status);
    
    // Здесь должен быть реальный запрос к API ЮKassa
    // Для демонстрации используем тестовый эндпоинт
    const confirmationUrl = `http://localhost:5000/api/subscription/payment-test?paymentId=${paymentId}&returnUrl=${encodeURIComponent(returnUrl || 'http://localhost:3000/profile/subscription/success')}`;
    
    res.status(200).json({
      success: true,
      data: {
        paymentId: paymentId,
        confirmationUrl: confirmationUrl,
        amount: price
      }
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при создании платежа: ' + error.message
    });
  }
};

// Тестовый эндпоинт для имитации успешного платежа
export const testPaymentSuccess = async (req, res) => {
  try {
    const { paymentId, returnUrl } = req.query;
    
    console.log('Test payment success for paymentId:', paymentId);
    
    if (!paymentId) {
      return res.status(400).send('Missing paymentId');
    }
    
    // Находим подписку по paymentId
    const subscription = await Subscription.findOne({ paymentId: paymentId });
    
    if (!subscription) {
      console.log('Subscription not found for paymentId:', paymentId);
      return res.status(404).send('Subscription not found');
    }
    
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30); // +30 дней
    
    // Активируем подписку
    subscription.status = 'active';
    subscription.startDate = now;
    subscription.endDate = endDate;
    
    if (!subscription.paymentHistory) {
      subscription.paymentHistory = [];
    }
    
    subscription.paymentHistory.push({
      paymentId: paymentId,
      amount: 599,
      status: 'succeeded',
      date: now,
      receipt: {}
    });
    
    await subscription.save();
    console.log('Subscription activated:', subscription._id, 'endDate:', endDate);
    
    // Обновляем пользователя
    const user = await User.findById(subscription.user);
    if (user) {
      user.hasPremiumAccess = true;
      user.subscriptionEndsAt = endDate;
      user.subscription = subscription._id;
      await user.save();
      console.log('User updated:', user.email, 'hasPremiumAccess:', true);
    }
    
    // Перенаправляем на страницу успеха
    const redirectUrl = returnUrl || 'http://localhost:3000/profile/subscription/success';
    const finalUrl = `${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}paymentId=${paymentId}&status=success`;
    console.log('Redirecting to:', finalUrl);
    res.redirect(finalUrl);
  } catch (error) {
    console.error('Test payment success error:', error);
    res.status(500).send('Payment processing error: ' + error.message);
  }
};

// Проверка статуса платежа
export const checkPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user._id;
    
    console.log('Checking payment status for:', paymentId, 'user:', userId);
    
    const subscription = await Subscription.findOne({ 
      paymentId: paymentId,
      user: userId 
    });
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Платеж не найден'
      });
    }
    
    // Проверяем, активна ли подписка
    const isActive = subscription.isActive ? subscription.isActive() : (subscription.status === 'active' && subscription.endDate && new Date(subscription.endDate) > new Date());
    const remainingDays = subscription.getRemainingDays ? subscription.getRemainingDays() : 
      (subscription.endDate ? Math.max(0, Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24))) : 0);
    
    console.log('Payment status:', subscription.status, 'isActive:', isActive, 'remainingDays:', remainingDays);
    
    res.status(200).json({
      success: true,
      data: {
        paymentStatus: subscription.status === 'active' ? 'succeeded' : subscription.status,
        subscriptionStatus: subscription.status,
        isActive: isActive,
        endDate: subscription.endDate,
        remainingDays: remainingDays
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

// Получение информации о подписке текущего пользователя
export const getMySubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('Getting subscription for user:', userId);
    
    // Находим пользователя с информацией о подписке
    const user = await User.findById(userId).populate('subscription');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }
    
    let subscription = user.subscription;
    let hasActiveSubscription = false;
    let remainingDays = 0;
    
    if (subscription) {
      // Проверяем активность подписки
      const isActiveByDate = subscription.endDate && new Date(subscription.endDate) > new Date();
      const isActiveByStatus = subscription.status === 'active';
      hasActiveSubscription = isActiveByDate && isActiveByStatus;
      
      if (hasActiveSubscription && subscription.endDate) {
        const diff = new Date(subscription.endDate).getTime() - new Date().getTime();
        remainingDays = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }
    } else {
      // Проверяем hasPremiumAccess в пользователе
      const hasAccess = user.hasPremiumAccess === true;
      const hasValidDate = user.subscriptionEndsAt && new Date(user.subscriptionEndsAt) > new Date();
      hasActiveSubscription = hasAccess && hasValidDate;
      
      if (hasActiveSubscription && user.subscriptionEndsAt) {
        const diff = new Date(user.subscriptionEndsAt).getTime() - new Date().getTime();
        remainingDays = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }
    }
    
    console.log('Has active subscription:', hasActiveSubscription, 'remainingDays:', remainingDays);
    
    // Формируем ответ
    const subscriptionData = subscription ? {
      id: subscription._id,
      plan: subscription.plan,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      paymentHistory: subscription.paymentHistory || [],
      autoRenew: subscription.autoRenew,
      remainingDays: remainingDays,
      hasActiveSubscription: hasActiveSubscription,
      isInTrial: false
    } : {
      hasActiveSubscription: hasActiveSubscription,
      remainingDays: remainingDays,
      endDate: user.subscriptionEndsAt
    };
    
    // Только один доступный план
    const availablePlans = [
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
        hasActiveSubscription: hasActiveSubscription
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
    
    console.log('Cancelling subscription for user:', userId);
    
    // Находим подписку пользователя (независимо от статуса)
    let subscription = await Subscription.findOne({ user: userId });
    
    if (!subscription) {
      console.log('No subscription found for user:', userId);
      return res.status(404).json({
        success: false,
        error: 'Подписка не найдена'
      });
    }
    
    console.log('Found subscription:', {
      id: subscription._id,
      status: subscription.status,
      endDate: subscription.endDate
    });
    
    // Проверяем, активна ли подписка (по статусу или по дате)
    const isActiveByDate = subscription.endDate && new Date(subscription.endDate) > new Date();
    const isActiveByStatus = subscription.status === 'active';
    
    if (!isActiveByDate && !isActiveByStatus) {
      console.log('Subscription is not active:', { isActiveByDate, isActiveByStatus });
      return res.status(400).json({
        success: false,
        error: 'Подписка уже неактивна или истекла'
      });
    }
    
    // Отменяем подписку
    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    await subscription.save();
    
    console.log('Subscription cancelled:', subscription._id, 'new status:', subscription.status);
    
    // Обновляем пользователя - отключаем премиум доступ
    const user = await User.findById(userId);
    if (user) {
      user.hasPremiumAccess = false;
      // Не удаляем subscriptionEndsAt, чтобы пользователь мог видеть, до какого числа был доступ
      await user.save();
      console.log('User updated:', user.email, 'hasPremiumAccess:', false);
    }
    
    res.status(200).json({
      success: true,
      message: 'Подписка успешно отменена'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при отмене подписки: ' + error.message
    });
  }
};

// Webhook для ЮKassa (тестовый)
export const yookassaWebhook = async (req, res) => {
  try {
    const { object } = req.body;
    
    console.log('Webhook received:', object);
    
    if (object && object.id && object.status === 'succeeded') {
      const paymentId = object.id;
      
      const subscription = await Subscription.findOne({ paymentId: paymentId });
      
      if (subscription && subscription.status !== 'active') {
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
          paymentId: paymentId,
          amount: object.amount?.value || 599,
          status: 'succeeded',
          date: now,
          receipt: {}
        });
        
        await subscription.save();
        
        // Обновляем пользователя
        const user = await User.findById(subscription.user);
        if (user) {
          user.hasPremiumAccess = true;
          user.subscriptionEndsAt = endDate;
          user.subscription = subscription._id;
          await user.save();
        }
        
        console.log('Subscription activated via webhook:', subscription._id);
      }
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing error: ' + error.message });
  }
};

export default {
  createPayment,
  checkPaymentStatus,
  getMySubscription,
  cancelSubscription,
  yookassaWebhook,
  testPaymentSuccess
};