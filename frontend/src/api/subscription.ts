import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const subscriptionApi = {
  // Создание платежа
  createPayment: async (plan: string, returnUrl?: string) => {
    try {
      const response = await api.post('/subscription/create-payment', {
        plan,
        returnUrl
      });
      return response.data;
    } catch (error: any) {
      console.error('Create payment error:', error);
      throw error.response?.data || error;
    }
  },

  // Проверка статуса платежа
  checkPaymentStatus: async (paymentId: string) => {
    try {
      const response = await api.get(`/subscription/payment-status/${paymentId}`);
      return response.data;
    } catch (error: any) {
      console.error('Check payment status error:', error);
      throw error.response?.data || error;
    }
  },

  // Получение информации о подписке
  getMySubscription: async () => {
    try {
      const response = await api.get('/subscription/my-subscription');
      return response.data;
    } catch (error: any) {
      console.error('Get subscription error:', error);
      throw error.response?.data || error;
    }
  },

  // Отмена подписки
  cancelSubscription: async () => {
    try {
      const response = await api.post('/subscription/cancel');
      return response.data;
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      throw error.response?.data || error;
    }
  },

  // Синхронизация подписки
syncSubscription: async () => {
  try {
    const response = await api.post('/subscription/sync');
    return response.data;
  } catch (error: any) {
    console.error('Sync subscription error:', error);
    throw error.response?.data || error;
  }
}
};

export default subscriptionApi;