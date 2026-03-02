import Review from '../models/Review.mjs';
import User from '../models/User.mjs';
import mongoose from 'mongoose';

export const createReview = async (req, res) => {
  try {
    const { type = 'service', rating, title, text, tags = [] } = req.body;
    const userId = req.user?._id;

    console.log('Create review request:', {
      userId,
      type,
      rating,
      title,
      text: text?.substring(0, 50) + '...',
      tags
    });

    // Проверяем, авторизован ли пользователь
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Не авторизован'
      });
    }

    // Проверяем обязательные поля
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Рейтинг должен быть от 1 до 5'
      });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Текст отзыва обязателен'
      });
    }

    // Проверяем, не оставлял ли пользователь уже отзыв сегодня
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const existingReview = await Review.findOne({
      userId,
      createdAt: { 
        $gte: today,
        $lt: tomorrow
      },
      status: { $ne: 'hidden' }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'Вы уже оставляли отзыв сегодня. Попробуйте завтра.'
      });
    }

    // Создаем отзыв
    const review = await Review.create({
      userId,
      type,
      rating: parseInt(rating),
      title: title?.trim(),
      text: text.trim(),
      tags: Array.isArray(tags) ? tags : [],
      isVerified: req.user?.role === 'admin'
    });

    console.log('Review created:', review._id);

    // Получаем созданный отзыв с populate
    const populatedReview = await Review.findById(review._id)
      .populate('user', 'firstName lastName fullName shortName');

    res.status(201).json({
      success: true,
      message: 'Спасибо за ваш отзыв!',
      review: populatedReview
    });
  } catch (error) {
    console.error('Create review error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }

    // Обработка ошибки "Вы уже оставляли отзыв сегодня"
    if (error.message && error.message.includes('Вы уже оставляли отзыв сегодня')) {
      return res.status(400).json({
        success: false,
        error: 'Вы уже оставляли отзыв сегодня. Попробуйте завтра.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Ошибка при создании отзыва'
    });
  }
};

export const getReviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      minRating = 0,
      maxRating = 5,
      type = null,
      hasReply = null,
      tags = []
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Формируем запрос
    const query = {
      status: 'active',
      rating: { $gte: parseInt(minRating), $lte: parseInt(maxRating) }
    };

    if (type) {
      query.type = type;
    }

    if (hasReply === 'true') {
      query['reply.text'] = { $exists: true, $ne: '' };
    } else if (hasReply === 'false') {
      query['reply.text'] = { $exists: false };
    }

    if (tags && tags.length > 0) {
      query.tags = { $in: tags.split(',') };
    }

    // Получаем отзывы
    const reviews = await Review.find(query)
      .populate('user', 'firstName lastName fullName shortName')
      .populate('replier', 'firstName lastName fullName shortName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Получаем общее количество
    const total = await Review.countDocuments(query);

    // Получаем средний рейтинг
    const stats = await Review.getAverageRating();

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении отзывов: ' + error.message
    });
  }
};

export const getRecentReviews = async (req, res) => {
  try {
    const { limit = 10, type = null } = req.query;

    const query = { status: 'active' };
    
    if (type) {
      query.type = type;
    }

    const reviews = await Review.find(query)
      .populate('user', 'firstName lastName fullName shortName')
      .populate('replier', 'firstName lastName fullName shortName')
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Get recent reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении отзывов'
    });
  }
};

export const replyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    // Находим отзыв
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Отзыв не найден'
      });
    }

    // Проверяем, что пользователь является администратором (так как в схеме нет targetUserId)
    // Или автор отзыва может отвечать? В зависимости от бизнес-логики
    // Обычно на отзывы отвечает только администратор
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Только администратор может отвечать на отзывы'
      });
    }

    // Проверяем, не отвечал ли уже пользователь
    if (review.reply && review.reply.text) {
      return res.status(400).json({
        success: false,
        error: 'Вы уже ответили на этот отзыв'
      });
    }

    // Добавляем ответ
    review.reply = {
      text,
      repliedAt: new Date(),
      repliedBy: userId
    };

    await review.save();

    // Получаем обновленный отзыв (убрали ненужный populate)
    const updatedReview = await Review.findById(reviewId)
      .populate('user', 'firstName lastName fullName shortName')
      .populate('replier', 'firstName lastName fullName shortName');

    res.status(200).json({
      success: true,
      message: 'Ответ успешно добавлен',
      review: updatedReview
    });
  } catch (error) {
    console.error('Reply to review error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при добавлении ответа'
    });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, text, tags } = req.body;
    const userId = req.user._id;

    // Находим отзыв
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Отзыв не найден'
      });
    }

    // Проверяем, что пользователь является автором отзыва
    if (review.userId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Нельзя редактировать чужие отзывы'
      });
    }

    // Обновляем отзыв
    if (rating !== undefined) review.rating = rating;
    if (text !== undefined) review.text = text;
    if (tags !== undefined) review.tags = tags;

    await review.save();

    // Получаем обновленный отзыв (убрали ненужный populate)
    const updatedReview = await Review.findById(reviewId)
      .populate('user', 'firstName lastName fullName shortName')
      .populate('replier', 'firstName lastName fullName shortName');

    res.status(200).json({
      success: true,
      message: 'Отзыв успешно обновлен',
      review: updatedReview
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при обновлении отзыва'
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    // Находим отзыв
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Отзыв не найден'
      });
    }

    // Проверяем права
    const isAuthor = review.userId.toString() === userId.toString();
    const isAdmin = req.user.role === 'admin';

    // В текущей схеме нет targetUserId, поэтому проверяем только автора и админа
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Нельзя удалять чужие отзывы'
      });
    }

    // Для автора или целевого пользователя скрываем отзыв
    // Админ может полностью удалить
    if (isAdmin) {
      await review.deleteOne();
    } else {
      review.status = 'hidden';
      await review.save();
    }

    res.status(200).json({
      success: true,
      message: 'Отзыв успешно удален'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при удалении отзыва'
    });
  }
};

export const markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    // Находим отзыв
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Отзыв не найден'
      });
    }

    // Проверяем, не отметил ли пользователь уже отзыв как полезный
    const alreadyHelpful = review.helpfulUsers.some(id => 
      id.toString() === userId.toString()
    );

    if (alreadyHelpful) {
      // Убираем отметку
      review.helpful = Math.max(0, review.helpful - 1);
      review.helpfulUsers = review.helpfulUsers.filter(id => 
        id.toString() !== userId.toString()
      );
    } else {
      // Добавляем отметку
      review.helpful += 1;
      review.helpfulUsers.push(userId);
    }

    await review.save();

    res.status(200).json({
      success: true,
      helpful: review.helpful,
      isHelpful: !alreadyHelpful
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при отметке отзыва'
    });
  }
};

export const getMyReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type = 'given' } = req.query; // Изменено: по умолчанию показываем оставленные отзывы

    let query = { status: 'active' };

    if (type === 'given') {
      query.userId = userId;
    }
    // В текущей схеме нет targetUserId, поэтому не можем фильтровать по полученным отзывам
    // Можно добавить это поле в будущем

    const reviews = await Review.find(query)
      .populate('user', 'firstName lastName fullName shortName')
      .populate('replier', 'firstName lastName fullName shortName')
      .sort('-createdAt');

    const stats = await Review.getAverageRating(userId);

    res.status(200).json({
      success: true,
      reviews,
      stats,
      type
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении отзывов'
    });
  }
};