
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
  // ============ ОСНОВНЫЕ МЕТОДЫ ============
  
  // Создание новой сессии (метод, который используется в useSessionManager)
  startSession: async (settings?: any, deviceInfo?: any) => {
    try {
      const response = await fetch(`${API_URL}/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          settings: settings || {
            confidenceThreshold: 0.3,
            deviationThreshold: 0.1,
            notificationEnabled: true
          },
          deviceInfo: deviceInfo || {}
        }),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Ошибка при создании сессии');
      }
      
      // Возвращаем в формате, который ожидает useSessionManager
      return {
        success: true,
        data: {
          sessionId: result.data?.sessionId || result.sessionId,
          ...result.data
        }
      };
    } catch (error: any) {
      console.error('Error starting session:', error);
      return {
        success: false,
        error: error.message || 'Ошибка при создании сессии'
      };
    }
  },

  // Завершение сессии
  endSession: async (sessionId: string, metrics: any, snapshots?: any[]) => {
    try {
      const response = await fetch(`${API_URL}/sessions/end/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          finalMetrics: metrics,
          snapshots: snapshots || []
        }),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Ошибка при завершении сессии');
      }
      
      return {
        success: true,
        data: result.data || result
      };
    } catch (error: any) {
      console.error('Error ending session:', error);
      return {
        success: false,
        error: error.message || 'Ошибка при завершении сессии'
      };
    }
  },

  // Обновление метрик сессии (для реального времени)
  updateSessionMetrics: async (sessionId: string, frameData: any, timestamp: number, currentStatus: string, issues: string[]) => {
  try {
    console.log(`[API] Updating metrics for session ${sessionId}: status=${currentStatus}, issues=${issues.length}`);
    
    const response = await fetch(`${API_URL}/sessions/metrics/${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        frameData,
        timestamp,
        currentStatus,
        issues: issues || []
      }),
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('[API] Update metrics failed:', result);
      throw new Error(result.error || 'Ошибка при обновлении метрик');
    }
    
    console.log('[API] Metrics updated successfully:', result);
    return result;
  } catch (error: any) {
    console.error('[API] Error updating metrics:', error);
    throw error;
  }
},

  // Добавление ключевого момента
  addKeyMoment: async (sessionId: string, type: string, message: string, data?: any) => {
    try {
      const response = await fetch(`${API_URL}/sessions/key-moments/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: type,
          message: message,
          data: data || {}
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

  // ============ ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ============

  // Получение истории сеансов
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
      
      const isLimited = response.headers.get('X-Sessions-Limited') === 'true';
      const sessionsLimit = parseInt(response.headers.get('X-Sessions-Limit') || '10');
      const hasPremium = response.headers.get('X-Has-Premium') === 'true';
      
      return {
        success: true,
        data: {
          sessions: result.data?.sessions || [],
          pagination: result.data?.pagination || {
            page,
            limit,
            total: 0,
            pages: 1,
            isLimited: isLimited,
            limitReached: result.data?.pagination?.limitReached || false
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
            totalErrorFrames: 0,
            isLimited: isLimited,
            limit: sessionsLimit
          },
          subscriptionInfo: result.data?.subscriptionInfo || {
            hasPremiumAccess: hasPremium,
            canViewAllSessions: hasPremium,
            freeSessionsLimit: sessionsLimit,
            currentSessionsCount: result.data?.sessions?.length || 0
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
          statistics: null,
          subscriptionInfo: null
        }
      };
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

  // Получение деталей сессии с рекомендациями
  getSessionDetails: async (sessionId: string) => {
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
        throw new Error(result.error || 'Ошибка при получении деталей сессии');
      }
      
      return result;
    } catch (error: any) {
      console.error('Error getting session details:', error);
      throw error;
    }
  },

  // Получение деталей сессии с рекомендациями (расширенная версия)
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

  // Обновление метрик (альтернативный метод)
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

  // Получение рекомендаций для сессии
  getSessionRecommendations: async (sessionId: string) => {
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/recommendations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Ошибка при получении рекомендаций');
      }
      
      return result;
    } catch (error: any) {
      console.error('Error getting session recommendations:', error);
      throw error;
    }
  },

  // Удаление сессии
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

  // Получение статистики сессий
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