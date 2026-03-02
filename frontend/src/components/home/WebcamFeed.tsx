import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import PostureNotification from '../ui/PostureNotification';
import { PostureSnapshotManager } from './PostureSnapshotManager'; // Новый компонент
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Typography,
  Alert,
  Chip,
  Container,
  Stack,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  useTheme,
  Badge,
  Avatar
} from '@mui/material';
import {
  Refresh,
  CheckCircle,
  ErrorOutline,
  Warning,
  History,
  PlayArrow,
  Stop,
  Timer,
  TrendingUp,
  FitnessCenter,
  ArrowBack as ArrowBackIcon,
  Collections,
  Close
} from '@mui/icons-material';
import { useSessionManager } from '../../hooks/useSessionManager';
import { useSnapshots } from '../../hooks/useSnapshots';
import { SnapshotGallery } from '../sessions/SnapshotGallery';

const VIDEO_SIZE = 480;
const DETECTION_INTERVAL = 200; // Оставляем как было

const KEYPOINT_INDICES = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
} as const;

const POSTURE_THRESHOLDS = {
  CONFIDENCE_THRESHOLD: 0.3,
  DEVIATION_THRESHOLD: 0.1,
  MIN_CALIBRATION_POINTS: 5,
} as const;

// Только верхняя часть тела
const UPPER_BODY_INDICES = [
  KEYPOINT_INDICES.NOSE,
  KEYPOINT_INDICES.LEFT_EYE,
  KEYPOINT_INDICES.RIGHT_EYE,
  KEYPOINT_INDICES.LEFT_EAR,
  KEYPOINT_INDICES.RIGHT_EAR,
  KEYPOINT_INDICES.LEFT_SHOULDER,
  KEYPOINT_INDICES.RIGHT_SHOULDER,
  KEYPOINT_INDICES.LEFT_ELBOW,
  KEYPOINT_INDICES.RIGHT_ELBOW,
  KEYPOINT_INDICES.LEFT_WRIST,
  KEYPOINT_INDICES.RIGHT_WRIST,
];

// Только ключевые точки для анализа
const POSTURE_ANALYSIS_INDICES = [
  KEYPOINT_INDICES.LEFT_SHOULDER,
  KEYPOINT_INDICES.RIGHT_SHOULDER,
  KEYPOINT_INDICES.NOSE,
  KEYPOINT_INDICES.LEFT_EAR,
  KEYPOINT_INDICES.RIGHT_EAR,
];

const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

const mirrorKeypoints = (keypoints: poseDetection.Keypoint[], canvasWidth: number): poseDetection.Keypoint[] => {
  return keypoints.map(kp => ({
    ...kp,
    x: canvasWidth - kp.x
  }));
};

const normalizePoints = (keypoints: poseDetection.Keypoint[]) => {
  const leftShoulder = keypoints[KEYPOINT_INDICES.LEFT_SHOULDER];
  const rightShoulder = keypoints[KEYPOINT_INDICES.RIGHT_SHOULDER];
  
  if (!leftShoulder || !rightShoulder || 
      leftShoulder.score < POSTURE_THRESHOLDS.CONFIDENCE_THRESHOLD ||
      rightShoulder.score < POSTURE_THRESHOLDS.CONFIDENCE_THRESHOLD) {
    return null;
  }
  
  const shoulderWidth = calculateDistance(
    leftShoulder.x, leftShoulder.y,
    rightShoulder.x, rightShoulder.y
  );
  
  if (shoulderWidth < 10) return null;
  
  return keypoints.map(kp => ({
    ...kp,
    x: kp.x / shoulderWidth,
    y: kp.y / shoulderWidth
  }));
};

