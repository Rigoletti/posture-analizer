import express from 'express';
import {
  createReview,
  getReviews,
  getRecentReviews,
  replyToReview,
  updateReview,
  deleteReview,
  markHelpful,
  getMyReviews
} from '../controllers/reviewController.mjs';
import { protect, authorize } from '../middleware/auth.mjs';

const router = express.Router();

// Публичные маршруты - отзывы о сервисе
router.get('/', getReviews); // Все отзывы
router.get('/recent', getRecentReviews); // Последние отзывы

// Защищенные маршруты
router.post('/', protect, createReview); // Создать отзыв
router.get('/my', protect, getMyReviews); // Мои отзывы
router.post('/:reviewId/reply', protect, replyToReview); // Ответить на отзыв (только админ)
router.put('/:reviewId', protect, updateReview); // Обновить свой отзыв
router.delete('/:reviewId', protect, deleteReview); // Удалить свой отзыв
router.post('/:reviewId/helpful', protect, markHelpful); // Отметить как полезный

// Админ маршруты
router.post('/admin/:reviewId/reply', protect, authorize(['admin']), replyToReview);
router.put('/admin/:reviewId', protect, authorize(['admin']), updateReview);
router.delete('/admin/:reviewId', protect, authorize(['admin']), deleteReview);

export default router;