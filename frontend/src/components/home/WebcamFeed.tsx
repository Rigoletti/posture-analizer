import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PostureNotification from '../ui/PostureNotification';
import { sessionsApi } from '../../api/sessions';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  LinearProgress,
  Tooltip,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Refresh,
  CheckCircle,
  History,
  PlayArrow,
  Stop,
  FitnessCenter,
  CheckCircleOutline,
  WarningAmber,
  EmojiEvents,
  AccessTime,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSessionManager } from '../../hooks/useSessionManager';
import { usePostureAnalysis, usePostureControl } from '../../contexts/PostureAnalysisContext';
import type { PostureIssueType } from '../../services/postureAnalysisService';

const NOTIFICATION_COOLDOWN = 5000;

const WebcamFeed: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastNotificationTimeRef = useRef(0);
  const [cameraReady, setCameraReady] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true);
  const isInitializedRef = useRef(false);

  // Состояние из глобального сервиса
  const state = usePostureAnalysis();
  const control = usePostureControl();

  // Только одна инициализация камеры при первом монтировании
  useEffect(() => {
    isMountedRef.current = true;
    
    // Предотвращаем повторную инициализацию
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const initCamera = async () => {
      try {
        // Проверяем, есть ли уже активный поток через сервис
        const existingStream = control.getVideoStream?.();
        if (existingStream && videoRef.current) {
          videoRef.current.srcObject = existingStream;
          setCameraReady(true);
          return;
        }
        
        // Иначе создаем новый поток
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current && isMountedRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch (error) {
        console.error('Ошибка доступа к камере:', error);
      }
    };

    initCamera();

    // Cleanup только если компонент размонтирован и анализ не активен
    return () => {
      isMountedRef.current = false;
      // Не останавливаем поток, если анализ активен
      if (!state.isRunning && streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [control, state.isRunning]);

  // Отдельный эффект для синхронизации с сервисом (без пересоздания потока)
  useEffect(() => {
    // Если анализ активен и видео элемент существует, но srcObject не соответствует
    if (state.isRunning && videoRef.current) {
      const serviceStream = control.getVideoStream?.();
      const currentStream = videoRef.current.srcObject as MediaStream;
      
      // Проверяем, нужно ли обновить srcObject
      if (serviceStream && serviceStream !== currentStream) {
        // Сохраняем текущее состояние воспроизведения
        const wasPlaying = !videoRef.current.paused;
        
        videoRef.current.srcObject = serviceStream;
        
        // Восстанавливаем воспроизведение если нужно
        if (wasPlaying && videoRef.current.paused) {
          videoRef.current.play().catch(console.error);
        }
      }
    }
  }, [state.isRunning, control]);

  // Обработка видимости страницы - только перезапуск видео, без смены потока
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && videoRef.current) {
        // Просто убеждаемся что видео играет
        if (videoRef.current.paused && videoRef.current.srcObject) {
          videoRef.current.play().catch(console.error);
        }
        
        // Обновляем отображение если нужно
        if (videoRef.current.srcObject) {
          // Принудительно перезапрашиваем кадр
          videoRef.current.style.opacity = '0.99';
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.style.opacity = '1';
            }
          }, 50);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<PostureIssueType>('shoulders');

  const [showSessionEndDialog, setShowSessionEndDialog] = useState(false);
  const [notificationAlert, setNotificationAlert] = useState<string | null>(null);

  const [isStartSessionLoading, setIsStartSessionLoading] = useState(false);
  const [isEndSessionLoading, setIsEndSessionLoading] = useState(false);

  const {
    currentSession,
    isSessionActive,
    startSession,
    endSession,
    updateMetrics,
    addKeyMoment,
  } = useSessionManager({
    onSessionStarted: () => {
      setIsStartSessionLoading(false);
    },
    onSessionEnded: () => {
      setIsEndSessionLoading(false);
    },
  });

  // Синхронизация метрик между сервисом и сессией
  useEffect(() => {
    if (!isSessionActive || !state.isRunning) return;
    
    const interval = setInterval(() => {
      if (state.totalFrames > 0) {
        updateMetrics(
          {
            normalizedPoints: state.normalizedKeypoints?.map(kp => ({
              x: kp.x,
              y: kp.y,
              score: kp.score || 0,
            })) || [],
          },
          state.currentStatus,
          state.issues.map(i => i.type === 'shoulders' ? 'Плечи' : i.type === 'head' ? 'Голова' : i.type),
        );
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isSessionActive, state.isRunning, state.totalFrames, state.currentStatus, state.issues, state.normalizedKeypoints, updateMetrics]);

  // Показываем in-app уведомление при нарушении осанки
  useEffect(() => {
    if (!state.isRunning || !state.isSessionActive) return;
    if (state.issues.length === 0) {
      setShowNotification(false);
      return;
    }

    const now = Date.now();
    if (now - lastNotificationTimeRef.current < NOTIFICATION_COOLDOWN) return;
    lastNotificationTimeRef.current = now;

    const issue = state.issues[0];
    setNotificationType(issue.type);
    setNotificationMessage(issue.message);
    setShowNotification(true);

    if (currentSession) {
      addKeyMoment('notification', issue.message, { type: issue.type });
    }

    setTimeout(() => setShowNotification(false), 5000);
  }, [state.issues, state.isRunning, state.isSessionActive, currentSession, addKeyMoment]);

  const handleCalibrate = useCallback(async () => {
    await control.calibrate();
  }, [control]);

  const handleResetCalibration = useCallback(() => {
    control.resetCalibration();
  }, [control]);

  const handleStartSession = useCallback(async () => {
    setIsStartSessionLoading(true);

    if (!state.isCalibrated) {
      const calibrated = await control.calibrate();
      if (!calibrated) {
        setIsStartSessionLoading(false);
        return;
      }
    }

    const started = await control.start();
    if (!started) {
      setIsStartSessionLoading(false);
      return;
    }

    try {
      await startSession({
        confidenceThreshold: 0.3,
        deviationThreshold: 0.1,
        notificationEnabled: true,
      });
    } catch (err) {
      console.error('Failed to start session:', err);
      control.stop();
      setIsStartSessionLoading(false);
    }
  }, [state.isCalibrated, control, startSession]);

  const handleEndSession = useCallback(async () => {
    setIsEndSessionLoading(true);

    try {
      control.stop();
      await endSession();
      setShowSessionEndDialog(true);
      control.resetSessionStats();
    } catch (err) {
      console.error('Failed to end session:', err);
      setIsEndSessionLoading(false);
    }
  }, [control, endSession]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCloseDialog = () => setShowSessionEndDialog(false);
  const handleViewHistory = () => {
    setShowSessionEndDialog(false);
    navigate('/sessions');
  };

  const closeNotification = () => setShowNotification(false);
  const closeNotificationAlert = () => setNotificationAlert(null);

  const postureSeverity = state.issues.length > 0 ? 'warning' : state.isRunning ? 'success' : 'info';
  const isStartButtonDisabled = !state.isCalibrated || state.isModelLoading || state.isCalibrating || isStartSessionLoading || state.isRunning;
  const isEndButtonDisabled = !state.isRunning || isEndSessionLoading;

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #eef2f7 50%, #e8edf5 100%)',
      py: 4,
      position: 'relative',
    }}>
      <Container maxWidth="xl">
        <PostureNotification
          isVisible={showNotification}
          message={notificationMessage}
          postureType={notificationType}
          severity="warning"
          onClose={closeNotification}
        />

        <Snackbar
          open={!!notificationAlert}
          autoHideDuration={5000}
          onClose={closeNotificationAlert}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={closeNotificationAlert} severity="info" sx={{ borderRadius: 2 }}>
            {notificationAlert}
          </Alert>
        </Snackbar>

        <Dialog 
          open={showSessionEndDialog} 
          onClose={handleCloseDialog}
          PaperProps={{
            sx: {
              borderRadius: 4,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
            <EmojiEvents sx={{ fontSize: 60, mb: 1 }} />
            <Typography variant="h5" fontWeight={600}>Сеанс завершен</Typography>
          </DialogTitle>
          <DialogContent>
            <Typography align="center" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              Отличная работа! Сеанс анализа успешно завершен.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button onClick={handleCloseDialog} sx={{ color: 'white' }}>Закрыть</Button>
            <Button onClick={handleViewHistory} variant="contained" sx={{ bgcolor: 'white', color: '#667eea' }}>История</Button>
          </DialogActions>
        </Dialog>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card sx={{ 
                borderRadius: 4, 
                overflow: 'hidden',
                background: 'white',
                boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
                }
              }}>
                <Box sx={{ 
                  position: 'relative', 
                  bgcolor: '#f0f2f5', 
                  aspectRatio: '4/3',
                }}>
                  <video
                    ref={videoRef}
                    width="100%"
                    height="100%"
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: 'scaleX(-1)',
                    }}
                  />

                  {state.isModelLoading && !cameraReady && (
                    <Fade in>
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: 2,
                        bgcolor: 'rgba(255,255,255,0.95)',
                      }}>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <CircularProgress size={60} sx={{ color: '#667eea' }} />
                        </motion.div>
                        <Typography sx={{ color: '#1e293b', fontWeight: 500 }}>Загрузка AI модели...</Typography>
                        <LinearProgress sx={{ width: '60%', borderRadius: 2 }} />
                      </Box>
                    </Fade>
                  )}

                  {state.error && (
                    <Fade in>
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(255,255,255,0.95)',
                        p: 3
                      }}>
                        <Alert severity="error" sx={{ borderRadius: 2 }}>{state.error}</Alert>
                      </Box>
                    </Fade>
                  )}

                  {state.isCalibrated && !state.isModelLoading && !state.error && (
                    <Zoom in>
                      <Chip
                        icon={<CheckCircleOutline sx={{ fontSize: 16 }} />}
                        label="Эталон задан"
                        color="success"
                        size="small"
                        sx={{ 
                          position: 'absolute', 
                          top: 16, 
                          left: 16, 
                          zIndex: 10,
                          fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                      />
                    </Zoom>
                  )}

                  {state.isRunning && (
                    <Zoom in>
                      <Chip
                        icon={<AccessTime />}
                        label={formatTime(state.sessionDuration)}
                        color="primary"
                        size="medium"
                        sx={{ 
                          position: 'absolute', 
                          bottom: 16, 
                          right: 16, 
                          zIndex: 10,
                          fontWeight: 600,
                          fontSize: '1rem',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                      />
                    </Zoom>
                  )}
                </Box>

                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={2}>
                      <Tooltip title="Зафиксировать текущую позу как эталон">
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={handleCalibrate}
                          disabled={state.isCalibrating || state.isModelLoading || state.isRunning}
                          startIcon={state.isCalibrating ? <CircularProgress size={20} /> : <CheckCircle />}
                          sx={{ 
                            textTransform: 'none', 
                            borderRadius: 2,
                            py: 1.2,
                            bgcolor: '#667eea',
                            '&:hover': {
                              bgcolor: '#5a67d8',
                            }
                          }}
                        >
                          {state.isCalibrating ? 'Калибровка...' : 'Задать эталон'}
                        </Button>
                      </Tooltip>
                      
                      {state.isCalibrated && (
                        <Tooltip title="Сбросить калибровку">
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={handleResetCalibration}
                            disabled={state.isCalibrating || state.isRunning}
                            startIcon={<Refresh />}
                            sx={{ 
                              textTransform: 'none', 
                              borderRadius: 2,
                              py: 1.2,
                              borderWidth: 2,
                              '&:hover': {
                                borderWidth: 2,
                              }
                            }}
                          >
                            Сброс
                          </Button>
                        </Tooltip>
                      )}
                    </Stack>

                    {!state.isRunning ? (
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          color="success"
                          size="large"
                          onClick={handleStartSession}
                          disabled={isStartButtonDisabled}
                          startIcon={isStartSessionLoading ? <CircularProgress size={20} /> : <PlayArrow />}
                          sx={{ 
                            textTransform: 'none', 
                            borderRadius: 2, 
                            py: 1.5,
                            bgcolor: '#10b981',
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            '&:hover': {
                              bgcolor: '#059669',
                            }
                          }}
                        >
                          {isStartSessionLoading ? 'Запуск...' : 'Начать анализ'}
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          color="error"
                          onClick={handleEndSession}
                          disabled={isEndButtonDisabled}
                          startIcon={isEndSessionLoading ? <CircularProgress size={20} /> : <Stop />}
                          sx={{ 
                            textTransform: 'none', 
                            borderRadius: 2, 
                            py: 1.5,
                            borderWidth: 2,
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            '&:hover': {
                              borderWidth: 2,
                            }
                          }}
                        >
                          {isEndSessionLoading ? 'Завершение...' : 'Завершить анализ'}
                        </Button>
                      </motion.div>
                    )}

                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Просмотреть историю сеансов">
                        <Button
                          fullWidth
                          startIcon={<History />}
                          onClick={() => navigate('/sessions')}
                          variant="outlined"
                          sx={{ 
                            textTransform: 'none', 
                            borderRadius: 2,
                            py: 1,
                            borderColor: '#cbd5e1',
                            color: '#475569',
                            '&:hover': {
                              borderColor: '#667eea',
                              bgcolor: '#f1f5f9',
                            }
                          }}
                        >
                          История
                        </Button>
                      </Tooltip>
                      
                      <Tooltip title="Рекомендуемые упражнения">
                        <Button
                          fullWidth
                          startIcon={<FitnessCenter />}
                          onClick={() => navigate('/exercises')}
                          variant="outlined"
                          sx={{ 
                            textTransform: 'none', 
                            borderRadius: 2,
                            py: 1,
                            borderColor: '#cbd5e1',
                            color: '#475569',
                            '&:hover': {
                              borderColor: '#667eea',
                              bgcolor: '#f1f5f9',
                            }
                          }}
                        >
                          Упражнения
                        </Button>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card sx={{ 
                  borderRadius: 4,
                  background: 'white',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#1e293b', fontWeight: 600, mb: 2 }}>
                      Статус системы
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Paper sx={{ 
                          p: 2.5, 
                          textAlign: 'center',
                          bgcolor: '#f8fafc',
                          borderRadius: 3,
                          border: '1px solid #e2e8f0',
                        }}>
                          <motion.div
                            animate={{ scale: state.trackingQuality > 70 ? [1, 1.05, 1] : 1 }}
                            transition={{ duration: 0.5, repeat: state.trackingQuality > 70 ? Infinity : 0, repeatDelay: 2 }}
                          >
                            <Typography variant="h2" sx={{ 
                              fontWeight: 700,
                              color: state.trackingQuality > 70 ? '#10b981' : '#f59e0b',
                            }}>
                              {state.trackingQuality}%
                            </Typography>
                          </motion.div>
                          <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
                            Качество отслеживания
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper sx={{ 
                          p: 2.5, 
                          textAlign: 'center',
                          bgcolor: '#f8fafc',
                          borderRadius: 3,
                          border: '1px solid #e2e8f0',
                        }}>
                          <Typography variant="h2" sx={{ 
                            fontWeight: 700,
                            color: state.isCalibrated ? '#10b981' : '#ef4444',
                          }}>
                            {state.isCalibrated ? '✓' : '!'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
                            Калибровка {state.isCalibrated ? 'задана' : 'не задана'}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card sx={{ 
                  borderRadius: 4,
                  background: 'white',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#1e293b', fontWeight: 600, mb: 2 }}>
                      Текущий статус
                    </Typography>
                    <Alert 
                      severity={postureSeverity as 'success' | 'warning' | 'info'} 
                      icon={postureSeverity === 'success' ? <CheckCircle /> : <WarningAmber />}
                      sx={{ 
                        mb: 2, 
                        borderRadius: 2,
                        bgcolor: postureSeverity === 'success' ? '#f0fdf4' : postureSeverity === 'warning' ? '#fffbeb' : '#f8fafc',
                        border: `1px solid ${postureSeverity === 'success' ? '#bbf7d0' : postureSeverity === 'warning' ? '#fde68a' : '#e2e8f0'}`,
                      }}
                    >
                      <Typography fontWeight={500}>{state.currentStatus}</Typography>
                    </Alert>
                    
                    {state.issues.length > 0 && (
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {state.issues.map((issue, i) => (
                          <Chip 
                            key={i} 
                            label={issue.type === 'shoulders' ? 'Плечи' : issue.type === 'head' ? 'Голова' : issue.type} 
                            color="warning" 
                            size="small" 
                            sx={{ 
                              fontWeight: 600,
                              bgcolor: '#fef3c7',
                              color: '#92400e',
                            }}
                          />
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {state.isRunning && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card sx={{ 
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                        Статистика сеанса
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                              Всего кадров
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                              {state.totalFrames}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                              Общая оценка
                            </Typography>
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 0.5 }}
                            >
                              <Typography variant="h4" sx={{ 
                                fontWeight: 700,
                                color: 'white'
                              }}>
                                {state.postureScore}%
                              </Typography>
                            </motion.div>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                              Хорошая осанка
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#bbf7d0' }}>
                              {state.goodPostureFrames}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                              Нарушения
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#fecaca' }}>
                              {state.warningFrames}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                      
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={state.postureScore} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: 'rgba(255,255,255,0.3)',
                            '& .MuiLinearProgress-bar': {
                              background: 'white',
                            }
                          }} 
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {state.postureHistory.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Card sx={{ 
                    borderRadius: 4,
                    background: 'white',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ color: '#1e293b', fontWeight: 600, mb: 2 }}>
                        Последние измерения
                      </Typography>
                      <Stack spacing={1.5}>
                        {state.postureHistory.slice(-3).map((status, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                          >
                            <Paper sx={{ 
                              p: 1.5, 
                              bgcolor: '#f8fafc',
                              borderRadius: 2,
                              border: '1px solid #e2e8f0',
                            }}>
                              <Typography variant="body2" sx={{ color: '#475569' }}>
                                {status}
                              </Typography>
                            </Paper>
                          </motion.div>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default WebcamFeed;