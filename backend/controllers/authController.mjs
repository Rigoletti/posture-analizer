import User from '../models/User.mjs';
import { generateToken, setTokenCookie, clearTokenCookie } from '../middleware/auth.mjs';
import emailSender from '../utils/email.mjs';
import { deleteAvatarFile } from '../middleware/uploadAvatar.mjs';

export const register = async (req, res) => {
  try {
    console.log('📝 Registration request body:', req.body);
    const { lastName, firstName, middleName, email, password } = req.body;

    // Проверяем существующего пользователя
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Пользователь с таким email уже существует'
      });
    }

    // Создаем пользователя
    const user = await User.create({
      lastName,
      firstName,
      middleName: middleName || '',
      email,
      password
    });

    // Генерируем код подтверждения
    const verificationCode = user.generateEmailVerificationCode();
    await user.save({ validateBeforeSave: false });

    console.log(`📧 Generated verification code for ${email}: ${verificationCode}`);

    // Отправляем email с кодом АСИНХРОННО
    emailSender.sendVerificationCodeEmail(email, verificationCode, firstName)
      .then(emailSent => {
        if (emailSent) {
          console.log(`✅ Verification code email sent to ${email}`);
        } else {
          console.log(`❌ Failed to send verification code email to ${email}`);
        }
      })
      .catch(err => {
        console.error(`❌ Error sending verification code email:`, err);
      });

    // Возвращаем ответ НЕМЕДЛЕННО
    const userResponse = {
      _id: user._id,
      lastName: user.lastName,
      firstName: user.firstName,
      middleName: user.middleName,
      fullName: user.fullName,
      shortName: user.shortName,
      email: user.email,
      role: user.role,
      postureSettings: user.postureSettings,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
      avatar: user.avatar,
      avatarThumbnail: user.avatarThumbnail,
      avatarUrl: user.avatarUrl,
      avatarThumbnailUrl: user.avatarThumbnailUrl,
      authProvider: user.authProvider,
      yandexAvatar: user.yandexAvatar
    };

    res.status(201).json({
      success: true,
      message: 'Регистрация успешно завершена. На вашу почту отправлен код подтверждения.',
      user: userResponse,
      requiresVerification: true
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(400).json({
        success: false,
        error: 'Пользователь с таким email уже существует'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при регистрации'
    });
  }
};

export const verifyEmailCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: 'Email и код подтверждения обязательны'
      });
    }

    console.log(`🔍 Verifying email code for ${email}: ${code}`);
    
    // Находим пользователя с кодом подтверждения
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }

    // Проверяем, не подтвержден ли email уже
    if (user.emailVerified) {
      user.clearVerificationCode();
      await user.save({ validateBeforeSave: false });
      
      return res.status(200).json({
        success: true,
        message: 'Email уже подтвержден',
        alreadyVerified: true,
        user: {
          _id: user._id,
          email: user.email,
          emailVerified: true
        }
      });
    }

    // Проверяем код
    try {
      user.verifyEmailCode(code);
    } catch (error) {
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({
        success: false,
        error: error.message,
        attemptsLeft: 5 - user.emailVerificationAttempts
      });
    }

    // Активируем пользователя
    user.emailVerified = true;
    user.clearVerificationCode();
    await user.save({ validateBeforeSave: false });

    console.log(`✅ Email verified for: ${user.email}`);

    // Отправляем приветственное письмо АСИНХРОННО
    emailSender.sendWelcomeEmail(user.email, user.firstName)
      .then(emailSent => {
        if (emailSent) {
          console.log(`✅ Welcome email sent to ${user.email}`);
        }
      })
      .catch(err => {
        console.error(`❌ Error sending welcome email:`, err);
      });

    // Авторизуем пользователя
    const authToken = generateToken(user._id);
    setTokenCookie(res, authToken);
    await user.updateLastLogin();

    const userResponse = {
      _id: user._id,
      lastName: user.lastName,
      firstName: user.firstName,
      middleName: user.middleName,
      fullName: user.fullName,
      shortName: user.shortName,
      email: user.email,
      role: user.role,
      postureSettings: user.postureSettings,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
      avatar: user.avatar,
      avatarThumbnail: user.avatarThumbnail,
      avatarUrl: user.avatarUrl,
      avatarThumbnailUrl: user.avatarThumbnailUrl,
      authProvider: user.authProvider,
      yandexAvatar: user.yandexAvatar
    };

    res.status(200).json({
      success: true,
      message: 'Email успешно подтвержден! Добро пожаловать!',
      user: userResponse
    });
  } catch (error) {
    console.error('❌ Email verification error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при подтверждении email'
    });
  }
};

