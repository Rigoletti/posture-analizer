import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense, memo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Container,
  Stack,
  CircularProgress,
  Alert,
  alpha,
  Button,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Paper,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Switch,
  FormControlLabel,
  InputAdornment,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  Tab,
  Tabs,
  Fade,
  useMediaQuery,
  Skeleton,
  debounce,
  Badge,
  Divider
} from '@mui/material';
import {
  History,
  Refresh,
  FilterList,
  Timer,
  Warning,
  CheckCircle,
  Error,
  CalendarToday,
  Delete,
  Visibility,
  Sort,
  Search,
  Clear,
  ExpandMore,
  ExpandLess,
  TableRows,
  GridView,
  Timeline,
  CompareArrows,
  AccessTime,
  Star,
  Analytics,
  Timeline as TimelineIcon,
  PlayCircleOutline,
  CheckCircleOutline,
  WarningAmber,
  ErrorOutline,
  CheckCircle as CheckCircleIcon,
  Close,
  Dangerous,
  DateRange,
  TrendingUp,
  TrendingDown,
  Whatshot,
  EmojiEvents,
  Speed,
  FitnessCenter
} from '@mui/icons-material';
import { sessionsApi } from '../../api/sessions';
import { useAuthStore } from '../../store/auth';
import { format, parseISO, formatDistanceToNow, intervalToDuration } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MotionPaper = motion(Paper);
const MotionBox = motion(Box);
const MotionCard = motion(Card);

// Ленивая загрузка тяжелого компонента
const SessionProgressLazy = lazy(() => import('../../components/sessions/SessionProgress'));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

interface Statistics {
  totalSessions: number;
  totalDuration: number;
  avgScore: number;
  bestScore: number;
  worstScore: number;
  avgDuration: number;
  totalFrames: number;
  totalGoodFrames: number;
  totalWarningFrames: number;
  totalErrorFrames: number;
  goodPosturePercentage?: number;
  warningPercentage?: number;
  errorPercentage?: number;
}

