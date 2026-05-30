// /src/api/sessions.ts
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

export const sessionsApi = {
  // Создание новой сессии
  createSession: async (data: {
    confidenceThreshold: number;
    deviationThreshold: number;
    notificationEnabled: boolean;
  }) => {
    try {
      const response = await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Ошибка при создании сессии');
      }
      
      return result;
    } catch (error: any) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  // Завершение сессии
  endSession: async (sessionId: string, metrics: any) => {
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/end`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metrics),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Ошибка при завершении сессии');
      }
      
      return result;
    } catch (error: any) {
      console.error('Error ending session:', error);
      throw error;
    }
  },

  // Получение списка сессий пользователя
  getSessions: async () => {
    try {
      const response = await fetch(`${API_URL}/sessions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Ошибка при получении списка сессий');
      }
      
      return result;
    } catch (error: any) {
      console.error('Error getting sessions:', error);
      throw error;
    }
  },

  // Получение конкретной сессии
  getSession: async (sessionId: string) => {
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Ошибка при получении сессии');
      }
      
      return result;
    } catch (error: any) {
      console.error('Error getting session:', error);
      throw error;
    }
  },

  // Добавление ключевого момента
  addKeyMoment: async (sessionId: string, moment: {
    type: string;
    description: string;
    timestamp: number;
    metadata?: any;
  }) => {
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/moments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(moment),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Ошибка при добавлении ключевого момента');
      }
      
      return result;
    } catch (error: any) {
      console.error('Error adding key moment:', error);
      throw error;
    }
  },

  // Обновление метрик сессии
  updateMetrics: async (sessionId: string, metrics: {
    normalizedPoints?: Array<{ x: number; y: number; score: number }>;
    postureStatus?: string;
    issues?: string[];
    timestamp?: number;
  }) => {
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/metrics`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metrics),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Ошибка при обновлении метрик');
      }
      
      return result;
    } catch (error: any) {
      console.error('Error updating metrics:', error);
      throw error;
    }
  }
};