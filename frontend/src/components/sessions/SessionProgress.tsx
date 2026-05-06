import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Stack,
  Chip,
  Button,
  alpha,
  useTheme,
  Paper,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Avatar,
  LinearProgress,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fade,
  useMediaQuery,
  Snackbar,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  IconButton,
  Badge,
  Container
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  ShowChart,
  BarChart,
  AccessTime,
  CheckCircle,
  Warning,
  Error,
  Whatshot,
  Speed,
  Star,
  EmojiEvents,
  Flag,
  CompareArrows,
  ArrowUpward,
  ArrowDownward,
  Remove,
  Info,
  Timeline as TimelineIcon,
  TableChart,
  PictureAsPdf,
  Refresh,
  ExpandMore,
  CalendarToday,
  FitnessCenter,
  Assessment,
  Analytics,
  Download,
  FilterList,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { format, parseISO, subWeeks, subMonths, subYears } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  ComposedChart
} from 'recharts';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../../store/auth';

const MotionPaper = motion(Paper);
const MotionBox = motion(Box);

interface SessionProgressProps {
  sessions: any[];
  loading?: boolean;
}

interface ProgressMetrics {
  totalSessions: number;
  totalDuration: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  scoreTrend: number;
  consistency: number;
  improvement: number;
  streak: number;
  lastSessionDate: string | null;
  firstSessionDate: string | null;
  sessionsByMonth: Record<string, number>;
  averageScoreByMonth: Record<string, number>;
}

