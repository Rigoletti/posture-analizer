import express from 'express';
import recommendationController from '../controllers/recommendationController.mjs';
import { protect, authorize } from '../middleware/auth.mjs';

const router = express.Router();

// Все маршруты требуют авторизации и прав администратора
router.use(protect);
router.use(authorize('admin'));

router.get('/', recommendationController.getRecommendations);
router.post('/', recommendationController.createRecommendation);
router.put('/:id', recommendationController.updateRecommendation);
router.delete('/:id', recommendationController.deleteRecommendation);
router.get('/available-exercises', recommendationController.getAvailableExercises);

export default router;

