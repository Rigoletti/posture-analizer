import jwt from 'jsonwebtoken';
import User from '../models/User.mjs';

export const protect = async (req, res, next) => {
  try {
    let token;
    
    // Проверяем наличие токена в куках
    token = req.cookies.token;
    
    if (!token) {
      // Также проверяем заголовок для обратной совместимости
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
      ) {
        token = req.headers.authorization.split(' ')[1];
      }
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Не авторизован. Пожалуйста, войдите в систему.'
      });
    }
    
    // Верифицируем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Находим пользователя по ID из токена
    const user = await User.findById(decoded.id).populate('subscription');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Пользователь не найден.'
      });
    }
    
    // Проверяем подтверждение EMAIL (только для обычных пользователей)
    if (user.role === 'user' && !user.emailVerified) {
      return res.status(401).json({
        success: false,
        error: 'Email не подтвержден. Пожалуйста, подтвердите ваш email.',
        requiresVerification: true,
        email: user.email
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Ваш аккаунт деактивирован.'
      });
    }
    
    // Добавляем пользователя в запрос
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Неверный токен. Пожалуйста, войдите снова.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Срок действия токена истек. Пожалуйста, войдите снова.'
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Ошибка сервера при проверке авторизации'
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Не авторизован'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Роль ${req.user.role} не имеет доступа к этому ресурсу`
      });
    }
    
    next();
  };
};

// Middleware для проверки наличия активной подписки (только Premium)
export const requireSubscription = () => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Не авторизован'
      });
    }

    // Админы имеют доступ ко всему
    if (req.user.role === 'admin') {
      return next();
    }

    // Проверяем наличие активной премиум подписки
    const hasPremiumAccess = req.user.hasPremiumAccess === true;
    const subscriptionEndsAt = req.user.subscriptionEndsAt;
    const isSubscriptionValid = subscriptionEndsAt && new Date(subscriptionEndsAt) > new Date();
    
    const hasActiveSubscription = hasPremiumAccess && isSubscriptionValid;

    if (!hasActiveSubscription) {
      return res.status(403).json({
        success: false,
        error: 'Для доступа к этому разделу необходима премиум подписка',
        requiresSubscription: true
      });
    }

    next();
  };
};

// Middleware для проверки наличия активной подписки (с проверкой через модель Subscription)
export const requireActiveSubscription = () => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Не авторизован'
      });
    }

    // Админы имеют доступ ко всему
    if (req.user.role === 'admin') {
      return next();
    }

    try {
      // Импортируем модель Subscription динамически для избежания циклических зависимостей
      const Subscription = (await import('../models/Subscription.mjs')).default;
      
      // Находим активную подписку пользователя
      const subscription = await Subscription.findOne({
        user: req.user._id,
        status: 'active',
        endDate: { $gt: new Date() }
      });

      if (!subscription) {
        return res.status(403).json({
          success: false,
          error: 'Для доступа к этому разделу необходима активная премиум подписка',
          requiresSubscription: true
        });
      }

      // Добавляем информацию о подписке в запрос
      req.subscription = subscription;
      next();
    } catch (error) {
      console.error('Require subscription error:', error);
      return res.status(500).json({
        success: false,
        error: 'Ошибка при проверке подписки'
      });
    }
  };
};

// Генерация JWT токена
export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Установка токена в куки
export const setTokenCookie = (res, token) => {
  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  };
  
  res.cookie('token', token, options);
};

// Очистка токена из кук
export const clearTokenCookie = (res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
};

// Middleware для проверки пробного периода
export const checkTrial = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Не авторизован'
    });
  }

  // Админы имеют доступ ко всему
  if (req.user.role === 'admin') {
    return next();
  }

  const trialEndsAt = req.user.trialEndsAt;
  const hasPremiumAccess = req.user.hasPremiumAccess;
  const isPremiumActive = hasPremiumAccess && req.user.subscriptionEndsAt && new Date(req.user.subscriptionEndsAt) > new Date();
  
  // Если есть активная премиум подписка
  if (isPremiumActive) {
    return next();
  }
  
  // Проверяем пробный период
  const isTrialValid = trialEndsAt && new Date(trialEndsAt) > new Date();

  if (!isTrialValid && !isPremiumActive) {
    return res.status(403).json({
      success: false,
      error: 'Пробный период истек. Оформите подписку для продолжения использования.',
      trialExpired: true,
      requiresSubscription: true
    });
  }

  // Добавляем информацию о пробном периоде
  req.isTrial = true;
  req.trialDaysLeft = Math.ceil((new Date(trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
  
  next();
};