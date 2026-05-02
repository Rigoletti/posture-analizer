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
    ended?: boolean;
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
  const isEndingRef = useRef(false);

  const stopMetricsUpdate = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, []);

  const flushMetricsBuffer = useCallback(async () => {
    if (!currentSession || metricsBufferRef.current.length === 0 || currentSession.ended) return;
    
    const buffer = [...metricsBufferRef.current];
    metricsBufferRef.current = [];
    
    try {
      const lastFrame = buffer[buffer.length - 1];
      if (lastFrame && currentSession.sessionId) {
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
      metricsBufferRef.current.unshift(...buffer);
    }
  }, [currentSession]);

  const startMetricsUpdate = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }
    
    updateIntervalRef.current = setInterval(() => {
      flushMetricsBuffer();
    }, 10000);
  }, [flushMetricsBuffer]);

  const startSession = useCallback(async (settings?: any) => {
    if (isEndingRef.current) return null;
    
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
      
      const sessionId = response.data.sessionId;
      
      const session = {
        id: sessionId,
        sessionId: sessionId,
        startTime: new Date(),
        ended: false
      };
      
      setCurrentSession(session);
      setIsSessionActive(true);
      
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
      
      startMetricsUpdate();
      
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
  }, [props, startMetricsUpdate]);

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

  const endSession = useCallback(async (finalMetrics?: any, endSnapshots?: any[]) => {
    if (!currentSession || isEndingRef.current) {
      return null;
    }
    
    isEndingRef.current = true;
    
    try {
      setIsLoading(true);
      
      stopMetricsUpdate();
      await flushMetricsBuffer();
      
      if (currentSession.ended) {
        return null;
      }
      
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
      
      setCurrentSession(prev => prev ? { ...prev, ended: true } : null);
      setIsSessionActive(false);
      
      props?.onSessionEnded?.(currentSession.sessionId, response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to end session:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Ошибка при завершении сеанса';
      setError(errorMsg);
      throw error;
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        isEndingRef.current = false;
      }, 500);
    }
  }, [currentSession, props, stopMetricsUpdate, flushMetricsBuffer, calculateFinalMetrics]);

  const updateMetrics = useCallback((
    frameData: any,
    currentStatus: string,
    issues: string[] = []
  ) => {
    if (!currentSession || !isSessionActive || currentSession.ended) return;
    
    const now = Date.now();
    const frameDuration = 0.2;
    
    setSessionStats(prevStats => {
      const newStats = { ...prevStats };
      
      newStats.totalFrames += 1;
      newStats.lastUpdateTime = now;
      
      if (currentStatus === 'Хорошая осанка' || currentStatus.includes('Хорошая')) {
        newStats.goodPostureFrames += 1;
      } else if (currentStatus.includes('Нарушена')) {
        newStats.warningFrames += 1;
        
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
    
    metricsBufferRef.current.push({
      frameData,
      timestamp: now,
      currentStatus,
      issues
    });
    
    if (metricsBufferRef.current.length >= 10) {
      flushMetricsBuffer();
    }
  }, [currentSession, isSessionActive, flushMetricsBuffer]);

  const addKeyMoment = useCallback(async (
    type: string,
    message: string,
    data?: any
  ) => {
    if (!currentSession || currentSession.ended) return;
    
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

  useEffect(() => {
    return () => {
      if (isSessionActive && currentSession && !currentSession.ended) {
        stopMetricsUpdate();
      }
    };
  }, [isSessionActive, currentSession, stopMetricsUpdate]);

  return {
    currentSession,
    isSessionActive,
    sessionStats,
    isLoading,
    error,
    
    startSession,
    endSession,
    updateMetrics,
    addKeyMoment,
    
    calculateFinalMetrics,
    flushMetricsBuffer,
    
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