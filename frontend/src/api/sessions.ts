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
      const response = await fetch(`${API_URL}/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: data }),
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
      const response = await fetch(`${API_URL}/sessions/end/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ finalMetrics: metrics }),
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

  // Получение истории сеансов (соответствует маршруту GET /sessions/history)
  getSessionsHistory: async (page: number = 1, limit: number = 20, filters?: {
    sortBy?: string;
    sortOrder?: string;
    dateFrom?: string;
    dateTo?: string;
    minScore?: number;
    maxScore?: number;
  }) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (filters?.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters?.minScore !== undefined) queryParams.append('minScore', filters.minScore.toString());
      if (filters?.maxScore !== undefined) queryParams.append('maxScore', filters.maxScore.toString());
      
      const response = await fetch(`${API_URL}/sessions/history?${queryParams.toString()}`, {
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
      
      // Возвращаем в формате, ожидаемом в SessionsHistory
      return {
        success: true,
        data: {
          sessions: result.data?.sessions || [],
          pagination: result.data?.pagination || {
            page,
            limit,
            total: 0,
            pages: 1
          },
          statistics: result.data?.statistics || {
            totalSessions: 0,
            totalDuration: 0,
            avgScore: 0,
            bestScore: 0,
            worstScore: 0,
            avgDuration: 0,
            totalFrames: 0,
            totalGoodFrames: 0,
            totalWarningFrames: 0,
            totalErrorFrames: 0
          }
        }
      };
    } catch (error: any) {
      console.error('Error getting sessions history:', error);
      return {
        success: false,
        error: error.message || 'Ошибка при загрузке истории сеансов',
        data: {
          sessions: [],
          pagination: { page: 1, limit, total: 0, pages: 1 },
          statistics: null
        }
      };
    }
  },

  // Получение конкретной сессии (соответствует маршруту GET /sessions/:sessionId)
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

  // Получение деталей сессии с рекомендациями
  getSessionWithRecommendations: async (sessionId: string) => {
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/details-with-recommendations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Ошибка при получении деталей сессии');
      }
      
      return result;
    } catch (error: any) {
      console.error('Error getting session with recommendations:', error);
      throw error;
    }
  },

  // Добавление ключевого момента (соответствует маршруту POST /sessions/key-moments/:sessionId)
  addKeyMoment: async (sessionId: string, moment: {
    type: string;
    message: string;
    data?: any;
  }) => {
    try {
      const response = await fetch(`${API_URL}/sessions/key-moments/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: moment.type,
          message: moment.message,
          data: moment.data || {}
        }),
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

  // Обновление метрик сессии (соответствует маршруту POST /sessions/metrics/:sessionId)
  updateMetrics: async (sessionId: string, metrics: {
    frameData?: any;
    timestamp?: number;
    currentStatus?: string;
    issues?: string[];
  }) => {
    try {
      const response = await fetch(`${API_URL}/sessions/metrics/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          frameData: metrics.frameData,
          timestamp: metrics.timestamp || Date.now(),
          currentStatus: metrics.currentStatus,
          issues: metrics.issues || []
        }),
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
  },

  // Удаление сессии (соответствует маршруту DELETE /sessions/:sessionId)
  deleteSession: async (sessionId: string) => {
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Ошибка при удалении сессии');
      }
      
      return result;
    } catch (error: any) {
      console.error('Error deleting session:', error);
      throw error;
    }
  },

  // Получение статистики сессий (соответствует маршруту GET /sessions/statistics)
  getSessionsStatistics: async () => {
    try {
      const response = await fetch(`${API_URL}/sessions/statistics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Ошибка при получении статистики');
      }
      
      return result;
    } catch (error: any) {
      console.error('Error getting sessions statistics:', error);
      throw error;
    }
  }
};