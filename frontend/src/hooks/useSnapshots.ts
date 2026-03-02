import { useState, useCallback, useRef } from 'react';
import { snapshotsApi } from '../api/snapshots';
import { useAuthStore } from '../store/auth';

interface UseSnapshotsOptions {
  sessionId?: string;
  autoCapture?: boolean;
  maxSnapshots?: number;
  onSnapshotCreated?: (snapshot: any) => void;
  onError?: (error: string) => void;
}

export const useSnapshots = (options: UseSnapshotsOptions = {}) => {
  const {
    sessionId,
    autoCapture = false,
    maxSnapshots = 50,
    onSnapshotCreated,
    onError
  } = options;

  const { user } = useAuthStore();
  
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [statistics, setStatistics] = useState<any>(null);
  
  const lastCaptureTime = useRef<number>(0);
  const captureQueue = useRef<any[]>([]);
  const isProcessingQueue = useRef(false);

  // Загрузить снимки сеанса
  const loadSnapshots = useCallback(async (
    sessionIdParam?: string,
    page = 1,
    filters?: any
  ) => {
    const targetSessionId = sessionIdParam || sessionId;
    
    if (!targetSessionId) {
      setError('ID сеанса не указан');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await snapshotsApi.getSessionSnapshots(
        targetSessionId,
        page,
        pagination.limit,
        filters
      );

      if (response.success) {
        setSnapshots(response.data.snapshots);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      console.error('Failed to load snapshots:', err);
      setError(err.message || 'Ошибка при загрузке снимков');
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId, pagination.limit, onError]);

  // Загрузить статистику
  const loadStatistics = useCallback(async () => {
    try {
      const response = await snapshotsApi.getSnapshotsStatistics();
      
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load statistics:', err);
    }
  }, []);

  // Создать снимок
  const createSnapshot = useCallback(async (
    imageBlob: Blob | File,
    data: {
      postureStatus: string;
      issues?: string[];
      issueDetails?: any;
      poseData?: any;
      type?: string;
      importance?: number;
      tags?: string[];
      notes?: string;
    }
  ) => {
    if (!sessionId) {
      setError('Нет активного сеанса');
      return null;
    }

    try {
      setError(null);

      // Конвертируем Blob в File если нужно
      const imageFile = imageBlob instanceof File 
        ? imageBlob 
        : new File([imageBlob], `snapshot_${Date.now()}.jpg`, { type: 'image/jpeg' });

      const response = await snapshotsApi.createSnapshot(sessionId, imageFile, data);

      if (response.success) {
        // Добавляем в локальный стейт
        setSnapshots(prev => [response.data, ...prev].slice(0, maxSnapshots));
        
        onSnapshotCreated?.(response.data);
        
        return response.data;
      }
      
      return null;
    } catch (err: any) {
      console.error('Failed to create snapshot:', err);
      setError(err.message || 'Ошибка при создании снимка');
      onError?.(err.message);
      return null;
    }
  }, [sessionId, maxSnapshots, onSnapshotCreated, onError]);

  // Обработка очереди снимков
  const processQueue = useCallback(async () => {
    if (isProcessingQueue.current || captureQueue.current.length === 0) {
      return;
    }

    isProcessingQueue.current = true;

    while (captureQueue.current.length > 0) {
      const item = captureQueue.current.shift();
      try {
        await createSnapshot(item.blob, item.data);
      } catch (err) {
        console.error('Error processing queued snapshot:', err);
      }
      // Небольшая задержка между снимками
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    isProcessingQueue.current = false;
  }, [createSnapshot]);

  // Автоматический захват при нарушении
  const captureViolation = useCallback(async (
    videoElement: HTMLVideoElement,
    status: string,
    issues: string[],
    poseData?: any
  ) => {
    if (!autoCapture || !sessionId) return;

    const now = Date.now();
    // Минимум 5 секунд между автоматическими снимками
    if (now - lastCaptureTime.current < 5000) {
      return;
    }

    try {
      // Создаем canvas для захвата кадра
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Рисуем текущий кадр
      ctx.drawImage(videoElement, 0, 0, 480, 480);

      // Конвертируем в blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
      });

      lastCaptureTime.current = now;

      // Добавляем в очередь
      captureQueue.current.push({
        blob,
        data: {
          postureStatus: status,
          issues,
          poseData,
          type: 'auto',
          importance: issues.length === 0 ? 3 : issues.length === 1 ? 5 : 8
        }
      });

      // Запускаем обработку очереди
      processQueue();

    } catch (err) {
      console.error('Failed to capture violation:', err);
    }
  }, [autoCapture, sessionId, processQueue]);

  // Обновить снимок
  const updateSnapshot = useCallback(async (
    snapshotId: string,
    data: {
      isFavorite?: boolean;
      notes?: string;
      tags?: string[];
      importance?: number;
    }
  ) => {
    try {
      setError(null);

      const response = await snapshotsApi.updateSnapshot(snapshotId, data);

      if (response.success) {
        // Обновляем в локальном стейте
        setSnapshots(prev => prev.map(s => 
          s._id === snapshotId ? { ...s, ...response.data } : s
        ));
        
        return response.data;
      }
      
      return null;
    } catch (err: any) {
      console.error('Failed to update snapshot:', err);
      setError(err.message || 'Ошибка при обновлении снимка');
      onError?.(err.message);
      return null;
    }
  }, [onError]);

  // Удалить снимок
  const deleteSnapshot = useCallback(async (snapshotId: string) => {
    try {
      setError(null);

      const response = await snapshotsApi.deleteSnapshot(snapshotId);

      if (response.success) {
        // Удаляем из локального стейта
        setSnapshots(prev => prev.filter(s => s._id !== snapshotId));
        
        return true;
      }
      
      return false;
    } catch (err: any) {
      console.error('Failed to delete snapshot:', err);
      setError(err.message || 'Ошибка при удалении снимка');
      onError?.(err.message);
      return false;
    }
  }, [onError]);

  // Массовое удаление
  const bulkDelete = useCallback(async (snapshotIds: string[]) => {
    try {
      setError(null);

      const response = await snapshotsApi.bulkDeleteSnapshots(snapshotIds);

      if (response.success) {
        // Удаляем из локального стейта
        setSnapshots(prev => prev.filter(s => !snapshotIds.includes(s._id)));
        
        return true;
      }
      
      return false;
    } catch (err: any) {
      console.error('Failed to bulk delete snapshots:', err);
      setError(err.message || 'Ошибка при массовом удалении снимков');
      onError?.(err.message);
      return false;
    }
  }, [onError]);

  // Переключить избранное
  const toggleFavorite = useCallback(async (snapshotId: string, currentValue: boolean) => {
    return updateSnapshot(snapshotId, { isFavorite: !currentValue });
  }, [updateSnapshot]);

  // Очистить ошибку
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    snapshots,
    loading,
    error,
    pagination,
    statistics,
    loadSnapshots,
    loadStatistics,
    createSnapshot,
    captureViolation,
    updateSnapshot,
    deleteSnapshot,
    bulkDelete,
    toggleFavorite,
    clearError,
    getSnapshotImageUrl: snapshotsApi.getSnapshotImageUrl,
    getSnapshotThumbnailUrl: snapshotsApi.getSnapshotThumbnailUrl
  };
};