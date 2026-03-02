import { useState, useRef, useCallback, useEffect } from 'react';
import { sessionsApi } from '../api/sessions';

interface UseSessionManagerProps {
  onSessionStarted?: (sessionId: string) => void;
  onSessionEnded?: (sessionId: string, data: any) => void;
}

export const useSessionManager = (props?: UseSessionManagerProps) => {
  const [currentSession, setCurrentSession] = useState<{
    id: string;
    sessionId: string;
    startTime: Date;
  } | null>(null);
  
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [sessionStats, setSessionStats] = useState({
    totalFrames: 0,
    goodPostureFrames: 0,
    warningFrames: 0,
    errorFrames: 0,
    errorsByZone: {
      shoulders: { count: 0, duration: 0 },
      head: { count: 0, duration: 0 },
      hips: { count: 0, duration: 0 }
    },
    lastUpdateTime: Date.now()
  });
  
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const metricsBufferRef = useRef<any[]>([]);

  // Функция для остановки обновления метрик
  const stopMetricsUpdate = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, []);

  // Начать сеанс
  const startSession = useCallback(async (settings?: any) => {
  try {
    setIsLoading(true);
    setError(null);
    
    const deviceInfo = {
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      webcamResolution: '480x480'
    };
    
    console.log('Starting session with settings:', settings);
    const response = await sessionsApi.startSession(settings, deviceInfo);
    console.log('Start session response:', response);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Не удалось начать сеанс');
    }
    
    // Используем sessionId из response.data
    const sessionId = response.data.sessionId;
    
    const session = {
      id: sessionId, // Используем sessionId как id
      sessionId: sessionId,
      startTime: new Date()
    };
    
    setCurrentSession(session);
    setIsSessionActive(true);
    
    // Сбрасываем статистику
    setSessionStats({
      totalFrames: 0,
      goodPostureFrames: 0,
      warningFrames: 0,
      errorFrames: 0,
      errorsByZone: {
        shoulders: { count: 0, duration: 0 },
        head: { count: 0, duration: 0 },
        hips: { count: 0, duration: 0 }
      },
      lastUpdateTime: Date.now()
    });
    
    // Не добавляем ключевой момент автоматически - это можно сделать позже
    
    // Запускаем периодическое обновление метрик
    startMetricsUpdate(session.sessionId);
    
    props?.onSessionStarted?.(session.sessionId);
    
    return session;
  } catch (error: any) {
    console.error('Failed to start session:', error);
    const errorMsg = error.response?.data?.error || error.message || 'Ошибка при начале сеанса';
    setError(errorMsg);
    throw error;
  } finally {
    setIsLoading(false);
  }
}, [props]);

  // Завершить сеанс
  const endSession = useCallback(async (finalMetrics?: any, endSnapshots?: any[]) => {
    if (!currentSession) {
      throw new Error('Нет активного сеанса');
    }
    
    try {
      setIsLoading(true);
      
      // Останавливаем обновление метрик
      stopMetricsUpdate();
      
      // Отправляем буферизованные метрики
      await flushMetricsBuffer();
      
      // Рассчитываем финальные метрики
      const calculatedMetrics = calculateFinalMetrics();
      const metricsToSend = finalMetrics || calculatedMetrics;
      
      console.log('Ending session with metrics:', metricsToSend);
      
      const response = await sessionsApi.endSession(
        currentSession.sessionId,
        metricsToSend,
        endSnapshots
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Не удалось завершить сеанс');
      }
      
      setIsSessionActive(false);
      setCurrentSession(null);
      
      props?.onSessionEnded?.(currentSession.sessionId, response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to end session:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Ошибка при завершении сеанса';
      setError(errorMsg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, props, stopMetricsUpdate]);

  // Обновить метрики
  const updateMetrics = useCallback((
    frameData: any,
    currentStatus: string,
    issues: string[] = []
  ) => {
    if (!currentSession || !isSessionActive) return;
    
    const now = Date.now();
    const frameDuration = 0.2; // Предполагаем 5 FPS
    
    setSessionStats(prevStats => {
      const newStats = { ...prevStats };
      
      newStats.totalFrames += 1;
      newStats.lastUpdateTime = now;
      
      if (currentStatus === 'Хорошая осанка' || currentStatus.includes('Хорошая')) {
        newStats.goodPostureFrames += 1;
      } else if (currentStatus.includes('Нарушена')) {
        newStats.warningFrames += 1;
        
        // Обновляем ошибки по зонам
        issues.forEach(issue => {
          if (issue.includes('Плечи')) {
            newStats.errorsByZone.shoulders.count += 1;
            newStats.errorsByZone.shoulders.duration += frameDuration;
          } else if (issue.includes('Голова')) {
            newStats.errorsByZone.head.count += 1;
            newStats.errorsByZone.head.duration += frameDuration;
          } else if (issue.includes('Таз')) {
            newStats.errorsByZone.hips.count += 1;
            newStats.errorsByZone.hips.duration += frameDuration;
          }
        });
      } else {
        newStats.errorFrames += 1;
      }
      
      return newStats;
    });
    
    // Добавляем в буфер для отправки на сервер
    metricsBufferRef.current.push({
      frameData,
      timestamp: now,
      currentStatus,
      issues
    });
  }, [currentSession, isSessionActive]);

  // Добавить ключевой момент
  const addKeyMoment = useCallback(async (
    type: string,
    message: string,
    data?: any
  ) => {
    if (!currentSession) return;
    
    try {
      await sessionsApi.addKeyMoment(
        currentSession.sessionId,
        type,
        message,
        data
      );
    } catch (error) {
      console.error('Failed to add key moment:', error);
    }
  }, [currentSession]);

  // Вспомогательные функции
  const startMetricsUpdate = useCallback((sessionId: string) => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }
    
    updateIntervalRef.current = setInterval(async () => {
      await flushMetricsBuffer();
    }, 10000); // Отправляем каждые 10 секунд
  }, []);

  const flushMetricsBuffer = useCallback(async () => {
    if (!currentSession || metricsBufferRef.current.length === 0) return;
    
    const buffer = [...metricsBufferRef.current];
    metricsBufferRef.current = [];
    
    try {
      // Отправляем последний фрейм как представительный
      const lastFrame = buffer[buffer.length - 1];
      if (lastFrame) {
        await sessionsApi.updateSessionMetrics(
          currentSession.sessionId,
          lastFrame.frameData,
          lastFrame.timestamp,
          lastFrame.currentStatus,
          lastFrame.issues
        );
      }
    } catch (error) {
      console.error('Failed to flush metrics buffer:', error);
      // Возвращаем неудавшиеся метрики в буфер
      metricsBufferRef.current.unshift(...buffer);
    }
  }, [currentSession]);

  const calculateFinalMetrics = useCallback(() => {
    const totalFrames = sessionStats.totalFrames;
    const goodPostureFrames = sessionStats.goodPostureFrames;
    
    const postureScore = totalFrames > 0 
      ? Math.round((goodPostureFrames / totalFrames) * 100)
      : 0;
    
    return {
      totalFrames: sessionStats.totalFrames,
      goodPostureFrames: sessionStats.goodPostureFrames,
      warningFrames: sessionStats.warningFrames,
      errorFrames: sessionStats.errorFrames,
      errorsByZone: sessionStats.errorsByZone,
      postureScore,
      averageTrackingQuality: 85,
      goodPercentage: totalFrames > 0 ? Math.round((sessionStats.goodPostureFrames / totalFrames) * 100) : 0,
      warningPercentage: totalFrames > 0 ? Math.round((sessionStats.warningFrames / totalFrames) * 100) : 0,
      errorPercentage: totalFrames > 0 ? Math.round((sessionStats.errorFrames / totalFrames) * 100) : 0
    };
  }, [sessionStats]);

  // Автоматическое завершение сеанса при размонтировании
  useEffect(() => {
    return () => {
      if (isSessionActive && currentSession) {
        // Только останавливаем обновление, но не завершаем сеанс
        stopMetricsUpdate();
      }
    };
  }, [isSessionActive, currentSession, stopMetricsUpdate]);

  return {
    // Состояние
    currentSession,
    isSessionActive,
    sessionStats,
    isLoading,
    error,
    
    // Действия
    startSession,
    endSession,
    updateMetrics,
    addKeyMoment,
    
    // Вспомогательные
    calculateFinalMetrics,
    flushMetricsBuffer,
    
    // Информация о сеансе
    getSessionDuration: () => {
      if (!currentSession) return 0;
      return Math.floor((Date.now() - currentSession.startTime.getTime()) / 1000);
    },
    
    getPostureScore: () => {
      const totalFrames = sessionStats.totalFrames;
      const goodPostureFrames = sessionStats.goodPostureFrames;
      
      return totalFrames > 0 
        ? Math.round((goodPostureFrames / totalFrames) * 100)
        : 0;
    },
    
    clearError: () => setError(null)
  };
};