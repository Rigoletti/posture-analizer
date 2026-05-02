import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Название упражнения обязательно'],
    trim: true,
    maxlength: [100, 'Название не может превышать 100 символов']
  },
  
  description: {
    type: String,
    required: [true, 'Описание обязательно'],
    trim: true,
    maxlength: [500, 'Описание не может превышать 500 символов']
  },
  type: {
    type: String,
    required: [true, 'Тип упражнения обязателен'],
    trim: true,
    enum: ['stretching', 'cardio', 'strength', 'posture', 'flexibility', 'warmup', 'cooldown'],
    default: 'stretching'
  },
  
  difficulty: {
    type: String,
    required: [true, 'Уровень сложности обязателен'],
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  
  duration: {
    type: Number,
    required: [true, 'Длительность обязательна'],
    min: [1, 'Длительность должна быть не менее 1 минуты']
  },
  
  instructions: {
    type: [String],
    required: [true, 'Инструкции обязательны'],
    validate: {
      validator: function(arr) {
        return arr.length > 0;
      },
      message: 'Должна быть хотя бы одна инструкция'
    }
  },
  
  benefits: {
    type: [String],
    required: [true, 'Преимущества обязательны'],
    validate: {
      validator: function(arr) {
        return arr.length > 0;
      },
      message: 'Должно быть хотя бы одно преимущество'
    }
  },
  
  warnings: {
    type: [String],
    default: []
  },
  
  has3dModel: {
    type: Boolean,
    default: false
  },
  
  modelType: {
    type: String,
    enum: ['arm-stretching', 'jumping-jacks', 'neck-stretch', 'bicycle-crunch', 
           'burpee', 'capoeira', 'press', 'custom'],
    default: 'custom'
  },
  
  modelFile: {
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimeType: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  
  videoUrl: {
    type: String,
    trim: true,
    default: ''
  },
  
  imageUrl: {
    type: String,
    trim: true,
    default: ''
  },
  
  muscleGroups: {
    type: [String],
    default: []
  },
  
  caloriesBurned: {
    type: Number,
    min: 0,
    default: 0
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      if (ret.modelFile && ret.modelFile.filename && !ret.modelFile.url) {
        ret.modelFile.url = `http://localhost:5000/uploads/exercises/${ret.modelFile.filename}`;
      }
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      if (ret.modelFile && ret.modelFile.filename && !ret.modelFile.url) {
        ret.modelFile.url = `http://localhost:5000/uploads/exercises/${ret.modelFile.filename}`;
      }
      return ret;
    }
  }
});

exerciseSchema.pre('save', function(next) {
  if (this.modelFile && this.modelFile.filename && !this.modelFile.url) {
    this.modelFile.url = `http://localhost:5000/uploads/exercises/${this.modelFile.filename}`;
  }
  next();
});

exerciseSchema.index({ title: 'text', description: 'text' });
exerciseSchema.index({ difficulty: 1 });
exerciseSchema.index({ type: 1 });
exerciseSchema.index({ isActive: 1 });
exerciseSchema.index({ has3dModel: 1 });

const Exercise = mongoose.model('Exercise', exerciseSchema);

export default Exercise;