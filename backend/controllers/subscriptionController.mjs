import YooKassa from 'yookassa';
import Subscription from '../models/Subscription.mjs';
import User from '../models/User.mjs';

// Инициализация ЮKassa
const yooKassa = new YooKassa({
  shopId: process.env.YOOKASSA_SHOP_ID,
  secretKey: process.env.YOOKASSA_SECRET_KEY
});

// Цены на подписки (в рублях)
const PLANS = {
  basic: {
    name: 'Базовая подписка',
    price: 299,
    description: 'Доступ к основным функциям мониторинга осанки'
  },
  premium: {
    name: 'Премиум подписка',
    price: 599,
    description: 'Полный доступ ко всем функциям, включая расширенную статистику'
  }
};

/**
 * Создание платежа для подписки
 */
export const createPayment = async (req, res) => {
  try {
    const { plan, returnUrl } = req.body;
    const userId = req.user._id;

    console.log(`📝 Creating payment for user: ${userId}, plan: ${plan}`);

    // Проверяем существование плана
    if (!PLANS[plan]) {
      return res.status(400).json({
        success: false,
        error: 'Неверный тип подписки'
      });
    }

    // Проверяем, нет ли уже активной подписки
    const existingSubscription = await Subscription.findOne({ 
      user: userId,
      status: 'active'
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        error: 'У вас уже есть активная подписка'
      });
    }

    const planDetails = PLANS[plan];
    const amount = planDetails.price;

    // Генерируем уникальный ID для платежа
    const idempotenceKey = Date.now().toString();

    // Создаем платеж в ЮKassa
    const payment = await yooKassa.createPayment({
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB'
      },
      payment_method_data: {
        type: 'bank_card'
      },
      confirmation: {
        type: 'redirect',
        return_url: returnUrl || `${process.env.CLIENT_URL}/profile/subscription/success`
      },
      capture: true,
      description: `Оплата подписки ${planDetails.name}`,
      metadata: {
        userId: userId.toString(),
        plan: plan,
        type: 'subscription'
      }
    }, idempotenceKey);

    console.log('✅ Payment created in YooKassa:', payment.id);

    // Создаем или обновляем подписку в статусе pending
    let subscription = await Subscription.findOne({ user: userId });
    
    if (!subscription) {
      subscription = new Subscription({
        user: userId,
        plan: plan,
        status: 'pending',
        paymentId: payment.id,
        paymentDetails: payment,
        paymentMethod: null
      });
    } else {
      subscription.plan = plan;
      subscription.status = 'pending';
      subscription.paymentId = payment.id;
      subscription.paymentDetails = payment;
    }

    await subscription.save();
    console.log('✅ Subscription saved with status: pending');

    res.status(200).json({
      success: true,
      data: {
        paymentId: payment.id,
        confirmationUrl: payment.confirmation.confirmation_url,
        amount: amount
      }
    });

  } catch (error) {
    console.error('❌ Error creating payment:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при создании платежа'
    });
  }
};

/**
 * Проверка статуса платежа
 */
