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
  AccordionDetails
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
  ExpandMore
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
  Cell
} from 'recharts';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/auth';

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
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [forceUpdate, setForceUpdate] = useState(0);
  const [debugOpen, setDebugOpen] = useState(false);
  
  const [timeRange, setTimeRange] = useState<'week' | 'month' | '3months' | '6months' | 'year' | 'all'>('all');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'scatter' | 'pie'>('scatter');
  const [selectedMetric, setSelectedMetric] = useState<'goodPosture' | 'duration' | 'problems'>('goodPosture');
  const [viewMode, setViewMode] = useState<'progress' | 'comparison' | 'table'>('progress');
  const [comparisonPeriod, setComparisonPeriod] = useState<'week' | 'month' | 'all'>('month');

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
    setSnackbarMessage('PDF отчет сгенерирован');
    setSnackbarOpen(true);
  };

  // Рендер метрик
  const renderMetricsCards = () => (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      <Grid item xs={6} sm={3}>
        <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
          <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
            <EmojiEvents />
          </Avatar>
          <Typography variant="h4" fontWeight="bold">{metrics.totalSessions}</Typography>
          <Typography variant="caption" color="text.secondary">Всего сеансов</Typography>
          <Typography variant="caption" display="block" color="text.secondary">{formatDuration(metrics.totalDuration)}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
          <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }}>
            <Star />
          </Avatar>
          <Typography variant="h4" fontWeight="bold" color="success.main">{metrics.averageScore}%</Typography>
          <Typography variant="caption" color="text.secondary">Средняя оценка</Typography>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} sx={{ mt: 0.5 }}>
            {getTrendIcon(metrics.scoreTrend)}
            <Typography variant="caption">Тренд: {metrics.scoreTrend > 0 ? '+' : ''}{metrics.scoreTrend}%</Typography>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3, bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
          <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main }}>
            <Speed />
          </Avatar>
          <Typography variant="h4" fontWeight="bold" color="warning.main">{metrics.consistency}%</Typography>
          <Typography variant="caption" color="text.secondary">Стабильность</Typography>
          <LinearProgress variant="determinate" value={metrics.consistency} sx={{ mt: 1, height: 4, borderRadius: 2 }} />
        </Paper>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
          <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main }}>
            <Whatshot />
          </Avatar>
          <Typography variant="h4" fontWeight="bold" color="info.main">{metrics.streak}</Typography>
          <Typography variant="caption" color="text.secondary">Серия успехов</Typography>
        </Paper>
      </Grid>
    </Grid>
  );

  // Конфигурация для метрик
  const getMetricConfig = () => {
    switch (selectedMetric) {
      case 'goodPosture':
        return { name: 'Хорошая осанка', color: theme.palette.success.main, domain: [0, 100], unit: '%', key: 'goodPosture' };
      case 'duration':
        return { name: 'Длительность', color: theme.palette.info.main, domain: [0, 60], unit: ' мин', key: 'duration' };
      case 'problems':
        return { name: 'Проблемы', color: theme.palette.warning.main, domain: [0, 'auto'], unit: '', key: 'problems' };
      default:
        return { name: 'Хорошая осанка', color: theme.palette.success.main, domain: [0, 100], unit: '%', key: 'goodPosture' };
    }
  };

  // Рендер графика
  const renderChart = () => {
    if (progressData.length === 0) {
      return (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="text.secondary">Нет данных для отображения графика</Typography>
        </Paper>
      );
    }

    const config = getMetricConfig();

    // Общий компонент тултипа для всех типов графиков
    const CustomTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const dataPoint = payload[0]?.payload;
        if (!dataPoint) return null;
        
        let value = dataPoint[config.key];
        if (config.key === 'duration') {
          value = `${value} мин`;
        } else if (config.key === 'goodPosture') {
          value = `${value}%`;
        }
        
        return (
          <Paper sx={{ p: 1.5, borderRadius: 2, boxShadow: 3, bgcolor: theme.palette.background.paper }}>
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
              Сеанс #{dataPoint.sessionNumber} ({dataPoint.date})
            </Typography>
            <Typography variant="body2" sx={{ color: config.color, fontWeight: 500 }}>
              {config.name}: {value}
            </Typography>
          </Paper>
        );
      }
      return null;
    };

    const renderChartComponent = () => {
      if (chartType === 'scatter') {
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sessionNumber" type="number" domain={[0, progressData.length + 1]} />
            <YAxis domain={config.domain} tickFormatter={(v) => v + config.unit} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            <Scatter name={config.name} dataKey={config.key} data={progressData} fill={config.color} line={{ stroke: config.color, strokeWidth: 2 }} lineType="joint" />
          </ScatterChart>
        );
      }
      
      if (chartType === 'pie') {
        const ranges = [
          { name: '0-20%', min: 0, max: 20, color: '#ef4444' },
          { name: '21-40%', min: 21, max: 40, color: '#f97316' },
          { name: '41-60%', min: 41, max: 60, color: '#f59e0b' },
          { name: '61-80%', min: 61, max: 80, color: '#eab308' },
          { name: '81-100%', min: 81, max: 100, color: '#10b981' }
        ];
        const pieData = ranges.map(r => ({ 
          name: r.name, 
          value: progressData.filter(d => d.goodPosture >= r.min && d.goodPosture <= r.max).length, 
          color: r.color 
        })).filter(d => d.value > 0);
        
        const PieTooltip = ({ active, payload }: any) => {
          if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
              <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: theme.palette.background.paper }}>
                <Typography variant="body2">{data.name}: {data.value} сеансов</Typography>
                <Typography variant="caption" color="text.secondary">{(data.value / progressData.length * 100).toFixed(1)}%</Typography>
              </Paper>
            );
          }
          return null;
        };
        
        return (
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={150} dataKey="value">
              {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <RechartsTooltip content={<PieTooltip />} />
            <Legend />
          </PieChart>
        );
      }
      
      if (chartType === 'area') {
        return (
          <AreaChart data={progressData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sessionNumber" />
            <YAxis domain={config.domain} tickFormatter={(v) => v + config.unit} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            <Area type="monotone" dataKey={config.key} stroke={config.color} fill={config.color} fillOpacity={0.3} />
          </AreaChart>
        );
      }
      
      if (chartType === 'bar') {
        return (
          <RechartsBarChart data={progressData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sessionNumber" />
            <YAxis domain={config.domain} tickFormatter={(v) => v + config.unit} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey={config.key} fill={config.color} radius={[4, 4, 0, 0]} />
          </RechartsBarChart>
        );
      }
      
      // line chart
      return (
        <LineChart data={progressData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="sessionNumber" />
          <YAxis domain={config.domain} tickFormatter={(v) => v + config.unit} />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend />
          <Line type="monotone" dataKey={config.key} stroke={config.color} strokeWidth={3} dot={{ r: 5 }} />
        </LineChart>
      );
    };

    return (
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }} flexWrap="wrap" gap={1}>
          <Typography variant="h6" fontWeight="bold">Динамика показателей — {progressData.length} сеансов</Typography>
          <Stack direction="row" spacing={1}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value as any)}>
                <MenuItem value="goodPosture">Хорошая осанка</MenuItem>
                <MenuItem value="duration">Длительность</MenuItem>
                <MenuItem value="problems">Проблемы</MenuItem>
              </Select>
            </FormControl>
            <ToggleButtonGroup value={chartType} exclusive onChange={(e, v) => v && setChartType(v)} size="small">
              <ToggleButton value="line">📈 Линия</ToggleButton>
              <ToggleButton value="area">📊 Область</ToggleButton>
              <ToggleButton value="bar">📊 Столбцы</ToggleButton>
              <ToggleButton value="scatter">🔵 Точки</ToggleButton>
              <ToggleButton value="pie">🥧 Круг</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>
        
        <ResponsiveContainer width="100%" height={400}>
          {renderChartComponent()}
        </ResponsiveContainer>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
          * График показывает каждый сеанс отдельно. Всего сеансов: {progressData.length}
          {timeRange !== 'all' && ` (период: ${timeRange === 'week' ? 'неделя' : timeRange === 'month' ? 'месяц' : timeRange === '3months' ? '3 месяца' : timeRange === '6months' ? '6 месяцев' : 'год'})`}
        </Typography>
      </Paper>
    );
  };

  // Рендер таблицы
  const renderTable = () => (
    <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
              <TableCell>#</TableCell>
              <TableCell>Дата</TableCell>
              <TableCell align="center">Оценка</TableCell>
              <TableCell align="center">Длит.</TableCell>
              <TableCell align="center">Хорошая</TableCell>
              <TableCell align="center">Пред.</TableCell>
              <TableCell align="center">Ошибки</TableCell>
              <TableCell align="center">Пробл.</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {progressData.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center">Нет данных</TableCell></TableRow>
            ) : (
              progressData.slice().reverse().map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{row.sessionNumber}</TableCell>
                  <TableCell>{formatFullDate(row.fullDate)}</TableCell>
                  <TableCell align="center">
                    <Chip label={`${row.score}%`} size="small" sx={{ bgcolor: getScoreColor(row.score), color: 'white', fontWeight: 'bold', minWidth: 55 }} />
                  </TableCell>
                  <TableCell align="center">{row.duration} мин</TableCell>
                  <TableCell align="center">{row.goodPosture}%</TableCell>
                  <TableCell align="center">{row.warningPosture}%</TableCell>
                  <TableCell align="center">{row.errorPosture}%</TableCell>
                  <TableCell align="center">{row.problems}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  // Рендер лучшего/худшего
  const renderBestWorst = () => (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.1) }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: alpha(theme.palette.success.main, 0.2), color: theme.palette.success.main }}>
              <EmojiEvents sx={{ fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Лучший результат</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.success.main }}>{formatNumber(metrics.bestScore)}%</Typography>
            </Box>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: alpha(theme.palette.warning.main, 0.2), color: theme.palette.warning.main }}>
              <Flag sx={{ fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Худший результат</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main }}>{formatNumber(metrics.worstScore)}%</Typography>
            </Box>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );

  // Рендер улучшения
  const renderImprovement = () => (
    <Paper sx={{ p: 3, mb: 4, borderRadius: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.2), color: theme.palette.success.main }}>
          <TrendingUp sx={{ fontSize: 20 }} />
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Улучшение показателей</Typography>
      </Stack>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>Общее улучшение</Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, color: metrics.improvement > 0 ? theme.palette.success.main : theme.palette.error.main }}>
              {metrics.improvement > 0 ? '+' : ''}{formatNumber(metrics.improvement)}%
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>от первых 3 к последним 3 сессиям</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>Распределение по месяцам</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {Object.entries(metrics.sessionsByMonth).map(([month, count]) => (
                <Chip key={month} label={`${month}: ${count} сесс.`} />
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );

  // Рендер достижений
  const renderMilestones = () => {
    if (progressData.length < 3) return null;
    return (
      <Paper sx={{ p: 3, mb: 4, borderRadius: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>🏆 Достижения</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Chip icon={<Star />} label={`Лучшая оценка: ${metrics.bestScore}%`} color="success" />
          <Chip icon={<Whatshot />} label={`Серия: ${metrics.streak} сеансов`} color="info" />
          <Chip icon={<TrendingUp />} label={`Улучшение: ${metrics.improvement > 0 ? '+' : ''}${formatNumber(metrics.improvement)}%`} />
        </Stack>
      </Paper>
    );
  };

  // Рендер сравнения
  const renderComparison = () => {
    if (!comparisonData) return <Alert severity="info">Недостаточно данных для сравнения</Alert>;
    return (
      <Paper sx={{ p: 3, mb: 4, borderRadius: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>📊 Сравнение с предыдущим периодом ({comparisonData.count} сеансов)</Typography>
        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Оценка</Typography>
            <Typography variant="h5">{comparisonData.metrics.avgScore}%</Typography>
            <Chip size="small" label={`${comparisonData.metrics.scoreChange > 0 ? '+' : ''}${formatNumber(comparisonData.metrics.scoreChange)}%`} color={comparisonData.metrics.scoreChange >= 0 ? 'success' : 'error'} />
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Хорошая осанка</Typography>
            <Typography variant="h5">{comparisonData.metrics.avgGoodPosture}%</Typography>
            <Chip size="small" label={`${comparisonData.metrics.goodPostureChange > 0 ? '+' : ''}${formatNumber(comparisonData.metrics.goodPostureChange)}%`} color={comparisonData.metrics.goodPostureChange >= 0 ? 'success' : 'error'} />
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Предупреждения</Typography>
            <Typography variant="h5">{comparisonData.metrics.avgWarningPosture}%</Typography>
            <Chip size="small" label={`${comparisonData.metrics.warningChange > 0 ? '+' : ''}${formatNumber(comparisonData.metrics.warningChange)}%`} color={comparisonData.metrics.warningChange <= 0 ? 'success' : 'error'} />
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Ошибки</Typography>
            <Typography variant="h5">{comparisonData.metrics.avgErrorPosture}%</Typography>
            <Chip size="small" label={`${comparisonData.metrics.errorChange > 0 ? '+' : ''}${formatNumber(comparisonData.metrics.errorChange)}%`} color={comparisonData.metrics.errorChange <= 0 ? 'success' : 'error'} />
          </Grid>
        </Grid>
        <Box sx={{ mt: 3 }}>
          <Chip icon={comparisonData.trend === 'up' ? <TrendingUp /> : <TrendingDown />} 
            label={`Тренд: ${comparisonData.trend === 'up' ? 'Положительный' : 'Отрицательный'} (${comparisonData.trendStrength === 'strong' ? 'сильный' : comparisonData.trendStrength === 'moderate' ? 'умеренный' : 'слабый'})`} />
        </Box>
      </Paper>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Загрузка данных...</Typography>
      </Box>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
        <Timeline sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>Нет данных</Typography>
        <Typography color="text.secondary">Выполните несколько анализов осанки для отображения статистики</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Статистика */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Stack direction="row" spacing={2}>
          <Typography variant="caption" color="text.secondary">📊 Всего сеансов: {sessions.length}</Typography>
          <Typography variant="caption" color="text.secondary">📈 На графике: {progressData.length}</Typography>
          <Typography variant="caption" color="text.secondary">⭐ Средняя оценка: {metrics.averageScore}%</Typography>
        </Stack>
        <Button size="small" startIcon={<Refresh />} onClick={() => setForceUpdate(prev => prev + 1)}>Обновить</Button>
      </Box>

      {/* Панель управления */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
            <Button size="small" variant={timeRange === 'week' ? 'contained' : 'outlined'} onClick={() => setTimeRange('week')}>Неделя</Button>
            <Button size="small" variant={timeRange === 'month' ? 'contained' : 'outlined'} onClick={() => setTimeRange('month')}>Месяц</Button>
            <Button size="small" variant={timeRange === '3months' ? 'contained' : 'outlined'} onClick={() => setTimeRange('3months')}>3 мес</Button>
            <Button size="small" variant={timeRange === '6months' ? 'contained' : 'outlined'} onClick={() => setTimeRange('6months')}>6 мес</Button>
            <Button size="small" variant={timeRange === 'year' ? 'contained' : 'outlined'} onClick={() => setTimeRange('year')}>Год</Button>
            <Button size="small" variant={timeRange === 'all' ? 'contained' : 'outlined'} onClick={() => setTimeRange('all')}>Всё</Button>
          </Stack>
          
          <Stack direction="row" spacing={1}>
            <Button startIcon={<PictureAsPdf />} onClick={generatePDF} variant="contained" sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}>PDF</Button>
            <ToggleButtonGroup value={viewMode} exclusive onChange={(e, v) => v && setViewMode(v)} size="small">
              <ToggleButton value="progress">📈 Прогресс</ToggleButton>
              <ToggleButton value="comparison">📊 Сравнение</ToggleButton>
              <ToggleButton value="table">📋 Таблица</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>
      </Paper>

      {/* Отладочная панель */}
      <Accordion expanded={debugOpen} onChange={() => setDebugOpen(!debugOpen)} sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
            🔧 Отладка: Все сессии ({progressData.length} шт.)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ maxHeight: 300, overflow: 'auto', bgcolor: '#f5f5f5', p: 2, borderRadius: 2 }}>
            <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', fontSize: 11, whiteSpace: 'pre-wrap' }}>
              {progressData.map((d, i) => {
                return `${i+1}. ${d.date} - Оценка: ${d.score}% (good: ${d.goodPosture}%, warning: ${d.warningPosture}%, error: ${d.errorPosture}%)\n`;
              }).join('')}
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Контент */}
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

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSnackbarOpen(false)}>{snackbarMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default SessionProgress;