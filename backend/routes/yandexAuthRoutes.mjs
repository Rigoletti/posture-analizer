import express from 'express';
import {
  yandexAuth,
  yandexCallback,
  yandexAuthStatus,
  disconnectYandex
} from '../controllers/yandexAuthController.mjs';
import { protect } from '../middleware/auth.mjs';

const router = express.Router();

// Публичные маршруты
router.get('/yandex', yandexAuth);
router.get('/yandex/callback', yandexCallback);

// Защищенные маршруты
router.get('/yandex/status', protect, yandexAuthStatus);
router.post('/yandex/disconnect', protect, disconnectYandex);

export default router;