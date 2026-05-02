import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
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
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fade,
  Zoom,
  useMediaQuery,
  Snackbar
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  ShowChart,
  BarChart,
  PieChart,
  AccessTime,
  CheckCircle,
  Warning,
  Error,
  Whatshot,
  Spa,
  Speed,
  Star,
  EmojiEvents,
  Flag,
  CompareArrows,
  ArrowUpward,
  ArrowDownward,
  Remove,
  Info,
  CalendarToday,
  FitnessCenter,
  Timeline as TimelineIcon,
  Radar as RadarIcon,
  TableChart,
  GridOn,
  Download,
  Share,
  Refresh,
  PictureAsPdf
} from '@mui/icons-material';
import { format, parseISO, subWeeks, subMonths } from 'date-fns';
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
  ComposedChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  PieChart as RechartsPieChart,
  Pie,
  Sector
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
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
  scores: number[];
  dates: string[];
  goodPercentages: number[];
  warningPercentages: number[];
  errorPercentages: number[];
}

interface ComparisonData {
  currentSession: any | null;
  previousSessions: any[];
  metrics: {
    avgScore: number;
    scoreChange: number;
    scoreChangePercent: number;
    avgDuration: number;
    durationChange: number;
    durationChangePercent: number;
    avgGoodPosture: number;
    goodPostureChange: number;
    goodPostureChangePercent: number;
    avgWarningPosture: number;
    warningChange: number;
    warningChangePercent: number;
    avgErrorPosture: number;
    errorChange: number;
    errorChangePercent: number;
    totalProblems: number;
    problemsChange: number;
    problemsChangePercent: number;
  };
  zoneData: {
    zone: string;
    zoneKey: string;
    current: number;
    previous: number;
    change: number;
    changePercent: number;
    currentDuration: number;
    previousDuration: number;
    currentCount: number;
    previousCount: number;
  }[];
  trend: 'up' | 'down' | 'stable';
  trendStrength: 'strong' | 'moderate' | 'weak';
  trendScore: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const SessionProgress: React.FC<SessionProgressProps> = ({ sessions, loading = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuthStore();
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const progressRef = useRef<HTMLDivElement>(null);
  
  // Основные состояния
  const [timeRange, setTimeRange] = useState<'week' | 'month' | '3months' | '6months' | 'year' | 'all'>('month');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'composed'>('area');
  const [selectedMetric, setSelectedMetric] = useState<'score' | 'goodPosture' | 'duration' | 'problems'>('score');
  const [viewMode, setViewMode] = useState<'progress' | 'comparison' | 'radar' | 'table'>('progress');
  const [comparisonPeriod, setComparisonPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [showAverage, setShowAverage] = useState(true);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [comparisonMode, setComparisonMode] = useState<'absolute' | 'percentage'>('absolute');

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
      return format(date, 'dd MMMM yyyy, HH:mm', { locale: ru });
    } catch {
      return dateString;
    }
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    if (!seconds) return '0 мин';
    const minutes = Math.round(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours} ч ${remainingMinutes} мин`;
    }
    return `${minutes} мин`;
  }, []);

  const formatShortDuration = useCallback((seconds: number) => {
    if (!seconds) return '0с';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    if (minutes > 0) {
      return `${minutes}м ${secs}с`;
    }
    return `${secs}с`;
  }, []);

  const formatNumber = useCallback((num: number, decimals: number = 1): string => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    const factor = Math.pow(10, decimals);
    const rounded = Math.round(num * factor) / factor;
    return rounded.toFixed(decimals).replace(/\.?0+$/, '');
  }, []);

  const formatPercentage = useCallback((value: number, decimals: number = 1): string => {
    return `${formatNumber(value, decimals)}%`;
  }, [formatNumber]);

  const getScoreColor = useCallback((score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  }, [theme]);

  const getScoreGradient = useCallback((score: number) => {
    if (theme.palette.mode === 'light') {
      if (score >= 90) return 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)';
      if (score >= 75) return 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)';
      if (score >= 60) return 'linear-gradient(135deg, #ff9800 0%, #ffc107 100%)';
      if (score >= 40) return 'linear-gradient(135deg, #f57c00 0%, #f44336 100%)';
      return 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)';
    } else {
      if (score >= 90) return 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)';
      if (score >= 75) return 'linear-gradient(135deg, #8bc34a 0%, #cddc39 100%)';
      if (score >= 60) return 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)';
      if (score >= 40) return 'linear-gradient(135deg, #ff9800 0%, #f44336 100%)';
      return 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
    }
  }, [theme]);

  const getTrendIcon = useCallback((value: number) => {
    if (value > 5) return <TrendingUp sx={{ color: theme.palette.success.main }} />;
    if (value < -5) return <TrendingDown sx={{ color: theme.palette.error.main }} />;
    return <TrendingFlat sx={{ color: theme.palette.warning.main }} />;
  }, [theme]);

  const getChangeColor = useCallback((change: number, invert: boolean = false) => {
    const actualChange = invert ? -change : change;
    if (Math.abs(actualChange) < 5) return theme.palette.warning.main;
    return actualChange > 0 ? theme.palette.success.main : theme.palette.error.main;
  }, [theme]);

  const getChangeIcon = useCallback((change: number, invert: boolean = false) => {
    const actualChange = invert ? -change : change;
    if (Math.abs(actualChange) < 5) return <Remove sx={{ fontSize: 16 }} />;
    return actualChange > 0 ? 
      <ArrowUpward sx={{ fontSize: 16 }} /> : 
      <ArrowDownward sx={{ fontSize: 16 }} />;
  }, []);

  const getChangeText = useCallback((change: number, changePercent: number, unit: string = '%') => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${formatNumber(change)}${unit} (${sign}${formatNumber(changePercent)}%)`;
  }, [formatNumber]);

  const getMetricIcon = useCallback((metric: string) => {
    switch (metric) {
      case 'score': return <BarChart sx={{ color: theme.palette.primary.main }} />;
      case 'goodPosture': return <CheckCircle sx={{ color: theme.palette.success.main }} />;
      case 'warningPosture': return <Warning sx={{ color: theme.palette.warning.main }} />;
      case 'errorPosture': return <Error sx={{ color: theme.palette.error.main }} />;
      case 'duration': return <AccessTime sx={{ color: theme.palette.info.main }} />;
      default: return <Info />;
    }
  }, [theme]);

  const getMetricName = useCallback((metric: string) => {
    switch (metric) {
      case 'score': return 'Оценка осанки';
      case 'goodPosture': return 'Хорошая осанка';
      case 'warningPosture': return 'Предупреждения';
      case 'errorPosture': return 'Ошибки';
      case 'duration': return 'Длительность';
      default: return metric;
    }
  }, []);

  const getMetricUnit = useCallback((metric: string) => {
    switch (metric) {
      case 'score': return '%';
      case 'goodPosture': return '%';
      case 'warningPosture': return '%';
      case 'errorPosture': return '%';
      case 'duration': return ' мин';
      default: return '';
    }
  }, []);

  // Мемоизированные вычисления прогресса
  const progressData = useMemo(() => {
    if (!sessions || sessions.length === 0) return [];

    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    const now = new Date();
    let cutoffDate = new Date(0);
    
    switch (timeRange) {
      case 'week':
        cutoffDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case '3months':
        cutoffDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case '6months':
        cutoffDate = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case 'year':
        cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case 'all':
      default:
        cutoffDate = new Date(0);
    }

    const filteredSessions = sortedSessions.filter(s => new Date(s.startTime) >= cutoffDate);

    return filteredSessions.map((session, index) => {
      const metrics = session.postureMetrics || {};
      const totalFrames = metrics.totalFrames || 1;
      const duration = session.duration || 0;
      
      return {
        date: formatDate(session.startTime),
        fullDate: session.startTime,
        index: index + 1,
        score: metrics.postureScore || 0,
        goodPosture: metrics.goodPercentage || 
          Math.round((metrics.goodPostureFrames || 0) / totalFrames * 100),
        warningPosture: metrics.warningPercentage || 
          Math.round((metrics.warningFrames || 0) / totalFrames * 100),
        errorPosture: metrics.errorPercentage || 
          Math.round((metrics.errorFrames || 0) / totalFrames * 100),
        duration: Math.round(duration / 60),
        durationSeconds: duration,
        problems: session.problems?.length || 0,
        shoulders: metrics.errorsByZone?.shoulders?.duration || 0,
        head: metrics.errorsByZone?.head?.duration || 0,
        hips: metrics.errorsByZone?.hips?.duration || 0
      };
    });
  }, [sessions, timeRange, formatDate]);