// Красивая карточка статистики
const StatsCard = memo(({ stats, theme }: any) => {
  if (!stats) {
    return (
      <Paper sx={{ p: 3, mb: 4, borderRadius: 4 }}>
        <Stack spacing={2}>
          <Skeleton variant="circular" width={56} height={56} />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3 }} />
        </Stack>
      </Paper>
    );
  }
  
  const statItems = [
    { label: 'Всего сеансов', value: stats.totalSessions || 0, icon: <History />, color: theme.palette.primary.main, bg: alpha(theme.palette.primary.main, 0.1) },
    { label: 'Средняя оценка', value: `${stats.avgScore || 0}%`, icon: <Star />, color: theme.palette.success.main, bg: alpha(theme.palette.success.main, 0.1) },
    { label: 'Средняя длительность', value: `${Math.round((stats.avgDuration || 0) / 60)} мин`, icon: <Timer />, color: theme.palette.warning.main, bg: alpha(theme.palette.warning.main, 0.1) },
    { label: 'Хорошая осанка', value: `${Math.round(stats.goodPosturePercentage || 0)}%`, icon: <CheckCircle />, color: theme.palette.info.main, bg: alpha(theme.palette.info.main, 0.1) }
  ];
  
  return (
    <MotionPaper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      sx={{
        p: 3,
        mb: 4,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
        backdropFilter: 'blur(10px)',
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Avatar sx={{ width: 56, height: 56, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)' }}>
          <Analytics sx={{ fontSize: 28 }} />
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Общая статистика</Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Анализ всех сеансов осанки</Typography>
        </Box>
      </Stack>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
        {statItems.map((item, idx) => (
          <MotionPaper
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            sx={{
              p: 2.5,
              textAlign: 'center',
              background: item.bg,
              borderRadius: 3,
              border: `1px solid ${alpha(item.color, 0.2)}`,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 25px ${alpha(item.color, 0.2)}` }
            }}
          >
            <Avatar sx={{ width: 48, height: 48, mx: 'auto', mb: 1.5, bgcolor: alpha(item.color, 0.2), color: item.color }}>
              {item.icon}
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 800, color: item.color, lineHeight: 1.2 }}>
              {item.value}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mt: 0.5, display: 'block' }}>
              {item.label}
            </Typography>
          </MotionPaper>
        ))}
      </Box>
    </MotionPaper>
  );
});

StatsCard.displayName = 'StatsCard';

// Красивая карточка сеанса
const SessionCard = memo(({ 
  session, 
  isExpanded, 
  isSelected, 
  onToggleExpand, 
  onSelect, 
  onView, 
  onDelete,
  getScoreColor,
  getScoreGradient,
  getScoreLabel,
  formatSessionDate,
  getTimeSince,
  formatSessionDuration,
  formatPercentage,
  theme 
}: any) => {
  const score = session.postureMetrics?.postureScore || 0;
  const scoreColor = getScoreColor(score);
  const scoreGradient = getScoreGradient(score);
  const scoreLabel = getScoreLabel(score);
  const hasProblems = session.postureMetrics?.postureScore < 100 || (session.problems && session.problems.length > 0);
  const goodPercent = session.postureMetrics?.goodPercentage || 0;
  const warningPercent = session.postureMetrics?.warningPercentage || 0;
  const errorPercent = session.postureMetrics?.errorPercentage || 0;
  
  return (
    <MotionCard
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -4 }}
      sx={{
        height: '100%',
        position: 'relative',
        background: alpha(theme.palette.background.paper, 0.9),
        backdropFilter: 'blur(10px)',
        borderRadius: 4,
        border: isSelected 
          ? `2px solid ${theme.palette.primary.main}`
          : `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: theme.palette.primary.main,
          boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.15)}`
        }
      }}
      onClick={() => onSelect(session.sessionId)}
    >
      <Box sx={{ height: 4, background: scoreGradient }} />
      
      {isSelected && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 14, color: 'white' }} />
        </Box>
      )}
      
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                Сеанс анализа
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <CalendarToday sx={{ fontSize: 12 }} />
                {formatSessionDate(session.startTime)}
              </Typography>
            </Box>
            
            <Tooltip title={scoreLabel} placement="top">
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  background: scoreGradient,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 15px ${alpha(scoreColor, 0.4)}`,
                }}
              >
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, lineHeight: 1 }}>
                  {score}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha('#fff', 0.8), fontSize: '0.6rem' }}>
                  баллов
                </Typography>
              </Box>
            </Tooltip>
          </Stack>
          
          <Stack direction="row" spacing={2}>
            <Tooltip title="Когда был">
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <AccessTime sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  {getTimeSince(session.startTime)}
                </Typography>
              </Stack>
            </Tooltip>
            
            <Tooltip title="Длительность">
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Timer sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  {formatSessionDuration(session.duration || 0)}
                </Typography>
              </Stack>
            </Tooltip>
          </Stack>
          
          <Divider sx={{ my: 0.5 }} />
          
          <Box>
            <Stack spacing={1.5}>
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>🟢</span> Хорошая осанка
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                    {formatPercentage(goodPercent)}
                  </Typography>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={goodPercent}
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
              </Box>
              
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>🟡</span> Предупреждения
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                    {formatPercentage(warningPercent)}
                  </Typography>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={warningPercent}
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
              </Box>
              
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>🔴</span> Ошибки
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
                    {formatPercentage(errorPercent)}
                  </Typography>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={errorPercent}
                  sx={{ 
                    height: 6,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      background: `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.error.light})`,
                      borderRadius: 3
                    }
                  }}
                />
              </Box>
            </Stack>
          </Box>
          
          <Divider sx={{ my: 0.5 }} />
          
          <Box>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 1, fontWeight: 500 }}>
              ⚠️ Проблемные зоны
            </Typography>
            
            {hasProblems ? (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                {session.problems && session.problems.length > 0 ? (
                  <>
                    {session.problems.slice(0, 2).map((problem: string, idx: number) => (
                      <Chip
                        key={idx}
                        label={problem}
                        size="small"
                        sx={{
                          background: alpha(theme.palette.error.main, 0.1),
                          color: theme.palette.error.main,
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          height: 24
                        }}
                      />
                    ))}
                    {session.problems.length > 2 && (
                      <Chip
                        label={`+${session.problems.length - 2}`}
                        size="small"
                        sx={{
                          background: alpha(theme.palette.text.primary, 0.1),
                          color: theme.palette.text.secondary,
                          fontSize: '0.7rem',
                          height: 24
                        }}
                      />
                    )}
                  </>
                ) : (
                  <Chip
                    icon={<WarningAmber sx={{ fontSize: '0.8rem' }} />}
                    label="Есть ошибки в анализе"
                    size="small"
                    sx={{
                      background: alpha(theme.palette.warning.main, 0.1),
                      color: theme.palette.warning.main,
                      fontSize: '0.7rem',
                      height: 24
                    }}
                  />
                )}
              </Stack>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0.5, borderRadius: 2, background: alpha(theme.palette.success.main, 0.05) }}>
                <CheckCircleIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
                <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 500 }}>
                  Нет проблемных зон
                </Typography>
              </Box>
            )}
          </Box>
          
          {isExpanded && (
            <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>📊 Кадров обработано</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{session.postureMetrics?.totalFrames?.toLocaleString() || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>❌ Ошибок</Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.error.main, fontWeight: 600 }}>{session.postureMetrics?.errorFrames?.toLocaleString() || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>🆔 ID сеанса</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }}>{session.sessionId?.slice(0, 12)}...</Typography>
                </Box>
              </Stack>
            </Box>
          )}
          
          <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
            <Button
              size="small"
              startIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(session.sessionId);
              }}
              sx={{
                color: theme.palette.text.secondary,
                borderRadius: 2,
                '&:hover': { color: theme.palette.primary.main, background: alpha(theme.palette.primary.main, 0.1) }
              }}
            >
              {isExpanded ? 'Скрыть детали' : 'Показать детали'}
            </Button>
            
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Просмотр">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(session.sessionId);
                  }}
                  sx={{
                    color: theme.palette.primary.main,
                    background: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': { background: alpha(theme.palette.primary.main, 0.2) }
                  }}
                >
                  <Visibility fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Удалить">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(session.sessionId, session.startTime, score, session.duration || 0);
                  }}
                  sx={{
                    color: theme.palette.error.main,
                    background: alpha(theme.palette.error.main, 0.1),
                    '&:hover': { background: alpha(theme.palette.error.main, 0.2) }
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </MotionCard>
  );
});

