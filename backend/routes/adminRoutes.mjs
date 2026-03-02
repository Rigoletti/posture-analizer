import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
  getAdminStats,
  createUser  
} from '../controllers/adminController.mjs';
import recommendationController from '../controllers/recommendationController.mjs';
import { protect, authorize } from '../middleware/auth.mjs';
import { uploadModel, handleUploadError } from '../middleware/upload.mjs';

const router = express.Router();

// Публичные маршруты для упражнений
router.get('/exercises/public', getExercises);
router.get('/exercises/public/:id', getExerciseById);

// Для получения упражнений с фильтрацией (доступно всем)
router.get('/exercises', getExercises);
router.get('/exercises/:id', getExerciseById);

// Защищенные маршруты (требуют авторизации)
router.use(protect);

// Маршруты для админов 
router.use(authorize('admin'));

// Статистика админ-панели
router.get('/stats', getAdminStats);

// Маршруты для управления пользователями
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);  
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Маршруты для управления упражнениями
router.post('/exercises', 
  (req, res, next) => {
    console.log('=== UPLOAD MIDDLEWARE START ===');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Method:', req.method);
    next();
  },
  (req, res, next) => {
    uploadModel(req, res, (err) => {
      if (err) {
        console.log('Upload error in middleware:', err);
        return handleUploadError(err, req, res, next);
      }
      console.log('Upload successful, file:', req.file);
      console.log('Body fields:', req.body);
      next();
    });
  },
  createExercise
);

router.put('/exercises/:id', 
  (req, res, next) => {
    uploadModel(req, res, (err) => {
      if (err) {
        return handleUploadError(err, req, res, next);
      }
      next();
    });
  },
  updateExercise
);

router.delete('/exercises/:id', deleteExercise);


// Получить все рекомендации
router.get('/recommendations', recommendationController.getRecommendations);

// Создать новую рекомендацию
router.post('/recommendations', recommendationController.createRecommendation);

// Получить рекомендацию по ID
router.get('/recommendations/:id', recommendationController.getRecommendationById);

// Обновить рекомендацию
router.put('/recommendations/:id', recommendationController.updateRecommendation);

// Удалить рекомендацию
router.delete('/recommendations/:id', recommendationController.deleteRecommendation);

// Получить доступные упражнения для рекомендаций
router.get('/recommendations/available-exercises', recommendationController.getAvailableExercises);

// Получить статистику по рекомендациям
router.get('/recommendations/stats/overview', recommendationController.getRecommendationsStats);

// Получить рекомендации по типу проблемы
router.get('/recommendations/problem-type/:problemType', recommendationController.getRecommendationsByProblemType);

export default router;