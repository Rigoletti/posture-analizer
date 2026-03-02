import express from 'express';
import sessionController from '../controllers/sessionController.mjs';
import recommendationController from '../controllers/recommendationController.mjs';
import { protect } from '../middleware/auth.mjs';

const router = express.Router();

// Все маршруты требуют авторизации
router.use(protect);

// Начать новый сеанс
router.post('/start', sessionController.startSession);

// Завершить сеанс
router.post('/end/:sessionId', sessionController.endSession);

// Обновить метрики сеанса
router.post('/metrics/:sessionId', sessionController.updateSessionMetrics);

// Добавить ключевой момент
router.post('/key-moments/:sessionId', sessionController.addKeyMoment);

// Получить историю сеансов
router.get('/history', sessionController.getSessionsHistory);

// Получить детали сеанса
router.get('/:sessionId', sessionController.getSessionDetails);

// Получить детали сеанса с рекомендациями
router.get('/:sessionId/details-with-recommendations', sessionController.getSessionDetailsWithRecommendations); // <-- Исправлено

// Получить рекомендации для сеанса
router.get('/:sessionId/recommendations', recommendationController.getSessionRecommendations);

// Получить статистику сеансов
router.get('/statistics', sessionController.getSessionStatistics);

// Удалить сеанс
router.delete('/:sessionId', sessionController.deleteSession);

export default router;