SessionCard.displayName = 'SessionCard';

const SessionsHistory: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [allSessionsForProgress, setAllSessionsForProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [totalSessions, setTotalSessions] = useState(0);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    sessionId: null as string | null,
    sessionDate: '',
    sessionScore: 0,
    sessionDuration: 0,
    deleting: false
  });
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    minScore: '',
    maxScore: '',
    sortBy: 'startTime',
    sortOrder: 'desc',
    showOnlyWithProblems: false
  });

  // Форматирование
  const formatSessionDuration = useCallback((seconds: number) => {
    if (!seconds) return '0 сек';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} мин`;
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours}ч ${minutes}м`;
  }, []);

  const formatSessionDate = useCallback((dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd.MM.yyyy HH:mm', { locale: ru });
    } catch {
      return dateString;
    }
  }, []);

  const getTimeSince = useCallback((dateString: string) => {
    try {
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: ru });
    } catch {
      return '';
    }
  }, []);

  const formatPercentage = useCallback((value: number): string => {
    return `${Math.round(value)}%`;
  }, []);

  const getScoreColor = useCallback((score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  }, [theme]);

  const getScoreGradient = useCallback((score: number) => {
    if (score >= 80) return 'linear-gradient(135deg, #2e7d32, #4caf50)';
    if (score >= 60) return 'linear-gradient(135deg, #ff9800, #ffc107)';
    return 'linear-gradient(135deg, #d32f2f, #f44336)';
  }, []);

  const getScoreLabel = useCallback((score: number) => {
    if (score >= 80) return 'Отлично';
    if (score >= 60) return 'Хорошо';
    if (score >= 40) return 'Средне';
    return 'Критично';
  }, []);

  // Загрузка всех сессий для прогресса
  const loadAllSessionsForProgress = useCallback(async () => {
    try {
      let allSessions: any[] = [];
      let currentPage = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await sessionsApi.getSessionsHistory(currentPage, 100, { sortBy: 'startTime', sortOrder: 'desc' });
        if (response.success && response.data.sessions) {
          allSessions = [...allSessions, ...response.data.sessions];
          hasMore = response.data.sessions.length === 100;
          currentPage++;
        } else {
          hasMore = false;
        }
      }
      setAllSessionsForProgress(allSessions);
    } catch (err) {
      console.error('Failed to load all sessions:', err);
    }
  }, []);

  // Загрузка сеансов с фильтрацией
  const loadSessions = useCallback(async (pageNum = 0, limit = rowsPerPage, filterParams = filters) => {
    try {
      setLoading(true);
      setError(null);
      
      // Формируем параметры для API
      const apiParams: any = {
        page: pageNum + 1,
        limit: limit,
        sortBy: filterParams.sortBy,
        sortOrder: filterParams.sortOrder
      };
      
      // Добавляем фильтры в API запрос
      if (filterParams.dateFrom) apiParams.dateFrom = filterParams.dateFrom;
      if (filterParams.dateTo) apiParams.dateTo = filterParams.dateTo;
      if (filterParams.minScore) apiParams.minScore = parseInt(filterParams.minScore);
      if (filterParams.maxScore) apiParams.maxScore = parseInt(filterParams.maxScore);
      
      const response = await sessionsApi.getSessionsHistory(
        apiParams.page,
        apiParams.limit,
        { 
          sortBy: apiParams.sortBy, 
          sortOrder: apiParams.sortOrder,
          dateFrom: apiParams.dateFrom,
          dateTo: apiParams.dateTo,
          minScore: apiParams.minScore,
          maxScore: apiParams.maxScore
        }
      );
      
      if (response.success) {
        let filteredSessions = response.data.sessions || [];
        
        // Дополнительная фильтрация по проблемам (если API не поддерживает)
        if (filterParams.showOnlyWithProblems) {
          filteredSessions = filteredSessions.filter((session: any) => 
            (session.problems && session.problems.length > 0) || 
            (session.postureMetrics?.postureScore < 100)
          );
        }
        
        // Обогащаем данные
        const enrichedSessions = filteredSessions.map((session: any) => {
          const metrics = session.postureMetrics || {};
          const totalFrames = metrics.totalFrames || 1;
          
          const goodPercentage = metrics.goodPercentage || 
            Math.round((metrics.goodPostureFrames / totalFrames) * 100);
          const warningPercentage = metrics.warningPercentage || 
            Math.round((metrics.warningFrames / totalFrames) * 100);
          const errorPercentage = metrics.errorPercentage || 
            Math.round((metrics.errorFrames / totalFrames) * 100);
          
          return {
            ...session,
            postureMetrics: {
              ...metrics,
              goodPercentage,
              warningPercentage,
              errorPercentage
            }
          };
        });
        
        setSessions(enrichedSessions);
        setTotalSessions(response.data.pagination?.total || enrichedSessions.length);
        
        // Обновляем статистику из API
        const statistics = response.data.statistics || {};
        const totalFrames = statistics.totalFrames || 1;
        setStats({
          totalSessions: statistics.totalSessions || 0,
          totalDuration: statistics.totalDuration || 0,
          avgScore: Math.round(statistics.avgScore || 0),
          bestScore: statistics.bestScore || 0,
          worstScore: statistics.worstScore || 100,
          avgDuration: Math.round(statistics.avgDuration || 0),
          totalFrames: totalFrames,
          totalGoodFrames: statistics.totalGoodFrames || 0,
          totalWarningFrames: statistics.totalWarningFrames || 0,
          totalErrorFrames: statistics.totalErrorFrames || 0,
          goodPosturePercentage: Math.round((statistics.totalGoodFrames / totalFrames) * 100),
          warningPercentage: Math.round((statistics.totalWarningFrames / totalFrames) * 100),
          errorPercentage: Math.round((statistics.totalErrorFrames / totalFrames) * 100)
        });
      } else {
        setError(response.error || 'Ошибка при загрузке данных');
      }
    } catch (err: any) {
      console.error('Failed to load sessions:', err);
      setError(err.message || 'Ошибка при загрузке сеансов');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [rowsPerPage, filters]);

  // Функция для применения фильтров
  const applyFilters = useCallback(() => {
    setPage(0);
    loadSessions(0, rowsPerPage, filters);
  }, [loadSessions, rowsPerPage, filters]);

  // Сброс фильтров
  const resetFilters = useCallback(() => {
    const defaultFilters = {
      dateFrom: '',
      dateTo: '',
      minScore: '',
      maxScore: '',
      sortBy: 'startTime',
      sortOrder: 'desc',
      showOnlyWithProblems: false
    };
    setFilters(defaultFilters);
    setPage(0);
    loadSessions(0, rowsPerPage, defaultFilters);
  }, [rowsPerPage, loadSessions]);

  // Обработчик изменения фильтров
  const handleFilterChange = useCallback((field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  // Валидация оценки (только положительные числа, не больше 100)
  const handleScoreChange = useCallback((field: 'minScore' | 'maxScore', value: string) => {
    // Убираем минус и ограничиваем значение
    let numValue = value.replace(/[^-0-9]/g, '');
    if (numValue === '') {
      handleFilterChange(field, '');
      return;
    }
    
    let intValue = parseInt(numValue, 10);
    if (isNaN(intValue)) {
      handleFilterChange(field, '');
      return;
    }
    
    // Ограничиваем от 0 до 100
    intValue = Math.min(100, Math.max(0, intValue));
    handleFilterChange(field, intValue.toString());
  }, [handleFilterChange]);

  useEffect(() => {
    loadAllSessionsForProgress();
  }, [loadAllSessionsForProgress]);

  useEffect(() => {
    loadSessions();
  }, []);

  const handleViewSession = useCallback((sessionId: string) => {
    navigate(`/sessions/${sessionId}`);
  }, [navigate]);

  const openDeleteDialog = useCallback((sessionId: string, sessionDate: string, sessionScore: number, sessionDuration: number) => {
    setDeleteDialog({
      open: true,
      sessionId,
      sessionDate: formatSessionDate(sessionDate),
      sessionScore,
      sessionDuration,
      deleting: false
    });
  }, [formatSessionDate]);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog(prev => ({ ...prev, open: false, sessionId: null }));
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteDialog.sessionId) return;
    
    try {
      setDeleteDialog(prev => ({ ...prev, deleting: true }));
      await sessionsApi.deleteSession(deleteDialog.sessionId);
      closeDeleteDialog();
      loadSessions(page, rowsPerPage, filters);
      loadAllSessionsForProgress();
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении сеанса');
    } finally {
      setDeleteDialog(prev => ({ ...prev, deleting: false }));
    }
  }, [deleteDialog.sessionId, closeDeleteDialog, loadSessions, page, rowsPerPage, filters, loadAllSessionsForProgress]);

  const toggleSessionExpand = useCallback((sessionId: string) => {
    setExpandedSessions(prev => ({ ...prev, [sessionId]: !prev[sessionId] }));
  }, []);

  const toggleSessionSelection = useCallback((sessionId: string) => {
    setSelectedSessions(prev => {
      if (prev.includes(sessionId)) return prev.filter(id => id !== sessionId);
      if (prev.length < 2) return [...prev, sessionId];
      return prev;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSessions([]);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadSessions(page, rowsPerPage, filters);
    loadAllSessionsForProgress();
  }, [loadSessions, page, rowsPerPage, filters, loadAllSessionsForProgress]);

  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
    loadSessions(newPage, rowsPerPage, filters);
  }, [loadSessions, rowsPerPage, filters]);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    loadSessions(0, newRowsPerPage, filters);
  }, [loadSessions, filters]);

  const handleViewModeChange = useCallback((event: React.MouseEvent<HTMLElement>, newViewMode: 'cards' | 'table') => {
    if (newViewMode) setViewMode(newViewMode);
  }, []);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);

  // Мемоизация карточек
  const sessionCards = useMemo(() => {
    return sessions.map((session) => (
      <SessionCard
        key={session.sessionId}
        session={session}
        isExpanded={expandedSessions[session.sessionId] || false}
        isSelected={selectedSessions.includes(session.sessionId)}
        onToggleExpand={toggleSessionExpand}
        onSelect={toggleSessionSelection}
        onView={handleViewSession}
        onDelete={openDeleteDialog}
        getScoreColor={getScoreColor}
        getScoreGradient={getScoreGradient}
        getScoreLabel={getScoreLabel}
        formatSessionDate={formatSessionDate}
        getTimeSince={getTimeSince}
        formatSessionDuration={formatSessionDuration}
        formatPercentage={formatPercentage}
        theme={theme}
      />
    ));
  }, [sessions, expandedSessions, selectedSessions, toggleSessionExpand, toggleSessionSelection, handleViewSession, openDeleteDialog, getScoreColor, getScoreGradient, getScoreLabel, formatSessionDate, getTimeSince, formatSessionDuration, formatPercentage, theme]);

  // Таблица
  const tableRows = useMemo(() => {
    return sessions.map((session) => {
      const score = session.postureMetrics?.postureScore || 0;
      const hasProblems = session.postureMetrics?.postureScore < 100 || (session.problems && session.problems.length > 0);
      
      return (
        <TableRow key={session.sessionId} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
          <TableCell>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatSessionDate(session.startTime)}</Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>{getTimeSince(session.startTime)}</Typography>
          </TableCell>
          <TableCell>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, background: getScoreGradient(score), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 700 }}>{score}</Typography>
              </Box>
              <Typography variant="body2" sx={{ color: getScoreColor(score) }}>{getScoreLabel(score)}</Typography>
            </Stack>
          </TableCell>
          <TableCell>{formatSessionDuration(session.duration || 0)}</TableCell>
          <TableCell>
            <LinearProgress variant="determinate" value={session.postureMetrics?.goodPercentage || 0} sx={{ height: 4, borderRadius: 2, width: 80 }} />
            <Typography variant="caption">{formatPercentage(session.postureMetrics?.goodPercentage || 0)}</Typography>
          </TableCell>
          <TableCell>
            {hasProblems ? (
              <Chip label={session.problems?.length > 0 ? `${session.problems.length} проблем` : "Есть ошибки"} size="small" color="warning" variant="outlined" />
            ) : (
              <Chip label="Нет проблем" size="small" color="success" variant="outlined" />
            )}
          </TableCell>
          <TableCell align="center">
            <Stack direction="row" spacing={0.5} justifyContent="center">
              <IconButton size="small" onClick={() => handleViewSession(session.sessionId)}><Visibility fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => openDeleteDialog(session.sessionId, session.startTime, score, session.duration || 0)} sx={{ color: theme.palette.error.main }}><Delete fontSize="small" /></IconButton>
            </Stack>
          </TableCell>
        </TableRow>
      );
    });
  }, [sessions, formatSessionDate, getTimeSince, getScoreGradient, getScoreColor, getScoreLabel, formatSessionDuration, formatPercentage, handleViewSession, openDeleteDialog, theme]);

  if (loading && sessions.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)` }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
      pt: { xs: 2, sm: 4 },
      pb: { xs: 4, sm: 8 }
    }}>
      <Container maxWidth="xl">
        {/* Header */}
        <MotionBox initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} sx={{ mb: 4 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                История анализов
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
                Просматривайте все сеансы, отслеживайте прогресс и анализируйте результаты
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={1}>
              {selectedSessions.length === 2 && (
                <Button startIcon={<CompareArrows />} onClick={() => setActiveTab(1)} variant="contained" sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  Сравнить
                </Button>
              )}
              {selectedSessions.length > 0 && (
                <Button startIcon={<Clear />} onClick={clearSelection} variant="outlined" sx={{ borderRadius: 2 }}>
                  Отмена ({selectedSessions.length})
                </Button>
              )}
              <IconButton onClick={handleRefresh} disabled={isRefreshing} sx={{ bgcolor: alpha(theme.palette.background.paper, 0.8), backdropFilter: 'blur(10px)' }}>
                <Refresh sx={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
              </IconButton>
            </Stack>
          </Stack>
          
          {error && (
            <Alert severity="error" sx={{ mt: 3, borderRadius: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </MotionBox>

        {/* Stats Card */}
        <StatsCard stats={stats} theme={theme} />

        {/* Filters */}
        <MotionPaper
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          sx={{
            p: 3,
            mb: 3,
            background: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(10px)',
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <FilterList sx={{ color: theme.palette.primary.main }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Фильтры</Typography>
              <Chip 
                label={`${Object.values(filters).filter(v => v && v !== false && v !== '').length} активных`} 
                size="small" 
                sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }} 
              />
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button startIcon={<Clear />} onClick={resetFilters} variant="outlined" size="small" sx={{ borderRadius: 2 }}>
                Сбросить
              </Button>
              <Button 
                startIcon={<Search />} 
                onClick={applyFilters} 
                variant="contained" 
                size="small" 
                sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                Применить
              </Button>
            </Stack>
          </Stack>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            <TextField 
              label="Дата от" 
              type="date" 
              value={filters.dateFrom} 
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)} 
              size="small" 
              InputLabelProps={{ shrink: true }} 
              fullWidth
            />
            <TextField 
              label="Дата до" 
              type="date" 
              value={filters.dateTo} 
              onChange={(e) => handleFilterChange('dateTo', e.target.value)} 
              size="small" 
              InputLabelProps={{ shrink: true }} 
              fullWidth
            />
            <TextField 
              label="Мин. оценка" 
              type="number" 
              value={filters.minScore} 
              onChange={(e) => handleScoreChange('minScore', e.target.value)} 
              size="small" 
              placeholder="0-100"
              InputProps={{ 
                inputProps: { min: 0, max: 100 },
                startAdornment: <InputAdornment position="start">%</InputAdornment>
              }}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e') {
                  e.preventDefault();
                }
              }}
              fullWidth
            />
            <TextField 
              label="Макс. оценка" 
              type="number" 
              value={filters.maxScore} 
              onChange={(e) => handleScoreChange('maxScore', e.target.value)} 
              size="small" 
              placeholder="0-100"
              InputProps={{ 
                inputProps: { min: 0, max: 100 },
                startAdornment: <InputAdornment position="start">%</InputAdornment>
              }}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e') {
                  e.preventDefault();
                }
              }}
              fullWidth
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <FormControlLabel 
              control={
                <Switch 
                  checked={filters.showOnlyWithProblems} 
                  onChange={(e) => handleFilterChange('showOnlyWithProblems', e.target.checked)} 
                />
              } 
              label="Только с проблемами" 
            />
          </Box>
        </MotionPaper>

        {/* Tabs */}
        <Paper sx={{ mb: 3, background: alpha(theme.palette.background.paper, 0.6), backdropFilter: 'blur(10px)', borderRadius: 4, overflow: 'hidden' }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth" sx={{ '& .MuiTabs-indicator': { background: 'linear-gradient(90deg, #667eea, #764ba2)', height: 3 } }}>
            <Tab icon={<History />} iconPosition="start" label="История сеансов" />
            <Tab icon={<TimelineIcon />} iconPosition="start" label="Прогресс и аналитика" />
          </Tabs>
        </Paper>

        {/* History Tab */}
        <TabPanel value={activeTab} index={0}>
          {sessions.length === 0 ? (
            <MotionPaper initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} sx={{ textAlign: 'center', py: 8, px: 4, borderRadius: 4 }}>
              <Box sx={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <History sx={{ fontSize: 50, color: 'white' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Нет данных о сеансах</Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 3 }}>Выполните анализ осанки, чтобы увидеть историю здесь</Typography>
              <Button variant="contained" onClick={() => navigate('/')} startIcon={<PlayCircleOutline />} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2 }}>
                Начать анализ осанки
              </Button>
            </MotionPaper>
          ) : (
            <>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Найдено: <strong>{totalSessions}</strong> сеансов
                </Typography>
                <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewModeChange} size="small">
                  <ToggleButton value="cards" sx={{ px: 2, py: 1 }}><GridView sx={{ mr: 0.5 }} />{!isTablet && 'Карточки'}</ToggleButton>
                  <ToggleButton value="table" sx={{ px: 2, py: 1 }}><TableRows sx={{ mr: 0.5 }} />{!isTablet && 'Таблица'}</ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              {viewMode === 'cards' ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
                  {sessionCards}
                </Box>
              ) : (
                <Paper sx={{ borderRadius: 4, overflow: 'auto' }}>
                  <TableContainer sx={{ maxHeight: 500 }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                          <TableCell sx={{ fontWeight: 700 }}>Дата и время</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Оценка</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Длительность</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Хорошая осанка</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Проблемы</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Действия</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>{tableRows}</TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {sessions.length > 0 && (
                <TablePagination
                  component="div"
                  count={totalSessions}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[8, 12, 24, 48]}
                  labelRowsPerPage="Строк на странице:"
                  sx={{ mt: 3, '& .MuiToolbar-root': { minHeight: 40 } }}
                />
              )}
            </>
          )}
        </TabPanel>

        {/* Progress Tab */}
        <TabPanel value={activeTab} index={1}>
          <Suspense fallback={<CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />}>
            <SessionProgressLazy sessions={allSessionsForProgress.length > 0 ? allSessionsForProgress : sessions} loading={loading} />
          </Suspense>
        </TabPanel>

        {/* Delete Dialog */}
        <Dialog open={deleteDialog.open} onClose={closeDeleteDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
          <Box sx={{ height: 4, background: 'linear-gradient(90deg, #f44336, #ff9800)' }} />
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main }}><WarningAmber /></Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Подтверждение удаления</Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Это действие нельзя будет отменить</Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }} icon={<Dangerous />}>
              Вы собираетесь удалить сеанс анализа. Все данные будут безвозвратно потеряны.
            </Alert>
            <Paper sx={{ p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>Удаляемый сеанс:</Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
                <Chip icon={<CalendarToday />} label={deleteDialog.sessionDate} variant="outlined" />
                <Chip icon={<Star />} label={`Оценка: ${deleteDialog.sessionScore}%`} color="warning" variant="outlined" />
                <Chip icon={<Timer />} label={`Длительность: ${formatSessionDuration(deleteDialog.sessionDuration)}`} variant="outlined" />
              </Stack>
            </Paper>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0, gap: 2 }}>
            <Button fullWidth variant="outlined" onClick={closeDeleteDialog} disabled={deleteDialog.deleting} sx={{ borderRadius: 2, py: 1 }}>Отмена</Button>
            <Button fullWidth variant="contained" onClick={handleDeleteConfirm} disabled={deleteDialog.deleting} sx={{ borderRadius: 2, py: 1, background: 'linear-gradient(135deg, #f44336, #d32f2f)' }}>
              {deleteDialog.deleting ? <CircularProgress size={24} /> : 'Удалить навсегда'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Box>
  );
};

export default SessionsHistory;