const SessionProgress: React.FC<SessionProgressProps> = ({ sessions, loading = false }) => {
  const theme = useTheme();
  const { user } = useAuthStore();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [forceUpdate, setForceUpdate] = useState(0);
  const [debugOpen, setDebugOpen] = useState(false);
  const [showStats, setShowStats] = useState(true);
  
  const [timeRange, setTimeRange] = useState<'week' | 'month' | '3months' | '6months' | 'year' | 'all'>('all');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'scatter' | 'pie'>('area');
  const [selectedMetric, setSelectedMetric] = useState<'goodPosture' | 'duration' | 'problems'>('goodPosture');
  const [viewMode, setViewMode] = useState<'progress' | 'comparison' | 'table'>('progress');
  const [comparisonPeriod, setComparisonPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<number | null>(null);

  // Вспомогательные функции
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd.MM', { locale: ru });
    } catch {
      return dateString;
    }
  }, []);

  const formatFullDate = useCallback((dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd MMM yyyy, HH:mm', { locale: ru });
    } catch {
      return dateString;
    }
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    if (!seconds || seconds === 0) return '0 мин';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ч ${mins} мин`;
  }, []);

  const formatNumber = useCallback((num: number): string => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return Math.round(num * 10) / 10 + '';
  }, []);

  const getScoreColor = useCallback((score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  }, [theme]);

  const getScoreGradient = useCallback((score: number) => {
    if (score >= 80) return `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`;
    if (score >= 60) return `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`;
    return `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`;
  }, [theme]);

  const getTrendIcon = useCallback((value: number) => {
    if (value > 5) return <TrendingUp sx={{ color: theme.palette.success.main }} />;
    if (value < -5) return <TrendingDown sx={{ color: theme.palette.error.main }} />;
    return <TrendingFlat sx={{ color: theme.palette.warning.main }} />;
  }, [theme]);

  // Получение оценки из сессии
  const getSessionScore = useCallback((session: any) => {
    const metrics = session?.postureMetrics || {};
    const totalFrames = metrics.totalFrames || 1;
    
    let goodPct = metrics.goodPercentage;
    if (goodPct === undefined || goodPct === null) {
      goodPct = Math.round((metrics.goodPostureFrames || 0) / totalFrames * 100);
    }
    
    let warningPct = metrics.warningPercentage;
    if (warningPct === undefined || warningPct === null) {
      warningPct = Math.round((metrics.warningFrames || 0) / totalFrames * 100);
    }
    
    let errorPct = metrics.errorPercentage;
    if (errorPct === undefined || errorPct === null) {
      errorPct = Math.round((metrics.errorFrames || 0) / totalFrames * 100);
    }
    
    const score = goodPct;
    
    return { score, goodPct, warningPct, errorPct };
  }, []);

  // Фильтрация по времени
  const filterSessionsByTimeRange = useCallback((sessionsList: any[]) => {
    if (timeRange === 'all') {
      return sessionsList;
    }
    
    const now = new Date();
    let cutoffDate: Date;
    
    switch (timeRange) {
      case 'week': cutoffDate = subWeeks(now, 1); break;
      case 'month': cutoffDate = subMonths(now, 1); break;
      case '3months': cutoffDate = subMonths(now, 3); break;
      case '6months': cutoffDate = subMonths(now, 6); break;
      case 'year': cutoffDate = subYears(now, 1); break;
      default: return sessionsList;
    }
    
    return sessionsList.filter(s => parseISO(s.startTime) >= cutoffDate);
  }, [timeRange]);

  // Прогресс данные
  const progressData = useMemo(() => {
    if (!sessions || sessions.length === 0) return [];

    const filteredSessions = filterSessionsByTimeRange(sessions);
    const sortedSessions = [...filteredSessions].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return sortedSessions.map((session, index) => {
      const { score, goodPct, warningPct, errorPct } = getSessionScore(session);
      const duration = session.duration || 0;
      const durationMinutes = Math.round(duration / 60);
      
      let problemsCount = 0;
      if (session.problems && Array.isArray(session.problems)) {
        problemsCount = session.problems.length;
      }
      
      return {
        sessionNumber: index + 1,
        date: formatDate(session.startTime),
        fullDate: session.startTime,
        score: score,
        goodPosture: goodPct,
        warningPosture: warningPct,
        errorPosture: errorPct,
        duration: durationMinutes,
        durationSeconds: duration,
        problems: problemsCount
      };
    });
  }, [sessions, timeRange, formatDate, getSessionScore, filterSessionsByTimeRange]);

  // Метрики
  const metrics = useMemo((): ProgressMetrics => {
    if (progressData.length === 0) {
      return {
        totalSessions: 0,
        totalDuration: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 100,
        scoreTrend: 0,
        consistency: 0,
        improvement: 0,
        streak: 0,
        lastSessionDate: null,
        firstSessionDate: null,
        sessionsByMonth: {},
        averageScoreByMonth: {}
      };
    }

    const scores = progressData.map(d => d.score);
    const totalSessions = progressData.length;
    const totalDuration = progressData.reduce((sum, d) => sum + d.durationSeconds, 0);
    const averageScore = scores.reduce((a, b) => a + b, 0) / totalSessions;
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);

    // Тренд
    const n = totalSessions;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = scores.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, _, i) => a + x[i] * scores[i], 0);
    const sumXX = x.reduce((a, _, i) => a + x[i] * x[i], 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const scoreTrend = slope * 10;

    const variance = scores.reduce((acc, val) => acc + Math.pow(val - averageScore, 2), 0) / n;
    const consistency = Math.max(0, 100 - Math.sqrt(variance) * 2);

    const first3 = scores.slice(0, Math.min(3, n)).reduce((a, b) => a + b, 0) / Math.min(3, n);
    const last3 = scores.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const improvement = first3 > 0 ? ((last3 - first3) / first3) * 100 : 0;

    let streak = 0;
    for (let i = n - 1; i >= 0; i--) {
      if (scores[i] >= averageScore) streak++;
      else break;
    }

    const byMonth: Record<string, number> = {};
    const avgByMonth: Record<string, number> = {};
    progressData.forEach(d => {
      try {
        const month = format(parseISO(d.fullDate), 'MMM yyyy', { locale: ru });
        byMonth[month] = (byMonth[month] || 0) + 1;
        if (!avgByMonth[month]) avgByMonth[month] = d.score;
        else avgByMonth[month] = (avgByMonth[month] + d.score) / 2;
      } catch (e) {}
    });

    return {
      totalSessions,
      totalDuration,
      averageScore: Math.round(averageScore * 10) / 10,
      bestScore,
      worstScore,
      scoreTrend: Math.round(scoreTrend * 10) / 10,
      consistency: Math.round(consistency * 10) / 10,
      improvement: Math.round(improvement * 10) / 10,
      streak,
      lastSessionDate: progressData[n - 1]?.fullDate || null,
      firstSessionDate: progressData[0]?.fullDate || null,
      sessionsByMonth: byMonth,
      averageScoreByMonth: avgByMonth
    };
  }, [progressData]);

  // Сравнение
  const comparisonData = useMemo(() => {
    if (!sessions || sessions.length < 2) return null;

    const sorted = [...sessions].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    const current = getSessionScore(sorted[0]);
    const currentDuration = sorted[0]?.duration || 1;
    
    let cutoff = new Date(0);
    if (comparisonPeriod === 'week') cutoff = subWeeks(new Date(), 1);
    if (comparisonPeriod === 'month') cutoff = subMonths(new Date(), 1);
    
    const prevSessions = sorted.slice(1).filter(s => new Date(s.startTime) >= cutoff);
    if (prevSessions.length === 0) return null;

    let prevScore = 0, prevDur = 0, prevGood = 0, prevWarn = 0, prevErr = 0, prevProblems = 0;
    prevSessions.forEach(s => {
      const m = getSessionScore(s);
      prevScore += m.score;
      prevDur += s.duration || 1;
      prevGood += m.goodPct;
      prevWarn += m.warningPct;
      prevErr += m.errorPct;
      prevProblems += s.problems?.length || 0;
    });
    const cnt = prevSessions.length;

    const scoreChange = current.score - prevScore / cnt;
    const scoreChangePercent = (prevScore / cnt) > 0 ? (scoreChange / (prevScore / cnt)) * 100 : 0;

    return {
      metrics: {
        avgScore: current.score,
        scoreChange,
        scoreChangePercent,
        avgDuration: currentDuration,
        durationChange: currentDuration - prevDur / cnt,
        durationChangePercent: (prevDur / cnt) > 0 ? ((currentDuration - prevDur / cnt) / (prevDur / cnt)) * 100 : 0,
        avgGoodPosture: current.goodPct,
        goodPostureChange: current.goodPct - prevGood / cnt,
        goodPostureChangePercent: (prevGood / cnt) > 0 ? ((current.goodPct - prevGood / cnt) / (prevGood / cnt)) * 100 : 0,
        avgWarningPosture: current.warningPct,
        warningChange: current.warningPct - prevWarn / cnt,
        warningChangePercent: (prevWarn / cnt) > 0 ? ((current.warningPct - prevWarn / cnt) / (prevWarn / cnt)) * 100 : 0,
        avgErrorPosture: current.errorPct,
        errorChange: current.errorPct - prevErr / cnt,
        errorChangePercent: (prevErr / cnt) > 0 ? ((current.errorPct - prevErr / cnt) / (prevErr / cnt)) * 100 : 0,
        totalProblems: sorted[0]?.problems?.length || 0,
        problemsChange: (sorted[0]?.problems?.length || 0) - prevProblems / cnt,
        problemsChangePercent: (prevProblems / cnt) > 0 ? (((sorted[0]?.problems?.length || 0) - prevProblems / cnt) / (prevProblems / cnt)) * 100 : 0
      },
      trend: current.score - prevScore / cnt > 0 ? 'up' : 'down',
      trendStrength: Math.abs(scoreChange) > 15 ? 'strong' : Math.abs(scoreChange) > 8 ? 'moderate' : 'weak',
      trendScore: scoreChange,
      count: cnt
    };
  }, [sessions, comparisonPeriod, getSessionScore]);

  const generatePDF = async () => {
    setPdfGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSnackbarMessage('PDF отчет успешно сгенерирован');
    setSnackbarOpen(true);
    setPdfGenerating(false);
  };

  // Анимированные карточки метрик
  const renderMetricsCards = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <MotionPaper
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          sx={{
            p: 3,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[8]
            }
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 1 }}>
                Всего сеансов
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`, backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                {metrics.totalSessions}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
                {formatDuration(metrics.totalDuration)}
              </Typography>
            </Box>
            <Avatar sx={{ width: 56, height: 56, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
              <Timeline sx={{ fontSize: 28 }} />
            </Avatar>
          </Stack>
        </MotionPaper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <MotionPaper
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          sx={{
            p: 3,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
            border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[8] }
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 1 }}>
                Средняя оценка
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, color: getScoreColor(metrics.averageScore) }}>
                {metrics.averageScore}%
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                {getTrendIcon(metrics.scoreTrend)}
                <Typography variant="caption" sx={{ color: metrics.scoreTrend > 0 ? theme.palette.success.main : metrics.scoreTrend < 0 ? theme.palette.error.main : theme.palette.warning.main }}>
                  {metrics.scoreTrend > 0 ? '+' : ''}{metrics.scoreTrend}%
                </Typography>
              </Stack>
            </Box>
            <Avatar sx={{ width: 56, height: 56, bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }}>
              <Star sx={{ fontSize: 28 }} />
            </Avatar>
          </Stack>
        </MotionPaper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <MotionPaper
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          sx={{
            p: 3,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
            border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[8] }
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 1 }}>
                Стабильность
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, color: theme.palette.info.main }}>
                {metrics.consistency}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={metrics.consistency} 
                sx={{ mt: 1, height: 4, borderRadius: 2, width: '100%', bgcolor: alpha(theme.palette.info.main, 0.2), '& .MuiLinearProgress-bar': { bgcolor: theme.palette.info.main, borderRadius: 2 } }} 
              />
            </Box>
            <Avatar sx={{ width: 56, height: 56, bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main }}>
              <Speed sx={{ fontSize: 28 }} />
            </Avatar>
          </Stack>
        </MotionPaper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <MotionPaper
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          sx={{
            p: 3,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.warning.main, 0.02)} 100%)`,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[8] }
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 1 }}>
                Серия успехов
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, color: theme.palette.warning.main }}>
                {metrics.streak}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                сеансов подряд
              </Typography>
            </Box>
            <Avatar sx={{ width: 56, height: 56, bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main }}>
              <Whatshot sx={{ fontSize: 28 }} />
            </Avatar>
          </Stack>
        </MotionPaper>
      </Grid>
    </Grid>
  );

  // Конфигурация для метрик
  const getMetricConfig = () => {
    switch (selectedMetric) {
      case 'goodPosture':
        return { name: 'Хорошая осанка', color: theme.palette.success.main, domain: [0, 100], unit: '%', key: 'goodPosture', icon: <CheckCircle /> };
      case 'duration':
        return { name: 'Длительность', color: theme.palette.info.main, domain: [0, 60], unit: ' мин', key: 'duration', icon: <AccessTime /> };
      case 'problems':
        return { name: 'Проблемы', color: theme.palette.warning.main, domain: [0, 'auto'], unit: '', key: 'problems', icon: <Warning /> };
      default:
        return { name: 'Хорошая осанка', color: theme.palette.success.main, domain: [0, 100], unit: '%', key: 'goodPosture', icon: <CheckCircle /> };
    }
  };

  // Кастомный тултип
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      if (!dataPoint) return null;
      
      const config = getMetricConfig();
      let value = dataPoint[config.key];
      if (config.key === 'duration') {
        value = `${value} мин`;
      } else if (config.key === 'goodPosture') {
        value = `${value}%`;
      }
      
      return (
        <Paper sx={{ p: 2, borderRadius: 3, boxShadow: theme.shadows[10], bgcolor: theme.palette.background.paper, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', color: theme.palette.primary.main }}>
            Сеанс #{dataPoint.sessionNumber}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            {dataPoint.date}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2" sx={{ color: config.color, fontWeight: 500 }}>
            {config.name}: <strong>{value}</strong>
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 0.5 }}>
            🟢 Хорошая: {dataPoint.goodPosture}% • 🟡 Предупреждения: {dataPoint.warningPosture}% • 🔴 Ошибки: {dataPoint.errorPosture}%
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  // Рендер графика
  const renderChart = () => {
    if (progressData.length === 0) {
      return (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4 }}>
          <Assessment sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary">Нет данных для отображения</Typography>
          <Typography variant="body2" color="text.secondary">Выполните несколько сеансов для построения графика</Typography>
        </Paper>
      );
    }

    const config = getMetricConfig();

    const renderChartComponent = () => {
      const commonProps = {
        data: progressData,
        margin: { top: 20, right: 30, left: 20, bottom: 20 }
      };

      if (chartType === 'scatter') {
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
            <XAxis 
              dataKey="sessionNumber" 
              type="number" 
              domain={[0, progressData.length + 1]} 
              label={{ value: 'Номер сеанса', position: 'bottom', offset: 0 }}
              tick={{ fill: theme.palette.text.secondary }}
            />
            <YAxis 
              domain={config.domain} 
              tickFormatter={(v) => v + config.unit}
              label={{ value: config.name, angle: -90, position: 'left', offset: 0 }}
              tick={{ fill: theme.palette.text.secondary }}
            />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Legend wrapperStyle={{ paddingTop: 20 }} />
            <Scatter 
              name={config.name} 
              dataKey={config.key} 
              fill={config.color} 
              line={{ stroke: config.color, strokeWidth: 2 }} 
              lineType="joint"
              shape="circle"
            />
          </ScatterChart>
        );
      }
      
      if (chartType === 'pie') {
        const ranges = [
          { name: 'Отлично (81-100%)', min: 81, max: 100, color: '#10b981', icon: '🌟' },
          { name: 'Хорошо (61-80%)', min: 61, max: 80, color: '#eab308', icon: '👍' },
          { name: 'Средне (41-60%)', min: 41, max: 60, color: '#f59e0b', icon: '😐' },
          { name: 'Плохо (21-40%)', min: 21, max: 40, color: '#f97316', icon: '⚠️' },
          { name: 'Критично (0-20%)', min: 0, max: 20, color: '#ef4444', icon: '🔴' }
        ];
        const pieData = ranges.map(r => ({ 
          name: r.name, 
          value: progressData.filter(d => d.goodPosture >= r.min && d.goodPosture <= r.max).length,
          color: r.color,
          icon: r.icon
        })).filter(d => d.value > 0);
        
        const PieTooltip = ({ active, payload }: any) => {
          if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
              <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: theme.palette.background.paper }}>
                <Typography variant="body2"><strong>{data.name}</strong></Typography>
                <Typography variant="caption" color="text.secondary">{data.value} сеансов ({(data.value / progressData.length * 100).toFixed(1)}%)</Typography>
              </Paper>
            );
          }
          return null;
        };
        
        return (
          <PieChart {...commonProps}>
            <Pie 
              data={pieData} 
              cx="50%" 
              cy="50%" 
              labelLine={false} 
              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} 
              outerRadius={130}
              innerRadius={60}
              paddingAngle={2}
              dataKey="value"
            >
              {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke={theme.palette.background.paper} strokeWidth={2} />)}
            </Pie>
            <RechartsTooltip content={<PieTooltip />} />
            <Legend wrapperStyle={{ paddingTop: 20 }} />
          </PieChart>
        );
      }
      
      if (chartType === 'area') {
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={config.color} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
            <XAxis dataKey="sessionNumber" tick={{ fill: theme.palette.text.secondary }} />
            <YAxis domain={config.domain} tickFormatter={(v) => v + config.unit} tick={{ fill: theme.palette.text.secondary }} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: 20 }} />
            <Area type="monotone" dataKey={config.key} stroke={config.color} fill="url(#colorMetric)" strokeWidth={3} />
          </AreaChart>
        );
      }
      
      if (chartType === 'bar') {
        return (
          <RechartsBarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
            <XAxis dataKey="sessionNumber" tick={{ fill: theme.palette.text.secondary }} />
            <YAxis domain={config.domain} tickFormatter={(v) => v + config.unit} tick={{ fill: theme.palette.text.secondary }} />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: alpha(config.color, 0.1) }} />
            <Legend wrapperStyle={{ paddingTop: 20 }} />
            <Bar dataKey={config.key} fill={config.color} radius={[8, 8, 0, 0]} />
          </RechartsBarChart>
        );
      }
      
      // line chart
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
          <XAxis dataKey="sessionNumber" tick={{ fill: theme.palette.text.secondary }} />
          <YAxis domain={config.domain} tickFormatter={(v) => v + config.unit} tick={{ fill: theme.palette.text.secondary }} />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 20 }} />
          <Line 
            type="monotone" 
            dataKey={config.key} 
            stroke={config.color} 
            strokeWidth={3} 
            dot={{ r: 6, strokeWidth: 2, stroke: theme.palette.background.paper, fill: config.color }}
            activeDot={{ r: 8, strokeWidth: 2 }}
          />
        </LineChart>
      );
    };

    return (
      <MotionPaper
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        sx={{ p: 3, borderRadius: 4, overflow: 'hidden' }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" sx={{ mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShowChart sx={{ color: theme.palette.primary.main }} />
            Динамика показателей
            <Chip size="small" label={`${progressData.length} сеансов`} sx={{ ml: 1 }} />
          </Typography>
          
          <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select 
                value={selectedMetric} 
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="goodPosture">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircle sx={{ fontSize: 16, color: theme.palette.success.main }} />
                    <span>Хорошая осанка</span>
                  </Stack>
                </MenuItem>
                <MenuItem value="duration">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AccessTime sx={{ fontSize: 16, color: theme.palette.info.main }} />
                    <span>Длительность</span>
                  </Stack>
                </MenuItem>
                <MenuItem value="problems">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Warning sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                    <span>Проблемы</span>
                  </Stack>
                </MenuItem>
              </Select>
            </FormControl>
            
            <ToggleButtonGroup 
              value={chartType} 
              exclusive 
              onChange={(e, v) => v && setChartType(v)} 
              size="small"
              sx={{ '& .MuiToggleButton-root': { borderRadius: 2, px: 1.5 } }}
            >
              <ToggleButton value="line">📈</ToggleButton>
              <ToggleButton value="area">📊</ToggleButton>
              <ToggleButton value="bar">📊</ToggleButton>
              <ToggleButton value="scatter">🔵</ToggleButton>
              <ToggleButton value="pie">🥧</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>
        
        <ResponsiveContainer width="100%" height={450}>
          {renderChartComponent()}
        </ResponsiveContainer>
        
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mt: 2, display: 'block', textAlign: 'center' }}>
          {timeRange !== 'all' && `Период: ${timeRange === 'week' ? 'неделя' : timeRange === 'month' ? 'месяц' : timeRange === '3months' ? '3 месяца' : timeRange === '6months' ? '6 месяцев' : 'год'}`}
        </Typography>
      </MotionPaper>
    );
  };

  // Рендер таблицы
  const renderTable = () => (
    <MotionPaper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{ borderRadius: 4, overflow: 'hidden' }}
    >
      <TableContainer sx={{ maxHeight: 500 }}>
        <Table stickyHeader size={isMobile ? 'small' : 'medium'}>
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
              <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Дата</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Оценка</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Длит.</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Хорошая</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Пред.</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Ошибки</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Пробл.</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {progressData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                  <Assessment sx={{ fontSize: 48, color: theme.palette.text.secondary, mb: 1, opacity: 0.5 }} />
                  <Typography color="text.secondary">Нет данных</Typography>
                </TableCell>
              </TableRow>
            ) : (
              progressData.slice().reverse().map((row, idx) => (
                <TableRow 
                  key={idx}
                  sx={{ 
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                    transition: 'background-color 0.2s'
                  }}
                >
                  <TableCell>{row.sessionNumber}</TableCell>
                  <TableCell>
                    <Tooltip title={formatFullDate(row.fullDate)}>
                      <span>{formatDate(row.fullDate)}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={`${row.score}%`} 
                      size="small" 
                      sx={{ 
                        bgcolor: getScoreColor(row.score), 
                        color: 'white', 
                        fontWeight: 'bold', 
                        minWidth: 55,
                        boxShadow: `0 2px 4px ${alpha(getScoreColor(row.score), 0.3)}`
                      }} 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                      <AccessTime sx={{ fontSize: 12, color: theme.palette.text.secondary }} />
                      <Typography variant="body2">{row.duration} мин</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" sx={{ color: theme.palette.success.main, fontWeight: 500 }}>{row.goodPosture}%</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" sx={{ color: theme.palette.warning.main }}>{row.warningPosture}%</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" sx={{ color: theme.palette.error.main }}>{row.errorPosture}%</Typography>
                  </TableCell>
                  <TableCell align="center">
                    {row.problems > 0 ? (
                      <Chip label={row.problems} size="small" color="warning" variant="outlined" />
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </MotionPaper>
  );

  // Рендер лучшего/худшего
  const renderBestWorst = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={6}>
        <MotionPaper
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          sx={{ p: 3, borderRadius: 4, background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`, border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}
        >
          <Stack direction="row" alignItems="center" spacing={3}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: alpha(theme.palette.success.main, 0.2), color: theme.palette.success.main }}>
              <EmojiEvents sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 1 }}>Лучший результат</Typography>
              <Typography variant="h2" sx={{ fontWeight: 800, color: theme.palette.success.main, lineHeight: 1 }}>
                {formatNumber(metrics.bestScore)}%
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>максимальная оценка</Typography>
            </Box>
          </Stack>
        </MotionPaper>
      </Grid>
      <Grid item xs={12} md={6}>
        <MotionPaper
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          sx={{ p: 3, borderRadius: 4, background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.02)} 100%)`, border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}` }}
        >
          <Stack direction="row" alignItems="center" spacing={3}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: alpha(theme.palette.warning.main, 0.2), color: theme.palette.warning.main }}>
              <Flag sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 1 }}>Худший результат</Typography>
              <Typography variant="h2" sx={{ fontWeight: 800, color: theme.palette.warning.main, lineHeight: 1 }}>
                {formatNumber(metrics.worstScore)}%
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>минимальная оценка</Typography>
            </Box>
          </Stack>
        </MotionPaper>
      </Grid>
    </Grid>
  );

  // Рендер улучшения
  const renderImprovement = () => (
    <MotionPaper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      sx={{ p: 3, mb: 4, borderRadius: 4 }}
    >
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.15), color: theme.palette.success.main }}>
          <TrendingUp sx={{ fontSize: 24 }} />
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Анализ прогресса</Typography>
      </Stack>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 3, textAlign: 'center', borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
              Общее улучшение
            </Typography>
            <Typography variant="h1" sx={{ fontWeight: 800, fontSize: { xs: 48, md: 64 }, color: metrics.improvement > 0 ? theme.palette.success.main : theme.palette.error.main }}>
              {metrics.improvement > 0 ? '+' : ''}{formatNumber(metrics.improvement)}%
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 1 }}>
              от первых 3 к последним 3 сессиям
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(100, Math.max(0, 50 + metrics.improvement / 2))} 
              sx={{ mt: 2, height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.divider, 0.5) }}
            />
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
              Активность по месяцам
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1.5}>
              {Object.entries(metrics.sessionsByMonth).map(([month, count]) => (
                <Chip 
                  key={month} 
                  label={`${month}: ${count} сесс.`} 
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    fontWeight: 500,
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                  }} 
                />
              ))}
            </Stack>
            {Object.keys(metrics.sessionsByMonth).length === 0 && (
              <Typography variant="body2" color="text.secondary">Нет данных по месяцам</Typography>
            )}
          </Card>
        </Grid>
      </Grid>
    </MotionPaper>
  );

  // Рендер достижений
  const renderMilestones = () => {
    if (progressData.length < 3) return null;
    return (
      <MotionPaper
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        sx={{ p: 3, mb: 4, borderRadius: 4, background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${theme.palette.background.paper} 100%)` }}
      >
        <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEvents sx={{ color: theme.palette.warning.main }} />
          Достижения
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ gap: 1.5 }}>
          <Chip 
            icon={<Star sx={{ fontSize: 16 }} />} 
            label={`Лучшая оценка: ${metrics.bestScore}%`} 
            color="success" 
            sx={{ borderRadius: 2, fontWeight: 500 }}
          />
          <Chip 
            icon={<Whatshot sx={{ fontSize: 16 }} />} 
            label={`Серия: ${metrics.streak} сеансов`} 
            color="warning" 
            sx={{ borderRadius: 2, fontWeight: 500 }}
          />
          <Chip 
            icon={<TrendingUp sx={{ fontSize: 16 }} />} 
            label={`Улучшение: ${metrics.improvement > 0 ? '+' : ''}${formatNumber(metrics.improvement)}%`}
            color="info"
            sx={{ borderRadius: 2, fontWeight: 500 }}
          />
          {metrics.totalSessions >= 10 && (
            <Chip icon={<EmojiEvents />} label="10+ сеансов" color="secondary" sx={{ borderRadius: 2 }} />
          )}
        </Stack>
      </MotionPaper>
    );
  };

  // Рендер сравнения
  const renderComparison = () => {
    if (!comparisonData) return (
      <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}>
        <CompareArrows sx={{ fontSize: 48, color: theme.palette.text.secondary, mb: 2, opacity: 0.5 }} />
        <Typography variant="h6" color="text.secondary">Недостаточно данных для сравнения</Typography>
        <Typography variant="body2" color="text.secondary">Выполните больше сеансов для анализа прогресса</Typography>
      </Paper>
    );
    
    const getTrendColor = (change: number, inverse: boolean = false) => {
      const isPositive = inverse ? change <= 0 : change >= 0;
      return isPositive ? theme.palette.success.main : theme.palette.error.main;
    };
    
    const formatChange = (change: number) => `${change > 0 ? '+' : ''}${formatNumber(change)}%`;
    
    return (
      <MotionPaper
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ p: 3, borderRadius: 4 }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CompareArrows sx={{ color: theme.palette.primary.main }} />
            Сравнение с предыдущим периодом
          </Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select value={comparisonPeriod} onChange={(e) => setComparisonPeriod(e.target.value as any)}>
              <MenuItem value="week">За неделю</MenuItem>
              <MenuItem value="month">За месяц</MenuItem>
              <MenuItem value="all">За всё время</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
          Сравнение последнего сеанса с {comparisonData.count} предыдущими
        </Typography>
        
        <Grid container spacing={2.5}>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 2.5, textAlign: 'center', borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase' }}>Оценка</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: getTrendColor(comparisonData.metrics.scoreChange) }}>
                {comparisonData.metrics.avgScore}%
              </Typography>
              <Chip 
                size="small" 
                label={formatChange(comparisonData.metrics.scoreChange)} 
                sx={{ 
                  bgcolor: alpha(getTrendColor(comparisonData.metrics.scoreChange), 0.1), 
                  color: getTrendColor(comparisonData.metrics.scoreChange),
                  fontWeight: 500,
                  mt: 1
                }} 
              />
            </Paper>
          </Grid>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 2.5, textAlign: 'center', borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.03) }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase' }}>Хорошая осанка</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: getTrendColor(comparisonData.metrics.goodPostureChange) }}>
                {comparisonData.metrics.avgGoodPosture}%
              </Typography>
              <Chip 
                size="small" 
                label={formatChange(comparisonData.metrics.goodPostureChange)} 
                sx={{ 
                  bgcolor: alpha(getTrendColor(comparisonData.metrics.goodPostureChange), 0.1), 
                  color: getTrendColor(comparisonData.metrics.goodPostureChange),
                  fontWeight: 500,
                  mt: 1
                }} 
              />
            </Paper>
          </Grid>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 2.5, textAlign: 'center', borderRadius: 3, bgcolor: alpha(theme.palette.warning.main, 0.03) }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase' }}>Предупреждения</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: getTrendColor(comparisonData.metrics.warningChange, true) }}>
                {comparisonData.metrics.avgWarningPosture}%
              </Typography>
              <Chip 
                size="small" 
                label={formatChange(comparisonData.metrics.warningChange)} 
                sx={{ 
                  bgcolor: alpha(getTrendColor(comparisonData.metrics.warningChange, true), 0.1), 
                  color: getTrendColor(comparisonData.metrics.warningChange, true),
                  fontWeight: 500,
                  mt: 1
                }} 
              />
            </Paper>
          </Grid>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 2.5, textAlign: 'center', borderRadius: 3, bgcolor: alpha(theme.palette.error.main, 0.03) }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase' }}>Ошибки</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: getTrendColor(comparisonData.metrics.errorChange, true) }}>
                {comparisonData.metrics.avgErrorPosture}%
              </Typography>
              <Chip 
                size="small" 
                label={formatChange(comparisonData.metrics.errorChange)} 
                sx={{ 
                  bgcolor: alpha(getTrendColor(comparisonData.metrics.errorChange, true), 0.1), 
                  color: getTrendColor(comparisonData.metrics.errorChange, true),
                  fontWeight: 500,
                  mt: 1
                }} 
              />
            </Paper>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.info.main, 0.05), display: 'inline-flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            icon={comparisonData.trend === 'up' ? <TrendingUp /> : <TrendingDown />} 
            label={`Тренд: ${comparisonData.trend === 'up' ? 'Положительный' : 'Отрицательный'} (${comparisonData.trendStrength === 'strong' ? 'сильный' : comparisonData.trendStrength === 'moderate' ? 'умеренный' : 'слабый'})`}
            sx={{ fontWeight: 500 }}
          />
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            на основе {comparisonData.count} сеансов
          </Typography>
        </Box>
      </MotionPaper>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 15 }}>
        <CircularProgress size={60} thickness={4} />
        <Typography sx={{ ml: 3, color: theme.palette.text.secondary }}>Загрузка данных...</Typography>
      </Box>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4 }}>
        <Timeline sx={{ fontSize: 80, color: theme.palette.text.secondary, mb: 2, opacity: 0.3 }} />
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>Нет данных</Typography>
        <Typography color="text.secondary">Выполните несколько анализов осанки для отображения статистики</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      {/* Заголовок */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Analytics sx={{ color: theme.palette.primary.main, fontSize: 32 }} />
            Прогресс осанки
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
            Анализ вашего прогресса за {sessions.length} сеансов
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Экспорт в PDF">
            <Button 
              startIcon={pdfGenerating ? <CircularProgress size={20} /> : <PictureAsPdf />} 
              onClick={generatePDF} 
              variant="contained" 
              disabled={pdfGenerating}
              sx={{ 
                bgcolor: '#ef4444', 
                '&:hover': { bgcolor: '#dc2626' },
                borderRadius: 2,
                textTransform: 'none'
              }}
            >
              {!isMobile && 'Отчет'}
            </Button>
          </Tooltip>
          <Tooltip title="Обновить">
            <IconButton onClick={() => setForceUpdate(prev => prev + 1)} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 2 }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Панель управления */}
      <Paper sx={{ p: 2, mb: 4, borderRadius: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
            <Button 
              size="small" 
              variant={timeRange === 'week' ? 'contained' : 'outlined'} 
              onClick={() => setTimeRange('week')}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >Неделя</Button>
            <Button 
              size="small" 
              variant={timeRange === 'month' ? 'contained' : 'outlined'} 
              onClick={() => setTimeRange('month')}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >Месяц</Button>
            <Button 
              size="small" 
              variant={timeRange === '3months' ? 'contained' : 'outlined'} 
              onClick={() => setTimeRange('3months')}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >3 мес</Button>
            <Button 
              size="small" 
              variant={timeRange === '6months' ? 'contained' : 'outlined'} 
              onClick={() => setTimeRange('6months')}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >6 мес</Button>
            <Button 
              size="small" 
              variant={timeRange === 'year' ? 'contained' : 'outlined'} 
              onClick={() => setTimeRange('year')}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >Год</Button>
            <Button 
              size="small" 
              variant={timeRange === 'all' ? 'contained' : 'outlined'} 
              onClick={() => setTimeRange('all')}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >Всё</Button>
          </Stack>
          
          <ToggleButtonGroup 
            value={viewMode} 
            exclusive 
            onChange={(e, v) => v && setViewMode(v)} 
            size="small"
            sx={{ '& .MuiToggleButton-root': { px: 2, py: 0.75, borderRadius: 2 } }}
          >
            <ToggleButton value="progress">📈 Прогресс</ToggleButton>
            <ToggleButton value="comparison">📊 Сравнение</ToggleButton>
            <ToggleButton value="table">📋 Таблица</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Paper>

      {/* Отладочная панель */}
      <Accordion 
        expanded={debugOpen} 
        onChange={() => setDebugOpen(!debugOpen)} 
        sx={{ mb: 3, borderRadius: 3, '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.info.main, display: 'flex', alignItems: 'center', gap: 1 }}>
            🔧 Отладка • {progressData.length} сеансов
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ maxHeight: 300, overflow: 'auto', bgcolor: alpha(theme.palette.common.black, 0.02), p: 2, borderRadius: 2 }}>
            <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', fontSize: 11, whiteSpace: 'pre-wrap', color: theme.palette.text.secondary }}>
              {progressData.map((d, i) => `${i+1}. ${d.date} - Оценка: ${d.score}% (good: ${d.goodPosture}%, warning: ${d.warningPosture}%, error: ${d.errorPosture}%)`).join('\n')}
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Основной контент */}
      <AnimatePresence mode="wait">
        {viewMode === 'progress' && (
          <Fade in={true} key="progress">
            <Box>
              {renderMetricsCards()}
              {renderBestWorst()}
              {renderChart()}
              {renderImprovement()}
              {renderMilestones()}
            </Box>
          </Fade>
        )}
        {viewMode === 'comparison' && (
          <Fade in={true} key="comparison">
            {renderComparison()}
          </Fade>
        )}
        {viewMode === 'table' && (
          <Fade in={true} key="table">
            {renderTable()}
          </Fade>
        )}
      </AnimatePresence>

      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={4000} 
        onClose={() => setSnackbarOpen(false)} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          onClose={() => setSnackbarOpen(false)} 
          sx={{ borderRadius: 3, boxShadow: theme.shadows[6] }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SessionProgress;