export const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email обязателен для заполнения'
      });
    }

    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь с таким email не найден'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email уже подтвержден'
      });
    }

    // Генерируем новый код
    const verificationCode = user.generateEmailVerificationCode();
    await user.save({ validateBeforeSave: false });

    console.log(`📧 Resending verification code to ${email}: ${verificationCode}`);

    // Отправляем email с кодом АСИНХРОННО
    emailSender.sendVerificationCodeEmail(email, verificationCode, user.firstName)
      .then(emailSent => {
        if (emailSent) {
          console.log(`✅ Resend verification code email sent to ${email}`);
        }
      })
      .catch(err => {
        console.error(`❌ Error resending verification code email:`, err);
      });

    res.status(200).json({
      success: true,
      message: 'Новый код подтверждения отправлен на ваш email'
    });
  } catch (error) {
    console.error('❌ Resend verification code error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при отправке кода подтверждения'
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Неверный email или пароль'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Неверный email или пароль'
      });
    }

    // Проверяем, подтвержден ли email
    if (!user.emailVerified) {
      // Если есть старый код, очищаем его
      if (user.emailVerificationCode) {
        user.clearVerificationCode();
        await user.save({ validateBeforeSave: false });
      }
      
      // Генерируем новый код
      const verificationCode = user.generateEmailVerificationCode();
      await user.save({ validateBeforeSave: false });
      
      // Отправляем новый код
      emailSender.sendVerificationCodeEmail(email, verificationCode, user.firstName)
        .then(emailSent => {
          if (emailSent) {
            console.log(`✅ New verification code sent during login to ${email}`);
          }
        })
        .catch(err => {
          console.error(`❌ Error sending verification code during login:`, err);
        });
      
      return res.status(401).json({
        success: false,
        error: 'Email не подтвержден. На вашу почту отправлен новый код подтверждения.',
        requiresVerification: true,
        email: user.email
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Ваш аккаунт деактивирован. Обратитесь к администратору.'
      });
    }

    await user.updateLastLogin();

    // Генерируем токен
    const token = generateToken(user._id);
    
    // Устанавливаем токен в HttpOnly куку
    setTokenCookie(res, token);
    
    const userResponse = {
      _id: user._id,
      lastName: user.lastName,
      firstName: user.firstName,
      middleName: user.middleName,
      fullName: user.fullName,
      shortName: user.shortName,
      email: user.email,
      role: user.role,
      postureSettings: user.postureSettings,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
      avatar: user.avatar,
      avatarThumbnail: user.avatarThumbnail,
      avatarUrl: user.avatarUrl,
      avatarThumbnailUrl: user.avatarThumbnailUrl,
      authProvider: user.authProvider,
      yandexAvatar: user.yandexAvatar
    };

    res.status(200).json({
      success: true,
      message: 'Авторизация успешна',
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при авторизации'
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }

    // Явно вызываем виртуальные поля
    const avatarUrl = user.avatarUrl;
    const avatarThumbnailUrl = user.avatarThumbnailUrl;

    const userResponse = {
      _id: user._id,
      lastName: user.lastName,
      firstName: user.firstName,
      middleName: user.middleName,
      fullName: user.fullName,
      shortName: user.shortName,
      email: user.email,
      role: user.role,
      postureSettings: user.postureSettings,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      emailVerified: user.emailVerified,
      avatar: user.avatar,
      avatarThumbnail: user.avatarThumbnail,
      avatarUrl: avatarUrl,
      avatarThumbnailUrl: avatarThumbnailUrl,
      authProvider: user.authProvider,
      yandexAvatar: user.yandexAvatar
    };

    console.log('📤 Sending user response with avatarUrl:', avatarUrl);

    res.status(200).json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при получении профиля'
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { lastName, firstName, middleName, postureSettings } = req.body;

    const updateFields = {};
    
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (middleName !== undefined) updateFields.middleName = middleName || '';
    
    if (postureSettings) {
      updateFields.postureSettings = {
        ...req.user.postureSettings,
        ...postureSettings
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    );

    const userResponse = {
      _id: user._id,
      lastName: user.lastName,
      firstName: user.firstName,
      middleName: user.middleName,
      fullName: user.fullName,
      shortName: user.shortName,
      email: user.email,
      role: user.role,
      postureSettings: user.postureSettings,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      emailVerified: user.emailVerified,
      avatar: user.avatar,
      avatarThumbnail: user.avatarThumbnail,
      avatarUrl: user.avatarUrl,
      avatarThumbnailUrl: user.avatarThumbnailUrl,
      authProvider: user.authProvider,
      yandexAvatar: user.yandexAvatar
    };

    res.status(200).json({
      success: true,
      message: 'Профиль успешно обновлен',
      user: userResponse
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(400).json({
        success: false,
        error: 'Пользователь с таким email уже существует'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при обновлении профиля'
    });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }

    // Обновляем пути к аватару
    user.updateAvatar(req.avatarPath, req.thumbnailPath);
    await user.save();

    // Явно получаем виртуальные поля
    const avatarUrl = user.avatarUrl;
    const avatarThumbnailUrl = user.avatarThumbnailUrl;

    console.log('✅ Avatar uploaded successfully');
    console.log('Avatar path:', user.avatar);
    console.log('Avatar URL:', avatarUrl);

    const userResponse = {
      _id: user._id,
      lastName: user.lastName,
      firstName: user.firstName,
      middleName: user.middleName,
      fullName: user.fullName,
      shortName: user.shortName,
      email: user.email,
      role: user.role,
      postureSettings: user.postureSettings,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      emailVerified: user.emailVerified,
      avatar: user.avatar,
      avatarThumbnail: user.avatarThumbnail,
      avatarUrl: avatarUrl,
      avatarThumbnailUrl: avatarThumbnailUrl,
      authProvider: user.authProvider,
      yandexAvatar: user.yandexAvatar
    };

    res.status(200).json({
      success: true,
      message: 'Аватар успешно загружен',
      user: userResponse
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при загрузке аватара'
    });
  }
};

export const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }

    // Удаляем файлы
    if (user.avatar || user.avatarThumbnail) {
      deleteAvatarFile(user.avatar, user.avatarThumbnail);
    }

    // Очищаем поля в базе данных
    user.clearAvatar();
    await user.save();

    const userResponse = {
      _id: user._id,
      lastName: user.lastName,
      firstName: user.firstName,
      middleName: user.middleName,
      fullName: user.fullName,
      shortName: user.shortName,
      email: user.email,
      role: user.role,
      postureSettings: user.postureSettings,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      emailVerified: user.emailVerified,
      avatar: user.avatar,
      avatarThumbnail: user.avatarThumbnail,
      avatarUrl: user.avatarUrl,
      avatarThumbnailUrl: user.avatarThumbnailUrl,
      authProvider: user.authProvider,
      yandexAvatar: user.yandexAvatar
    };

    res.status(200).json({
      success: true,
      message: 'Аватар успешно удален',
      user: userResponse
    });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при удалении аватара'
    });
  }
};

export const logout = (req, res) => {
  clearTokenCookie(res);
  
  res.status(200).json({
    success: true,
    message: 'Выход выполнен успешно'
  });
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Новый пароль и подтверждение не совпадают'
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Текущий пароль неверен'
      });
    }

    user.password = newPassword;
    await user.save();
    
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Пароль успешно обновлен'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при обновлении пароля'
    });
  }
};