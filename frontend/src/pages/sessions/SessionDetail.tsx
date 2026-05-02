import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Stack,
  Button,
  Divider,
  LinearProgress,
  Paper,
  Avatar,
  alpha,
  useTheme,
  Alert,
  Skeleton,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CalendarToday,
  AccessTime,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Warning,
  Error as ErrorIcon,
  CheckCircle,
  Whatshot,
  Speed,
  Timer,
  FitnessCenter,
  PictureAsPdf,
  Share,
  Download,
  Info
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { sessionsApi } from '../../api/sessions';
import { PDFExport } from '../../components/sessions/PDFExport';
import SessionRecommendations from '../../components/sessions/SessionRecommendations';
// УБРАЛИ импорт SnapshotGallery

interface Session {
  _id: string;
  sessionId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  postureMetrics: {
    totalFrames: number;
    goodPostureFrames: number;
    warningFrames: number;
    errorFrames: number;
    postureScore: number;
    averageTrackingQuality: number;
    goodPercentage: number;
    warningPercentage: number;
    errorPercentage: number;
    errorsByZone: {
      shoulders: { count: number; duration: number; percentage: number };
      head: { count: number; duration: number; percentage: number };
      hips: { count: number; duration: number; percentage: number };
    };
  };
  keyMoments?: Array<{
    timestamp: string;
    type: string;
    message: string;
    data?: any;
  }>;
  settings?: {
    confidenceThreshold: number;
    deviationThreshold: number;
    notificationEnabled: boolean;
    calibrationType: string;
  };
  deviceInfo?: {
    userAgent: string;
    screenResolution: string;
    webcamResolution: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

const SessionDetail: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await sessionsApi.getSessionDetails(sessionId);
      setSession(response.data.session);
    } catch (err: any) {
      console.error('Failed to load session:', err);
      setError(err.message || 'Ошибка при загрузке сеанса');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const formatDateTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd MMMM yyyy, HH:mm:ss', { locale: ru });
    } catch {
      return dateString;
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0 мин';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes} мин ${secs} сек`;
    }
    return `${secs} сек`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Отлично';
    if (score >= 75) return 'Хорошо';
    if (score >= 60) return 'Удовлетворительно';
    if (score >= 40) return 'Требует внимания';
    return 'Критично';
  };

  const getTrendIcon = (value: number) => {
    if (value > 5) return <TrendingUp sx={{ color: theme.palette.success.main }} />;
    if (value < -5) return <TrendingDown sx={{ color: theme.palette.error.main }} />;
    return <TrendingFlat sx={{ color: theme.palette.warning.main }} />;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
        </Stack>
      </Container>
    );
  }

  if (error || !session) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/sessions')}>
              Вернуться к списку
            </Button>
          }
        >
          {error || 'Сеанс не найден'}
        </Alert>
      </Container>
    );
  }

  const metrics = session.postureMetrics;
  const totalFrames = metrics.totalFrames || 1;
  const goodPercentage = metrics.goodPercentage || 
    Math.round((metrics.goodPostureFrames / totalFrames) * 100);
  const warningPercentage = metrics.warningPercentage || 
    Math.round((metrics.warningFrames / totalFrames) * 100);
  const errorPercentage = metrics.errorPercentage || 
    Math.round((metrics.errorFrames / totalFrames) * 100);
  const postureScore = metrics.postureScore || 0;
  const scoreColor = getScoreColor(postureScore);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Хлебные крошки и навигация */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <IconButton onClick={() => navigate('/sessions')}>
          <ArrowBackIcon />
        </IconButton>
        <Breadcrumbs>
          <Link 
            component="button"
            variant="body1"
            onClick={() => navigate('/sessions')}
            sx={{ cursor: 'pointer', textDecoration: 'none' }}
          >
            Сеансы
          </Link>
          <Typography color="text.primary">
            Детали сеанса
          </Typography>
        </Breadcrumbs>
      </Stack>

      <Grid container spacing={3}>
        {/* Основная информация */}
        <Grid item xs={12}>
          <Card sx={{ 
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative'
          }}>
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${scoreColor}, ${alpha(scoreColor, 0.3)})`
            }} />
            <CardContent sx={{ p: 3 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    Анализ осанки
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ID сеанса: {session.sessionId}
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <Chip
                      icon={<CalendarToday />}
                      label={formatDateTime(session.startTime)}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<AccessTime />}
                      label={formatDuration(session.duration || 0)}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </Box>
                
                <Stack direction="row" spacing={1}>
                  <PDFExport session={session} buttonVariant="outlined" />
                  <Button
                    startIcon={<FitnessCenter />}
                    variant="contained"
                    onClick={() => navigate('/exercises')}
                  >
                    Упражнения
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Оценка осанки */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Общая оценка осанки
              </Typography>
              <Box sx={{ position: 'relative', display: 'inline-flex', mt: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    background: `conic-gradient(${scoreColor} 0deg ${postureScore * 3.6}deg, ${alpha(scoreColor, 0.2)} ${postureScore * 3.6}deg 360deg)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      width: 110,
                      height: 110,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: theme.palette.background.paper,
                      boxShadow: theme.shadows[2]
                    }}
                  >
                    <Typography variant="h2" sx={{ fontWeight: 800, color: scoreColor }}>
                      {postureScore}%
                    </Typography>
                  </Paper>
                </Box>
              </Box>
              <Typography variant="h6" sx={{ color: scoreColor, fontWeight: 600, mb: 1 }}>
                {getScoreLabel(postureScore)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                На основе {metrics.totalFrames.toLocaleString('ru-RU')} кадров
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Распределение по статусам */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Распределение по статусам
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle sx={{ color: theme.palette.success.main, fontSize: 16 }} />
                      Хорошая осанка
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {goodPercentage}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={goodPercentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.success.main, 0.2),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: theme.palette.success.main,
                        borderRadius: 4
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {metrics.goodPostureFrames.toLocaleString('ru-RU')} кадров
                  </Typography>
                </Box>

                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Warning sx={{ color: theme.palette.warning.main, fontSize: 16 }} />
                      Предупреждения
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {warningPercentage}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={warningPercentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.warning.main, 0.2),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: theme.palette.warning.main,
                        borderRadius: 4
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {metrics.warningFrames.toLocaleString('ru-RU')} кадров
                  </Typography>
                </Box>

                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 16 }} />
                      Ошибки
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {errorPercentage}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={errorPercentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.error.main, 0.2),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: theme.palette.error.main,
                        borderRadius: 4
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {metrics.errorFrames.toLocaleString('ru-RU')} кадров
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Ошибки по зонам */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Ошибки по зонам
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    borderRadius: 2
                  }}>
                    <Avatar sx={{ 
                      mx: 'auto', 
                      mb: 1,
                      bgcolor: alpha(theme.palette.info.main, 0.2),
                      color: theme.palette.info.main
                    }}>
                      👥
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">Плечи</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                      {metrics.errorsByZone?.shoulders?.percentage || 0}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Math.round((metrics.errorsByZone?.shoulders?.duration || 0) / 60)} мин
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    bgcolor: alpha(theme.palette.warning.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    borderRadius: 2
                  }}>
                    <Avatar sx={{ 
                      mx: 'auto', 
                      mb: 1,
                      bgcolor: alpha(theme.palette.warning.main, 0.2),
                      color: theme.palette.warning.main
                    }}>
                      🧠
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">Голова</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                      {metrics.errorsByZone?.head?.percentage || 0}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Math.round((metrics.errorsByZone?.head?.duration || 0) / 60)} мин
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    bgcolor: alpha(theme.palette.error.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                    borderRadius: 2
                  }}>
                    <Avatar sx={{ 
                      mx: 'auto', 
                      mb: 1,
                      bgcolor: alpha(theme.palette.error.main, 0.2),
                      color: theme.palette.error.main
                    }}>
                      🦵
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">Таз</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
                      {metrics.errorsByZone?.hips?.percentage || 0}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Math.round((metrics.errorsByZone?.hips?.duration || 0) / 60)} мин
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* УБРАЛИ блок с галереей снимков */}

        {/* Рекомендации */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                💪 Рекомендации
              </Typography>
              <SessionRecommendations sessionId={session.sessionId} />
            </CardContent>
          </Card>
        </Grid>

        {/* Дополнительная информация */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Дополнительная информация
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Настройки сеанса
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        <strong>Порог уверенности:</strong> {session.settings?.confidenceThreshold || 0.5}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Порог отклонения:</strong> {session.settings?.deviationThreshold || 0.1}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Уведомления:</strong> {session.settings?.notificationEnabled ? 'Включены' : 'Выключены'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Тип калибровки:</strong> {session.settings?.calibrationType || 'auto'}
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Информация об устройстве
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        <strong>User Agent:</strong> {session.deviceInfo?.userAgent?.substring(0, 100)}...
                      </Typography>
                      <Typography variant="body2">
                        <strong>Разрешение экрана:</strong> {session.deviceInfo?.screenResolution || 'Не указано'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Разрешение камеры:</strong> {session.deviceInfo?.webcamResolution || 'Не указано'}
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SessionDetail;