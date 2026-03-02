import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  lastName: {
    type: String,
    required: [true, 'Фамилия обязательна для заполнения'],
    trim: true,
    maxlength: [50, 'Фамилия не может превышать 50 символов']
  },
  
  firstName: {
    type: String,
    required: [true, 'Имя обязательно для заполнения'],
    trim: true,
    maxlength: [50, 'Имя не может превышать 50 символов']
  },
  
  middleName: {
    type: String,
    trim: true,
    maxlength: [50, 'Отчество не может превышать 50 символов']
  },
  
  email: {
    type: String,
    required: [true, 'Email обязателен для заполнения'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Пожалуйста, введите корректный email']
  },

  emailVerified: {
    type: Boolean,
    default: false
  },

  emailVerificationCode: {
    type: String,
    select: false
  },

  emailVerificationCodeExpires: {
    type: Date,
    select: false
  },

  emailVerificationAttempts: {
    type: Number,
    default: 0,
    select: false
  },

  password: {
    type: String,
    minlength: [6, 'Пароль должен содержать минимум 6 символов'],
    select: false
  },

  // Поля для аватара
  avatar: {
    type: String,
    default: null
  },
  
  avatarThumbnail: {
    type: String,
    default: null
  },

  // Поля для OAuth авторизации через Яндекс
  yandexId: {
    type: String,
    sparse: true,
    unique: true
  },
  
  yandexAvatar: {
    type: String
  },
  
  authProvider: {
    type: String,
    enum: ['local', 'yandex'],
    default: 'local'
  },

  role: {
    type: String,
    enum: ['guest', 'user', 'admin'],
    default: 'user'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  postureSettings: {
    notificationsEnabled: {
      type: Boolean,
      default: true
    },
    calibrationDone: {
      type: Boolean,
      default: false
    }
  },
  
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null
  },
  
  // Флаг, показывающий, есть ли доступ к платным функциям
  hasPremiumAccess: {
    type: Boolean,
    default: false
  },
  
  // Дата окончания бесплатного пробного периода
  trialEndsAt: {
    type: Date,
    default: () => new Date(+new Date() + 7*24*60*60*1000) // 7 дней пробного периода
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Добавляем виртуальные поля в JSON
      ret.avatarUrl = doc.avatarUrl;
      ret.avatarThumbnailUrl = doc.avatarThumbnailUrl;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.avatarUrl = doc.avatarUrl;
      ret.avatarThumbnailUrl = doc.avatarThumbnailUrl;
      return ret;
    }
  }
});

// Виртуальные поля
userSchema.virtual('fullName').get(function() {
  return `${this.lastName} ${this.firstName}${this.middleName ? ' ' + this.middleName : ''}`;
});

userSchema.virtual('shortName').get(function() {
  return `${this.lastName} ${this.firstName.charAt(0)}.${this.middleName ? ' ' + this.middleName.charAt(0) + '.' : ''}`;
});

// Виртуальное поле для URL аватара
userSchema.virtual('avatarUrl').get(function() {
  if (this.authProvider === 'yandex' && this.yandexAvatar) {
    return this.yandexAvatar;
  }
  if (this.avatar) {
    return `${process.env.API_URL || 'http://localhost:5000'}${this.avatar}`;
  }
  return null;
});

// Виртуальное поле для миниатюры аватара
userSchema.virtual('avatarThumbnailUrl').get(function() {
  if (this.authProvider === 'yandex' && this.yandexAvatar) {
    return this.yandexAvatar;
  }
  if (this.avatarThumbnail) {
    return `${process.env.API_URL || 'http://localhost:5000'}${this.avatarThumbnail}`;
  }
  return null;
});

// Хеширование пароля перед сохранением
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Методы
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = Date.now();
  await this.save({ validateBeforeSave: false });
};

userSchema.methods.generateEmailVerificationCode = function() {
  // Генерируем 6-значный цифровой код
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Хэшируем код для хранения в БД
  this.emailVerificationCode = crypto
    .createHash('sha256')
    .update(verificationCode)
    .digest('hex');
    
  this.emailVerificationCodeExpires = Date.now() + 15 * 60 * 1000; // 15 минут
  this.emailVerificationAttempts = 0;
  
  return verificationCode;
};

userSchema.methods.verifyEmailCode = function(code) {
  // Проверяем попытки
  if (this.emailVerificationAttempts >= 5) {
    throw new Error('Превышено количество попыток. Запросите новый код.');
  }
  
  // Проверяем срок действия
  if (this.emailVerificationCodeExpires < Date.now()) {
    throw new Error('Код подтверждения истек. Запросите новый код.');
  }
  
  // Хэшируем введенный код для сравнения
  const hashedCode = crypto
    .createHash('sha256')
    .update(code)
    .digest('hex');
    
  const isValid = this.emailVerificationCode === hashedCode;
  
  if (!isValid) {
    this.emailVerificationAttempts += 1;
    throw new Error('Неверный код подтверждения');
  }
  
  return true;
};

userSchema.methods.clearVerificationCode = function() {
  this.emailVerificationCode = undefined;
  this.emailVerificationCodeExpires = undefined;
  this.emailVerificationAttempts = 0;
};

userSchema.methods.updateAvatar = function(avatarPath, thumbnailPath) {
  this.avatar = avatarPath;
  this.avatarThumbnail = thumbnailPath;
};

userSchema.methods.clearAvatar = function() {
  this.avatar = null;
  this.avatarThumbnail = null;
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email }).select('+password +emailVerificationCode +emailVerificationCodeExpires +emailVerificationAttempts');
};

userSchema.statics.findByYandexId = function(yandexId) {
  return this.findOne({ yandexId });
};

const User = mongoose.model('User', userSchema);

export default User;