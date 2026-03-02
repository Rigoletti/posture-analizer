import api from './index';

// Добавьте кэширование запросов
const pendingRequests = new Map();
const requestCache = new Map();

// Интерфейсы
export interface ReviewUser {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  shortName: string;
}

export interface ReviewReply {
  text: string;
  repliedAt: string;
  repliedBy: string;
}

export interface Review {
  _id: string;
  userId: string;
  type: string;
  rating: number;
  title?: string;
  text: string;
  tags: string[];
  reply?: ReviewReply;
  isVerified: boolean;
  helpful: number;
  helpfulUsers: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  user?: ReviewUser;
  replier?: ReviewUser;
}

export interface ReviewsResponse {
  success: boolean;
  reviews: Review[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats?: {
    averageRating: number;
    totalReviews: number;
    distribution: Record<number, number>;
  };
}

export interface CreateReviewData {
  type?: string;
  rating: number;
  title?: string;
  text: string;
  tags?: string[];
}

// Функция для создания ключа кэша
const getCacheKey = (endpoint: string, params?: any) => {
  return `${endpoint}_${JSON.stringify(params || {})}`;
};

// API методы
export const reviewsApi = {
  // Создать отзыв
  createReview: async (data: CreateReviewData) => {
    try {
      const response = await api.post('/reviews', data);
      // Очищаем кэш при создании нового отзыва
      requestCache.clear();
      return response.data;
    } catch (error: any) {
      console.error('Create review error details:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Ошибка при создании отзыва';
      throw new Error(errorMessage);
    }
  },

  // Получить все отзывы (с кэшированием и защитой от повторных запросов)
  getReviews: async (params?: {
    page?: number;
    limit?: number;
    sort?: string;
    minRating?: number;
    maxRating?: number;
    type?: string;
    hasReply?: boolean | string;
    tags?: string[];
  }) => {
    const cacheKey = getCacheKey('getReviews', params);
    
    // Возвращаем кэшированный результат, если есть
    if (requestCache.has(cacheKey)) {
      return requestCache.get(cacheKey);
    }

    // Если запрос уже выполняется, возвращаем тот же промис
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    const requestPromise = (async () => {
      try {
        const response = await api.get('/reviews', { 
          params,
          timeout: 5000 // Таймаут 5 секунд
        });
        
        const result = response.data;
        // Кэшируем успешный результат на 30 секунд
        requestCache.set(cacheKey, result);
        setTimeout(() => {
          requestCache.delete(cacheKey);
        }, 30000);
        
        return result;
      } catch (error: any) {
        console.error('Get reviews error:', error);
        
        // Если сервер не отвечает, возвращаем пустой результат вместо ошибки
        if (error.code === 'ERR_NETWORK' || 
            error.message.includes('ECONNREFUSED') ||
            error.code === 'ECONNABORTED') {
          return {
            success: false,
            reviews: [],
            pagination: {
              page: params?.page || 1,
              limit: params?.limit || 10,
              total: 0,
              pages: 1
            },
            stats: {
              averageRating: 0,
              totalReviews: 0,
              distribution: {}
            },
            error: 'Сервис отзывов временно недоступен. Попробуйте позже.'
          };
        }
        
        // Для других ошибок
        return {
          success: false,
          reviews: [],
          pagination: {
            page: params?.page || 1,
            limit: params?.limit || 10,
            total: 0,
            pages: 1
          },
          stats: {
            averageRating: 0,
            totalReviews: 0,
            distribution: {}
          },
          error: error.response?.data?.error || 
                error.message || 
                'Ошибка при получении отзывов'
        };
      } finally {
        // Удаляем из pending запросов
        pendingRequests.delete(cacheKey);
      }
    })();

    pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  },

  // Получить последние отзывы
  getRecentReviews: async (params?: {
    limit?: number;
    type?: string;
  }) => {
    const cacheKey = getCacheKey('getRecentReviews', params);
    
    if (requestCache.has(cacheKey)) {
      return requestCache.get(cacheKey);
    }

    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    const requestPromise = (async () => {
      try {
        const response = await api.get('/reviews/recent', { 
          params,
          timeout: 5000
        });
        
        const result = response.data;
        requestCache.set(cacheKey, result);
        setTimeout(() => {
          requestCache.delete(cacheKey);
        }, 30000);
        
        return result;
      } catch (error: any) {
        console.error('Get recent reviews error:', error);
        
        if (error.code === 'ERR_NETWORK' || 
            error.message.includes('ECONNREFUSED') ||
            error.code === 'ECONNABORTED') {
          return {
            success: false,
            reviews: [],
            error: 'Сервис временно недоступен'
          };
        }
        
        return {
          success: false,
          reviews: [],
          error: error.response?.data?.error || 
                error.message || 
                'Ошибка при получении последних отзывов'
        };
      } finally {
        pendingRequests.delete(cacheKey);
      }
    })();

    pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  },

  // Получить мои отзывы
  getMyReviews: async (type: 'received' | 'given' | 'all' = 'all') => {
    const cacheKey = getCacheKey('getMyReviews', { type });
    
    if (requestCache.has(cacheKey)) {
      return requestCache.get(cacheKey);
    }

    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    const requestPromise = (async () => {
      try {
        const response = await api.get('/reviews/my', { 
          params: { type },
          timeout: 5000
        });
        
        const result = response.data;
        requestCache.set(cacheKey, result);
        setTimeout(() => {
          requestCache.delete(cacheKey);
        }, 30000);
        
        return result;
      } catch (error: any) {
        console.error('Get my reviews error:', error);
        
        if (error.code === 'ERR_NETWORK' || 
            error.message.includes('ECONNREFUSED') ||
            error.code === 'ECONNABORTED') {
          return {
            success: false,
            reviews: [],
            stats: {
              averageRating: 0,
              totalReviews: 0,
              distribution: {}
            },
            type,
            error: 'Сервис временно недоступен'
          };
        }
        
        return {
          success: false,
          reviews: [],
          stats: {
            averageRating: 0,
            totalReviews: 0,
            distribution: {}
          },
          type,
          error: error.response?.data?.error || 
                error.message || 
                'Ошибка при получении моих отзывов'
        };
      } finally {
        pendingRequests.delete(cacheKey);
      }
    })();

    pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  },

  // Ответить на отзыв
  replyToReview: async (reviewId: string, text: string) => {
    try {
      const response = await api.post(`/reviews/${reviewId}/reply`, { text });
      // Очищаем кэш при изменении отзыва
      requestCache.clear();
      return response.data;
    } catch (error: any) {
      console.error('Reply to review error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Ошибка при добавлении ответа');
    }
  },

  // Обновить отзыв
  updateReview: async (reviewId: string, data: {
    rating?: number;
    title?: string;
    text?: string;
    tags?: string[];
  }) => {
    try {
      const response = await api.put(`/reviews/${reviewId}`, data);
      requestCache.clear();
      return response.data;
    } catch (error: any) {
      console.error('Update review error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Ошибка при обновлении отзыва');
    }
  },

  // Удалить отзыв
  deleteReview: async (reviewId: string) => {
    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      requestCache.clear();
      return response.data;
    } catch (error: any) {
      console.error('Delete review error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Ошибка при удалении отзыва');
    }
  },

  // Отметить как полезный
  markHelpful: async (reviewId: string) => {
    try {
      const response = await api.post(`/reviews/${reviewId}/helpful`);
      requestCache.clear();
      return response.data;
    } catch (error: any) {
      console.error('Mark helpful error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Ошибка при отметке отзыва');
    }
  },

  // Очистить кэш (для отладки)
  clearCache: () => {
    requestCache.clear();
    pendingRequests.clear();
  }
};

export default reviewsApi;