export const checkPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user._id;

    console.log(`🔍 Checking payment status for paymentId: ${paymentId}, userId: ${userId}`);

    // Получаем информацию о платеже из ЮKassa
    let payment;
    try {
      payment = await yooKassa.getPayment(paymentId);
      console.log('✅ Payment found in YooKassa, status:', payment.status);
    } catch (error) {
      console.error('❌ Error getting payment from YooKassa:', error);
      
      // Если платеж не найден в ЮKassa, проверяем локальную подписку
      const localSubscription = await Subscription.findOne({ 
        paymentId: paymentId,
        user: userId
      });

      if (localSubscription) {
        console.log('✅ Found local subscription for paymentId:', paymentId);
        return res.status(200).json({
          success: true,
          data: {
            paymentStatus: 'local',
            subscriptionStatus: localSubscription.status,
            plan: localSubscription.plan,
            endDate: localSubscription.endDate,
            startDate: localSubscription.startDate
          }
        });
      }

      return res.status(404).json({
        success: false,
        error: 'Платеж не найден в системе'
      });
    }

    // Находим подписку
    let subscription = await Subscription.findOne({ 
      paymentId: paymentId,
      user: userId
    });

    if (!subscription) {
      console.log('⚠️ Subscription not found for paymentId:', paymentId);
      
      // Проверяем, может быть подписка уже создана для этого пользователя
      const existingSubscription = await Subscription.findOne({ user: userId });
      
      if (existingSubscription) {
        console.log('✅ Found existing subscription for user:', userId);
        
        // Если платеж успешен, обновляем существующую подписку
        if (payment.status === 'succeeded') {
          existingSubscription.status = 'active';
          existingSubscription.startDate = new Date();
          existingSubscription.endDate = new Date(+new Date() + 30 * 24 * 60 * 60 * 1000);
          existingSubscription.paymentId = paymentId;
          existingSubscription.paymentMethod = payment.payment_method?.type || null;
          
          existingSubscription.paymentHistory.push({
            paymentId: payment.id,
            amount: parseFloat(payment.amount.value),
            status: payment.status,
            date: new Date(),
            receipt: payment.receipt || {}
          });

          await existingSubscription.save();

          // Обновляем пользователя
          await User.findByIdAndUpdate(userId, {
            hasPremiumAccess: true,
            subscription: existingSubscription._id
          });

          console.log('✅ Updated existing subscription with new payment');
        }

        return res.status(200).json({
          success: true,
          data: {
            paymentStatus: payment.status,
            subscriptionStatus: existingSubscription.status,
            plan: existingSubscription.plan,
            endDate: existingSubscription.endDate,
            startDate: existingSubscription.startDate
          }
        });
      }

      return res.status(404).json({
        success: false,
        error: 'Подписка не найдена'
      });
    }

    console.log(`📊 Payment status: ${payment.status}, Subscription status: ${subscription.status}`);

    // Если платеж успешен, активируем подписку
    if (payment.status === 'succeeded' && subscription.status === 'pending') {
      console.log('✅ Payment succeeded, activating subscription for user:', userId);
      
      // Обновляем подписку
      subscription.status = 'active';
      subscription.startDate = new Date();
      subscription.endDate = new Date(+new Date() + 30 * 24 * 60 * 60 * 1000); // +30 дней
      subscription.paymentMethod = payment.payment_method?.type || null;
      
      // Добавляем в историю платежей
      subscription.paymentHistory.push({
        paymentId: payment.id,
        amount: parseFloat(payment.amount.value),
        status: payment.status,
        date: new Date(),
        receipt: payment.receipt || {}
      });

      await subscription.save();

      // Обновляем пользователя
      await User.findByIdAndUpdate(userId, {
        hasPremiumAccess: true,
        subscription: subscription._id
      });

      console.log('✅ Subscription activated for user:', userId);
    }

    // Если платеж ожидает подтверждения
    if (payment.status === 'waiting_for_capture' && subscription.status === 'pending') {
      console.log('⏳ Payment waiting for capture');
    }

    res.status(200).json({
      success: true,
      data: {
        paymentStatus: payment.status,
        subscriptionStatus: subscription.status,
        plan: subscription.plan,
        endDate: subscription.endDate,
        startDate: subscription.startDate,
        paymentMethod: subscription.paymentMethod,
        autoRenew: subscription.autoRenew
      }
    });

  } catch (error) {
    console.error('❌ Error checking payment status:', error);
    
    // Проверяем, может это ошибка валидации
    if (error.name === 'ValidationError') {
      console.error('Validation Error details:', error.errors);
    }
    
    res.status(500).json({
      success: false,
      error: 'Ошибка при проверке статуса платежа'
    });
  }
};

/**
 * Получение информации о текущей подписке пользователя
 */
