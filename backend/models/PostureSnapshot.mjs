import mongoose from 'mongoose';

const PostureSnapshotSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  // Тип снимка
  type: {
    type: String,
    enum: ['warning', 'error', 'calibration', 'manual', 'auto'],
    default: 'auto'
  },
  
  // Статус осанки в момент снимка
  postureStatus: {
    type: String,
    enum: ['good', 'warning', 'error'],
    required: true
  },
  
  // Оценка осанки в момент снимка
  postureScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Обнаруженные проблемы
  issues: [{
    type: String,
    enum: ['shoulders', 'head', 'hips', 'neck', 'back']
  }],
  
  // Детали проблемы
  issueDetails: {
    shoulders: {
      detected: { type: Boolean, default: false },
      deviation: { type: Number, default: 0 },
      description: String
    },
    head: {
      detected: { type: Boolean, default: false },
      deviation: { type: Number, default: 0 },
      description: String
    },
    hips: {
      detected: { type: Boolean, default: false },
      deviation: { type: Number, default: 0 },
      description: String
    }
  },
  
  // Метаданные изображения
  imageMetadata: {
    filename: { type: String, required: true },
    contentType: { type: String, default: 'image/jpeg' },
    size: { type: Number, default: 0 },
    width: { type: Number, default: 480 },
    height: { type: Number, default: 480 },
    thumbnailId: { type: mongoose.Schema.Types.ObjectId } // ID миниатюры в GridFS
  },
  
  // Данные позы (ключевые точки)
  poseData: {
    keypoints: [{
      x: Number,
      y: Number,
      score: Number,
      name: String
    }],
    normalizedPoints: [{
      x: Number,
      y: Number,
      score: Number,
      name: String
    }]
  },
  
  // Важность снимка (для сортировки)
  importance: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  
  // Теги для поиска
  tags: [String],
  
  // Заметки пользователя
  notes: {
    type: String,
    maxlength: 500
  },
  
  // Флаг избранного
  isFavorite: {
    type: Boolean,
    default: false
  },
  
  // Статистика просмотров
  views: {
    type: Number,
    default: 0
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Индексы для быстрого поиска
PostureSnapshotSchema.index({ userId: 1, timestamp: -1 });
PostureSnapshotSchema.index({ sessionId: 1, timestamp: -1 });
PostureSnapshotSchema.index({ userId: 1, isFavorite: 1 });
PostureSnapshotSchema.index({ postureStatus: 1 });
PostureSnapshotSchema.index({ issues: 1 });

// Виртуальное поле для URL изображения
PostureSnapshotSchema.virtual('imageUrl').get(function() {
  return `/api/snapshots/${this._id}/image`;
});

// Виртуальное поле для URL миниатюры
PostureSnapshotSchema.virtual('thumbnailUrl').get(function() {
  if (this.imageMetadata.thumbnailId) {
    return `/api/snapshots/thumbnail/${this.imageMetadata.thumbnailId}`;
  }
  return `/api/snapshots/${this._id}/thumbnail`;
});

// Метод для увеличения счетчика просмотров
PostureSnapshotSchema.methods.incrementViews = async function() {
  this.views += 1;
  return this.save();
};

// Метод для обновления заметок
PostureSnapshotSchema.methods.updateNotes = async function(notes) {
  this.notes = notes;
  return this.save();
};

// Метод для переключения избранного
PostureSnapshotSchema.methods.toggleFavorite = async function() {
  this.isFavorite = !this.isFavorite;
  return this.save();
};

// Статический метод для получения снимков сеанса
PostureSnapshotSchema.statics.getBySession = async function(sessionId, limit = 50, skip = 0) {
  return this.find({ sessionId })
    .sort({ timestamp: -1, importance: -1 })
    .limit(limit)
    .skip(skip);
};

// Статический метод для получения снимков по проблемам
PostureSnapshotSchema.statics.getByIssues = async function(userId, issues, limit = 20) {
  return this.find({ 
    userId, 
    issues: { $in: issues } 
  })
  .sort({ timestamp: -1 })
  .limit(limit);
};

const PostureSnapshot = mongoose.model('PostureSnapshot', PostureSnapshotSchema);

export default PostureSnapshot;