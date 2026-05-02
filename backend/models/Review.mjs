import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID пользователя обязательно']
  },
  type: {
    type: String,
    enum: ['service', 'product', 'feature', 'general'],
    default: 'service'
  },
  rating: {
    type: Number,
    required: [true, 'Рейтинг обязателен'],
    min: [1, 'Минимальный рейтинг - 1'],
    max: [5, 'Максимальный рейтинг - 5']
  },
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Заголовок не может превышать 200 символов']
  },
  text: {
    type: String,
    required: [true, 'Текст отзыва обязателен'],
    trim: true,
    maxlength: [2000, 'Отзыв не может превышать 2000 символов']
  },
  reply: {
    text: {
      type: String,
      trim: true,
      maxlength: [1000, 'Ответ не может превышать 1000 символов']
    },
    repliedAt: {
      type: Date
    },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  helpful: {
    type: Number,
    default: 0
  },
  helpfulUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tags: [{
    type: String,
    enum: ['точный', 'удобный', 'полезный', 'инновационный', 'надежный', 'быстрый', 'дружелюбный']
  }],
  status: {
    type: String,
    enum: ['active', 'hidden', 'pending'],
    default: 'active'
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
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Индексы для быстрого поиска
reviewSchema.index({ userId: 1 });
reviewSchema.index({ type: 1, status: 1 });
reviewSchema.index({ rating: 1, status: 1 });
reviewSchema.index({ createdAt: -1 });

// Виртуальные поля для связей
reviewSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

reviewSchema.virtual('replier', {
  ref: 'User',
  localField: 'reply.repliedBy',
  foreignField: '_id',
  justOne: true
});

// Предварительная проверка перед сохранением
reviewSchema.pre('save', function(next) {
  if (this.isModified('rating')) {
    this.rating = Math.max(1, Math.min(5, this.rating));
  }
  next();
});

// Статические методы
reviewSchema.statics.getAverageRating = async function() {
  try {
    const result = await this.aggregate([
      {
        $match: {
          status: 'active'
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (result.length > 0 && result[0].averageRating !== null) {
      const distribution = result[0].ratingDistribution.reduce((acc, rating) => {
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
      }, {});

      return {
        averageRating: Math.round(result[0].averageRating * 10) / 10,
        totalReviews: result[0].totalReviews,
        distribution
      };
    }

    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: {}
    };
  } catch (error) {
    console.error('Error calculating average rating:', error);
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: {}
    };
  }
};

reviewSchema.statics.getReviews = async function(options = {}) {
  const {
    limit = 10,
    skip = 0,
    sort = '-createdAt',
    status = 'active',
    minRating = 0,
    maxRating = 5,
    type = null,
    hasReply = null
  } = options;

  const query = {
    status,
    rating: { $gte: minRating, $lte: maxRating }
  };

  if (type) {
    query.type = type;
  }

  if (hasReply !== null) {
    if (hasReply) {
      query['reply.text'] = { $exists: true, $ne: '' };
    } else {
      query['reply.text'] = { $exists: false };
    }
  }

  return await this.find(query)
    .populate('user', 'firstName lastName fullName shortName')
    .populate('replier', 'firstName lastName fullName shortName')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

const Review = mongoose.model('Review', reviewSchema);

export default Review;