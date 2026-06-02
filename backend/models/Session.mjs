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
    
    errorFrames: {
      type: Number,
      default: 0
    },
    
    // Детальные ошибки по зонам
    errorsByZone: {
      shoulders: {
        count: { type: Number, default: 0 },
        duration: { type: Number, default: 0 }, // в секундах
        percentage: { type: Number, default: 0 } // ДОБАВЛЯЕМ поле percentage
      },
      head: {
        count: { type: Number, default: 0 },
        duration: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 } // ДОБАВЛЯЕМ поле percentage
      },
      hips: {
        count: { type: Number, default: 0 },
        duration: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 } // ДОБАВЛЯЕМ поле percentage
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
    },
    
    goodPercentage: {
      type: Number,
      default: 0
    },
    
    warningPercentage: {
      type: Number,
      default: 0
    },
    
    errorPercentage: {
      type: Number,
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

// Единый pre-save хук (убираем дублирование)
SessionSchema.pre('save', function(next) {
  // Если сеанс завершен и duration не установлен, вычисляем его
  if (this.endTime && !this.duration) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  
  // Если duration все еще 0, используем текущую длительность для расчетов
  const effectiveDuration = this.duration || 1;
  
  // Если есть метрики и кадры, рассчитываем оценку и проценты
  if (this.postureMetrics.totalFrames > 0) {
    const totalFrames = this.postureMetrics.totalFrames;
    
    // Рассчитываем проценты для общей осанки
    this.postureMetrics.goodPercentage = Math.round(
      (this.postureMetrics.goodPostureFrames / totalFrames) * 100
    );
    
    this.postureMetrics.warningPercentage = Math.round(
      (this.postureMetrics.warningFrames / totalFrames) * 100
    );
    
    this.postureMetrics.errorPercentage = Math.round(
      (this.postureMetrics.errorFrames / totalFrames) * 100
    );
    
    // Рассчитываем общую оценку осанки
    this.postureMetrics.postureScore = this.postureMetrics.goodPercentage;
  }
  
  // Рассчитываем проценты для ошибок по зонам на основе длительности
  if (this.postureMetrics.errorsByZone) {
    Object.keys(this.postureMetrics.errorsByZone).forEach(zone => {
      const zoneData = this.postureMetrics.errorsByZone[zone];
      if (zoneData && zoneData.duration > 0) {
        // Процент времени, когда была проблема в этой зоне
        zoneData.percentage = Math.round((zoneData.duration / effectiveDuration) * 1000) / 10;
      } else if (zoneData) {
        zoneData.percentage = 0;
      }
    });
  }
  
  next();
});

// Метод для расчета итоговой статистики
SessionSchema.methods.calculateFinalStats = function() {
  const totalFrames = this.postureMetrics.totalFrames;
  if (totalFrames === 0) return this;
  
  // Расчет процента хорошей осанки
  this.postureMetrics.postureScore = Math.round(
    (this.postureMetrics.goodPostureFrames / totalFrames) * 100
  );
  
  // Расчет процентов по зонам
  const effectiveDuration = this.duration || 1;
  Object.keys(this.postureMetrics.errorsByZone).forEach(zone => {
    const zoneData = this.postureMetrics.errorsByZone[zone];
    if (zoneData && zoneData.count > 0) {
      zoneData.percentage = Math.round((zoneData.duration / effectiveDuration) * 1000) / 10;
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