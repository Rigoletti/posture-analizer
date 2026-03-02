import React, { useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useSnapshots } from '../../hooks/useSnapshots';

interface PostureSnapshotManagerProps {
  webcamRef: React.RefObject<Webcam>;
  sessionId?: string;
  isSessionActive: boolean;
  currentIssues: string[];
  onSnapshotCreated?: (snapshot: any) => void;
}

const VIDEO_SIZE = 640; // Увеличил с 480 до 640 для лучшего качества
const MIN_CAPTURE_INTERVAL = 10000; // 10 секунд между снимками

// Маппинг русских названий на английские для сервера
const issueMapping: Record<string, string> = {
  'Плечи': 'shoulders',
  'Голова': 'head',
  'Таз': 'hips'
};

export const PostureSnapshotManager: React.FC<PostureSnapshotManagerProps> = ({
  webcamRef,
  sessionId,
  isSessionActive,
  currentIssues,
  onSnapshotCreated
}) => {
  const lastCaptureTimeRef = useRef<number>(0);
  const hasViolationRef = useRef<boolean>(false);
  
  const { createSnapshot } = useSnapshots({ 
    sessionId,
    autoCapture: false,
    onSnapshotCreated
  });

  // Функция для создания снимка при нарушении
  const captureViolation = useCallback(async () => {
    if (!webcamRef.current?.video || !isSessionActive || !sessionId || currentIssues.length === 0) {
      return;
    }
  
    const now = Date.now();
    if (now - lastCaptureTimeRef.current < MIN_CAPTURE_INTERVAL) {
      return;
    }
  
    try {
      const video = webcamRef.current.video;
      const canvas = document.createElement('canvas');
      
      const videoWidth = video.videoWidth || VIDEO_SIZE;
      const videoHeight = video.videoHeight || VIDEO_SIZE;
      
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
  
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob!), 
          'image/jpeg', 
          0.95
        );
      });
  
      const englishIssues = currentIssues.map(issue => issueMapping[issue] || issue.toLowerCase());
  
      // Создаем тестовые poseData (в реальном приложении нужно получать из анализа)
      const poseData = {
        keypoints: [
          // Здесь должны быть реальные ключевые точки из анализа
          // Пока создаем тестовые для демонстрации
          { x: 0.5, y: 0.2, score: 0.9, name: 'nose' },
          { x: 0.45, y: 0.2, score: 0.9, name: 'left_eye' },
          { x: 0.55, y: 0.2, score: 0.9, name: 'right_eye' },
          // ... остальные точки
        ]
      };
  
      const snapshot = await createSnapshot(blob, {
        postureStatus: 'warning',
        issues: englishIssues,
        poseData: poseData, // Передаем poseData
        type: 'auto',
        importance: currentIssues.length === 1 ? 7 : 8,
        tags: ['auto', ...englishIssues]
      });
  
      if (snapshot) {
        console.log('✅ Снимок успешно создан:', snapshot._id);
        lastCaptureTimeRef.current = now;
      }
    } catch (err) {
      console.error('❌ Ошибка создания снимка:', err);
    }
  }, [webcamRef, sessionId, isSessionActive, currentIssues, createSnapshot]);

  // Проверяем нарушения и делаем снимок
  useEffect(() => {
    if (!isSessionActive || !sessionId) return;

    if (currentIssues.length > 0 && !hasViolationRef.current) {
      console.log('🔴 Обнаружено нарушение:', currentIssues);
      captureViolation();
      hasViolationRef.current = true;
    } else if (currentIssues.length === 0) {
      hasViolationRef.current = false;
    }
  }, [currentIssues, isSessionActive, sessionId, captureViolation]);

  return null;
};