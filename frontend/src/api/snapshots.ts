import api from './index';

export interface SnapshotPoseData {
  keypoints?: Array<{
    x: number;
    y: number;
    score: number;
    name?: string;
  }>;
  normalizedPoints?: Array<{
    x: number;
    y: number;
    score: number;
    name?: string;
  }>;
}

export interface SnapshotIssueDetails {
  shoulders?: {
    detected: boolean;
    deviation: number;
    description?: string;
  };
  head?: {
    detected: boolean;
    deviation: number;
    description?: string;
  };
  hips?: {
    detected: boolean;
    deviation: number;
    description?: string;
  };
}

export interface Snapshot {
    _id: string;
    sessionId: string;
    timestamp: string;
    type: 'warning' | 'error' | 'calibration' | 'manual' | 'auto';
    postureStatus: 'good' | 'warning' | 'error';
    postureScore: number;
    issues: string[];
    issueDetails?: SnapshotIssueDetails;
    poseData?: {  // Добавлено
      keypoints?: Array<{
        x: number;
        y: number;
        score: number;
        name?: string;
      }>;
      normalizedPoints?: Array<{
        x: number;
        y: number;
        score: number;
        name?: string;
      }>;
    };
    isFavorite: boolean;
    notes?: string;
    tags: string[];
    importance: number;
    views: number;
    imageUrl: string;
    thumbnailUrl: string;
    imageMetadata: {
      filename: string;
      contentType: string;
      size: number;
      width: number;
      height: number;
      thumbnailId?: string;
    };
    createdAt: string;
  }

export interface SnapshotsResponse {
  success: boolean;
  data: {
    snapshots: Snapshot[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface SnapshotDetailsResponse {
  success: boolean;
  data: Snapshot;
}

export interface SnapshotStatisticsResponse {
  success: boolean;
  data: {
    overview: {
      totalSnapshots: number;
      favoriteSnapshots: number;
      warningSnapshots: number;
      errorSnapshots: number;
      goodSnapshots: number;
      avgImportance: number;
      totalViews: number;
    };
    issuesStats: Array<{
      _id: string;
      count: number;
    }>;
    dailyStats: Array<{
      _id: {
        year: number;
        month: number;
        day: number;
      };
      count: number;
      avgScore: number;
    }>;
  };
}

export const snapshotsApi = {
  // Создать снимок
  createSnapshot: async (
    sessionId: string,
    imageFile: File,
    data: {
      type?: string;
      postureStatus: string;
      issues?: string[];  // Должен быть массив строк
      issueDetails?: any;
      poseData?: any;
      importance?: number;
      tags?: string[];
      notes?: string;
    }
  ) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('postureStatus', data.postureStatus);
      
      if (data.type) formData.append('type', data.type);
      if (data.issues) {
        // Отправляем как JSON строку, но на сервере нужно распарсить
        formData.append('issues', JSON.stringify(data.issues));
      }
      if (data.issueDetails) formData.append('issueDetails', JSON.stringify(data.issueDetails));
      if (data.poseData) formData.append('poseData', JSON.stringify(data.poseData));
      if (data.importance) formData.append('importance', data.importance.toString());
      if (data.tags) formData.append('tags', JSON.stringify(data.tags));
      if (data.notes) formData.append('notes', data.notes);
  
      const response = await api.post(`/snapshots/session/${sessionId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Create snapshot error:', error);
      throw error;
    }
  },

  // Получить снимки сеанса
  getSessionSnapshots: async (
    sessionId: string,
    page = 1,
    limit = 20,
    filters?: {
      type?: string;
      status?: string;
      favorite?: boolean;
    }
  ) => {
    try {
      const params: any = { page, limit };
      if (filters) {
        if (filters.type) params.type = filters.type;
        if (filters.status) params.status = filters.status;
        if (filters.favorite) params.favorite = 'true';
      }
      
      const response = await api.get(`/snapshots/session/${sessionId}`, { params });
      
      return response.data as SnapshotsResponse;
    } catch (error: any) {
      console.error('Get session snapshots error:', error);
      throw error;
    }
  },

  // Получить детали снимка
  getSnapshotDetails: async (snapshotId: string) => {
    try {
      const response = await api.get(`/snapshots/${snapshotId}`);
      
      return response.data as SnapshotDetailsResponse;
    } catch (error: any) {
      console.error('Get snapshot details error:', error);
      throw error;
    }
  },

  // Получить изображение снимка
  getSnapshotImageUrl: (snapshotId: string) => {
    return `${api.defaults.baseURL}/snapshots/${snapshotId}/image`;
  },

  // Получить миниатюру
  getSnapshotThumbnailUrl: (snapshotId: string) => {
    return `${api.defaults.baseURL}/snapshots/${snapshotId}/thumbnail`;
  },

  // Обновить снимок
  updateSnapshot: async (
    snapshotId: string,
    data: {
      isFavorite?: boolean;
      notes?: string;
      tags?: string[];
      importance?: number;
    }
  ) => {
    try {
      const response = await api.patch(`/snapshots/${snapshotId}`, data);
      
      return response.data;
    } catch (error: any) {
      console.error('Update snapshot error:', error);
      throw error;
    }
  },

  // Удалить снимок
  deleteSnapshot: async (snapshotId: string) => {
    try {
      const response = await api.delete(`/snapshots/${snapshotId}`);
      
      return response.data;
    } catch (error: any) {
      console.error('Delete snapshot error:', error);
      throw error;
    }
  },

  // Получить статистику
  getSnapshotsStatistics: async () => {
    try {
      const response = await api.get('/snapshots/statistics');
      
      return response.data as SnapshotStatisticsResponse;
    } catch (error: any) {
      console.error('Get snapshots statistics error:', error);
      throw error;
    }
  },

  // Массовое удаление
  bulkDeleteSnapshots: async (snapshotIds: string[]) => {
    try {
      const response = await api.post('/snapshots/bulk-delete', { snapshotIds });
      
      return response.data;
    } catch (error: any) {
      console.error('Bulk delete snapshots error:', error);
      throw error;
    }
  }

  
};  


