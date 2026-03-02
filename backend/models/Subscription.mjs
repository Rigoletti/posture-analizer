import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Тип подписки
  plan: {
    type: String,
    enum: ['basic', 'premium', 'trial'],
    default: 'trial'
  },
  
  // Статус подписки
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'cancelled', 'pending'],
    default: 'inactive'
  },
  
  // Информация о платеже в ЮKassa
  paymentId: {
    type: String,
    sparse: true,
    default: null
  },
  
  paymentMethod: {
    type: String,
    enum: ['bank_card', 'yoo_money', 'sberbank', 'tinkoff', 'cash', 'mobile_balance', 'qiwi', 'apple_pay', 'google_pay', null],
    default: null
  },
  
  paymentDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Даты подписки
  startDate: {
    type: Date,
    default: null
  },
  
  endDate: {
    type: Date,
    default: null
  },
  
  trialEndDate: {
    type: Date,
    default: null
  },
  
  // История платежей
  paymentHistory: [{
    paymentId: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['succeeded', 'pending', 'canceled', 'waiting_for_capture'],
      default: 'pending'
    },
    date: {
      type: Date,
      default: Date.now
    },
    receipt: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  
  // Настройки авто-продления
  autoRenew: {
    type: Boolean,
    default: true
  },
  
  // Дата следующего платежа
  nextPaymentDate: {
    type: Date,
    default: null
  },
  
  // Метаданные
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Индексы для быстрого поиска
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ nextPaymentDate: 1 });
subscriptionSchema.index({ paymentId: 1 });

// Методы для работы с подпиской
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && 
         (!this.endDate || new Date(this.endDate) > new Date());
};

subscriptionSchema.methods.isInTrial = function() {
  return this.trialEndDate && new Date(this.trialEndDate) > new Date();
};

subscriptionSchema.methods.getRemainingDays = function() {
  if (!this.endDate) return 0;
  const diff = new Date(this.endDate) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

subscriptionSchema.methods.getPlanPrice = function() {
  const prices = {
    trial: 0,
    basic: 299,
    premium: 599
  };
  return prices[this.plan] || 0;
};

// Статические методы
subscriptionSchema.statics.findByUser = function(userId) {
  return this.findOne({ user: userId });
};

subscriptionSchema.statics.findByPaymentId = function(paymentId) {
  return this.findOne({ paymentId: paymentId });
};

subscriptionSchema.statics.findActiveSubscriptions = function() {
  return this.find({
    status: 'active',
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gt: new Date() } }
    ]
  });
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;