import express from 'express';
import { protect } from '../middleware/auth.mjs';
import {
  createPayment,
  checkPaymentStatus,
  getMySubscription,
  cancelSubscription,
  yookassaWebhook,
  testPaymentSuccess
} from '../controllers/subscriptionController.mjs';

const router = express.Router();

// Публичный webhook для ЮKassa (без защиты)
router.post('/webhook', yookassaWebhook);

// Тестовый эндпоинт для имитации успешного платежа
router.get('/payment-test', testPaymentSuccess);

// Защищенные маршруты
router.use(protect);

router.post('/create-payment', createPayment);
router.get('/my-subscription', getMySubscription);
router.get('/payment-status/:paymentId', checkPaymentStatus);
router.post('/cancel', cancelSubscription); // 

export default router;