  // Вычисляем метрики прогресса
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
        averageScoreByMonth: {},
        scores: [],
        dates: [],
        goodPercentages: [],
        warningPercentages: [],
        errorPercentages: []
      };
    }

    const scores = progressData.map(d => d.score);
    const totalSessions = progressData.length;
    const totalDuration = progressData.reduce((sum, d) => sum + d.duration, 0);
    const averageScore = scores.reduce((a, b) => a + b, 0) / totalSessions;
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);

    // Тренд (линейная регрессия)
    const xValues = Array.from({ length: totalSessions }, (_, i) => i);
    const yValues = scores;
    
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((a, _, i) => a + xValues[i] * yValues[i], 0);
    const sumXX = xValues.reduce((a, _, i) => a + xValues[i] * xValues[i], 0);
    
    const slope = (totalSessions * sumXY - sumX * sumY) / (totalSessions * sumXX - sumX * sumX);
    const scoreTrend = slope * 10;

    // Консистентность
    const variance = scores.reduce((acc, val) => acc + Math.pow(val - averageScore, 2), 0) / totalSessions;
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, 100 - stdDev * 2);

    // Улучшение
    const first3Avg = scores.slice(0, Math.min(3, totalSessions)).reduce((a, b) => a + b, 0) / Math.min(3, totalSessions);
    const last3Avg = scores.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const improvement = first3Avg > 0 ? ((last3Avg - first3Avg) / first3Avg) * 100 : 0;

    // Текущая серия
    let streak = 0;
    for (let i = totalSessions - 1; i >= 0; i--) {
      if (scores[i] >= averageScore) {
        streak++;
      } else {
        break;
      }
    }

    // Группировка по месяцам
    const sessionsByMonth: Record<string, number> = {};
    const averageScoreByMonth: Record<string, number> = {};
    
    progressData.forEach(data => {
      const month = format(parseISO(data.fullDate), 'MMM yyyy', { locale: ru });
      sessionsByMonth[month] = (sessionsByMonth[month] || 0) + 1;
      
      if (!averageScoreByMonth[month]) {
        averageScoreByMonth[month] = data.score;
      } else {
        averageScoreByMonth[month] = (averageScoreByMonth[month] + data.score) / 2;
      }
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
      lastSessionDate: progressData[progressData.length - 1]?.fullDate || null,
      firstSessionDate: progressData[0]?.fullDate || null,
      sessionsByMonth,
      averageScoreByMonth,
      scores: progressData.map(d => d.score),
      dates: progressData.map(d => d.fullDate),
      goodPercentages: progressData.map(d => d.goodPosture),
      warningPercentages: progressData.map(d => d.warningPosture),
      errorPercentages: progressData.map(d => d.errorPosture)
    };
  }, [progressData]);

  // Вычисляем данные для сравнения
  const comparisonData = useMemo((): ComparisonData | null => {
    if (!sessions || sessions.length < 2) return null;

    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    const currentSession = sortedSessions[0];
    
    const now = new Date();
    let cutoffDate: Date;
    
    switch (comparisonPeriod) {
      case 'week':
        cutoffDate = subWeeks(now, 1);
        break;
      case 'month':
        cutoffDate = subMonths(now, 1);
        break;
      case 'all':
      default:
        cutoffDate = new Date(0);
    }
    
    const previousSessions = sortedSessions.slice(1).filter(s => 
      new Date(s.startTime) >= cutoffDate
    );

    if (previousSessions.length === 0) return null;

    const currentMetrics = currentSession.postureMetrics || {};
    const currentProblems = currentSession.problems || [];
    const currentDuration = currentSession.duration || 1;
    
    const currentScore = currentMetrics.postureScore || 0;
    const currentGoodPosture = currentMetrics.goodPercentage || 
      Math.round((currentMetrics.goodPostureFrames || 0) / (currentMetrics.totalFrames || 1) * 100);
    const currentWarningPosture = currentMetrics.warningPercentage || 
      Math.round((currentMetrics.warningFrames || 0) / (currentMetrics.totalFrames || 1) * 100);
    const currentErrorPosture = currentMetrics.errorPercentage || 
      Math.round((currentMetrics.errorFrames || 0) / (currentMetrics.totalFrames || 1) * 100);

    // Рассчитываем средние значения для предыдущих сессий
    let prevTotalScore = 0;
    let prevTotalDuration = 0;
    let prevTotalGoodPosture = 0;
    let prevTotalWarningPosture = 0;
    let prevTotalErrorPosture = 0;
    let prevTotalProblems = 0;
    
    const zoneStats: Record<string, { currentPercent: number, prevPercent: number, currentDuration: number, prevDuration: number, currentCount: number, prevCount: number }> = {
      shoulders: { currentPercent: 0, prevPercent: 0, currentDuration: 0, prevDuration: 0, currentCount: 0, prevCount: 0 },
      head: { currentPercent: 0, prevPercent: 0, currentDuration: 0, prevDuration: 0, currentCount: 0, prevCount: 0 },
      hips: { currentPercent: 0, prevPercent: 0, currentDuration: 0, prevDuration: 0, currentCount: 0, prevCount: 0 }
    };

    const currentErrorsByZone = currentMetrics.errorsByZone || {};
    
    Object.keys(zoneStats).forEach(zone => {
      const zoneData = currentErrorsByZone[zone] || { duration: 0, count: 0 };
      zoneStats[zone].currentDuration = zoneData.duration || 0;
      zoneStats[zone].currentCount = zoneData.count || 0;
      zoneStats[zone].currentPercent = currentDuration > 0 ? (zoneData.duration / currentDuration) * 100 : 0;
    });

    previousSessions.forEach(session => {
      const metrics = session.postureMetrics || {};
      const duration = session.duration || 1;
      const problems = session.problems || [];
      
      prevTotalScore += metrics.postureScore || 0;
      prevTotalDuration += duration;
      
      const goodPercent = metrics.goodPercentage || 
        Math.round((metrics.goodPostureFrames || 0) / (metrics.totalFrames || 1) * 100);
      prevTotalGoodPosture += goodPercent;
      
      const warningPercent = metrics.warningPercentage || 
        Math.round((metrics.warningFrames || 0) / (metrics.totalFrames || 1) * 100);
      prevTotalWarningPosture += warningPercent;
      
      const errorPercent = metrics.errorPercentage || 
        Math.round((metrics.errorFrames || 0) / (metrics.totalFrames || 1) * 100);
      prevTotalErrorPosture += errorPercent;
      
      prevTotalProblems += problems.length;

      const errorsByZone = metrics.errorsByZone || {};
      Object.keys(zoneStats).forEach(zone => {
        const zoneData = errorsByZone[zone] || { duration: 0, count: 0 };
        zoneStats[zone].prevDuration += zoneData.duration || 0;
        zoneStats[zone].prevCount += zoneData.count || 0;
        zoneStats[zone].prevPercent += duration > 0 ? ((zoneData.duration || 0) / duration) * 100 : 0;
      });
    });

    const prevCount = previousSessions.length;
    const prevAvgScore = prevTotalScore / prevCount;
    const prevAvgDuration = prevTotalDuration / prevCount;
    const prevAvgGoodPosture = prevTotalGoodPosture / prevCount;
    const prevAvgWarningPosture = prevTotalWarningPosture / prevCount;
    const prevAvgErrorPosture = prevTotalErrorPosture / prevCount;
    const prevAvgProblems = prevTotalProblems / prevCount;

    const scoreChange = currentScore - prevAvgScore;
    const durationChange = currentDuration - prevAvgDuration;
    const goodPostureChange = currentGoodPosture - prevAvgGoodPosture;
    const warningChange = currentWarningPosture - prevAvgWarningPosture;
    const errorChange = currentErrorPosture - prevAvgErrorPosture;
    const problemsChange = currentProblems.length - prevAvgProblems;

    const scoreChangePercent = prevAvgScore > 0 ? (scoreChange / prevAvgScore) * 100 : 0;
    const durationChangePercent = prevAvgDuration > 0 ? (durationChange / prevAvgDuration) * 100 : 0;
    const goodPostureChangePercent = prevAvgGoodPosture > 0 ? (goodPostureChange / prevAvgGoodPosture) * 100 : 0;
    const warningChangePercent = prevAvgWarningPosture > 0 ? (warningChange / prevAvgWarningPosture) * 100 : 0;
    const errorChangePercent = prevAvgErrorPosture > 0 ? (errorChange / prevAvgErrorPosture) * 100 : 0;
    const problemsChangePercent = prevAvgProblems > 0 ? (problemsChange / prevAvgProblems) * 100 : 0;

    // Определяем тренд
    const avgPositiveChange = (scoreChangePercent + goodPostureChangePercent) / 2;
    const avgNegativeChange = (warningChangePercent + errorChangePercent + problemsChangePercent) / 3;
    const trendScore = avgPositiveChange - avgNegativeChange;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let trendStrength: 'strong' | 'moderate' | 'weak' = 'weak';
    
    if (Math.abs(trendScore) < 5) {
      trend = 'stable';
      trendStrength = 'weak';
    } else if (trendScore > 0) {
      trend = 'up';
      trendStrength = trendScore > 15 ? 'strong' : trendScore > 8 ? 'moderate' : 'weak';
    } else {
      trend = 'down';
      trendStrength = Math.abs(trendScore) > 15 ? 'strong' : Math.abs(trendScore) > 8 ? 'moderate' : 'weak';
    }

    const zoneLabels: Record<string, string> = {
      'shoulders': 'Плечи',
      'head': 'Голова',
      'hips': 'Таз'
    };

    const zoneData = Object.keys(zoneStats).map(zone => {
      const prevAvgPercent = zoneStats[zone].prevPercent / prevCount;
      const prevAvgDuration = zoneStats[zone].prevDuration / prevCount;
      const prevAvgCount = zoneStats[zone].prevCount / prevCount;
      
      const change = zoneStats[zone].currentPercent - prevAvgPercent;
      const changePercent = prevAvgPercent > 0 ? (change / prevAvgPercent) * 100 : 0;

      return {
        zone: zoneLabels[zone] || zone,
        zoneKey: zone,
        current: zoneStats[zone].currentPercent,
        previous: prevAvgPercent,
        change,
        changePercent,
        currentDuration: zoneStats[zone].currentDuration,
        previousDuration: prevAvgDuration,
        currentCount: zoneStats[zone].currentCount,
        previousCount: prevAvgCount
      };
    }).filter(z => z.current > 0.1 || z.previous > 0.1);

    return {
      currentSession,
      previousSessions,
      metrics: {
        avgScore: currentScore,
        scoreChange,
        scoreChangePercent,
        avgDuration: currentDuration,
        durationChange,
        durationChangePercent,
        avgGoodPosture: currentGoodPosture,
        goodPostureChange,
        goodPostureChangePercent,
        avgWarningPosture: currentWarningPosture,
        warningChange,
        warningChangePercent,
        avgErrorPosture: currentErrorPosture,
        errorChange,
        errorChangePercent,
        totalProblems: currentProblems.length,
        problemsChange,
        problemsChangePercent
      },
      zoneData,
      trend,
      trendStrength,
      trendScore
    };
  }, [sessions, comparisonPeriod]);

  // Функция для генерации SVG графиков для PDF
  const generateScoreChartSVG = useCallback(() => {
    if (progressData.length === 0) return '';

    const width = 700;
    const height = 250;
    const padding = { top: 30, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const scores = progressData.map(d => d.score);
    const maxScore = 100;
    const minScore = 0;
    const dates = progressData.map(d => format(parseISO(d.fullDate), 'dd.MM'));

    const points = scores.map((score, i) => {
      const x = padding.left + (i / (scores.length - 1)) * chartWidth;
      const y = padding.top + ((maxScore - score) / (maxScore - minScore)) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    const gridLines = [];
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (i / 5) * chartHeight;
      const value = maxScore - (i / 5) * (maxScore - minScore);
      gridLines.push(`
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="5,5" />
        <text x="${padding.left - 5}" y="${y - 5}" text-anchor="end" font-size="10" fill="#64748b">${Math.round(value)}%</text>
      `);
    }

    const xAxisLabels = dates.map((date, i) => {
      if (i % Math.max(1, Math.floor(dates.length / 8)) === 0 || i === dates.length - 1) {
        const x = padding.left + (i / (dates.length - 1)) * chartWidth;
        return `<text x="${x}" y="${height - 10}" text-anchor="middle" font-size="9" fill="#64748b">${date}</text>`;
      }
      return '';
    }).join('');

    const dataPoints = scores.map((score, i) => {
      const x = padding.left + (i / (scores.length - 1)) * chartWidth;
      const y = padding.top + ((maxScore - score) / (maxScore - minScore)) * chartHeight;
      const color = getScoreColor(score).replace('#', '');
      return `<circle cx="${x}" cy="${y}" r="4" fill="#${color}" stroke="white" stroke-width="2" />`;
    }).join('');

    const movingAveragePoints = [];
    for (let i = 2; i < scores.length; i++) {
      const avg = (scores[i-2] + scores[i-1] + scores[i]) / 3;
      const x = padding.left + (i / (scores.length - 1)) * chartWidth;
      const y = padding.top + ((maxScore - avg) / (maxScore - minScore)) * chartHeight;
      movingAveragePoints.push(`${x},${y}`);
    }

    const movingAverageLine = movingAveragePoints.length > 2 
      ? `<polyline points="${movingAveragePoints.join(' ')}" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="5,5" />`
      : '';

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="white" />
        
        <!-- Grid -->
        ${gridLines.join('')}
        
        <!-- Axes -->
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#94a3b8" stroke-width="1" />
        <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#94a3b8" stroke-width="1" />
        
        <!-- Moving average line -->
        ${movingAverageLine}
        
        <!-- Main line -->
        <polyline points="${points}" fill="none" stroke="#6366f1" stroke-width="3" />
        
        <!-- Data points -->
        ${dataPoints}
        
        <!-- X axis labels -->
        ${xAxisLabels}
        
        <!-- Title -->
        <text x="${width / 2}" y="15" text-anchor="middle" font-size="12" fill="#1e293b" font-weight="bold">Динамика оценки осанки</text>
      </svg>
    `;
  }, [progressData, getScoreColor]);

  const generateZoneChartSVG = useCallback(() => {
    if (!comparisonData || comparisonData.zoneData.length === 0) return '';

    const width = 400;
    const height = 300;
    const radius = Math.min(width, height) / 2.5;
    const centerX = width / 2;
    const centerY = height / 2;

    const zones = comparisonData.zoneData;
    const angleStep = (Math.PI * 2) / zones.length;

    const currentPoints = zones.map((zone, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const value = Math.min(zone.current / 100, 1) * radius;
      const x = centerX + value * Math.cos(angle);
      const y = centerY + value * Math.sin(angle);
      return `${x},${y}`;
    });

    const previousPoints = zones.map((zone, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const value = Math.min(zone.previous / 100, 1) * radius;
      const x = centerX + value * Math.cos(angle);
      const y = centerY + value * Math.sin(angle);
      return `${x},${y}`;
    });

    const axisLines = zones.map((zone, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      const labelX = centerX + (radius + 25) * Math.cos(angle);
      const labelY = centerY + (radius + 25) * Math.sin(angle);
      return `
        <line x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}" stroke="#e2e8f0" stroke-width="1" />
        <text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="10" fill="#64748b">${zone.zone}</text>
      `;
    }).join('');

    const gridCircles = [0.25, 0.5, 0.75, 1].map(scale => {
      const r = radius * scale;
      return `<circle cx="${centerX}" cy="${centerY}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3" />`;
    }).join('');

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="white" />
        
        <!-- Grid circles -->
        ${gridCircles}
        
        <!-- Axis lines -->
        ${axisLines}
        
        <!-- Center point -->
        <circle cx="${centerX}" cy="${centerY}" r="3" fill="#94a3b8" />
        
        <!-- Previous period polygon -->
        <polygon points="${previousPoints.join(' ')}" fill="#94a3b8" fill-opacity="0.3" stroke="#64748b" stroke-width="2" stroke-dasharray="5,5" />
        
        <!-- Current period polygon -->
        <polygon points="${currentPoints.join(' ')}" fill="#6366f1" fill-opacity="0.5" stroke="#6366f1" stroke-width="2" />
        
        <!-- Legend -->
        <rect x="${width - 120}" y="20" width="12" height="12" fill="#6366f1" fill-opacity="0.5" stroke="#6366f1" stroke-width="1" />
        <text x="${width - 100}" y="30" font-size="10" fill="#1e293b">Текущий</text>
        
        <rect x="${width - 120}" y="40" width="12" height="12" fill="#94a3b8" fill-opacity="0.3" stroke="#64748b" stroke-width="1" stroke-dasharray="3,2" />
        <text x="${width - 100}" y="50" font-size="10" fill="#1e293b">Средний</text>
        
        <!-- Title -->
        <text x="${width / 2}" y="15" text-anchor="middle" font-size="12" fill="#1e293b" font-weight="bold">Радар проблемных зон</text>
      </svg>
    `;
  }, [comparisonData]);

  const generateDistributionChartSVG = useCallback(() => {
    if (progressData.length === 0) return '';

    const width = 400;
    const height = 250;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 80;

    const avgGood = progressData.reduce((sum, d) => sum + d.goodPosture, 0) / progressData.length;
    const avgWarning = progressData.reduce((sum, d) => sum + d.warningPosture, 0) / progressData.length;
    const avgError = progressData.reduce((sum, d) => sum + d.errorPosture, 0) / progressData.length;

    const data = [
      { name: 'Хорошая', value: avgGood, color: '#10b981' },
      { name: 'Предупреждения', value: avgWarning, color: '#f59e0b' },
      { name: 'Ошибки', value: avgError, color: '#ef4444' }
    ].filter(d => d.value > 0);

    const total = data.reduce((sum, d) => sum + d.value, 0);
    let startAngle = 0;

    const pieSlices = data.map(item => {
      const angle = (item.value / total) * 360;
      const endAngle = startAngle + angle;
      
      const startRad = (startAngle - 90) * Math.PI / 180;
      const endRad = (endAngle - 90) * Math.PI / 180;
      
      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const path = `
        M ${centerX} ${centerY}
        L ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
        Z
      `;
      
      const labelAngle = startAngle + angle / 2 - 90;
      const labelRad = labelAngle * Math.PI / 180;
      const labelX = centerX + (radius + 30) * Math.cos(labelRad);
      const labelY = centerY + (radius + 30) * Math.sin(labelRad);
      
      const slice = `<path d="${path}" fill="${item.color}" stroke="white" stroke-width="2" />`;
      
      startAngle = endAngle;
      
      return {
        slice,
        label: item.value > 5 ? `
          <text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="9" fill="#1e293b" font-weight="600">${item.name}</text>
          <text x="${labelX}" y="${labelY + 12}" text-anchor="middle" font-size="9" fill="#64748b">${Math.round(item.value)}%</text>
        ` : ''
      };
    });

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="white" />
        
        <!-- Pie slices -->
        ${pieSlices.map(s => s.slice).join('')}
        
        <!-- Labels -->
        ${pieSlices.map(s => s.label).join('')}
        
        <!-- Title -->
        <text x="${width / 2}" y="15" text-anchor="middle" font-size="12" fill="#1e293b" font-weight="bold">Распределение состояний</text>
      </svg>
    `;
  }, [progressData]);

  const generateTrendChartSVG = useCallback(() => {
    if (progressData.length < 2) return '';

    const width = 600;
    const height = 200;
    const padding = { top: 20, right: 30, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const recentScores = progressData.slice(-5).map(d => d.score);
    const recentDates = progressData.slice(-5).map(d => format(parseISO(d.fullDate), 'dd.MM'));

    const bars = recentScores.map((score, i) => {
      const barWidth = chartWidth / recentScores.length - 4;
      const x = padding.left + i * (chartWidth / recentScores.length);
      const barHeight = (score / 100) * chartHeight;
      const y = height - padding.bottom - barHeight;
      const color = getScoreColor(score).replace('#', '');
      
      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#${color}" rx="4" ry="4" />
        <text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="8" fill="#1e293b" font-weight="600">${Math.round(score)}%</text>
        <text x="${x + barWidth / 2}" y="${height - 5}" text-anchor="middle" font-size="8" fill="#64748b">${recentDates[i]}</text>
      `;
    }).join('');

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="white" />
        
        <!-- Title -->
        <text x="${width / 2}" y="15" text-anchor="middle" font-size="12" fill="#1e293b" font-weight="bold">Последние 5 сеансов</text>
        
        <!-- Bars -->
        ${bars}
      </svg>
    `;
  }, [progressData, getScoreColor]);

  // Функция для генерации PDF с прогрессом
  const generateProgressPDF = useCallback(async () => {
    if (!sessions || sessions.length === 0) {
      setSnackbarMessage('Нет данных для экспорта');
      setSnackbarOpen(true);
      return;
    }

    setPdfGenerating(true);

    try {
      // Создаем iframe вне основного документа
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.style.visibility = 'hidden';
      
      document.body.appendChild(iframe);

      // Форматируем даты для отчета
      const reportDate = format(new Date(), 'dd.MM.yyyy HH:mm', { locale: ru });
      const userName = user?.fullName || 
                      (user?.firstName ? user.firstName + ' ' + (user?.lastName || '') : 'Пользователь');
      const userEmail = user?.email || 'Не указан';
      
      // Определяем период отчета
      let periodText = '';
      switch (timeRange) {
        case 'week': periodText = 'за последнюю неделю'; break;
        case 'month': periodText = 'за последний месяц'; break;
        case '3months': periodText = 'за последние 3 месяца'; break;
        case '6months': periodText = 'за последние 6 месяцев'; break;
        case 'year': periodText = 'за последний год'; break;
        case 'all': periodText = 'за всё время'; break;
      }

      // Получаем общие метрики
      const totalSessions = metrics.totalSessions;
      const totalDuration = formatDuration(metrics.totalDuration * 60);
      const avgScore = formatNumber(metrics.averageScore);
      const bestScore = metrics.bestScore;
      const worstScore = metrics.worstScore;
      const consistency = formatNumber(metrics.consistency);
      const improvement = metrics.improvement > 0 ? `+${formatNumber(metrics.improvement)}%` : `${formatNumber(metrics.improvement)}%`;
      const streak = metrics.streak;

      // Генерируем SVG графики
      const scoreChartSVG = generateScoreChartSVG();
      const zoneChartSVG = generateZoneChartSVG();
      const distributionChartSVG = generateDistributionChartSVG();
      const trendChartSVG = generateTrendChartSVG();

      // Формируем данные для таблицы сессий
      const sessionsTableRows = progressData.slice().reverse().map((session, idx) => {
        const date = format(parseISO(session.fullDate), 'dd.MM.yyyy HH:mm', { locale: ru });
        const scoreColor = getScoreColor(session.score).replace('#', '');
        return `
          <tr>
            <td>${date}</td>
            <td class="number-cell" style="color: #${scoreColor}; font-weight: 600;">${session.score}%</td>
            <td class="number-cell">${session.duration} мин</td>
            <td class="number-cell" style="color: #10b981;">${session.goodPosture}%</td>
            <td class="number-cell" style="color: #f59e0b;">${session.warningPosture}%</td>
            <td class="number-cell" style="color: #ef4444;">${session.errorPosture}%</td>
            <td class="number-cell">${session.problems}</td>
          </tr>
        `;
      }).join('');

      // Формируем данные для распределения по месяцам
      const monthChips = Object.entries(metrics.sessionsByMonth).map(([month, count]) => {
        const avgScoreForMonth = metrics.averageScoreByMonth[month] || 0;
        const color = getScoreColor(avgScoreForMonth).replace('#', '');
        return `
          <span style="display: inline-block; background-color: #${color}20; color: #${color}; border: 1px solid #${color}40; border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: 600; margin: 0 4px 4px 0;">
            ${month}: ${count} сес. (${formatNumber(avgScoreForMonth)}%)
          </span>
        `;
      }).join('');

      // Определяем рекомендации на основе прогресса
      const getProgressRecommendations = () => {
        const recs = [];
        
        if (metrics.totalSessions < 3) {
          recs.push('Проведите еще несколько анализов для получения более точной статистики');
        }
        
        if (metrics.scoreTrend > 0) {
          recs.push('Отличная динамика! Продолжайте работать над осанкой');
        } else if (metrics.scoreTrend < 0) {
          recs.push('Наблюдается отрицательная динамика. Рекомендуется уделить больше внимания упражнениям');
        }
        
        if (metrics.consistency < 70) {
          recs.push('Результаты нестабильны. Старайтесь поддерживать одинаковый уровень осанки на всех сеансах');
        }
        
        if (metrics.improvement > 10) {
          recs.push('Заметен значительный прогресс с первых сеансов. Поздравляем!');
        }
        
        if (metrics.streak > 3) {
          recs.push(`Вы на серии из ${metrics.streak} успешных сеансов! Так держать!`);
        }

        if (metrics.bestScore >= 90) {
          recs.push('Достигнут отличный результат! Поддерживайте его регулярными тренировками');
        } else if (metrics.bestScore >= 80) {
          recs.push('Близки к отличному результату! Еще немного усилий');
        }
        
        return recs;
      };

      const recommendations = getProgressRecommendations();

      // Создаем HTML строку с графиками
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Arial', sans-serif;
                color: #1e293b;
                padding: 20px;
                max-width: 900px;
                margin: 0 auto;
              }
              
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              
              .title {
                font-size: 28px;
                font-weight: bold;
                color: #1e293b;
                margin-bottom: 8px;
              }
              
              .subtitle {
                color: #64748b;
                font-size: 14px;
                margin-bottom: 5px;
              }
              
              .section-title {
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 15px;
                border-bottom: 2px solid #6366f1;
                padding-bottom: 5px;
              }
              
              .info-box {
                background-color: #f8fafc;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
                font-size: 13px;
                line-height: 1.8;
                margin-bottom: 25px;
              }
              
              .stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 25px;
              }
              
              .stat-card {
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 15px;
              }
              
              .stat-label {
                color: #64748b;
                font-size: 12px;
                margin-bottom: 5px;
              }
              
              .stat-value {
                font-size: 24px;
                font-weight: bold;
                color: #1e293b;
              }
              
              .stat-trend {
                font-size: 14px;
                margin-top: 5px;
              }
              
              .chart-container {
                background-color: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 25px;
                text-align: center;
              }
              
              .charts-row {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                margin-bottom: 25px;
              }
              
              .chart-half {
                flex: 1 1 calc(50% - 15px);
                min-width: 300px;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11px;
                margin-bottom: 25px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                overflow: hidden;
              }
              
              th {
                background-color: #6366f1;
                color: white;
                padding: 8px 10px;
                text-align: left;
                font-weight: 600;
                font-size: 11px;
              }
              
              td {
                padding: 6px 10px;
                border-bottom: 1px solid #e2e8f0;
              }
              
              tr:nth-child(even) {
                background-color: #f8fafc;
              }
              
              tr:hover {
                background-color: #f1f5f9;
              }
              
              .number-cell {
                text-align: right;
                font-feature-settings: 'tnum' 1;
                font-variant-numeric: tabular-nums;
                font-family: monospace;
              }
              
              .score-highlight {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 20px;
                font-weight: bold;
              }
              
              .recommendations {
                background-color: #f0f9ff;
                border: 1px solid #bae6fd;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 30px;
              }
              
              ul {
                font-size: 13px;
                line-height: 1.6;
                color: #0c4a6e;
                margin: 0;
                padding-left: 20px;
              }
              
              li {
                margin-bottom: 8px;
              }
              
              .footer {
                font-size: 10px;
                color: #94a3b8;
                border-top: 1px solid #e2e8f0;
                padding-top: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 20px;
              }
              
              .badge {
                display: inline-block;
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
                padding: 4px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 10px;
              }
              
              .trend-up {
                color: #10b981;
              }
              
              .trend-down {
                color: #ef4444;
              }
              
              .trend-stable {
                color: #f59e0b;
              }
              
              .month-chips {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                margin-top: 10px;
              }
              
              .kpi-row {
                display: flex;
                gap: 10px;
                margin-bottom: 10px;
              }
              
              .kpi-item {
                flex: 1;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                padding: 10px;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="badge">Отчет о прогрессе</div>
              <div class="title">Анализ динамики осанки</div>
              <div class="subtitle">Posture Analyzer System</div>
              <div style="color: #94a3b8; font-size: 12px;">${periodText}</div>
            </div>
            
            <hr style="border: none; border-top: 2px solid #6366f1; margin: 20px 0 30px 0; opacity: 0.7;">
            
            <div class="section-title">Информация о пользователе</div>
            <div class="info-box">
              <p><strong>Пользователь:</strong> ${userName}</p>
              <p><strong>Email:</strong> ${userEmail}</p>
              <p><strong>Период отчета:</strong> ${periodText}</p>
              <p><strong>Количество сеансов:</strong> ${totalSessions}</p>
              <p><strong>Всего времени:</strong> ${totalDuration}</p>
              <p><strong>Дата первого сеанса:</strong> ${metrics.firstSessionDate ? formatFullDate(metrics.firstSessionDate) : 'Нет данных'}</p>
              <p><strong>Дата последнего сеанса:</strong> ${metrics.lastSessionDate ? formatFullDate(metrics.lastSessionDate) : 'Нет данных'}</p>
            </div>
            
            <div class="section-title">Ключевые показатели</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Средняя оценка</div>
                <div class="stat-value" style="color: #6366f1;">${avgScore}%</div>
                <div class="stat-trend">${metrics.scoreTrend > 0 ? '↑' : metrics.scoreTrend < 0 ? '↓' : '→'} Тренд: ${metrics.scoreTrend > 0 ? '+' : ''}${formatNumber(metrics.scoreTrend)}%</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-label">Лучший результат</div>
                <div class="stat-value" style="color: #10b981;">${bestScore}%</div>
                <div class="stat-trend">Худший: ${worstScore}%</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-label">Консистентность</div>
                <div class="stat-value" style="color: #f59e0b;">${consistency}%</div>
                <div class="stat-trend">Стабильность результатов</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-label">Улучшение</div>
                <div class="stat-value" style="color: ${metrics.improvement > 0 ? '#10b981' : metrics.improvement < 0 ? '#ef4444' : '#f59e0b'};">${improvement}</div>
                <div class="stat-trend">От первых к последним</div>
              </div>
            </div>
            
            <div class="kpi-row">
              <div class="kpi-item">
                <div style="font-size: 12px; color: #64748b;">Текущая серия</div>
                <div style="font-size: 28px; font-weight: bold; color: #3b82f6;">${streak}</div>
                <div style="font-size: 11px; color: #64748b;">успешных сеансов</div>
              </div>
              
              <div class="kpi-item">
                <div style="font-size: 12px; color: #64748b;">Всего сеансов</div>
                <div style="font-size: 28px; font-weight: bold; color: #8b5cf6;">${totalSessions}</div>
                <div style="font-size: 11px; color: #64748b;">за выбранный период</div>
              </div>
            </div>
            
            <!-- График динамики -->
            <div class="section-title">Динамика оценки осанки</div>
            <div class="chart-container">
              ${scoreChartSVG}
            </div>
            
            <!-- Два графика в ряд -->
            <div class="charts-row">
              <div class="chart-half">
                <div class="section-title">Распределение состояний</div>
                <div class="chart-container">
                  ${distributionChartSVG}
                </div>
              </div>
              
              <div class="chart-half">
                <div class="section-title">Последние 5 сеансов</div>
                <div class="chart-container">
                  ${trendChartSVG}
                </div>
              </div>
            </div>
            
            <!-- Радар проблемных зон (если есть данные) -->
            ${comparisonData && comparisonData.zoneData.length > 0 ? `
              <div class="section-title">Радар проблемных зон</div>
              <div class="chart-container">
                ${zoneChartSVG}
              </div>
            ` : ''}
            
            <div class="section-title">Распределение по месяцам</div>
            <div class="info-box">
              <div class="month-chips">
                ${monthChips || 'Нет данных по месяцам'}
              </div>
            </div>
            
            <div class="section-title">История сеансов</div>
            <table>
              <thead>
                <tr>
                  <th>Дата и время</th>
                  <th>Оценка</th>
                  <th>Длит.</th>
                  <th>Хор.</th>
                  <th>Пред.</th>
                  <th>Ошиб.</th>
                  <th>Проб.</th>
                </tr>
              </thead>
              <tbody>
                ${sessionsTableRows || '<tr><td colspan="7" style="text-align: center; padding: 20px;">Нет данных за выбранный период</td></tr>'}
              </tbody>
            </table>
            
            ${comparisonData ? `
              <div class="section-title">Сравнение с предыдущим периодом</div>
              <table style="margin-bottom: 25px;">
                <thead>
                  <tr>
                    <th>Показатель</th>
                    <th>Текущий</th>
                    <th>Средний</th>
                    <th>Изменение</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Оценка осанки</td>
                    <td class="number-cell" style="color: #6366f1; font-weight: 600;">${formatNumber(comparisonData.metrics.avgScore)}%</td>
                    <td class="number-cell">${formatNumber(comparisonData.metrics.avgScore - comparisonData.metrics.scoreChange)}%</td>
                    <td class="number-cell" style="color: ${comparisonData.metrics.scoreChange > 0 ? '#10b981' : comparisonData.metrics.scoreChange < 0 ? '#ef4444' : '#f59e0b'};">
                      ${comparisonData.metrics.scoreChange > 0 ? '+' : ''}${formatNumber(comparisonData.metrics.scoreChange)}%
                    </td>
                  </tr>
                  <tr>
                    <td>Длительность</td>
                    <td class="number-cell" style="font-weight: 600;">${formatNumber(comparisonData.metrics.avgDuration / 60)} мин</td>
                    <td class="number-cell">${formatNumber((comparisonData.metrics.avgDuration - comparisonData.metrics.durationChange) / 60)} мин</td>
                    <td class="number-cell" style="color: ${comparisonData.metrics.durationChange > 0 ? '#10b981' : comparisonData.metrics.durationChange < 0 ? '#ef4444' : '#f59e0b'};">
                      ${comparisonData.metrics.durationChange > 0 ? '+' : ''}${formatNumber(comparisonData.metrics.durationChange / 60)} мин
                    </td>
                  </tr>
                  <tr>
                    <td>Хорошая осанка</td>
                    <td class="number-cell" style="color: #10b981; font-weight: 600;">${formatNumber(comparisonData.metrics.avgGoodPosture)}%</td>
                    <td class="number-cell">${formatNumber(comparisonData.metrics.avgGoodPosture - comparisonData.metrics.goodPostureChange)}%</td>
                    <td class="number-cell" style="color: ${comparisonData.metrics.goodPostureChange > 0 ? '#10b981' : comparisonData.metrics.goodPostureChange < 0 ? '#ef4444' : '#f59e0b'};">
                      ${comparisonData.metrics.goodPostureChange > 0 ? '+' : ''}${formatNumber(comparisonData.metrics.goodPostureChange)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            ` : ''}
            
            <div class="section-title">Рекомендации на основе прогресса</div>
            <div class="recommendations">
              <ul>
                ${recommendations.length > 0 ? 
                  recommendations.map(rec => `<li>${rec}</li>`).join('') : 
                  '<li>Продолжайте регулярно проводить анализ осанки для отслеживания прогресса</li>'
                }
                <li>Старайтесь заниматься не реже 3-4 раз в неделю для стабильных результатов</li>
                <li>Обращайте внимание на зоны с наибольшим количеством ошибок</li>
              </ul>
            </div>
            
            <div class="footer">
              <div style="font-weight: 500;">Posture Analyzer System • Отчет о прогрессе</div>
              <div>Сгенерировано: ${reportDate}</div>
            </div>
          </body>
        </html>
      `;

      // Создаем содержимое iframe с правильной загрузкой скрипта
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('Cannot access iframe document');

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
          </head>
          <body>
            <div id="content">${htmlContent}</div>
            <script>
              function generatePDF() {
                const element = document.getElementById('content');
                const opt = {
                  margin: [10, 10, 10, 10],
                  filename: 'progress_report_${format(new Date(), 'yyyy-MM-dd')}.pdf',
                  image: { type: 'jpeg', quality: 0.98 },
                  html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', letterRendering: true },
                  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
                };
                
                // Ждем загрузки скрипта и DOM
                if (typeof html2pdf !== 'undefined') {
                  html2pdf().set(opt).from(element).save().then(() => {
                    window.parent.postMessage('pdf-generated', '*');
                  });
                } else {
                  console.error('html2pdf not loaded yet');
                  setTimeout(generatePDF, 500);
                }
              }
              
              // Запускаем генерацию после полной загрузки страницы
              window.onload = function() {
                setTimeout(generatePDF, 1000); // Даем дополнительное время на загрузку скрипта
              };
            </script>
          </body>
        </html>
      `);
      iframeDoc.close();

      // Ждем сообщения об успешной генерации
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          window.removeEventListener('message', handler);
          reject(new Error('PDF generation timeout'));
        }, 30000);
        
        const handler = (event: MessageEvent) => {
          if (event.data === 'pdf-generated') {
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            resolve(true);
          }
        };
        window.addEventListener('message', handler);
      });

      setSnackbarMessage('PDF успешно сгенерирован');
      setSnackbarOpen(true);

      // Удаляем iframe
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setSnackbarMessage('Ошибка при генерации PDF');
      setSnackbarOpen(true);
    } finally {
      setPdfGenerating(false);
    }
  }, [sessions, progressData, metrics, comparisonData, timeRange, user, formatFullDate, formatNumber, formatDuration, getScoreColor, generateScoreChartSVG, generateZoneChartSVG, generateDistributionChartSVG, generateTrendChartSVG]);

  // Рендер метрик
  const renderMetricsCards = () => (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Paper
          elevation={theme.palette.mode === 'light' ? 1 : 0}
          sx={{
            p: 2.5,
            height: '100%',
            background: theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, #f0f4f8 0%, #e6ecf3 100%)'
              : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[4]
            }
          }}
        >
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: alpha(theme.palette.primary.main, 0.2),
                color: theme.palette.primary.main
              }}>
                <EmojiEvents sx={{ fontSize: 20 }} />
              </Avatar>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Всего сеансов
              </Typography>
            </Stack>
            <Typography variant="h3" sx={{ 
              fontWeight: 800, 
              color: theme.palette.primary.main,
              textShadow: theme.palette.mode === 'light' 
                ? 'none'
                : '0 2px 10px rgba(102, 126, 234, 0.3)'
            }}>
              {metrics.totalSessions}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {formatDuration(metrics.totalDuration * 60)} всего
            </Typography>
          </Stack>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper
          elevation={theme.palette.mode === 'light' ? 1 : 0}
          sx={{
            p: 2.5,
            height: '100%',
            background: theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
              : 'linear-gradient(135deg, #1a2e1a 0%, #1e3e1e 100%)',
            border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
            borderRadius: 3,
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[4]
            }
          }}
        >
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: alpha(theme.palette.success.main, 0.2),
                color: theme.palette.success.main
              }}>
                <Star sx={{ fontSize: 20 }} />
              </Avatar>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Средняя оценка
              </Typography>
            </Stack>
            <Typography variant="h3" sx={{ 
              fontWeight: 800, 
              color: theme.palette.success.main,
              textShadow: theme.palette.mode === 'light' 
                ? 'none'
                : '0 2px 10px rgba(76, 175, 80, 0.3)'
            }}>
              {formatNumber(metrics.averageScore)}%
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              {getTrendIcon(metrics.scoreTrend)}
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Тренд: {metrics.scoreTrend > 0 ? '+' : ''}{formatNumber(metrics.scoreTrend)}%
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper
          elevation={theme.palette.mode === 'light' ? 1 : 0}
          sx={{
            p: 2.5,
            height: '100%',
            background: theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)'
              : 'linear-gradient(135deg, #2e1a1a 0%, #3e1e1e 100%)',
            border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
            borderRadius: 3,
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[4]
            }
          }}
        >
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: alpha(theme.palette.warning.main, 0.2),
                color: theme.palette.warning.main
              }}>
                <Speed sx={{ fontSize: 20 }} />
              </Avatar>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Консистентность
              </Typography>
            </Stack>
            <Typography variant="h3" sx={{ 
              fontWeight: 800, 
              color: theme.palette.warning.main,
              textShadow: theme.palette.mode === 'light' 
                ? 'none'
                : '0 2px 10px rgba(255, 152, 0, 0.3)'
            }}>
              {formatNumber(metrics.consistency)}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={metrics.consistency}
              sx={{ 
                height: 6,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})`,
                  borderRadius: 3
                }
              }}
            />
          </Stack>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper
          elevation={theme.palette.mode === 'light' ? 1 : 0}
          sx={{
            p: 2.5,
            height: '100%',
            background: theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%)'
              : 'linear-gradient(135deg, #1a2e2e 0%, #1e3e3e 100%)',
            border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
            borderRadius: 3,
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[4]
            }
          }}
        >
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: alpha(theme.palette.info.main, 0.2),
                color: theme.palette.info.main
              }}>
                <Whatshot sx={{ fontSize: 20 }} />
              </Avatar>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Текущая серия
              </Typography>
            </Stack>
            <Typography variant="h3" sx={{ 
              fontWeight: 800, 
              color: theme.palette.info.main,
              textShadow: theme.palette.mode === 'light' 
                ? 'none'
                : '0 2px 10px rgba(33, 150, 243, 0.3)'
            }}>
              {metrics.streak}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              сессий подряд
            </Typography>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );

  // Рендер прогресс-чарта
  const renderProgressChart = () => {
    if (progressData.length === 0) return null;

    const getMetricConfig = () => {
      switch (selectedMetric) {
        case 'score':
          return {
            name: 'Оценка осанки',
            color: theme.palette.primary.main,
            gradient: 'colorScore',
            domain: [0, 100],
            unit: '%'
          };
        case 'goodPosture':
          return {
            name: 'Хорошая осанка',
            color: theme.palette.success.main,
            gradient: 'colorGood',
            domain: [0, 100],
            unit: '%'
          };
        case 'duration':
          return {
            name: 'Длительность',
            color: theme.palette.info.main,
            gradient: 'colorDuration',
            domain: [0, 'auto'],
            unit: ' мин'
          };
        case 'problems':
          return {
            name: 'Количество проблем',
            color: theme.palette.warning.main,
            gradient: 'colorProblems',
            domain: [0, 'auto'],
            unit: ''
          };
        default:
          return {
            name: 'Оценка осанки',
            color: theme.palette.primary.main,
            gradient: 'colorScore',
            domain: [0, 100],
            unit: '%'
          };
      }
    };

    const metricConfig = getMetricConfig();

    // Вычисляем скользящее среднее
    const movingAverage = progressData.map((item, index) => {
      if (index < 2) return null;
      const values = progressData.slice(index - 2, index + 1).map(d => d[selectedMetric]);
      return values.reduce((a, b) => a + b, 0) / 3;
    });

    const dataWithAverage = progressData.map((item, index) => ({
      ...item,
      movingAverage: movingAverage[index]
    }));

    const renderChart = () => {
      switch (chartType) {
        case 'line':
          return (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={dataWithAverage} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProblems" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={theme.palette.divider}
                  vertical={false}
                />
                <XAxis 
                  dataKey="date" 
                  stroke={theme.palette.text.secondary}
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                  axisLine={{ stroke: theme.palette.divider }}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                  axisLine={{ stroke: theme.palette.divider }}
                  domain={metricConfig.domain}
                />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload;
                      return (
                        <Paper sx={{ 
                          p: 2, 
                          bgcolor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          boxShadow: theme.shadows[3]
                        }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
                            {formatFullDate(dataPoint.fullDate)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: metricConfig.color }}>
                            {metricConfig.name}: {dataPoint[selectedMetric]}{metricConfig.unit}
                          </Typography>
                          {dataPoint.movingAverage && (
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              Среднее (3): {formatNumber(dataPoint.movingAverage)}{metricConfig.unit}
                            </Typography>
                          )}
                        </Paper>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  wrapperStyle={{ color: theme.palette.text.primary }}
                  formatter={(value) => <span style={{ color: theme.palette.text.primary }}>{value}</span>}
                />
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  name={metricConfig.name}
                  stroke={metricConfig.color}
                  strokeWidth={3}
                  dot={{ r: 4, fill: metricConfig.color, strokeWidth: 2, stroke: theme.palette.background.paper }}
                  activeDot={{ r: 6, fill: metricConfig.color, stroke: theme.palette.background.paper }}
                />
                {showAverage && (
                  <Line
                    type="monotone"
                    dataKey="movingAverage"
                    name="Скользящее среднее"
                    stroke={theme.palette.text.secondary}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          );

        case 'area':
          return (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={progressData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorGood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorProblems" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={theme.palette.divider}
                  vertical={false}
                />
                <XAxis 
                  dataKey="date" 
                  stroke={theme.palette.text.secondary}
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                  axisLine={{ stroke: theme.palette.divider }}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                  axisLine={{ stroke: theme.palette.divider }}
                  domain={metricConfig.domain}
                />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload;
                      return (
                        <Paper sx={{ 
                          p: 2, 
                          bgcolor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          boxShadow: theme.shadows[3]
                        }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
                            {formatFullDate(dataPoint.fullDate)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: metricConfig.color }}>
                            {metricConfig.name}: {dataPoint[selectedMetric]}{metricConfig.unit}
                          </Typography>
                        </Paper>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  wrapperStyle={{ color: theme.palette.text.primary }}
                  formatter={(value) => <span style={{ color: theme.palette.text.primary }}>{value}</span>}
                />
                <Area
                  type="monotone"
                  dataKey={selectedMetric}
                  name={metricConfig.name}
                  stroke={metricConfig.color}
                  fill={`url(#${metricConfig.gradient})`}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          );

        case 'bar':
          return (
            <ResponsiveContainer width="100%" height={400}>
              <RechartsBarChart data={progressData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={theme.palette.divider}
                  vertical={false}
                />
                <XAxis 
                  dataKey="date" 
                  stroke={theme.palette.text.secondary}
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                  axisLine={{ stroke: theme.palette.divider }}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                  axisLine={{ stroke: theme.palette.divider }}
                  domain={metricConfig.domain}
                />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload;
                      return (
                        <Paper sx={{ 
                          p: 2, 
                          bgcolor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          boxShadow: theme.shadows[3]
                        }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
                            {formatFullDate(dataPoint.fullDate)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: metricConfig.color }}>
                            {metricConfig.name}: {dataPoint[selectedMetric]}{metricConfig.unit}
                          </Typography>
                        </Paper>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  wrapperStyle={{ color: theme.palette.text.primary }}
                  formatter={(value) => <span style={{ color: theme.palette.text.primary }}>{value}</span>}
                />
                <Bar
                  dataKey={selectedMetric}
                  name={metricConfig.name}
                  fill={metricConfig.color}
                  radius={[4, 4, 0, 0]}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          );

        case 'composed':
          return (
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={progressData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorGood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorWarning" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={theme.palette.divider}
                  vertical={false}
                />
                <XAxis 
                  dataKey="date" 
                  stroke={theme.palette.text.secondary}
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                  axisLine={{ stroke: theme.palette.divider }}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                  axisLine={{ stroke: theme.palette.divider }}
                  domain={[0, 100]}
                />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload;
                      return (
                        <Paper sx={{ 
                          p: 2, 
                          bgcolor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          boxShadow: theme.shadows[3]
                        }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
                            {formatFullDate(dataPoint.fullDate)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: theme.palette.success.main }}>
                            Хорошая: {dataPoint.goodPosture}%
                          </Typography>
                          <Typography variant="body2" sx={{ color: theme.palette.warning.main }}>
                            Предупреждения: {dataPoint.warningPosture}%
                          </Typography>
                          <Typography variant="body2" sx={{ color: theme.palette.error.main }}>
                            Ошибки: {dataPoint.errorPosture}%
                          </Typography>
                          <Typography variant="body2" sx={{ color: theme.palette.primary.main, mt: 1 }}>
                            Оценка: {dataPoint.score}%
                          </Typography>
                        </Paper>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  wrapperStyle={{ color: theme.palette.text.primary }}
                  formatter={(value) => <span style={{ color: theme.palette.text.primary }}>{value}</span>}
                />
                <Area
                  type="monotone"
                  dataKey="goodPosture"
                  stackId="1"
                  name="Хорошая осанка"
                  stroke={theme.palette.success.main}
                  fill="url(#colorGood)"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="warningPosture"
                  stackId="1"
                  name="Предупреждения"
                  stroke={theme.palette.warning.main}
                  fill="url(#colorWarning)"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="errorPosture"
                  stackId="1"
                  name="Ошибки"
                  stroke={theme.palette.error.main}
                  fill="url(#colorError)"
                  fillOpacity={0.6}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Общая оценка"
                  stroke={theme.palette.primary.main}
                  strokeWidth={3}
                  dot={{ r: 4, fill: theme.palette.primary.main, stroke: theme.palette.background.paper }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          );

        default:
          return null;
      }
    };

    return (
      <Paper
        elevation={theme.palette.mode === 'light' ? 1 : 0}
        sx={{
          p: 3,
          mb: 4,
          background: theme.palette.mode === 'light'
            ? alpha(theme.palette.background.paper, 0.8)
            : alpha(theme.palette.background.paper, 0.4),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 4
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ 
              width: 36, 
              height: 36, 
              bgcolor: alpha(theme.palette.primary.main, 0.2),
              color: theme.palette.primary.main
            }}>
              <ShowChart sx={{ fontSize: 20 }} />
            </Avatar>
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
              График прогресса
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ color: theme.palette.text.secondary }}>Метрика</InputLabel>
              <Select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                label="Метрика"
                sx={{
                  color: theme.palette.text.primary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.divider,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.text.secondary,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                  '& .MuiSvgIcon-root': {
                    color: theme.palette.text.secondary,
                  },
                }}
              >
                <MenuItem value="score">Оценка осанки</MenuItem>
                <MenuItem value="goodPosture">Хорошая осанка</MenuItem>
                <MenuItem value="duration">Длительность</MenuItem>
                <MenuItem value="problems">Проблемы</MenuItem>
              </Select>
            </FormControl>
            
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={(e, value) => value && setChartType(value)}
              size="small"
              sx={{
                background: theme.palette.mode === 'light'
                  ? alpha(theme.palette.background.paper, 0.5)
                  : alpha(theme.palette.background.paper, 0.2),
                border: `1px solid ${theme.palette.divider}`,
                '& .MuiToggleButton-root': {
                  color: theme.palette.text.secondary,
                  borderColor: theme.palette.divider,
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                    background: alpha(theme.palette.primary.main, 0.1)
                  },
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.05)
                  }
                }
              }}
            >
              <ToggleButton value="line">
                <ShowChart />
              </ToggleButton>
              <ToggleButton value="area">
                <TimelineIcon />
              </ToggleButton>
              <ToggleButton value="bar">
                <BarChart />
              </ToggleButton>
              <ToggleButton value="composed">
                <PieChart />
              </ToggleButton>
            </ToggleButtonGroup>

            {chartType === 'line' && (
              <Button
                size="small"
                variant={showAverage ? 'contained' : 'outlined'}
                onClick={() => setShowAverage(!showAverage)}
                sx={{
                  background: showAverage ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  borderColor: theme.palette.divider,
                  color: showAverage ? theme.palette.primary.main : theme.palette.text.secondary,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    background: alpha(theme.palette.primary.main, 0.1)
                  }
                }}
              >
                Среднее
              </Button>
            )}
          </Stack>
        </Stack>
        
        {renderChart()}
      </Paper>
    );
  };

  // Рендер лучшего/худшего результата
  const renderBestWorst = () => (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      <Grid item xs={12} md={6}>
        <Paper
          elevation={theme.palette.mode === 'light' ? 1 : 0}
          sx={{
            p: 2.5,
            background: theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
              : 'linear-gradient(135deg, #1a2e1a 0%, #1e3e1e 100%)',
            border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
            borderRadius: 3
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ 
              width: 48, 
              height: 48, 
              bgcolor: alpha(theme.palette.success.main, 0.2),
              color: theme.palette.success.main
            }}>
              <EmojiEvents sx={{ fontSize: 24 }} />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Лучший результат
              </Typography>
              <Typography variant="h4" sx={{ 
                fontWeight: 800, 
                color: theme.palette.success.main,
                textShadow: theme.palette.mode === 'light' 
                  ? 'none'
                  : '0 2px 10px rgba(76, 175, 80, 0.3)'
              }}>
                {formatNumber(metrics.bestScore)}%
              </Typography>
            </Box>
            {progressData.filter(d => d.score === metrics.bestScore).map((d, i) => (
              <Chip
                key={i}
                label={format(parseISO(d.fullDate), 'dd MMM', { locale: ru })}
                size="small"
                sx={{ 
                  bgcolor: alpha(theme.palette.success.main, 0.2),
                  color: theme.palette.success.main,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
                }}
              />
            ))}
          </Stack>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper
          elevation={theme.palette.mode === 'light' ? 1 : 0}
          sx={{
            p: 2.5,
            background: theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)'
              : 'linear-gradient(135deg, #2e1a1a 0%, #3e1e1e 100%)',
            border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
            borderRadius: 3
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ 
              width: 48, 
              height: 48, 
              bgcolor: alpha(theme.palette.warning.main, 0.2),
              color: theme.palette.warning.main
            }}>
              <Flag sx={{ fontSize: 24 }} />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Худший результат
              </Typography>
              <Typography variant="h4" sx={{ 
                fontWeight: 800, 
                color: theme.palette.warning.main,
                textShadow: theme.palette.mode === 'light' 
                  ? 'none'
                  : '0 2px 10px rgba(255, 152, 0, 0.3)'
              }}>
                {formatNumber(metrics.worstScore)}%
              </Typography>
            </Box>
            {progressData.filter(d => d.score === metrics.worstScore).map((d, i) => (
              <Chip
                key={i}
                label={format(parseISO(d.fullDate), 'dd MMM', { locale: ru })}
                size="small"
                sx={{ 
                  bgcolor: alpha(theme.palette.warning.main, 0.2),
                  color: theme.palette.warning.main,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
                }}
              />
            ))}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );

  // Рендер радиар-чарта
  const renderRadarChart = () => {
    if (!comparisonData || comparisonData.zoneData.length === 0) return null;

    const radarData = comparisonData.zoneData.map(zone => ({
      subject: zone.zone,
      current: Math.min(zone.current, 100),
      previous: Math.min(zone.previous, 100),
      fullMark: 100
    }));

    return (
      <Paper
        elevation={theme.palette.mode === 'light' ? 1 : 0}
        sx={{
          p: 3,
          mb: 4,
          background: theme.palette.mode === 'light'
            ? alpha(theme.palette.background.paper, 0.8)
            : alpha(theme.palette.background.paper, 0.4),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 4
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <Avatar sx={{ 
            width: 36, 
            height: 36, 
            bgcolor: alpha(theme.palette.info.main, 0.2),
            color: theme.palette.info.main
          }}>
            <RadarIcon sx={{ fontSize: 20 }} />
          </Avatar>
          <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
            Радар проблемных зон
          </Typography>
        </Stack>
        
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke={theme.palette.divider} />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: theme.palette.text.primary, fontSize: 12 }}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
              stroke={theme.palette.divider}
            />
            <Radar
              name="Текущий сеанс"
              dataKey="current"
              stroke={theme.palette.primary.main}
              fill={theme.palette.primary.main}
              fillOpacity={0.6}
            />
            <Radar
              name="Среднее за период"
              dataKey="previous"
              stroke={theme.palette.text.secondary}
              fill={theme.palette.text.secondary}
              fillOpacity={0.3}
            />
            <Legend 
              wrapperStyle={{ color: theme.palette.text.primary }}
              formatter={(value) => <span style={{ color: theme.palette.text.primary }}>{value}</span>}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Paper>
    );
  };

  // Рендер сравнения
  const renderComparison = () => {
    if (!comparisonData) {
      return (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 4,
            borderRadius: 3,
            background: alpha(theme.palette.info.main, 0.1),
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            color: theme.palette.info.main
          }}
        >
          <Typography variant="body1">
            Для сравнения необходимо минимум 2 сеанса за выбранный период
          </Typography>
        </Alert>
      );
    }

    const { metrics, previousSessions, trend, trendStrength, trendScore, zoneData } = comparisonData;

    const getTrendColor = () => {
      switch (trend) {
        case 'up': return theme.palette.success.main;
        case 'down': return theme.palette.error.main;
        default: return theme.palette.warning.main;
      }
    };

    const getTrendText = () => {
      switch (trend) {
        case 'up': return 'Положительная динамика';
        case 'down': return 'Отрицательная динамика';
        default: return 'Стабильно';
      }
    };

    const getTrendStrengthText = () => {
      switch (trendStrength) {
        case 'strong': return 'Сильный тренд';
        case 'moderate': return 'Умеренный тренд';
        case 'weak': return 'Слабый тренд';
      }
    };

    return (
      <>
        {/* Сводка тренда */}
        <Paper
          elevation={theme.palette.mode === 'light' ? 1 : 0}
          sx={{
            p: 3,
            mb: 4,
            background: `linear-gradient(135deg, ${alpha(getTrendColor(), 0.1)} 0%, ${
              theme.palette.mode === 'light' 
                ? alpha(theme.palette.background.paper, 0.8)
                : alpha(theme.palette.background.paper, 0.4)
            } 100%)`,
            border: `1px solid ${alpha(getTrendColor(), 0.3)}`,
            borderRadius: 4
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
            <Box sx={{ 
              p: 2,
              borderRadius: '50%',
              bgcolor: alpha(getTrendColor(), 0.2),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${getTrendColor()}`
            }}>
              {trend === 'up' && <TrendingUp sx={{ fontSize: 48, color: getTrendColor() }} />}
              {trend === 'down' && <TrendingDown sx={{ fontSize: 48, color: getTrendColor() }} />}
              {trend === 'stable' && <TrendingFlat sx={{ fontSize: 48, color: getTrendColor() }} />}
            </Box>
            
            <Box sx={{ flexGrow: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                <Box>
                  <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 700, mb: 0.5 }}>
                    {getTrendText()}
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    {getTrendStrengthText()} • Сравнение с {previousSessions.length} {previousSessions.length === 1 ? 'сеансом' : 'сеансами'}
                  </Typography>
                </Box>
                
                <Chip
                  icon={<Info />}
                  label={`Общий тренд: ${trendScore > 0 ? '+' : ''}${formatNumber(trendScore)}%`}
                  sx={{
                    bgcolor: alpha(getTrendColor(), 0.2),
                    color: getTrendColor(),
                    fontWeight: 600,
                    border: `1px solid ${alpha(getTrendColor(), 0.3)}`
                  }}
                />
              </Stack>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ 
                    p: 2,
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    borderRadius: 2
                  }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
                      Средняя оценка
                    </Typography>
                    <Stack direction="row" alignItems="baseline" justifyContent="space-between">
                      <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                        {formatNumber(metrics.avgScore)}%
                      </Typography>
                      <Chip
                        size="small"
                        icon={getChangeIcon(metrics.scoreChange)}
                        label={`${metrics.scoreChange > 0 ? '+' : ''}${formatNumber(metrics.scoreChange)}%`}
                        sx={{
                          bgcolor: alpha(getChangeColor(metrics.scoreChange), 0.2),
                          color: getChangeColor(metrics.scoreChange),
                          height: 24,
                          border: `1px solid ${alpha(getChangeColor(metrics.scoreChange), 0.3)}`
                        }}
                      />
                    </Stack>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ 
                    p: 2,
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    borderRadius: 2
                  }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
                      Хорошая осанка
                    </Typography>
                    <Stack direction="row" alignItems="baseline" justifyContent="space-between">
                      <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                        {formatNumber(metrics.avgGoodPosture)}%
                      </Typography>
                      <Chip
                        size="small"
                        icon={getChangeIcon(metrics.goodPostureChange)}
                        label={`${metrics.goodPostureChange > 0 ? '+' : ''}${formatNumber(metrics.goodPostureChange)}%`}
                        sx={{
                          bgcolor: alpha(getChangeColor(metrics.goodPostureChange), 0.2),
                          color: getChangeColor(metrics.goodPostureChange),
                          height: 24,
                          border: `1px solid ${alpha(getChangeColor(metrics.goodPostureChange), 0.3)}`
                        }}
                      />
                    </Stack>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ 
                    p: 2,
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    borderRadius: 2
                  }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
                      Предупреждения
                    </Typography>
                    <Stack direction="row" alignItems="baseline" justifyContent="space-between">
                      <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                        {formatNumber(metrics.avgWarningPosture)}%
                      </Typography>
                      <Chip
                        size="small"
                        icon={getChangeIcon(metrics.warningChange, true)}
                        label={`${metrics.warningChange > 0 ? '+' : ''}${formatNumber(metrics.warningChange)}%`}
                        sx={{
                          bgcolor: alpha(getChangeColor(metrics.warningChange, true), 0.2),
                          color: getChangeColor(metrics.warningChange, true),
                          height: 24,
                          border: `1px solid ${alpha(getChangeColor(metrics.warningChange, true), 0.3)}`
                        }}
                      />
                    </Stack>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ 
                    p: 2,
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                    borderRadius: 2
                  }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
                      Ошибки
                    </Typography>
                    <Stack direction="row" alignItems="baseline" justifyContent="space-between">
                      <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
                        {formatNumber(metrics.avgErrorPosture)}%
                      </Typography>
                      <Chip
                        size="small"
                        icon={getChangeIcon(metrics.errorChange, true)}
                        label={`${metrics.errorChange > 0 ? '+' : ''}${formatNumber(metrics.errorChange)}%`}
                        sx={{
                          bgcolor: alpha(getChangeColor(metrics.errorChange, true), 0.2),
                          color: getChangeColor(metrics.errorChange, true),
                          height: 24,
                          border: `1px solid ${alpha(getChangeColor(metrics.errorChange, true), 0.3)}`
                        }}
                      />
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </Paper>

        {/* Сравнение по зонам */}
        {zoneData.length > 0 && (
          <Paper
            elevation={theme.palette.mode === 'light' ? 1 : 0}
            sx={{
              p: 3,
              mb: 4,
              background: theme.palette.mode === 'light'
                ? alpha(theme.palette.background.paper, 0.8)
                : alpha(theme.palette.background.paper, 0.4),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 4
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
              <Avatar sx={{ 
                width: 36, 
                height: 36, 
                bgcolor: alpha(theme.palette.warning.main, 0.2),
                color: theme.palette.warning.main
              }}>
                <Warning sx={{ fontSize: 20 }} />
              </Avatar>
              <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
                Сравнение проблемных зон
              </Typography>
            </Stack>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '& th': {
                      color: theme.palette.text.primary,
                      fontWeight: 600,
                      borderBottom: `1px solid ${theme.palette.divider}`
                    }
                  }}>
                    <TableCell>Зона</TableCell>
                    <TableCell align="center">Текущий сеанс</TableCell>
                    <TableCell align="center">Среднее за период</TableCell>
                    <TableCell align="center">Изменение</TableCell>
                    <TableCell align="center">Количество нарушений</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {zoneData.map((zone, index) => (
                    <TableRow 
                      key={index} 
                      sx={{ 
                        '& td': {
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          color: theme.palette.text.primary
                        },
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.02)
                        }
                      }}
                    >
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: alpha(
                              zone.zoneKey === 'shoulders' ? theme.palette.info.main :
                              zone.zoneKey === 'head' ? theme.palette.warning.main :
                              theme.palette.error.main,
                              0.2
                            ),
                            color: zone.zoneKey === 'shoulders' ? theme.palette.info.main :
                                   zone.zoneKey === 'head' ? theme.palette.warning.main :
                                   theme.palette.error.main
                          }}>
                            {zone.zoneKey === 'shoulders' ? '👥' : zone.zoneKey === 'head' ? '🧠' : '🦵'}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {zone.zone}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={`${formatDuration(zone.currentDuration)} (${zone.currentCount} нарушений)`}>
                          <Chip
                            label={`${formatNumber(zone.current)}%`}
                            size="small"
                            sx={{
                              bgcolor: alpha(
                                zone.current > 30 ? theme.palette.error.main :
                                zone.current > 15 ? theme.palette.warning.main :
                                theme.palette.info.main,
                                0.2
                              ),
                              color: zone.current > 30 ? theme.palette.error.main :
                                     zone.current > 15 ? theme.palette.warning.main :
                                     theme.palette.info.main,
                              fontWeight: 600,
                              border: `1px solid ${
                                zone.current > 30 ? alpha(theme.palette.error.main, 0.3) :
                                zone.current > 15 ? alpha(theme.palette.warning.main, 0.3) :
                                alpha(theme.palette.info.main, 0.3)
                              }`,
                              cursor: 'help'
                            }}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={`${formatDuration(zone.previousDuration)} (${formatNumber(zone.previousCount)} нарушений)`}>
                          <Typography variant="body2" sx={{ 
                            color: theme.palette.text.secondary,
                            cursor: 'help'
                          }}>
                            {formatNumber(zone.previous)}%
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                          <Box sx={{ color: getChangeColor(zone.change, true) }}>
                            {getChangeIcon(zone.change, true)}
                          </Box>
                          <Tooltip title={getChangeText(zone.change, zone.changePercent, '%')}>
                            <Typography variant="body2" sx={{ 
                              color: getChangeColor(zone.change, true),
                              fontWeight: 600,
                              cursor: 'help'
                            }}>
                              {zone.change > 0 ? '+' : ''}{formatNumber(zone.change)}%
                            </Typography>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                          <Chip
                            label={zone.currentCount}
                            size="small"
                            sx={{ 
                              bgcolor: alpha(theme.palette.primary.main, 0.2),
                              color: theme.palette.primary.main,
                              minWidth: 40,
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                            }}
                          />
                          <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                            vs
                          </Typography>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {formatNumber(zone.previousCount)}
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </>
    );
  };

  // Рендер таблицы всех сеансов
  const renderTable = () => (
    <Paper
      elevation={theme.palette.mode === 'light' ? 1 : 0}
      sx={{
        background: theme.palette.mode === 'light'
          ? alpha(theme.palette.background.paper, 0.8)
          : alpha(theme.palette.background.paper, 0.4),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 4,
        overflow: 'hidden'
      }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '& th': {
                color: theme.palette.text.primary,
                fontWeight: 600,
                borderBottom: `1px solid ${theme.palette.divider}`
              }
            }}>
              <TableCell>Дата и время</TableCell>
              <TableCell>Оценка</TableCell>
              <TableCell>Длительность</TableCell>
              <TableCell>Хорошая осанка</TableCell>
              <TableCell>Предупреждения</TableCell>
              <TableCell>Ошибки</TableCell>
              <TableCell>Проблемы</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {progressData.slice().reverse().map((session, index) => {
              const scoreColor = getScoreColor(session.score);
              return (
                <TableRow
                  key={index}
                  sx={{
                    '& td': {
                      color: theme.palette.text.primary,
                      borderBottom: `1px solid ${theme.palette.divider}`
                    },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.02)
                    }
                  }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                        {format(parseISO(session.fullDate), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 2,
                          background: getScoreGradient(session.score),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography variant="body2" sx={{ 
                          color: 'white',
                          fontWeight: 700
                        }}>
                          {session.score}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {session.duration} мин
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ width: 100 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={session.goodPosture}
                        sx={{ 
                          height: 6,
                          borderRadius: 3,
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
                            borderRadius: 3
                          }
                        }}
                      />
                      <Typography variant="caption" sx={{ 
                        color: theme.palette.text.secondary,
                        display: 'block',
                        textAlign: 'center',
                        mt: 0.5
                      }}>
                        {session.goodPosture}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: theme.palette.warning.main }}>
                      {session.warningPosture}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: theme.palette.error.main }}>
                      {session.errorPosture}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={session.problems}
                      size="small"
                      sx={{
                        bgcolor: alpha(
                          session.problems > 2 ? theme.palette.error.main :
                          session.problems > 0 ? theme.palette.warning.main :
                          theme.palette.success.main,
                          0.2
                        ),
                        color: session.problems > 2 ? theme.palette.error.main :
                               session.problems > 0 ? theme.palette.warning.main :
                               theme.palette.success.main,
                        border: `1px solid ${
                          session.problems > 2 ? alpha(theme.palette.error.main, 0.3) :
                          session.problems > 0 ? alpha(theme.palette.warning.main, 0.3) :
                          alpha(theme.palette.success.main, 0.3)
                        }`
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  // Рендер достижений
  const renderMilestones = () => {
    if (progressData.length < 3) return null;

    const milestones = [];
    
    milestones.push({
      label: 'Первый анализ',
      date: progressData[0].fullDate,
      value: progressData[0].score,
      icon: '🚀',
      color: theme.palette.info.main
    });

    for (let i = 1; i < progressData.length; i++) {
      if (progressData[i].score >= progressData[0].score + 10) {
        milestones.push({
          label: '+10% к первому результату',
          date: progressData[i].fullDate,
          value: progressData[i].score,
          icon: '🎯',
          color: theme.palette.success.main
        });
        break;
      }
    }

    const eightyPlus = progressData.find(d => d.score >= 80);
    if (eightyPlus) {
      milestones.push({
        label: 'Достижение 80%',
        date: eightyPlus.fullDate,
        value: eightyPlus.score,
        icon: '🏆',
        color: theme.palette.warning.main
      });
    }

    milestones.push({
      label: 'Последний анализ',
      date: progressData[progressData.length - 1].fullDate,
      value: progressData[progressData.length - 1].score,
      icon: '⭐',
      color: theme.palette.primary.main
    });

    return (
      <Paper
        elevation={theme.palette.mode === 'light' ? 1 : 0}
        sx={{
          p: 3,
          mb: 4,
          background: theme.palette.mode === 'light'
            ? alpha(theme.palette.background.paper, 0.8)
            : alpha(theme.palette.background.paper, 0.4),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 4
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4 }}>
          <Avatar sx={{ 
            width: 36, 
            height: 36, 
            bgcolor: alpha(theme.palette.warning.main, 0.2),
            color: theme.palette.warning.main
          }}>
            <EmojiEvents sx={{ fontSize: 20 }} />
          </Avatar>
          <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
            Важные достижения
          </Typography>
        </Stack>
        
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={2} 
          justifyContent="space-between" 
          alignItems="center"
        >
          {milestones.map((milestone, index) => (
            <React.Fragment key={index}>
              <Paper sx={{ 
                p: 2.5,
                textAlign: 'center',
                minWidth: 140,
                background: `linear-gradient(135deg, ${alpha(milestone.color, 0.1)} 0%, ${
                  theme.palette.mode === 'light'
                    ? alpha(theme.palette.background.paper, 0.9)
                    : alpha(theme.palette.background.paper, 0.5)
                } 100%)`,
                border: `1px solid ${alpha(milestone.color, 0.3)}`,
                borderRadius: 3,
                position: 'relative',
                flex: 1
              }}>
                <Typography variant="h3" sx={{ mb: 1 }}>
                  {milestone.icon}
                </Typography>
                <Typography variant="h5" sx={{ 
                  fontWeight: 800,
                  color: milestone.color,
                  textShadow: theme.palette.mode === 'light' 
                    ? 'none'
                    : `0 2px 10px ${alpha(milestone.color, 0.3)}`,
                  mb: 0.5
                }}>
                  {milestone.value}%
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                  {format(parseISO(milestone.date), 'dd MMM', { locale: ru })}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  {milestone.label}
                </Typography>
              </Paper>
              {index < milestones.length - 1 && (
                <Box sx={{ 
                  width: 40, 
                  height: 2, 
                  background: `linear-gradient(90deg, ${milestone.color}, ${milestones[index + 1].color})`,
                  display: { xs: 'none', md: 'block' }
                }} />
              )}
            </React.Fragment>
          ))}
        </Stack>
      </Paper>
    );
  };

  // Рендер улучшения
  const renderImprovement = () => (
    <Paper
      elevation={theme.palette.mode === 'light' ? 1 : 0}
      sx={{
        p: 3,
        mb: 4,
        background: theme.palette.mode === 'light'
          ? alpha(theme.palette.background.paper, 0.8)
          : alpha(theme.palette.background.paper, 0.4),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 4
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <Avatar sx={{ 
          width: 36, 
          height: 36, 
          bgcolor: alpha(theme.palette.success.main, 0.2),
          color: theme.palette.success.main
        }}>
          <TrendingUp sx={{ fontSize: 20 }} />
        </Avatar>
        <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
          Улучшение показателей
        </Typography>
      </Stack>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 3, 
            textAlign: 'center',
            bgcolor: alpha(theme.palette.background.paper, 0.5),
            border: `1px solid ${
              metrics.improvement > 0 ? alpha(theme.palette.success.main, 0.3) :
              alpha(theme.palette.error.main, 0.3)
            }`,
            borderRadius: 3
          }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
              Общее улучшение
            </Typography>
            <Typography variant="h2" sx={{ 
              fontWeight: 800,
              color: metrics.improvement > 0 ? theme.palette.success.main : theme.palette.error.main,
              textShadow: theme.palette.mode === 'light' 
                ? 'none'
                : metrics.improvement > 0 ? 
                  '0 2px 10px rgba(76, 175, 80, 0.3)' : 
                  '0 2px 10px rgba(244, 67, 54, 0.3)',
              mb: 1
            }}>
              {metrics.improvement > 0 ? '+' : ''}{formatNumber(metrics.improvement)}%
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              от первых 3 к последним 3 сессиям
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ 
            p: 3,
            bgcolor: alpha(theme.palette.background.paper, 0.5),
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
            height: '100%'
          }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
              Распределение сессий по месяцам
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {Object.entries(metrics.sessionsByMonth).map(([month, count]) => (
                <Tooltip key={month} title={`Средняя оценка: ${formatNumber(metrics.averageScoreByMonth[month] || 0)}%`}>
                  <Chip
                    label={`${month}: ${count} ${count === 1 ? 'сесс' : 'сесс.'}`}
                    sx={{
                      bgcolor: alpha(getScoreColor(metrics.averageScoreByMonth[month] || 0), 0.2),
                      color: getScoreColor(metrics.averageScoreByMonth[month] || 0),
                      border: `1px solid ${alpha(getScoreColor(metrics.averageScoreByMonth[month] || 0), 0.3)}`,
                      '&:hover': { 
                        transform: 'scale(1.05)',
                        transition: 'transform 0.2s'
                      }
                    }}
                  />
                </Tooltip>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );

  // Рендер прогресса по зонам
  const renderZoneProgress = () => {
    if (progressData.length === 0) return null;

    const shouldersAvg = progressData.reduce((sum, d) => sum + d.shoulders, 0) / progressData.length / 60;
    const headAvg = progressData.reduce((sum, d) => sum + d.head, 0) / progressData.length / 60;
    const hipsAvg = progressData.reduce((sum, d) => sum + d.hips, 0) / progressData.length / 60;

    return (
      <Paper
        elevation={theme.palette.mode === 'light' ? 1 : 0}
        sx={{
          p: 3,
          mb: 4,
          background: theme.palette.mode === 'light'
            ? alpha(theme.palette.background.paper, 0.8)
            : alpha(theme.palette.background.paper, 0.4),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 4
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <Avatar sx={{ 
            width: 36, 
            height: 36, 
            bgcolor: alpha(theme.palette.info.main, 0.2),
            color: theme.palette.info.main
          }}>
            <Spa sx={{ fontSize: 20 }} />
          </Avatar>
          <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
            Прогресс по зонам
          </Typography>
        </Stack>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ 
              p: 2.5,
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              borderRadius: 3
            }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ 
                  width: 48, 
                  height: 48, 
                  bgcolor: alpha(theme.palette.info.main, 0.2),
                  color: theme.palette.info.main
                }}>
                  👥
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Плечи
                  </Typography>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 700,
                    color: theme.palette.info.main
                  }}>
                    {formatNumber(shouldersAvg)} мин
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    в среднем за сеанс
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ 
              p: 2.5,
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              borderRadius: 3
            }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ 
                  width: 48, 
                  height: 48, 
                  bgcolor: alpha(theme.palette.warning.main, 0.2),
                  color: theme.palette.warning.main
                }}>
                  🧠
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Голова
                  </Typography>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 700,
                    color: theme.palette.warning.main
                  }}>
                    {formatNumber(headAvg)} мин
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    в среднем за сеанс
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ 
              p: 2.5,
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              borderRadius: 3
            }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ 
                  width: 48, 
                  height: 48, 
                  bgcolor: alpha(theme.palette.error.main, 0.2),
                  color: theme.palette.error.main
                }}>
                  🦵
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Таз
                  </Typography>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 700,
                    color: theme.palette.error.main
                  }}>
                    {formatNumber(hipsAvg)} мин
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    в среднем за сеанс
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        py: 12, 
        minHeight: 500 
      }}>
        <Stack spacing={3} alignItems="center">
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': {
                  boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0.7)}`,
                },
                '70%': {
                  boxShadow: `0 0 0 20px ${alpha(theme.palette.primary.main, 0)}`,
                },
                '100%': {
                  boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0)}`,
                },
              }
            }}
          >
            <CircularProgress size={40} thickness={4} sx={{ color: 'white' }} />
          </Box>
          <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
            Загрузка данных прогресса...
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Анализируем ваши сеансы
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Paper
        elevation={theme.palette.mode === 'light' ? 1 : 0}
        sx={{
          p: 6,
          textAlign: 'center',
          background: theme.palette.mode === 'light'
            ? alpha(theme.palette.background.paper, 0.8)
            : alpha(theme.palette.background.paper, 0.4),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 4
        }}
      >
        <Box
          sx={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)'
          }}
        >
          <Timeline sx={{ fontSize: 48, color: 'white' }} />
        </Box>
        
        <Typography variant="h5" sx={{ color: theme.palette.text.primary, mb: 2, fontWeight: 700 }}>
          Нет данных для отображения прогресса
        </Typography>
        
        <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 4 }}>
          Выполните несколько анализов осанки, чтобы увидеть динамику изменений
        </Typography>
      </Paper>
    );
  }

  return (
    <Box ref={progressRef}>
      {/* Верхняя панель управления с кнопкой PDF */}
      <Paper
        elevation={theme.palette.mode === 'light' ? 1 : 0}
        sx={{
          p: 2,
          mb: 4,
          background: theme.palette.mode === 'light'
            ? alpha(theme.palette.background.paper, 0.8)
            : alpha(theme.palette.background.paper, 0.4),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 4
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
          {/* Выбор временного диапазона */}
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            <Button
              size="small"
              variant={timeRange === 'week' ? 'contained' : 'outlined'}
              onClick={() => setTimeRange('week')}
              sx={{
                background: timeRange === 'week' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                borderColor: theme.palette.divider,
                color: timeRange === 'week' ? 'white' : theme.palette.text.secondary,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  background: timeRange === 'week' ? 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)' : alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              Неделя
            </Button>
            <Button
              size="small"
              variant={timeRange === 'month' ? 'contained' : 'outlined'}
              onClick={() => setTimeRange('month')}
              sx={{
                background: timeRange === 'month' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                borderColor: theme.palette.divider,
                color: timeRange === 'month' ? 'white' : theme.palette.text.secondary,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  background: timeRange === 'month' ? 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)' : alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              Месяц
            </Button>
            <Button
              size="small"
              variant={timeRange === '3months' ? 'contained' : 'outlined'}
              onClick={() => setTimeRange('3months')}
              sx={{
                background: timeRange === '3months' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                borderColor: theme.palette.divider,
                color: timeRange === '3months' ? 'white' : theme.palette.text.secondary,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  background: timeRange === '3months' ? 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)' : alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              3 месяца
            </Button>
            <Button
              size="small"
              variant={timeRange === '6months' ? 'contained' : 'outlined'}
              onClick={() => setTimeRange('6months')}
              sx={{
                background: timeRange === '6months' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                borderColor: theme.palette.divider,
                color: timeRange === '6months' ? 'white' : theme.palette.text.secondary,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  background: timeRange === '6months' ? 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)' : alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              6 месяцев
            </Button>
            <Button
              size="small"
              variant={timeRange === 'year' ? 'contained' : 'outlined'}
              onClick={() => setTimeRange('year')}
              sx={{
                background: timeRange === 'year' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                borderColor: theme.palette.divider,
                color: timeRange === 'year' ? 'white' : theme.palette.text.secondary,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  background: timeRange === 'year' ? 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)' : alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              Год
            </Button>
            <Button
              size="small"
              variant={timeRange === 'all' ? 'contained' : 'outlined'}
              onClick={() => setTimeRange('all')}
              sx={{
                background: timeRange === 'all' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                borderColor: theme.palette.divider,
                color: timeRange === 'all' ? 'white' : theme.palette.text.secondary,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  background: timeRange === 'all' ? 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)' : alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              Все время
            </Button>
          </Stack>

          <Stack direction="row" spacing={1}>
            {/* Кнопка экспорта PDF */}
            <Button
              startIcon={pdfGenerating ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdf />}
              onClick={generateProgressPDF}
              disabled={pdfGenerating || progressData.length === 0}
              variant="contained"
              size="medium"
              sx={{ 
                bgcolor: '#ef4444',
                color: 'white',
                '&:hover': { 
                  bgcolor: '#dc2626'
                },
                '&.Mui-disabled': {
                  bgcolor: alpha('#ef4444', 0.5)
                }
              }}
            >
              {pdfGenerating ? 'Генерация...' : 'Скачать PDF отчёт'}
            </Button>

            {/* Выбор режима просмотра */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, value) => value && setViewMode(value)}
              size="small"
              sx={{
                background: theme.palette.mode === 'light'
                  ? alpha(theme.palette.background.paper, 0.5)
                  : alpha(theme.palette.background.paper, 0.2),
                border: `1px solid ${theme.palette.divider}`,
                '& .MuiToggleButton-root': {
                  color: theme.palette.text.secondary,
                  borderColor: theme.palette.divider,
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                    background: alpha(theme.palette.primary.main, 0.1)
                  },
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.05)
                  }
                }
              }}
            >
              <ToggleButton value="progress">
                <ShowChart />
              </ToggleButton>
              <ToggleButton value="comparison">
                <CompareArrows />
              </ToggleButton>
              <ToggleButton value="radar">
                <RadarIcon />
              </ToggleButton>
              <ToggleButton value="table">
                <TableChart />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>

        {/* Дополнительные контролы для режима сравнения */}
        {viewMode === 'comparison' && (
          <Fade in={viewMode === 'comparison'}>
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel sx={{ color: theme.palette.text.secondary }}>Период сравнения</InputLabel>
                <Select
                  value={comparisonPeriod}
                  onChange={(e) => setComparisonPeriod(e.target.value as any)}
                  label="Период сравнения"
                  sx={{
                    color: theme.palette.text.primary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.divider,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.text.secondary,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                    '& .MuiSvgIcon-root': {
                      color: theme.palette.text.secondary,
                    },
                  }}
                >
                  <MenuItem value="week">Последняя неделя</MenuItem>
                  <MenuItem value="month">Последний месяц</MenuItem>
                  <MenuItem value="all">Все время</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Fade>
        )}
      </Paper>

      {/* Основной контент в зависимости от режима */}
      <AnimatePresence mode="wait">
        {viewMode === 'progress' && (
          <Fade in={viewMode === 'progress'} key="progress">
            <Box>
              {renderMetricsCards()}
              {renderBestWorst()}
              {renderProgressChart()}
              {renderImprovement()}
              {renderMilestones()}
              {renderZoneProgress()}
            </Box>
          </Fade>
        )}

        {viewMode === 'comparison' && (
          <Fade in={viewMode === 'comparison'} key="comparison">
            <Box>
              {renderComparison()}
            </Box>
          </Fade>
        )}

        {viewMode === 'radar' && (
          <Fade in={viewMode === 'radar'} key="radar">
            <Box>
              {renderRadarChart()}
              {renderZoneProgress()}
            </Box>
          </Fade>
        )}

        {viewMode === 'table' && (
          <Fade in={viewMode === 'table'} key="table">
            <Box>
              {renderTable()}
            </Box>
          </Fade>
        )}
      </AnimatePresence>

      {/* Snackbar для уведомлений */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarMessage.includes('Ошибка') ? 'error' : 'success'}
          sx={{ 
            width: '100%',
            borderRadius: 2,
            boxShadow: theme.shadows[3]
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SessionProgress;