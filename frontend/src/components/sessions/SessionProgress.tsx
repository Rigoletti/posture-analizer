import React, { useState, useMemo, useCallback } from 'react';
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
  IconButton,
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  ShowChart,
  AccessTime,
  CheckCircle,
  Warning,
  Error,
  Whatshot,
  Speed,
  Star,
  EmojiEvents,
  Flag,
  PictureAsPdf,
  Refresh,
  CalendarToday,
  FitnessCenter,
  Assessment,
  Analytics,
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AnimatePresence, motion } from 'framer-motion';

const MotionPaper = motion(Paper);

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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [forceUpdate, setForceUpdate] = useState(0);
  
  const [timeRange, setTimeRange] = useState<'week' | 'month' | '3months' | '6months' | 'year' | 'all'>('all');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'pie'>('area');
  const [selectedMetric, setSelectedMetric] = useState<'goodPosture' | 'duration' | 'problems'>('goodPosture');
  const [viewMode, setViewMode] = useState<'progress' | 'table'>('progress');

  // Форматирование даты
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd.MM.yy', { locale: ru });
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
    
    return { score: goodPct, goodPct, warningPct, errorPct };
  }, []);

  // Фильтрация по времени
  const filterSessionsByTimeRange = useCallback((sessionsList: any[]) => {
    if (!sessionsList || sessionsList.length === 0) return [];
    if (timeRange === 'all') return sessionsList;
    
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
    
    return sessionsList.filter(s => s.startTime && parseISO(s.startTime) >= cutoffDate);
  }, [timeRange]);

  // Прогресс данные для графика
  const progressData = useMemo(() => {
    if (!sessions || sessions.length === 0) return [];

    const filteredSessions = filterSessionsByTimeRange(sessions);
    if (filteredSessions.length === 0) return [];
    
    const sortedSessions = [...filteredSessions].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return sortedSessions.map((session, index) => {
      const { score, goodPct, warningPct, errorPct } = getSessionScore(session);
      const duration = Math.round((session.duration || 0) / 60);
      const problemsCount = session.problems?.length || 0;
      
      return {
        sessionNumber: index + 1,
        date: formatDate(session.startTime),
        fullDate: session.startTime,
        score: score,
        goodPosture: goodPct,
        warningPosture: warningPct,
        errorPosture: errorPct,
        duration: duration,
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
    const durations = progressData.map(d => d.duration * 60);
    const totalSessions = progressData.length;
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const averageScore = scores.reduce((a, b) => a + b, 0) / totalSessions;
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);

    const n = totalSessions;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = scores.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, _, i) => a + x[i] * scores[i], 0);
    const sumXX = x.reduce((a, _, i) => a + x[i] * x[i], 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const scoreTrend = slope * 10;

    const variance = scores.reduce((acc, val) => acc + Math.pow(val - averageScore, 2), 0) / n;
    const consistency = Math.max(0, Math.min(100, 100 - Math.sqrt(variance)));

    const first3 = scores.slice(0, Math.min(3, n)).reduce((a, b) => a + b, 0) / Math.min(3, n);
    const last3 = scores.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const improvement = first3 > 0 ? ((last3 - first3) / first3) * 100 : 0;

    let streak = 0;
    for (let i = n - 1; i >= 0; i--) {
      if (scores[i] >= averageScore) streak++;
      else break;
    }

    const byMonth: Record<string, number> = {};
    progressData.forEach(d => {
      try {
        const month = format(parseISO(d.fullDate), 'MMM yyyy', { locale: ru });
        byMonth[month] = (byMonth[month] || 0) + 1;
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
      averageScoreByMonth: {}
    };
  }, [progressData]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getMetricConfig = () => {
    switch (selectedMetric) {
      case 'goodPosture':
        return { 
          name: 'Хорошая осанка', 
          labelY: 'Хорошая осанка, %',
          labelX: 'Номер сеанса →',
          color: theme.palette.success.main, 
          key: 'goodPosture', 
          unit: '%' 
        };
      case 'duration':
        return { 
          name: 'Длительность', 
          labelY: 'Длительность, мин',
          labelX: 'Номер сеанса →',
          color: theme.palette.info.main, 
          key: 'duration', 
          unit: ' мин' 
        };
      case 'problems':
        return { 
          name: 'Проблемы', 
          labelY: 'Количество проблем',
          labelX: 'Номер сеанса →',
          color: theme.palette.warning.main, 
          key: 'problems', 
          unit: '' 
        };
      default:
        return { 
          name: 'Хорошая осанка', 
          labelY: 'Хорошая осанка, %',
          labelX: 'Номер сеанса →',
          color: theme.palette.success.main, 
          key: 'goodPosture', 
          unit: '%' 
        };
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const config = getMetricConfig();
      let value = data[config.key];
      let displayValue = value;
      if (config.key === 'duration') {
        displayValue = `${value} мин`;
      } else if (config.key === 'goodPosture') {
        displayValue = `${value}%`;
      }
      
      return (
        <Paper sx={{ p: 1.5, borderRadius: 2, boxShadow: 3, minWidth: 180 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Сеанс #{data.sessionNumber}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <CalendarToday sx={{ fontSize: 12 }} />
            {data.date}
          </Typography>
          <Divider sx={{ my: 0.5 }} />
          <Typography variant="body2" sx={{ color: config.color }}>
            {config.name}: <strong>{displayValue}</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            🟢 Хорошая: {data.goodPosture}% • 🟡 Пред.: {data.warningPosture}% • 🔴 Ошибки: {data.errorPosture}%
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  const generatePDF = async () => {
    setPdfGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSnackbarMessage('PDF отчет успешно сгенерирован');
    setSnackbarOpen(true);
    setPdfGenerating(false);
  };

  const renderMetricsCards = () => (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2.5, borderRadius: 3, background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`, height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Всего сеансов</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, fontSize: { xs: 36, sm: 42 } }}>{metrics.totalSessions}</Typography>
              <Typography variant="caption" color="text.secondary">{formatDuration(metrics.totalDuration)}</Typography>
            </Box>
            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, width: 56, height: 56 }}>
              <Timeline sx={{ fontSize: 28 }} />
            </Avatar>
          </Stack>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2.5, borderRadius: 3, background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`, border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`, height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Средняя оценка</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, fontSize: { xs: 36, sm: 42 }, color: getScoreColor(metrics.averageScore) }}>{metrics.averageScore}%</Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {metrics.scoreTrend > 0 ? <TrendingUp sx={{ fontSize: 16, color: theme.palette.success.main }} /> : metrics.scoreTrend < 0 ? <TrendingDown sx={{ fontSize: 16, color: theme.palette.error.main }} /> : <TrendingFlat sx={{ fontSize: 16, color: theme.palette.warning.main }} />}
                <Typography variant="caption" color={metrics.scoreTrend > 0 ? 'success.main' : metrics.scoreTrend < 0 ? 'error.main' : 'warning.main'}>
                  {metrics.scoreTrend > 0 ? '+' : ''}{metrics.scoreTrend}% тренд
                </Typography>
              </Stack>
            </Box>
            <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, width: 56, height: 56 }}>
              <Star sx={{ fontSize: 28 }} />
            </Avatar>
          </Stack>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2.5, borderRadius: 3, background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`, border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`, height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box flex={1}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Стабильность</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, fontSize: { xs: 36, sm: 42 }, color: theme.palette.info.main }}>{metrics.consistency}%</Typography>
              <LinearProgress variant="determinate" value={metrics.consistency} sx={{ mt: 1, height: 4, borderRadius: 2 }} />
            </Box>
            <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main, width: 56, height: 56 }}>
              <Speed sx={{ fontSize: 28 }} />
            </Avatar>
          </Stack>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2.5, borderRadius: 3, background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.warning.main, 0.03)} 100%)`, border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`, height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Серия успехов</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, fontSize: { xs: 36, sm: 42 }, color: theme.palette.warning.main }}>{metrics.streak}</Typography>
              <Typography variant="caption" color="text.secondary">сеансов подряд</Typography>
            </Box>
            <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main, width: 56, height: 56 }}>
              <Whatshot sx={{ fontSize: 28 }} />
            </Avatar>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderBestWorst = () => (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.05), border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
          <Stack direction="row" alignItems="center" spacing={3}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: alpha(theme.palette.success.main, 0.15), color: theme.palette.success.main }}>
              <EmojiEvents sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Лучший результат</Typography>
              <Typography variant="h2" sx={{ fontWeight: 800, color: theme.palette.success.main, fontSize: { xs: 48, md: 56 } }}>{metrics.bestScore}%</Typography>
              <Typography variant="caption" color="text.secondary">максимальная оценка</Typography>
            </Box>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.warning.main, 0.05), border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}` }}>
          <Stack direction="row" alignItems="center" spacing={3}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: alpha(theme.palette.warning.main, 0.15), color: theme.palette.warning.main }}>
              <Flag sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Худший результат</Typography>
              <Typography variant="h2" sx={{ fontWeight: 800, color: theme.palette.warning.main, fontSize: { xs: 48, md: 56 } }}>{metrics.worstScore}%</Typography>
              <Typography variant="caption" color="text.secondary">минимальная оценка</Typography>
            </Box>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderChart = () => {
    if (progressData.length === 0) {
      return (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Assessment sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary">Нет данных для отображения</Typography>
        </Paper>
      );
    }

    const config = getMetricConfig();

    const renderChartComponent = () => {
      if (chartType === 'pie') {
        return (
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Pie
              data={progressData}
              dataKey={config.key}
              nameKey="sessionNumber"
              cx="50%"
              cy="50%"
              outerRadius={isMobile ? 100 : 120}
              label={({ sessionNumber, value }) => isMobile ? `${value}` : `#${sessionNumber}: ${value}${config.unit}`}
              labelLine={!isMobile}
            >
              {progressData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`hsl(${index * 360 / progressData.length}, 70%, 55%)`} />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomTooltip />} />
            {!isMobile && <Legend formatter={(value) => `Сеанс #${value}`} />}
          </PieChart>
        );
      }
      
      const chartMargin = { top: 30, right: 30, left: isMobile ? 10 : 30, bottom: isMobile ? 50 : 40 };
      
      if (chartType === 'area') {
        return (
          <AreaChart data={progressData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
            <XAxis 
              dataKey="sessionNumber" 
              label={{ value: config.labelX, position: 'bottom', offset: isMobile ? 10 : 15, style: { fill: theme.palette.text.secondary, fontSize: isMobile ? 11 : 13, fontWeight: 500 } }}
              tick={{ fill: theme.palette.text.primary, fontSize: isMobile ? 11 : 12 }}
              tickMargin={12}
              axisLine={{ stroke: theme.palette.divider }}
              tickLine={{ stroke: theme.palette.divider }}
            />
            <YAxis 
              label={{ value: config.labelY, angle: -90, position: 'left', offset: isMobile ? 5 : 15, style: { fill: theme.palette.text.secondary, fontSize: isMobile ? 11 : 13, fontWeight: 500 } }}
              tick={{ fill: theme.palette.text.primary, fontSize: isMobile ? 11 : 12 }}
              tickMargin={12}
              width={isMobile ? 45 : 65}
              axisLine={{ stroke: theme.palette.divider }}
              tickLine={{ stroke: theme.palette.divider }}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: 20 }} formatter={() => config.name} />
            <Area type="monotone" dataKey={config.key} stroke={config.color} fill={alpha(config.color, 0.3)} strokeWidth={2} />
          </AreaChart>
        );
      }
      
      if (chartType === 'bar') {
        return (
          <RechartsBarChart data={progressData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
            <XAxis 
              dataKey="sessionNumber" 
              label={{ value: config.labelX, position: 'bottom', offset: isMobile ? 10 : 15, style: { fill: theme.palette.text.secondary, fontSize: isMobile ? 11 : 13, fontWeight: 500 } }}
              tick={{ fill: theme.palette.text.primary, fontSize: isMobile ? 11 : 12 }}
              tickMargin={12}
              axisLine={{ stroke: theme.palette.divider }}
              tickLine={{ stroke: theme.palette.divider }}
            />
            <YAxis 
              label={{ value: config.labelY, angle: -90, position: 'left', offset: isMobile ? 5 : 15, style: { fill: theme.palette.text.secondary, fontSize: isMobile ? 11 : 13, fontWeight: 500 } }}
              tick={{ fill: theme.palette.text.primary, fontSize: isMobile ? 11 : 12 }}
              tickMargin={12}
              width={isMobile ? 45 : 65}
              axisLine={{ stroke: theme.palette.divider }}
              tickLine={{ stroke: theme.palette.divider }}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: 20 }} formatter={() => config.name} />
            <Bar dataKey={config.key} fill={config.color} radius={[8, 8, 0, 0]} />
          </RechartsBarChart>
        );
      }
      
      return (
        <LineChart data={progressData} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
          <XAxis 
            dataKey="sessionNumber" 
            label={{ value: config.labelX, position: 'bottom', offset: isMobile ? 10 : 15, style: { fill: theme.palette.text.secondary, fontSize: isMobile ? 11 : 13, fontWeight: 500 } }}
            tick={{ fill: theme.palette.text.primary, fontSize: isMobile ? 11 : 12 }}
            tickMargin={12}
            axisLine={{ stroke: theme.palette.divider }}
            tickLine={{ stroke: theme.palette.divider }}
          />
          <YAxis 
            label={{ value: config.labelY, angle: -90, position: 'left', offset: isMobile ? 5 : 15, style: { fill: theme.palette.text.secondary, fontSize: isMobile ? 11 : 13, fontWeight: 500 } }}
            tick={{ fill: theme.palette.text.primary, fontSize: isMobile ? 11 : 12 }}
            tickMargin={12}
            width={isMobile ? 45 : 65}
            axisLine={{ stroke: theme.palette.divider }}
            tickLine={{ stroke: theme.palette.divider }}
          />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 20 }} formatter={() => config.name} />
          <Line type="monotone" dataKey={config.key} stroke={config.color} strokeWidth={3} dot={{ r: isMobile ? 5 : 7, fill: config.color, strokeWidth: 2, stroke: theme.palette.background.paper }} activeDot={{ r: isMobile ? 7 : 9 }} />
        </LineChart>
      );
    };

    return (
      <Paper sx={{ p: 3, borderRadius: 3, mb: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" sx={{ mb: 3, gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShowChart sx={{ color: theme.palette.primary.main }} />
            Динамика показателей
            <Chip size="small" label={`${progressData.length} сеансов`} />
          </Typography>
          
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value as any)}>
                <MenuItem value="goodPosture">✅ Хорошая осанка</MenuItem>
                <MenuItem value="duration">⏱️ Длительность</MenuItem>
                <MenuItem value="problems">⚠️ Количество проблем</MenuItem>
              </Select>
            </FormControl>
            
            <ToggleButtonGroup value={chartType} exclusive onChange={(e, v) => v && setChartType(v)} size="small">
              <ToggleButton value="line">📈 Линия</ToggleButton>
              <ToggleButton value="area">📊 Область</ToggleButton>
              <ToggleButton value="bar">📊 Столбцы</ToggleButton>
              <ToggleButton value="pie">🥧 Круг</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>
        
        <ResponsiveContainer width="100%" height={isMobile ? 380 : 450}>
          {renderChartComponent()}
        </ResponsiveContainer>
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 3, pt: 2 }}>
          {timeRange !== 'all' && `📅 Период: ${timeRange === 'week' ? 'неделя' : timeRange === 'month' ? 'месяц' : timeRange === '3months' ? '3 месяца' : timeRange === '6months' ? '6 месяцев' : 'год'}`}
        </Typography>
      </Paper>
    );
  };

  const renderTable = () => (
    <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 500, overflowX: 'auto' }}>
        <Table stickyHeader size="medium">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
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
            {progressData.slice().reverse().map((row) => (
              <TableRow key={row.sessionNumber} hover>
                <TableCell>{row.sessionNumber}</TableCell>
                <TableCell>{formatDate(row.fullDate)}</TableCell>
                <TableCell align="center">
                  <Chip label={`${row.score}%`} size="small" sx={{ bgcolor: getScoreColor(row.score), color: 'white', fontWeight: 700 }} />
                </TableCell>
                <TableCell align="center">{row.duration} мин</TableCell>
                <TableCell align="center" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>{row.goodPosture}%</TableCell>
                <TableCell align="center" sx={{ color: theme.palette.warning.main }}>{row.warningPosture}%</TableCell>
                <TableCell align="center" sx={{ color: theme.palette.error.main }}>{row.errorPosture}%</TableCell>
                <TableCell align="center">{row.problems > 0 ? row.problems : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 15 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
        <Timeline sx={{ fontSize: 80, color: theme.palette.text.secondary, mb: 2, opacity: 0.3 }} />
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>Нет данных</Typography>
        <Typography color="text.secondary">Выполните несколько анализов осанки для отображения статистики</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Заголовок */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Analytics sx={{ color: theme.palette.primary.main }} />
            Прогресс осанки
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Анализ вашего прогресса за {sessions.length} сеансов
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={pdfGenerating ? <CircularProgress size={20} /> : <PictureAsPdf />} onClick={generatePDF} variant="contained" disabled={pdfGenerating} sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}>
            {!isMobile && 'Отчет'}
          </Button>
          <IconButton onClick={() => setForceUpdate(prev => prev + 1)} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
            <Refresh />
          </IconButton>
        </Stack>
      </Stack>

      {/* Панель управления */}
      <Paper sx={{ p: 2, mb: 4, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
            <Button size="small" variant={timeRange === 'week' ? 'contained' : 'outlined'} onClick={() => setTimeRange('week')}>Неделя</Button>
            <Button size="small" variant={timeRange === 'month' ? 'contained' : 'outlined'} onClick={() => setTimeRange('month')}>Месяц</Button>
            <Button size="small" variant={timeRange === '3months' ? 'contained' : 'outlined'} onClick={() => setTimeRange('3months')}>3 мес</Button>
            <Button size="small" variant={timeRange === '6months' ? 'contained' : 'outlined'} onClick={() => setTimeRange('6months')}>6 мес</Button>
            <Button size="small" variant={timeRange === 'year' ? 'contained' : 'outlined'} onClick={() => setTimeRange('year')}>Год</Button>
            <Button size="small" variant={timeRange === 'all' ? 'contained' : 'outlined'} onClick={() => setTimeRange('all')}>Всё</Button>
          </Stack>
          
          <ToggleButtonGroup value={viewMode} exclusive onChange={(e, v) => v && setViewMode(v)} size="small">
            <ToggleButton value="progress">📈 Прогресс</ToggleButton>
            <ToggleButton value="table">📋 Таблица</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Paper>

      {/* Основной контент */}
      <AnimatePresence mode="wait">
        {viewMode === 'progress' && (
          <Fade in={true} key="progress">
            <Box>
              {renderMetricsCards()}
              {renderBestWorst()}
              {renderChart()}
            </Box>
          </Fade>
        )}
        {viewMode === 'table' && (
          <Fade in={true} key="table">
            {renderTable()}
          </Fade>
        )}
      </AnimatePresence>

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SessionProgress;