import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  endTime: {
    type: Date,
    required: false 
  },
  
  duration: {
    type: Number, 
    default: 0
  },
  
  postureMetrics: {
    totalFrames: {
      type: Number,
      default: 0
    },
    
    goodPostureFrames: {
      type: Number,
      default: 0
    },
    
    warningFrames: {
      type: Number,
      default: 0
    },
    postureSnapshots: [{
      snapshotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PostureSnapshot'
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      status: String,
      issues: [String],
      thumbnailId: mongoose.Schema.Types.ObjectId // ID миниатюры в GridFS
    }],
    
    errorFrames: {
      type: Number,
      default: 0
    },
    
    // Детальные ошибки по зонам
    errorsByZone: {
      shoulders: {
        count: { type: Number, default: 0 },
        duration: { type: Number, default: 0 } // в секундах
      },
      head: {
        count: { type: Number, default: 0 },
        duration: { type: Number, default: 0 }
      },
      hips: {
        count: { type: Number, default: 0 },
        duration: { type: Number, default: 0 }
      }
    },
    
    // Процентное соотношение
    postureScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    
    // Среднее качество отслеживания
    averageTrackingQuality: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  
  // Ключевые моменты сеанса
  keyMoments: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['start', 'end', 'calibration', 'notification', 'score_change', 'pause', 'resume']
    },
    message: String,
    data: mongoose.Schema.Types.Mixed
  }],
  
  postureSnapshots: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    normalizedPoints: [{
      x: Number,
      y: Number,
      score: Number,
      name: String
    }],
    status: String,
    issues: [String]
  }],
  
  // Настройки сеанса
  settings: {
    confidenceThreshold: Number,
    deviationThreshold: Number,
    notificationEnabled: Boolean,
    calibrationType: String
  },
  
  deviceInfo: {
    userAgent: String,
    screenResolution: String,
    webcamResolution: String
  },
  
  // Статус сеанса
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true
});


SessionSchema.pre('save', function(next) {
  // Если сеанс завершен, обновляем длительность
  if (this.endTime && !this.duration) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  
  // Если есть метрики, рассчитываем оценку и проценты
  if (this.postureMetrics.totalFrames > 0) {
    this.postureMetrics.postureScore = Math.round(
      (this.postureMetrics.goodPostureFrames / this.postureMetrics.totalFrames) * 100
    );
    
    // Рассчитываем проценты
    this.postureMetrics.goodPercentage = Math.round(
      (this.postureMetrics.goodPostureFrames / this.postureMetrics.totalFrames) * 100
    );
    
    this.postureMetrics.warningPercentage = Math.round(
      (this.postureMetrics.warningFrames / this.postureMetrics.totalFrames) * 100
    );
    
    this.postureMetrics.errorPercentage = Math.round(
      (this.postureMetrics.errorFrames / this.postureMetrics.totalFrames) * 100
    );
  }
  
  // Рассчитываем проценты для ошибок по зонам
  const duration = this.duration || 1;
  if (this.postureMetrics.errorsByZone) {
    Object.keys(this.postureMetrics.errorsByZone).forEach(zone => {
      if (this.postureMetrics.errorsByZone[zone] && this.postureMetrics.errorsByZone[zone].duration > 0) {
        this.postureMetrics.errorsByZone[zone].percentage = 
          Math.round((this.postureMetrics.errorsByZone[zone].duration / duration) * 1000) / 10;
      } else {
        this.postureMetrics.errorsByZone[zone].percentage = 0;
      }
    });
  }
  
  next();
});


// Метод для расчета итоговой статистики
SessionSchema.methods.calculateFinalStats = function() {
  const totalFrames = this.postureMetrics.totalFrames;
  if (totalFrames === 0) return;
  
  // Расчет процента хорошей осанки
  this.postureMetrics.postureScore = Math.round(
    (this.postureMetrics.goodPostureFrames / totalFrames) * 100
  );
  
  // Расчет средней длительности ошибок
  Object.keys(this.postureMetrics.errorsByZone).forEach(zone => {
    if (this.postureMetrics.errorsByZone[zone].count > 0) {
      this.postureMetrics.errorsByZone[zone].averageDuration = 
        this.postureMetrics.errorsByZone[zone].duration / 
        this.postureMetrics.errorsByZone[zone].count;
    }
  });
  
  return this;
};

// Виртуальное поле для проверки завершенности
SessionSchema.virtual('isCompleted').get(function() {
  return !!this.endTime || this.status === 'completed';
});

// Виртуальное поле для текущей длительности
SessionSchema.virtual('currentDuration').get(function() {
  if (this.endTime) {
    return Math.floor((this.endTime - this.startTime) / 1000);
  }
  return Math.floor((Date.now() - this.startTime) / 1000);
});

// Предварительная обработка перед сохранением
SessionSchema.pre('save', function(next) {
  // Если сеанс завершен, обновляем длительность
  if (this.endTime && !this.duration) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  
  // Если есть метрики, рассчитываем оценку
  if (this.postureMetrics.totalFrames > 0) {
    this.postureMetrics.postureScore = Math.round(
      (this.postureMetrics.goodPostureFrames / this.postureMetrics.totalFrames) * 100
    );
  }
  
  next();
});

// Индексы для быстрого поиска
SessionSchema.index({ userId: 1, startTime: -1 });
SessionSchema.index({ 'postureMetrics.postureScore': 1 });
SessionSchema.index({ duration: 1 });
SessionSchema.index({ status: 1 });
SessionSchema.index({ userId: 1, status: 1 });
SessionSchema.index({ startTime: -1 });
SessionSchema.index({ 'postureMetrics.postureScore': -1 });
SessionSchema.index({ duration: -1 });
SessionSchema.index({ 'postureMetrics.errorsByZone.shoulders.count': -1 });



const Session = mongoose.model('Session', SessionSchema);

export default Session;