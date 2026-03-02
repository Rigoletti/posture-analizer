import express from 'express';
import { protect } from '../middleware/auth.mjs';
import {
  createPayment,
  checkPaymentStatus,
  getMySubscription,
  cancelSubscription,
  yookassaWebhook
} from '../controllers/subscriptionController.mjs';

const router = express.Router();

// Публичный webhook для ЮKassa (без защиты)
router.post('/webhook', yookassaWebhook);

// Защищенные маршруты
router.use(protect);

router.post('/create-payment', createPayment);
router.get('/my-subscription', getMySubscription);
router.get('/payment-status/:paymentId', checkPaymentStatus);
router.post('/cancel', cancelSubscription);

export default router;