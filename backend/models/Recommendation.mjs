import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema({
  problemType: {
    type: String,
    required: true,
    enum: ['shoulders', 'head', 'hips', 'general_posture', 'balance', 'flexibility'],
    index: true
  },
  
  exerciseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true,
    index: true
  },
  
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  
  description: {
    type: String,
    trim: true
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  timestamps: true
});

// Индексы
recommendationSchema.index({ problemType: 1, exerciseId: 1 }, { unique: true });
recommendationSchema.index({ priority: -1 });
recommendationSchema.index({ isActive: 1 });

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

export default Recommendation;