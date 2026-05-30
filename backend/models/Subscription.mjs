import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  plan: {
    type: String,
    enum: ['basic', 'premium'],
    default: 'basic'
  },
  
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'pending'
  },
  
  paymentId: {
    type: String,
    sparse: true,
    default: null
  },
  
  yookassaPaymentId: {
    type: String,
    sparse: true,
    default: null
  },
  
  paymentMethod: {
    type: String,
    default: null
  },
  
  paymentDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  startDate: {
    type: Date,
    default: null
  },
  
  endDate: {
    type: Date,
    default: null
  },
  
  paymentHistory: [{
    paymentId: String,
    amount: Number,
    status: String,
    date: Date,
    receipt: Object
  }],
  
  autoRenew: {
    type: Boolean,
    default: true
  },
  
  nextPaymentDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Индексы
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ yookassaPaymentId: 1 });
subscriptionSchema.index({ paymentId: 1 });

// Метод проверки активности подписки
subscriptionSchema.methods.isActive = function() {
  // Если статус не active - не активна
  if (this.status !== 'active') {
    return false;
  }
  
  // Если нет даты окончания - не активна
  if (!this.endDate) {
    return false;
  }
  
  // Проверяем, не истекла ли дата
  const now = new Date();
  const endDate = new Date(this.endDate);
  const isActive = endDate > now;
  
  return isActive;
};

// Метод получения оставшихся дней
subscriptionSchema.methods.getRemainingDays = function() {
  if (!this.isActive()) return 0;
  
  const now = new Date();
  const endDate = new Date(this.endDate);
  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// Метод получения цены плана
subscriptionSchema.methods.getPlanPrice = function() {
  return this.plan === 'premium' ? 599 : 299;
};

// Статические методы
subscriptionSchema.statics.findByUser = function(userId) {
  return this.findOne({ user: userId });
};

subscriptionSchema.statics.findByPaymentId = function(paymentId) {
  return this.findOne({ paymentId: paymentId });
};

subscriptionSchema.statics.findByYookassaPaymentId = function(yookassaPaymentId) {
  return this.findOne({ yookassaPaymentId: yookassaPaymentId });
};

subscriptionSchema.statics.findActiveSubscriptions = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    endDate: { $gt: now }
  });
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;