export const getMySubscription = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log(`📋 Getting subscription for user: ${userId}`);

    let subscription = await Subscription.findOne({ user: userId });

    // Если подписки нет, создаем "пустую" для информации
    if (!subscription) {
      console.log('ℹ️ No subscription found, returning default info');
      
      const trialEndDate = req.user.trialEndsAt || new Date(+new Date() + 7*24*60*60*1000);
      const isInTrial = new Date(trialEndDate) > new Date();

      subscription = {
        user: userId,
        plan: 'trial',
        status: 'inactive',
        hasActiveSubscription: false,
        trialEndDate: trialEndDate,
        isInTrial: isInTrial,
        paymentHistory: []
      };
    } else {
      subscription = subscription.toObject();
      subscription.hasActiveSubscription = subscription.status === 'active' && 
                                         (!subscription.endDate || new Date(subscription.endDate) > new Date());
      subscription.isInTrial = req.user.trialEndsAt && new Date(req.user.trialEndsAt) > new Date();
      subscription.trialEndDate = req.user.trialEndsAt;
    }

    // Добавляем информацию о доступных планах
    const availablePlans = Object.entries(PLANS).map(([key, value]) => ({
      id: key,
      ...value
    }));

    console.log('✅ Subscription info retrieved successfully');

    res.status(200).json({
      success: true,
      data: {
        subscription,
        availablePlans
      }
    });

  } catch (error) {
    console.error('❌ Error getting subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении информации о подписке'
    });
  }
};

/**
 * Отмена подписки
 */
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log(`📝 Cancelling subscription for user: ${userId}`);

    const subscription = await Subscription.findOne({ 
      user: userId,
      status: 'active'
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Активная подписка не найдена'
      });
    }

    // Отключаем авто-продление
    subscription.autoRenew = false;
    subscription.status = 'cancelled';
    await subscription.save();

    // Обновляем пользователя
    await User.findByIdAndUpdate(userId, {
      hasPremiumAccess: false
    });

    console.log('✅ Subscription cancelled for user:', userId);

    res.status(200).json({
      success: true,
      message: 'Подписка отменена'
    });

  } catch (error) {
    console.error('❌ Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при отмене подписки'
    });
  }
};

/**
 * Webhook для уведомлений от ЮKassa
 */
export const yookassaWebhook = async (req, res) => {
  try {
    const event = req.body;
    console.log('📨 Webhook received:', event.type);

    // Обрабатываем только уведомления об успешном платеже
    if (event.type === 'payment.succeeded') {
      const payment = event.object;
      const { userId, plan } = payment.metadata || {};

      if (!userId) {
        console.log('⚠️ Webhook: missing userId in metadata');
        return res.status(200).json({ received: true });
      }

      console.log(`💰 Payment succeeded webhook for user: ${userId}, payment: ${payment.id}`);

      // Находим подписку
      let subscription = await Subscription.findOne({ paymentId: payment.id });

      if (!subscription) {
        // Если подписки нет, создаем новую
        subscription = new Subscription({
          user: userId,
          plan: plan || 'basic',
          status: 'active',
          paymentId: payment.id,
          paymentMethod: payment.payment_method?.type || null,
          paymentDetails: payment,
          startDate: new Date(),
          endDate: new Date(+new Date() + 30 * 24 * 60 * 60 * 1000),
          paymentHistory: [{
            paymentId: payment.id,
            amount: parseFloat(payment.amount.value),
            status: 'succeeded',
            date: new Date(),
            receipt: payment.receipt || {}
          }]
        });
      } else {
        // Обновляем существующую
        subscription.status = 'active';
        subscription.startDate = new Date();
        subscription.endDate = new Date(+new Date() + 30 * 24 * 60 * 60 * 1000);
        subscription.paymentMethod = payment.payment_method?.type || null;
        
        subscription.paymentHistory.push({
          paymentId: payment.id,
          amount: parseFloat(payment.amount.value),
          status: 'succeeded',
          date: new Date(),
          receipt: payment.receipt || {}
        });
      }

      await subscription.save();

      // Обновляем пользователя
      await User.findByIdAndUpdate(userId, {
        hasPremiumAccess: true,
        subscription: subscription._id
      });

      console.log('✅ Webhook: subscription activated for user:', userId);
    }

    // Всегда отвечаем 200, чтобы ЮKassa знала, что уведомление получено
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};