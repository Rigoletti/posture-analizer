import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  logout,
  updatePassword,
  verifyEmailCode,
  resendVerificationCode,
  uploadAvatar,
  deleteAvatar
} from '../controllers/authController.mjs';
import yandexAuthRoutes from './yandexAuthRoutes.mjs';
import {
  validateRegistration,
  validateLogin,
  validateProfileUpdate
} from '../middleware/validation.mjs';
import { protect } from '../middleware/auth.mjs';
import { uploadAvatar as uploadAvatarMiddleware, handleAvatarUpload, handleUploadError } from '../middleware/uploadAvatar.mjs';

const router = express.Router();

// Публичные маршруты
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);

// Маршруты для подтверждения email через код
router.post('/verify-email-code', verifyEmailCode);
router.post('/resend-verification-code', resendVerificationCode);

// Маршруты Яндекс авторизации
router.use('/', yandexAuthRoutes);

// Защищенные маршруты (требуют авторизации)
router.get('/me', protect, getMe);
router.put('/update-profile', protect, validateProfileUpdate, updateProfile);
router.put('/update-password', protect, updatePassword);
router.post('/logout', protect, logout);

// Маршруты для управления аватаром
router.post(
  '/avatar',
  protect,
  uploadAvatarMiddleware,
  handleUploadError,
  handleAvatarUpload,
  uploadAvatar
);

router.delete('/avatar', protect, deleteAvatar);

export default router;