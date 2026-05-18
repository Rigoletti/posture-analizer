const API_URL = 'http://localhost:5000/api';

export const subscriptionApi = {
  // Создание платежа
  createPayment: async (plan: string, returnUrl?: string) => {
    try {
      const response = await fetch(`${API_URL}/subscription/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          plan, 
          returnUrl: returnUrl || window.location.origin + '/profile/subscription/success'
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при создании платежа');
      }
      
      return data;
    } catch (error: any) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  // Проверка статуса платежа
  checkPaymentStatus: async (paymentId: string) => {
    try {
      console.log('Checking payment status for:', paymentId);
      const response = await fetch(`${API_URL}/subscription/payment-status/${paymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('Payment status response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при проверке статуса платежа');
      }
      
      return data;
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  },

  // Получение информации о подписке текущего пользователя
  getMySubscription: async () => {
    try {
      const response = await fetch(`${API_URL}/subscription/my-subscription`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при получении информации о подписке');
      }
      
      return data;
    } catch (error: any) {
      console.error('Error getting subscription:', error);
      throw error;
    }
  },

  // Отмена подписки
  cancelSubscription: async () => {
    try {
      const response = await fetch(`${API_URL}/subscription/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при отмене подписки');
      }
      
      return data;
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }
};