const WebcamFeed: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referenceNormalized, setReferenceNormalized] = useState<poseDetection.Keypoint[] | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [postureHistory, setPostureHistory] = useState<string[]>([]);
  const [calibrationInProgress, setCalibrationInProgress] = useState<boolean>(false);
  const [trackingQuality, setTrackingQuality] = useState<number>(0);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);
  const [currentPoseStatus, setCurrentPoseStatus] = useState<string>('Ожидание анализа...');
  const [postureSeverity, setPostureSeverity] = useState<'success' | 'warning' | 'error' | 'info'>('info');
  const [currentIssues, setCurrentIssues] = useState<string[]>([]);
  
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'shoulders' | 'head'>('shoulders');
  const lastNotificationTimeRef = useRef<number>(0);
  const lastAlertRef = useRef<string>('');

  const [sessionDuration, setSessionDuration] = useState(0);
  const [showSessionEndDialog, setShowSessionEndDialog] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [recentSnapshots, setRecentSnapshots] = useState<any[]>([]);

  // Используем хук сеансов
  const {
    currentSession,
    isSessionActive,
    startSession,
    endSession,
    updateMetrics,
    addKeyMoment,
    sessionStats,
    getPostureScore,
  } = useSessionManager({
    onSessionStarted: (sessionId) => {
      console.log('Session started:', sessionId);
      setCurrentPoseStatus('Сеанс начат');
      setRecentSnapshots([]);
    },
    onSessionEnded: (sessionId, data) => {
      console.log('Session ended:', sessionId, data);
      setCurrentPoseStatus('Сеанс завершен');
    }
  });

  // Используем хук снимков только для получения данных
  const {
    getSnapshotThumbnailUrl,
    snapshots: allSnapshots
  } = useSnapshots({ 
    sessionId: currentSession?.sessionId,
    autoCapture: false,
    onSnapshotCreated: (snapshot) => {
      setRecentSnapshots(prev => [snapshot, ...prev].slice(0, 5));
    }
  });

  const showPostureNotification = useCallback(async (type: 'shoulders' | 'head', message: string) => {
    const now = Date.now();
    if (now - lastNotificationTimeRef.current < 4000) {
      return;
    }
    
    lastNotificationTimeRef.current = now;

    setNotificationType(type);
    setNotificationMessage(message);
    setShowNotification(true);
    
    if (isSessionActive && currentSession) {
      await addKeyMoment('notification', message, { type });
    }
    
    setTimeout(() => setShowNotification(false), 5000);
  }, [isSessionActive, currentSession, addKeyMoment]);

  const closeNotification = useCallback(() => {
    setShowNotification(false);
  }, []);

  const analyzePosture = useCallback((currentNormalized: poseDetection.Keypoint[]) => {
    if (!referenceNormalized) return;

    const issues: string[] = [];
    let hasShoulderIssue = false;
    let hasHeadIssue = false;

    for (const index of POSTURE_ANALYSIS_INDICES) {
      const currentPoint = currentNormalized[index];
      const referencePoint = referenceNormalized[index];

      if (currentPoint?.score && currentPoint.score > POSTURE_THRESHOLDS.CONFIDENCE_THRESHOLD && 
          referencePoint?.score && referencePoint.score > POSTURE_THRESHOLDS.CONFIDENCE_THRESHOLD) {
        
        const deviation = calculateDistance(
          currentPoint.x, currentPoint.y,
          referencePoint.x, referencePoint.y
        );
        
        if (deviation > POSTURE_THRESHOLDS.DEVIATION_THRESHOLD) {
          if (index === KEYPOINT_INDICES.LEFT_SHOULDER || index === KEYPOINT_INDICES.RIGHT_SHOULDER) {
            if (!issues.includes('Плечи')) {
              issues.push('Плечи');
              hasShoulderIssue = true;
            }
          } else if (index === KEYPOINT_INDICES.NOSE || index === KEYPOINT_INDICES.LEFT_EAR || index === KEYPOINT_INDICES.RIGHT_EAR) {
            if (!issues.includes('Голова')) {
              issues.push('Голова');
              hasHeadIssue = true;
            }
          }
        }
      }
    }

    const status = issues.length > 0 ? `Нарушена: ${issues.join(', ')}` : 'Хорошая осанка';
    const severity = issues.length > 0 ? 'warning' : 'success';

    if (issues.length > 0 && lastAlertRef.current !== status) {
      if (hasShoulderIssue) {
        showPostureNotification('shoulders', 'Плечи в неправильном положении!\nВыпрямите спину и опустите плечи');
      } else if (hasHeadIssue) {
        showPostureNotification('head', 'Голова наклонена вперед!\nПоднимите подбородок и выпрямите шею');
      }
    }

    lastAlertRef.current = status;

    setCurrentIssues(issues);
    setPostureHistory(prev => {
      const newHistory = [...prev, status];
      return newHistory.slice(-5);
    });
    setCurrentPoseStatus(status);
    setPostureSeverity(severity);
    
    if (isSessionActive && currentSession) {
      updateMetrics(
        {
          normalizedPoints: currentNormalized.map((kp, index) => ({
            x: kp.x,
            y: kp.y,
            score: kp.score || 0,
            name: Object.keys(KEYPOINT_INDICES).find(key => 
              KEYPOINT_INDICES[key as keyof typeof KEYPOINT_INDICES] === index
            )
          }))
        },
        status,
        issues
      );
    }
  }, [referenceNormalized, isSessionActive, currentSession, updateMetrics, showPostureNotification]);

  const calibrate = useCallback(async () => {
    const webcamVideo = webcamRef.current?.video;
    
    if (!webcamVideo) {
      setError('Вебкамера не найдена');
      return;
    }

    if (!detector) {
      setError('Модель не загружена');
      return;
    }

    if (calibrationInProgress) return;

    setCalibrationInProgress(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const poses = await detector.estimatePoses(webcamVideo, {
        maxPoses: 1,
        flipHorizontal: false
      });
      
      if (poses.length > 0) {
        const hasRequiredPoints = 
          poses[0].keypoints[KEYPOINT_INDICES.LEFT_SHOULDER]?.score > POSTURE_THRESHOLDS.CONFIDENCE_THRESHOLD &&
          poses[0].keypoints[KEYPOINT_INDICES.RIGHT_SHOULDER]?.score > POSTURE_THRESHOLDS.CONFIDENCE_THRESHOLD &&
          poses[0].keypoints[KEYPOINT_INDICES.NOSE]?.score > POSTURE_THRESHOLDS.CONFIDENCE_THRESHOLD;
        
        if (hasRequiredPoints) {
          const mirroredPoints = mirrorKeypoints(poses[0].keypoints, VIDEO_SIZE);
          const normalized = normalizePoints(mirroredPoints);
          
          if (normalized) {
            setReferenceNormalized(normalized);
            setIsCalibrated(true);
            setCurrentPoseStatus('Калибровано');
            setPostureHistory([]);
            setPostureSeverity('success');
            setShowNotification(false);
            lastAlertRef.current = '';
            lastNotificationTimeRef.current = 0;
          }
        } else {
          setError('Не удалось распознать плечи и голову. Встаньте прямо перед камерой.');
        }
      }
    } catch (err) {
      console.error('Calibration error:', err);
      setError('Ошибка калибровки');
    }
    
    setCalibrationInProgress(false);
  }, [detector, calibrationInProgress]);

  const resetCalibration = () => {
    setReferenceNormalized(null);
    setIsCalibrated(false);
    setCurrentPoseStatus('Ожидание анализа...');
    setPostureSeverity('info');
    setPostureHistory([]);
    setShowNotification(false);
    lastAlertRef.current = '';
    lastNotificationTimeRef.current = 0;
  };

  const handleStartSession = useCallback(async () => {
    try {
      await startSession({
        confidenceThreshold: POSTURE_THRESHOLDS.CONFIDENCE_THRESHOLD,
        deviationThreshold: POSTURE_THRESHOLDS.DEVIATION_THRESHOLD,
        notificationEnabled: true
      });
      
      setCurrentPoseStatus('Анализ начат');
    } catch (err) {
      console.error('Failed to start session:', err);
      setError('Не удалось начать сеанс');
    }
  }, [startSession]);

  const handleEndSession = useCallback(async () => {
    try {
      await endSession();
      setShowSessionEndDialog(true);
      setCurrentPoseStatus('Сеанс завершен');
    } catch (err) {
      console.error('Failed to end session:', err);
      setError('Не удалось завершить сеанс');
    }
  }, [endSession]);

  const handleCloseSessionDialog = () => {
    setShowSessionEndDialog(false);
  };

  const handleViewHistory = () => {
    setShowSessionEndDialog(false);
    navigate('/sessions');
  };

  const handleViewSessionDetails = () => {
    if (currentSession) {
      setShowSessionEndDialog(false);
      navigate(`/sessions/${currentSession.sessionId}`);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { 
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
            enableSmoothing: true
          }
        );
        
        setDetector(detector);
        setIsModelReady(true);
        setIsLoading(false);
      } catch (err) {
        console.error('Model loading error:', err);
        setError('Ошибка загрузки модели');
        setIsLoading(false);
      }
    };

    loadModel();
  }, []);

  useEffect(() => {
    let isMounted = true;
    let lastDetectionTime = 0;

    const detect = async () => {
      if (!isMounted) return;

      const webcamVideo = webcamRef.current?.video;
      
      if (!webcamVideo || !detector) {
        if (isMounted) {
          animationFrameRef.current = requestAnimationFrame(detect);
        }
        return;
      }

      const now = Date.now();
      if (now - lastDetectionTime < DETECTION_INTERVAL) {
        if (isMounted) {
          animationFrameRef.current = requestAnimationFrame(detect);
        }
        return;
      }

      lastDetectionTime = now;

      try {
        if (webcamVideo.readyState < 2) {
          if (isMounted) {
            animationFrameRef.current = requestAnimationFrame(detect);
          }
          return;
        }

        const poses = await detector.estimatePoses(webcamVideo, {
          maxPoses: 1,
          flipHorizontal: false
        });

        if (poses.length > 0) {
          const validPoints = poses[0].keypoints.filter((k, index) => 
            UPPER_BODY_INDICES.includes(index) && 
            k.score && k.score > POSTURE_THRESHOLDS.CONFIDENCE_THRESHOLD
          );
          
          const quality = Math.round((validPoints.length / UPPER_BODY_INDICES.length) * 100);
          setTrackingQuality(quality);
          
          if (quality < 40) {
            setCurrentPoseStatus('Низкое качество отслеживания');
            setPostureSeverity('error');
          } else if (referenceNormalized) {
            const mirroredPoints = mirrorKeypoints(poses[0].keypoints, VIDEO_SIZE);
            const normalized = normalizePoints(mirroredPoints);
            if (normalized) {
              analyzePosture(normalized);
            }
          } else {
            setCurrentPoseStatus('Калибруйте позу');
            setPostureSeverity('info');
          }
        } else {
          setTrackingQuality(0);
          setCurrentPoseStatus('Поза не обнаружена');
          setPostureSeverity('error');
        }
      } catch (err) {
        console.warn('Detection error:', err);
        setTrackingQuality(0);
        setCurrentPoseStatus('Ошибка анализа');
        setPostureSeverity('error');
      }

      if (isMounted) {
        animationFrameRef.current = requestAnimationFrame(detect);
      }
    };

    if (isModelReady && detector) {
      detect();
    }

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [detector, isModelReady, referenceNormalized, analyzePosture]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isSessionActive) {
      interval = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    } else {
      setSessionDuration(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculatePostureScore = () => {
    return getPostureScore();
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: theme.palette.mode === 'light' 
        ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
        : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      py: 4
    }}>
      {/* Менеджер снимков - ничего не рендерит, только логика */}
      <PostureSnapshotManager
        webcamRef={webcamRef}
        sessionId={currentSession?.sessionId}
        isSessionActive={isSessionActive}
        currentIssues={currentIssues}
        onSnapshotCreated={(snapshot) => {
          setRecentSnapshots(prev => [snapshot, ...prev].slice(0, 5));
        }}
      />

      <Container maxWidth="xl">
        {/* Навигация */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
            На главную
          </Button>
          
          <Typography variant="h4" sx={{ flex: 1, fontWeight: 700 }}>
            Анализатор осанки
          </Typography>
          
          {isSessionActive && (
            <Chip icon={<Timer />} label={formatTime(sessionDuration)} color="primary" />
          )}
        </Stack>

        {/* Уведомление */}
        <PostureNotification
          isVisible={showNotification}
          message={notificationMessage}
          postureType={notificationType}
          severity="warning"
          onClose={closeNotification}
        />

        {/* Диалог завершения */}
        <Dialog open={showSessionEndDialog} onClose={handleCloseSessionDialog}>
          <DialogTitle>Сеанс завершен</DialogTitle>
          <DialogContent>
            <Typography>Сеанс анализа успешно завершен.</Typography>
            {currentSession && (
              <Box sx={{ mt: 2 }}>
                <Typography>Длительность: {formatTime(sessionDuration)}</Typography>
                <Typography>Оценка: {calculatePostureScore()}%</Typography>
                <Typography>Кадров: {sessionStats.totalFrames}</Typography>
                <Typography>Снимков нарушений: {recentSnapshots.length}</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSessionDialog}>Закрыть</Button>
            <Button onClick={handleViewHistory} variant="contained">История</Button>
          </DialogActions>
        </Dialog>

        {/* Основной контент */}
        <Grid container spacing={3}>
          {/* Левая колонка - видео */}
          <Grid item xs={12} md={6}>
            <Card>
              <Box sx={{ position: 'relative', bgcolor: 'black' }}>
                <Webcam
                  ref={webcamRef}
                  width={VIDEO_SIZE}
                  height={VIDEO_SIZE}
                  videoConstraints={{ 
                    width: VIDEO_SIZE, 
                    height: VIDEO_SIZE,
                    facingMode: 'user'
                  }}
                  mirrored={true}
                  style={{ width: '100%', height: 'auto' }}
                  onUserMedia={() => {
                    console.log('Webcam accessed successfully');
                    setError(null);
                  }}
                  onUserMediaError={(error) => {
                    console.error('Webcam error:', error);
                    setError('Не удалось получить доступ к вебкамере');
                  }}
                />

                {isLoading && (
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(0,0,0,0.8)'
                  }}>
                    <CircularProgress />
                  </Box>
                )}

                {error && (
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(0,0,0,0.8)',
                    p: 3
                  }}>
                    <Alert severity="error">{error}</Alert>
                  </Box>
                )}

                {isCalibrated && !isLoading && !error && (
                  <Chip
                    label="Эталон задан"
                    color="success"
                    size="small"
                    sx={{ position: 'absolute', top: 10, left: 10 }}
                  />
                )}
              </Box>

              <CardContent>
                <Stack spacing={2}>
                  {/* Кнопки калибровки */}
                  <Stack direction="row" spacing={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={calibrate}
                      disabled={!isModelReady || calibrationInProgress}
                      startIcon={calibrationInProgress ? <CircularProgress size={20} /> : <CheckCircle />}
                    >
                      {calibrationInProgress ? 'Калибровка...' : 'Задать эталон'}
                    </Button>
                    
                    {isCalibrated && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={resetCalibration}
                        startIcon={<Refresh />}
                      >
                        Сброс
                      </Button>
                    )}
                  </Stack>

                  {/* Управление сеансом */}
                  {!isSessionActive ? (
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      size="large"
                      onClick={handleStartSession}
                      disabled={!isCalibrated}
                      startIcon={<PlayArrow />}
                    >
                      Начать анализ
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={handleEndSession}
                      startIcon={<Stop />}
                    >
                      Завершить анализ
                    </Button>
                  )}

                  {/* Последние снимки нарушений */}
                  {recentSnapshots.length > 0 && (
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="subtitle2">Последние нарушения</Typography>
                        <Button size="small" onClick={() => setShowGallery(true)}>
                          Все ({allSnapshots.length})
                        </Button>
                      </Stack>
                      
                      <Stack direction="row" spacing={1}>
                        {recentSnapshots.map((snapshot) => (
                          <Tooltip
                            key={snapshot._id}
                            title={
                              <Box>
                                <Typography variant="caption" display="block">
                                  {new Date(snapshot.timestamp).toLocaleTimeString()}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Проблемы: {snapshot.issues.join(', ')}
                                </Typography>
                              </Box>
                            }
                          >
                            <Badge
                              badgeContent={snapshot.issues.length}
                              color="error"
                            >
                              <Avatar
                                src={getSnapshotThumbnailUrl(snapshot._id)}
                                variant="rounded"
                                sx={{
                                  width: 50,
                                  height: 50,
                                  border: `2px solid ${theme.palette.warning.main}`,
                                  cursor: 'pointer'
                                }}
                                onClick={() => setShowGallery(true)}
                              />
                            </Badge>
                          </Tooltip>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Кнопки навигации */}
                  <Stack direction="row" spacing={1}>
                    <Button
                      fullWidth
                      startIcon={<History />}
                      onClick={() => navigate('/sessions')}
                      variant="outlined"
                    >
                      История
                    </Button>
                    
                    <Button
                      fullWidth
                      startIcon={<Collections />}
                      onClick={() => setShowGallery(true)}
                      variant="outlined"
                    >
                      Снимки
                    </Button>
                    
                    <Button
                      fullWidth
                      startIcon={<FitnessCenter />}
                      onClick={() => navigate('/exercises')}
                      variant="outlined"
                    >
                      Упражнения
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Правая колонка - статистика */}
          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              {/* Статус системы */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Статус системы</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color={trackingQuality > 70 ? 'success.main' : 'warning.main'}>
                          {trackingQuality}%
                        </Typography>
                        <Typography variant="body2">Качество</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color={isCalibrated ? 'success.main' : 'warning.main'}>
                          {isCalibrated ? '✓' : '!'}
                        </Typography>
                        <Typography variant="body2">Калибровка</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Текущий статус */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Текущий статус</Typography>
                  <Alert severity={postureSeverity} sx={{ mb: 2 }}>
                    {currentPoseStatus}
                  </Alert>
                  
                  {currentIssues.length > 0 && (
                    <Stack direction="row" spacing={1}>
                      {currentIssues.map((issue, i) => (
                        <Chip key={i} label={issue} color="warning" size="small" />
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>

              {/* Статистика сеанса */}
              {isSessionActive && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Статистика</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Кадров</Typography>
                        <Typography variant="h6">{sessionStats.totalFrames}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Оценка</Typography>
                        <Typography variant="h6" color="primary">{calculatePostureScore()}%</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Хорошая осанка</Typography>
                        <Typography variant="h6" color="success.main">{sessionStats.goodPostureFrames}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Нарушений</Typography>
                        <Typography variant="h6" color="warning.main">{sessionStats.warningFrames}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* История измерений */}
              {postureHistory.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Последние измерения</Typography>
                    <Stack spacing={1}>
                      {postureHistory.map((status, i) => (
                        <Paper key={i} sx={{ p: 1, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                          <Typography variant="body2">{status}</Typography>
                        </Paper>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Grid>
        </Grid>

        {/* Галерея */}
        <Dialog
          open={showGallery}
          onClose={() => setShowGallery(false)}
          maxWidth="xl"
          fullWidth
          PaperProps={{ sx: { height: '90vh' } }}
        >
          <DialogTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography>Галерея снимков нарушений</Typography>
              <IconButton onClick={() => setShowGallery(false)}>
                <Close />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            {currentSession && (
              <SnapshotGallery sessionId={currentSession.sessionId} />
            )}
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
};

export default WebcamFeed;