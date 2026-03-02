import api from './index';

export interface SessionPostureMetrics {
  totalFrames: number;
  goodPostureFrames: number;
  warningFrames: number;
  errorFrames: number;
  errorsByZone: {
    shoulders: { count: number; duration: number; percentage?: number };
    head: { count: number; duration: number; percentage?: number };
    hips: { count: number; duration: number; percentage?: number };
  };
  postureScore: number;
  averageTrackingQuality: number;
}

export interface SessionKeyMoment {
  timestamp: string;
  type: string;
  message: string;
  data?: any;
}

export interface SessionData {
  _id: string;
  sessionId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  postureMetrics: SessionPostureMetrics;
  keyMoments: SessionKeyMoment[];
  settings: any;
  deviceInfo: any;
  createdAt: string;
  updatedAt: string;
}

export interface SessionSummary {
  _id: string;
  sessionId: string;
  startTime: string;
  endTime: string;
  duration: number;
  postureMetrics: {
    postureScore: number;
  };
  keyMoments: any[];
}

export interface SessionStatistics {
  dayOfWeekStats: Array<{ _id: number; count: number; avgScore: number }>;
  hourStats: Array<{ _id: number; count: number; avgScore: number }>;
  errorStats: {
    totalShoulderErrors: number;
    totalHeadErrors: number;
    totalHipErrors: number;
  };
  progressStats: Array<{ date: string; score: number; duration: number }>;
}

export interface Recommendation {
  problemType: string;
  problemSeverity: 'low' | 'medium' | 'high';
  problemPercentage?: number;
  exercise: {
    _id: string;
    title: string;
    description: string;
    type: string;
    difficulty: string;
    duration: number;
    instructions: string[];
    benefits: string[];
    has3dModel?: boolean;
    modelType?: string;
    videoUrl?: string;
    imageUrl?: string;
  };
  recommendation: string;
  priority: number;
}

export interface SessionRecommendations {
  success: boolean;
  data: {
    sessionId: string;
    postureScore: number;
    problems: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      percentage?: number;
    }>;
    recommendations: Recommendation[];
    timestamp: string;
  };
}

export interface SessionMetrics {
  totalFrames: number;
  goodPostureFrames: number;
  warningFrames: number;
  errorFrames: number;
  errorsByZone: {
    shoulders: { count: number; duration: number; percentage?: number };
    head: { count: number; duration: number; percentage?: number };
    hips: { count: number; duration: number; percentage?: number };
  };
  postureScore: number;
  averageTrackingQuality: number;
  goodPercentage?: number;
  warningPercentage?: number;
  errorPercentage?: number;
}


export interface SessionSummary {
  _id: string;
  sessionId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  durationMinutes?: number;
  timeOfDay?: string;
  postureMetrics: SessionMetrics;
  problems: string[];
  keyMomentsCount: number;
  settings: any;
  deviceInfo: any;
  status: string;
}

export interface SessionsHistoryResponse {
  success: boolean;
  data: {
    sessions: SessionSummary[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    statistics: {
      totalSessions: number;
      totalDuration: number;
      avgScore: number;
      bestScore: number;
      worstScore: number;
      avgDuration: number;
      totalFrames: number;
      totalGoodFrames: number;
      totalWarningFrames: number;
      totalErrorFrames: number;
      totalShoulderErrors: number;
      totalHeadErrors: number;
      totalHipErrors: number;
      goodPosturePercentage?: number;
      warningPercentage?: number;
      errorPercentage?: number;
    };
  };
}

export interface SessionsHistoryResponse {
  success: boolean;
  data: {
    sessions: SessionSummary[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    statistics: {
      totalSessions: number;
      totalDuration: number;
      avgScore: number;
      bestScore: number;
      worstScore: number;
    };
  };
}

export const sessionsApi = {
  // Начать новый сеанс
   startSession: async (settings?: any, deviceInfo?: any) => {
    try {
      const response = await api.post('/sessions/start', {
        settings,
        deviceInfo
      });
      
      console.log('Start session response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Start session error:', error);
      throw error;
    }
  },


  // Завершить сеанс
   endSession: async (sessionId: string, finalMetrics?: any, endSnapshots?: any[]) => {
    try {
      const response = await api.post(`/sessions/end/${sessionId}`, { // <-- Изменено
        finalMetrics,
        endSnapshots
      });
      
      console.log('End session response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('End session error:', error);
      throw error;
    }
  },


  // Обновить метрики в реальном времени
   updateSessionMetrics: async (
    sessionId: string, 
    frameData: any, 
    timestamp: number,
    currentStatus: string,
    issues: string[] = []
  ) => {
    try {
      const response = await api.post(`/sessions/metrics/${sessionId}`, { // <-- Изменено
        frameData,
        timestamp,
        currentStatus,
        issues
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Update session metrics error:', error);
      return null;
    }
  },

  // Добавить ключевой момент
 addKeyMoment: async (sessionId: string, type: string, message: string, data?: any) => {
    try {
      const response = await api.post(`/sessions/key-moments/${sessionId}`, { // <-- Изменено
        type,
        message,
        data
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Add key moment error:', error);
      return null;
    }
  },

  // Получить историю сеансов
  getSessionsHistory: async (
    page = 1, 
    limit = 10, 
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      minScore?: number;
      maxScore?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ) => {
    try {
      const params: any = { page, limit };
      if (filters) {
        Object.assign(params, filters);
      }
      
      const response = await api.get('/sessions/history', { params });
      
      return response.data as SessionsHistoryResponse;
    } catch (error: any) {
      console.error('Get sessions history error:', error);
      throw error;
    }
  },

  // Получить детали сеанса
  getSessionDetails: async (sessionId: string) => {
    try {
      const response = await api.get(`/sessions/${sessionId}`);
      
      return response.data;
    } catch (error: any) {
      console.error('Get session details error:', error);
      throw error;
    }
  },

  // Получить статистику
  getSessionStatistics: async () => {
    try {
      const response = await api.get('/sessions/statistics');
      
      return response.data;
    } catch (error: any) {
      console.error('Get session statistics error:', error);
      throw error;
    }
  },

  // Удалить сеанс
  deleteSession: async (sessionId: string) => {
    try {
      const response = await api.delete(`/sessions/${sessionId}`);
      
      return response.data;
    } catch (error: any) {
      console.error('Delete session error:', error);
      throw error;
    }
  },
   // Получить рекомендации для сеанса
  getSessionRecommendations: async (sessionId: string) => {
    try {
      const response = await api.get(`/sessions/${sessionId}/recommendations`);
      return response.data as SessionRecommendations;
    } catch (error: any) {
      console.error('Get session recommendations error:', error);
      throw error;
    }
  },

  // Получить детали сеанса с рекомендациями
  getSessionDetailsWithRecommendations: async (sessionId: string) => {
    try {
      const response = await api.get(`/sessions/${sessionId}/details-with-recommendations`);
      return response.data;
    } catch (error: any) {
      console.error('Get session details with recommendations error:', error);
      throw error;
    }
  }
};