import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Grid,
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
  Divider,
  Switch,
  FormControlLabel,
  InputAdornment,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  Tab,
  Tabs,
  Collapse,
  Fade,
  Zoom,
  Badge,
  useMediaQuery
} from '@mui/material';
import {
  History,
  Refresh,
  FilterList,
  TrendingUp,
  Timer,
  Score,
  Warning,
  CheckCircle,
  Error,
  CalendarToday,
  Delete,
  Visibility,
  BarChart,
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
  FitnessCenter,
  Speed,
  Star,
  StarBorder,
  Analytics,
  Timeline as TimelineIcon,
  Compare as CompareIcon,
  PlayCircleOutline,
  PauseCircleOutline,
  CheckCircleOutline,
  WarningAmber,
  ErrorOutline,
  KeyboardArrowDown,
  KeyboardArrowUp,
  MoreVert,
  CheckCircle as CheckCircleIcon,
  Close,
  Dangerous
} from '@mui/icons-material';
import { sessionsApi } from '../../api/sessions';
import { useAuthStore } from '../../store/auth';
import { format, parseISO, formatDistanceToNow, intervalToDuration } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SessionProgress from '../../components/sessions/SessionProgress';

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
  totalShoulderErrors: number;
  totalHeadErrors: number;
  totalHipErrors: number;
  goodPosturePercentage?: number;
  warningPercentage?: number;
  errorPercentage?: number;
}

interface ExpandedState {
  [sessionId: string]: boolean;
}

// Компонент анимации для диалога
const Transition = React.forwardRef(function Transition(props: any, ref) {
  return <Fade ref={ref} {...props} />;
});

const SessionsHistory: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuthStore();
  
  const [sessions, setSessions] = useState<any[]>([]);
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
  const [expandedSessions, setExpandedSessions] = useState<ExpandedState>({});
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Фильтры
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    minScore: '',
    maxScore: '',
    sortBy: 'startTime',
    sortOrder: 'desc',
    search: '',
    showOnlyWithProblems: false
  });

  // Загрузка сеансов
  const loadSessions = useCallback(async (pageNum = 0, limit = rowsPerPage, filterParams = filters) => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page: pageNum + 1,
        limit,
        sortBy: filterParams.sortBy,
        sortOrder: filterParams.sortOrder
      };
      
      if (filterParams.dateFrom) params.dateFrom = filterParams.dateFrom;
      if (filterParams.dateTo) params.dateTo = filterParams.dateTo;
      if (filterParams.minScore) params.minScore = filterParams.minScore;
      if (filterParams.maxScore) params.maxScore = filterParams.maxScore;
      
      const response = await sessionsApi.getSessionsHistory(
        params.page,
        params.limit,
        params
      );
      
      if (response.success) {
        let filteredSessions = response.data.sessions || [];
        
        // Фильтр по проблемам
        if (filterParams.showOnlyWithProblems) {
          filteredSessions = filteredSessions.filter((session: any) => 
            session.problems && session.problems.length > 0
          );
        }
        
        // Обогащаем данные процентами
        filteredSessions = filteredSessions.map((session: any) => {
          const metrics = session.postureMetrics || {};
          const totalFrames = metrics.totalFrames || 1;
          const duration = session.duration || 1;
          
          const goodPercentage = metrics.goodPercentage || 
            Math.round((metrics.goodPostureFrames / totalFrames) * 100);
          const warningPercentage = metrics.warningPercentage || 
            Math.round((metrics.warningFrames / totalFrames) * 100);
          const errorPercentage = metrics.errorPercentage || 
            Math.round((metrics.errorFrames / totalFrames) * 100);
          
          const errorsByZone = metrics.errorsByZone || {};
          if (errorsByZone.shoulders && errorsByZone.shoulders.duration) {
            errorsByZone.shoulders.percentage = 
              Math.round((errorsByZone.shoulders.duration / duration) * 1000) / 10;
          }
          if (errorsByZone.head && errorsByZone.head.duration) {
            errorsByZone.head.percentage = 
              Math.round((errorsByZone.head.duration / duration) * 1000) / 10;
          }
          if (errorsByZone.hips && errorsByZone.hips.duration) {
            errorsByZone.hips.percentage = 
              Math.round((errorsByZone.hips.duration / duration) * 1000) / 10;
          }
          
          return {
            ...session,
            postureMetrics: {
              ...metrics,
              goodPercentage,
              warningPercentage,
              errorPercentage,
              errorsByZone
            }
          };
        });
        
        setSessions(filteredSessions);
        setTotalSessions(response.data.pagination?.total || filteredSessions.length);
        
        const statistics = response.data.statistics || {};
        const totalFrames = statistics.totalFrames || 1;
        const calculatedStats: Statistics = {
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
          totalShoulderErrors: statistics.totalShoulderErrors || 0,
          totalHeadErrors: statistics.totalHeadErrors || 0,
          totalHipErrors: statistics.totalHipErrors || 0,
          goodPosturePercentage: Math.round((statistics.totalGoodFrames / totalFrames) * 100),
          warningPercentage: Math.round((statistics.totalWarningFrames / totalFrames) * 100),
          errorPercentage: Math.round((statistics.totalErrorFrames / totalFrames) * 100)
        };
        
        setStats(calculatedStats);
        setExpandedSessions({});
      } else {
        setError(response.error || 'Ошибка при загрузке данных');
      }
      
    } catch (err: any) {
      console.error('Failed to load sessions:', err);
      setError(err.response?.data?.error || err.message || 'Ошибка при загрузке сеансов');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [rowsPerPage, filters]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    loadSessions(newPage, rowsPerPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    loadSessions(0, newRowsPerPage);
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    setPage(0);
    loadSessions(0, rowsPerPage, filters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      dateFrom: '',
      dateTo: '',
      minScore: '',
      maxScore: '',
      sortBy: 'startTime',
      sortOrder: 'desc',
      search: '',
      showOnlyWithProblems: false
    };
    setFilters(defaultFilters);
    setPage(0);
    loadSessions(0, rowsPerPage, defaultFilters);
  };

  const handleViewSession = (sessionId: string) => {
    navigate(`/sessions/${sessionId}`);
  };

  const openDeleteDialog = (sessionId: string, sessionDate: string, sessionScore: number, sessionDuration: number) => {
    setDeleteDialog({
      open: true,
      sessionId,
      sessionDate: formatSessionDate(sessionDate),
      sessionScore,
      sessionDuration,
      deleting: false
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog(prev => ({ ...prev, open: false, sessionId: null }));
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.sessionId) return;
    
    try {
      setDeleteDialog(prev => ({ ...prev, deleting: true }));
      
      await sessionsApi.deleteSession(deleteDialog.sessionId);
      closeDeleteDialog();
      
      setExpandedSessions(prev => {
        const newState = { ...prev };
        delete newState[deleteDialog.sessionId!];
        return newState;
      });
      
      loadSessions(page, rowsPerPage);
    } catch (err: any) {
      console.error('Failed to delete session:', err);
      setError(err.message || 'Ошибка при удалении сеанса');
    } finally {
      setDeleteDialog(prev => ({ ...prev, deleting: false }));
    }
  };

  const toggleSessionExpand = useCallback((sessionId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  }, []);

  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewMode: 'cards' | 'table',
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
      setExpandedSessions({});
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setExpandedSessions({});
  };

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions(prev => {
      if (prev.includes(sessionId)) {
        return prev.filter(id => id !== sessionId);
      } else {
        if (prev.length < 2) {
          return [...prev, sessionId];
        }
        return prev;
      }
    });
  };

  const clearSelection = () => {
    setSelectedSessions([]);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadSessions(page, rowsPerPage);
  };

  const getScoreColor = useCallback((score: number) => {
    if (score >= 90) return theme.palette.success.main;
    if (score >= 75) return theme.palette.success.light;
    if (score >= 60) return theme.palette.warning.main;
    if (score >= 40) return theme.palette.warning.dark;
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

  const getScoreLabel = useCallback((score: number) => {
    if (score >= 90) return 'Отлично';
    if (score >= 75) return 'Хорошо';
    if (score >= 60) return 'Удовлетворительно';
    if (score >= 40) return 'Требует внимания';
    return 'Критично';
  }, []);

  const getScoreIcon = useCallback((score: number) => {
    if (score >= 75) return <CheckCircleOutline sx={{ fontSize: 20 }} />;
    if (score >= 40) return <WarningAmber sx={{ fontSize: 20 }} />;
    return <ErrorOutline sx={{ fontSize: 20 }} />;
  }, []);

  const formatSessionDuration = useCallback((seconds: number) => {
    if (!seconds) return '0 сек';
    
    const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
    
    const parts = [];
    if (duration.hours && duration.hours > 0) parts.push(`${duration.hours}ч`);
    if (duration.minutes && duration.minutes > 0) parts.push(`${duration.minutes}м`);
    if (duration.seconds && duration.seconds > 0) parts.push(`${duration.seconds}с`);
    
    return parts.length > 0 ? parts.join(' ') : `${seconds}с`;
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
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: ru 
      });
    } catch {
      return '';
    }
  }, []);

  const getDayOfWeek = useCallback((dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'EEEE', { locale: ru });
    } catch {
      return '';
    }
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

  const statsCard = useMemo(() => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper
        elevation={theme.palette.mode === 'light' ? 2 : 0}
        sx={{
          p: 3,
          mb: 4,
          background: theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #f5f7fa 0%, #e9ecf3 100%)'
            : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.palette.mode === 'light'
            ? '0 8px 32px rgba(0, 0, 0, 0.08)'
            : '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            <Analytics sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ 
              color: theme.palette.text.primary,
              fontWeight: 700,
              letterSpacing: '0.5px'
            }}>
              Общая статистика
            </Typography>
            <Typography variant="body2" sx={{ 
              color: theme.palette.text.secondary,
              fontWeight: 500
            }}>
              Анализ всех сеансов осанки
            </Typography>
          </Box>
        </Stack>
        
        {stats ? (
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: 2,
                  background: theme.palette.mode === 'light'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.paper, 0.2),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    background: theme.palette.mode === 'light'
                      ? alpha(theme.palette.background.paper, 0.9)
                      : alpha(theme.palette.background.paper, 0.3),
                    borderColor: alpha(theme.palette.primary.main, 0.5)
                  }
                }}
              >
                <Stack spacing={1}>
                  <Typography variant="h4" sx={{ 
                    color: theme.palette.primary.main,
                    fontWeight: 800
                  }}>
                    {stats.totalSessions || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Всего сеансов
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: 2,
                  background: theme.palette.mode === 'light'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.paper, 0.2),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    background: theme.palette.mode === 'light'
                      ? alpha(theme.palette.background.paper, 0.9)
                      : alpha(theme.palette.background.paper, 0.3),
                    borderColor: alpha(theme.palette.success.main, 0.5)
                  }
                }}
              >
                <Stack spacing={1}>
                  <Typography variant="h4" sx={{ 
                    color: theme.palette.success.main,
                    fontWeight: 800
                  }}>
                    {stats.avgScore || 0}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Средняя оценка
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: 2,
                  background: theme.palette.mode === 'light'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.paper, 0.2),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    background: theme.palette.mode === 'light'
                      ? alpha(theme.palette.background.paper, 0.9)
                      : alpha(theme.palette.background.paper, 0.3),
                    borderColor: alpha(theme.palette.warning.main, 0.5)
                  }
                }}
              >
                <Stack spacing={1}>
                  <Typography variant="h4" sx={{ 
                    color: theme.palette.warning.main,
                    fontWeight: 800
                  }}>
                    {Math.round((stats.avgDuration || 0) / 60)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Средняя длительность (мин)
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: 2,
                  background: theme.palette.mode === 'light'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.paper, 0.2),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    background: theme.palette.mode === 'light'
                      ? alpha(theme.palette.background.paper, 0.9)
                      : alpha(theme.palette.background.paper, 0.3),
                    borderColor: alpha(theme.palette.info.main, 0.5)
                  }
                }}
              >
                <Stack spacing={1}>
                  <Typography variant="h4" sx={{ 
                    color: theme.palette.info.main,
                    fontWeight: 800
                  }}>
                    {formatPercentage(stats.goodPosturePercentage || 0)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Хорошая осанка
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </Paper>
    </motion.div>
  ), [stats, formatPercentage, theme]);

  const filtersPanel = useMemo(() => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Paper
        elevation={theme.palette.mode === 'light' ? 1 : 0}
        sx={{
          p: 3,
          mb: 3,
          background: theme.palette.mode === 'light'
            ? alpha(theme.palette.background.paper, 0.7)
            : alpha(theme.palette.background.paper, 0.4),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 4
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexGrow: 1 }}>
            <FilterList sx={{ color: theme.palette.text.secondary }} />
            <Typography variant="h6" sx={{ 
              color: theme.palette.text.primary,
              fontWeight: 600
            }}>
              Фильтры и поиск
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button
              startIcon={<Clear />}
              onClick={resetFilters}
              variant="outlined"
              size="small"
              sx={{
                color: theme.palette.text.secondary,
                borderColor: theme.palette.divider,
                '&:hover': {
                  borderColor: theme.palette.text.primary,
                  background: alpha(theme.palette.primary.main, 0.05)
                }
              }}
            >
              Сбросить
            </Button>
            
            <Button
              startIcon={<Search />}
              onClick={applyFilters}
              variant="contained"
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                }
              }}
            >
              Применить
            </Button>
          </Stack>
        </Stack>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Дата от"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: theme.palette.text.primary,
                  '& fieldset': {
                    borderColor: theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.text.secondary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: theme.palette.text.secondary,
                },
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Дата до"
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: theme.palette.text.primary,
                  '& fieldset': {
                    borderColor: theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.text.secondary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: theme.palette.text.secondary,
                },
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Мин. оценка"
              type="number"
              value={filters.minScore}
              onChange={(e) => handleFilterChange('minScore', e.target.value)}
              size="small"
              InputProps={{ inputProps: { min: 0, max: 100 } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: theme.palette.text.primary,
                  '& fieldset': {
                    borderColor: theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.text.secondary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: theme.palette.text.secondary,
                },
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Макс. оценка"
              type="number"
              value={filters.maxScore}
              onChange={(e) => handleFilterChange('maxScore', e.target.value)}
              size="small"
              InputProps={{ inputProps: { min: 0, max: 100 } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: theme.palette.text.primary,
                  '& fieldset': {
                    borderColor: theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.text.secondary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: theme.palette.text.secondary,
                },
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: theme.palette.text.secondary }}>Сортировка</InputLabel>
              <Select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                label="Сортировка"
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
                <MenuItem value="startTime">По дате</MenuItem>
                <MenuItem value="postureMetrics.postureScore">По оценке</MenuItem>
                <MenuItem value="duration">По длительности</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={filters.showOnlyWithProblems}
                onChange={(e) => handleFilterChange('showOnlyWithProblems', e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: theme.palette.primary.main,
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: theme.palette.primary.main,
                  },
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Только с проблемами
              </Typography>
            }
          />
          
          <TextField
            placeholder="Поиск по ID или дате..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            size="small"
            sx={{
              flexGrow: 1,
              '& .MuiOutlinedInput-root': {
                color: theme.palette.text.primary,
                '& fieldset': {
                  borderColor: theme.palette.divider,
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.text.secondary,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
              '& .MuiInputBase-input::placeholder': {
                color: theme.palette.text.disabled,
                opacity: 1,
              },
            }}
          />
        </Stack>
      </Paper>
    </motion.div>
  ), [filters, applyFilters, resetFilters, handleFilterChange, theme]);

  const renderSessionCard = useCallback((session: any, index: number) => {
    const isExpanded = expandedSessions[session.sessionId] || false;
    const scoreColor = getScoreColor(session.postureMetrics?.postureScore || 0);
    const scoreGradient = getScoreGradient(session.postureMetrics?.postureScore || 0);
    const scoreLabel = getScoreLabel(session.postureMetrics?.postureScore || 0);
    const scoreIcon = getScoreIcon(session.postureMetrics?.postureScore || 0);
    const isSelected = selectedSessions.includes(session.sessionId);
    
    // Проверяем, есть ли проблемы (оценка меньше 100 или есть проблемы в массиве problems)
    const hasProblems = session.postureMetrics?.postureScore < 100 || 
                        (session.problems && session.problems.length > 0);
    
    return (
      <Grid item xs={12} sm={6} md={4} lg={3} key={session.sessionId}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.03 }}
          whileHover={{ y: -4 }}
        >
          <Paper
            elevation={theme.palette.mode === 'light' ? 2 : 0}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              background: theme.palette.mode === 'light'
                ? alpha(theme.palette.background.paper, 0.7)
                : alpha(theme.palette.background.paper, 0.4),
              backdropFilter: 'blur(10px)',
              border: isSelected 
                ? `2px solid ${theme.palette.primary.main}`
                : `1px solid ${theme.palette.divider}`,
              borderRadius: 4,
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              position: 'relative',
              cursor: 'pointer',
              '&:hover': {
                borderColor: isSelected ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.5),
                boxShadow: theme.shadows[4],
              }
            }}
            onClick={() => toggleSessionSelection(session.sessionId)}
          >
            {/* Верхний градиентный акцент */}
            <Box
              sx={{
                height: 4,
                background: scoreGradient,
              }}
            />
            
            <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
              <Stack spacing={2}>
                {/* Заголовок с оценкой */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="subtitle2" sx={{ 
                      color: theme.palette.text.primary,
                      fontWeight: 600,
                      mb: 0.5
                    }}>
                      Сеанс анализа
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: theme.palette.text.secondary,
                      display: 'block'
                    }}>
                      {formatSessionDate(session.startTime)}
                    </Typography>
                  </Box>
                  
                  <Tooltip title={scoreLabel}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 3,
                        background: scoreGradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 4px 15px ${alpha(scoreColor, 0.4)}`,
                      }}
                    >
                      <Typography variant="h6" sx={{ 
                        color: 'white',
                        fontWeight: 800,
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}>
                        {session.postureMetrics?.postureScore || 0}
                      </Typography>
                    </Box>
                  </Tooltip>
                </Stack>
                
                {/* Время и длительность */}
                <Stack direction="row" spacing={2}>
                  <Tooltip title="Время сеанса">
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <AccessTime sx={{ 
                        fontSize: 16, 
                        color: theme.palette.text.secondary
                      }} />
                      <Typography variant="caption" sx={{ 
                        color: theme.palette.text.secondary
                      }}>
                        {getTimeSince(session.startTime)}
                      </Typography>
                    </Stack>
                  </Tooltip>
                  
                  <Tooltip title="Длительность">
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Timer sx={{ 
                        fontSize: 16, 
                        color: theme.palette.text.secondary
                      }} />
                      <Typography variant="caption" sx={{ 
                        color: theme.palette.text.secondary
                      }}>
                        {formatSessionDuration(session.duration || 0)}
                      </Typography>
                    </Stack>
                  </Tooltip>
                </Stack>
                
                {/* Прогресс-бары */}
                <Box>
                  <Stack spacing={1}>
                    {/* Хорошая осанка */}
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          Хорошая осанка
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: theme.palette.success.main,
                          fontWeight: 600
                        }}>
                          {formatPercentage(session.postureMetrics?.goodPercentage || 0)}
                        </Typography>
                      </Stack>
                      <LinearProgress 
                        variant="determinate" 
                        value={session.postureMetrics?.goodPercentage || 0}
                        sx={{ 
                          height: 4,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
                            borderRadius: 2
                          }
                        }}
                      />
                    </Box>
                    
                    {/* Предупреждения */}
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          Предупреждения
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: theme.palette.warning.main,
                          fontWeight: 600
                        }}>
                          {formatPercentage(session.postureMetrics?.warningPercentage || 0)}
                        </Typography>
                      </Stack>
                      <LinearProgress 
                        variant="determinate" 
                        value={session.postureMetrics?.warningPercentage || 0}
                        sx={{ 
                          height: 4,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})`,
                            borderRadius: 2
                          }
                        }}
                      />
                    </Box>
                  </Stack>
                </Box>
                
                {/* Проблемные зоны */}
                <Box>
                  <Typography variant="caption" sx={{ 
                    color: theme.palette.text.secondary,
                    display: 'block',
                    mb: 1
                  }}>
                    Проблемные зоны
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
                                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                                fontSize: '0.7rem',
                                height: 20,
                                '& .MuiChip-label': { px: 1 }
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
                                height: 20,
                                '& .MuiChip-label': { px: 1 }
                              }}
                            />
                          )}
                        </>
                      ) : (
                        session.postureMetrics?.postureScore < 100 ? (
                          <Chip
                            icon={<WarningAmber sx={{ fontSize: '0.8rem !important' }} />}
                            label="Есть ошибки в анализе"
                            size="small"
                            sx={{
                              background: alpha(theme.palette.warning.main, 0.1),
                              color: theme.palette.warning.main,
                              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                              fontSize: '0.7rem',
                              height: 24,
                              '& .MuiChip-icon': { color: theme.palette.warning.main }
                            }}
                          />
                        ) : null
                      )}
                    </Stack>
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        p: 0.5,
                        borderRadius: 1,
                        background: alpha(theme.palette.success.main, 0.05),
                      }}
                    >
                      <CheckCircleIcon sx={{ 
                        fontSize: 16, 
                        color: theme.palette.success.main,
                        opacity: 0.7
                      }} />
                      <Typography variant="caption" sx={{ 
                        color: theme.palette.success.main,
                        fontWeight: 500,
                        fontSize: '0.75rem'
                      }}>
                        Нет проблемных зон
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                {/* Collapse для дополнительной информации */}
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Box sx={{ 
                    mt: 1,
                    pt: 2,
                    borderTop: `1px solid ${theme.palette.divider}`
                  }}>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ 
                          color: theme.palette.text.secondary,
                          display: 'block'
                        }}>
                          Кадров обработано
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: theme.palette.text.primary,
                          fontWeight: 600
                        }}>
                          {session.postureMetrics?.totalFrames?.toLocaleString() || 0}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ 
                          color: theme.palette.text.secondary,
                          display: 'block'
                        }}>
                          Ошибки
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: theme.palette.error.main,
                          fontWeight: 600
                        }}>
                          {session.postureMetrics?.errorFrames?.toLocaleString() || 0}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="caption" sx={{ 
                          color: theme.palette.text.secondary,
                          display: 'block',
                          mt: 1
                        }}>
                          ID сеанса
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: theme.palette.text.disabled,
                          fontFamily: 'monospace',
                          fontSize: '0.7rem'
                        }}>
                          {session.sessionId}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Collapse>
                
                {/* Действия */}
                <Stack 
                  direction="row" 
                  spacing={1} 
                  justifyContent="space-between" 
                  alignItems="center"
                  sx={{ mt: 'auto' }}
                >
                  <Button
                    size="small"
                    startIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSessionExpand(session.sessionId, e);
                    }}
                    sx={{
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        color: theme.palette.primary.main,
                        background: alpha(theme.palette.primary.main, 0.1)
                      }
                    }}
                  >
                    {isExpanded ? 'Скрыть' : 'Детали'}
                  </Button>
                  
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Просмотр">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSession(session.sessionId);
                        }}
                        sx={{
                          color: theme.palette.primary.main,
                          background: alpha(theme.palette.primary.main, 0.1),
                          '&:hover': {
                            background: alpha(theme.palette.primary.main, 0.2)
                          }
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
                          openDeleteDialog(
                            session.sessionId, 
                            session.startTime, 
                            session.postureMetrics?.postureScore || 0,
                            session.duration || 0
                          );
                        }}
                        sx={{
                          color: theme.palette.error.main,
                          background: alpha(theme.palette.error.main, 0.1),
                          '&:hover': {
                            background: alpha(theme.palette.error.main, 0.2)
                          }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Paper>
        </motion.div>
      </Grid>
    );
  }, [expandedSessions, selectedSessions, getScoreColor, getScoreGradient, getScoreLabel, getScoreIcon, formatSessionDate, getTimeSince, formatSessionDuration, formatPercentage, toggleSessionExpand, handleViewSession, toggleSessionSelection, theme]);

  const tableComponent = useMemo(() => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper
        elevation={theme.palette.mode === 'light' ? 1 : 0}
        sx={{
          background: theme.palette.mode === 'light'
            ? alpha(theme.palette.background.paper, 0.7)
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
                background: theme.palette.mode === 'light'
                  ? alpha(theme.palette.primary.main, 0.05)
                  : alpha(theme.palette.background.paper, 0.2),
                '& th': {
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }
              }}>
                <TableCell>Дата и время</TableCell>
                <TableCell>Оценка</TableCell>
                <TableCell>Длительность</TableCell>
                <TableCell>Хорошая осанка</TableCell>
                <TableCell>Проблемы</TableCell>
                <TableCell>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => {
                const scoreColor = getScoreColor(session.postureMetrics?.postureScore || 0);
                const hasProblems = session.postureMetrics?.postureScore < 100 || 
                                  (session.problems && session.problems.length > 0);
                
                return (
                  <TableRow
                    key={session.sessionId}
                    sx={{
                      '& td': {
                        color: theme.palette.text.primary,
                        borderBottom: `1px solid ${theme.palette.divider}`
                      },
                      '&:hover': {
                        background: alpha(theme.palette.primary.main, 0.02)
                      }
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                          {formatSessionDate(session.startTime)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {getTimeSince(session.startTime)}
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
                            background: getScoreGradient(session.postureMetrics?.postureScore || 0),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Typography variant="body2" sx={{ 
                            color: 'white',
                            fontWeight: 700
                          }}>
                            {session.postureMetrics?.postureScore || 0}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: scoreColor }}>
                          {getScoreLabel(session.postureMetrics?.postureScore || 0)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatSessionDuration(session.duration || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: 100 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={session.postureMetrics?.goodPercentage || 0}
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
                          {formatPercentage(session.postureMetrics?.goodPercentage || 0)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {hasProblems ? (
                        session.problems && session.problems.length > 0 ? (
                          <Stack direction="row" spacing={0.5}>
                            {session.problems.slice(0, 2).map((problem: string, idx: number) => (
                              <Chip
                                key={idx}
                                label={problem}
                                size="small"
                                sx={{
                                  background: alpha(theme.palette.error.main, 0.1),
                                  color: theme.palette.error.main,
                                  fontSize: '0.7rem',
                                  height: 20
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
                                  height: 20
                                }}
                              />
                            )}
                          </Stack>
                        ) : (
                          <Chip
                            icon={<WarningAmber sx={{ fontSize: '0.8rem !important' }} />}
                            label="Есть ошибки"
                            size="small"
                            sx={{
                              background: alpha(theme.palette.warning.main, 0.1),
                              color: theme.palette.warning.main,
                              fontSize: '0.7rem',
                              height: 24,
                              '& .MuiChip-icon': { color: theme.palette.warning.main }
                            }}
                          />
                        )
                      ) : (
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <CheckCircleIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
                          <Typography variant="caption" sx={{ color: theme.palette.success.main }}>
                            Нет проблем
                          </Typography>
                        </Stack>
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Просмотр">
                          <IconButton
                            size="small"
                            onClick={() => handleViewSession(session.sessionId)}
                            sx={{ 
                              color: theme.palette.text.secondary,
                              '&:hover': { 
                                color: theme.palette.primary.main,
                                background: alpha(theme.palette.primary.main, 0.1)
                              }
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Удалить">
                          <IconButton
                            size="small"
                            onClick={() => openDeleteDialog(
                              session.sessionId, 
                              session.startTime, 
                              session.postureMetrics?.postureScore || 0,
                              session.duration || 0
                            )}
                            sx={{ 
                              color: theme.palette.text.secondary,
                              '&:hover': { 
                                color: theme.palette.error.main,
                                background: alpha(theme.palette.error.main, 0.1)
                              }
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </motion.div>
  ), [sessions, getScoreColor, getScoreGradient, getScoreLabel, formatSessionDate, getTimeSince, formatSessionDuration, formatPercentage, handleViewSession, theme]);

  const emptyState = useMemo(() => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper
        elevation={theme.palette.mode === 'light' ? 1 : 0}
        sx={{
          textAlign: 'center',
          py: 8,
          px: 4,
          background: theme.palette.mode === 'light'
            ? alpha(theme.palette.background.paper, 0.7)
            : alpha(theme.palette.background.paper, 0.4),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 4
        }}
      >
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)'
          }}
        >
          <History sx={{ fontSize: 60, color: 'white' }} />
        </Box>
        
        <Typography variant="h5" sx={{ 
          color: theme.palette.text.primary,
          mb: 2,
          fontWeight: 700
        }}>
          Нет данных о сеансах
        </Typography>
        
        <Typography variant="body1" sx={{ 
          color: theme.palette.text.secondary,
          mb: 4,
          maxWidth: 400,
          mx: 'auto'
        }}>
          Выполните анализ осанки, чтобы увидеть историю здесь
        </Typography>
        
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          startIcon={<PlayCircleOutline />}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            px: 4,
            py: 1.5,
            '&:hover': {
              background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
            }
          }}
        >
          Начать анализ осанки
        </Button>
      </Paper>
    </motion.div>
  ), [navigate, theme]);

  if (loading && sessions.length === 0) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: theme.palette.mode === 'light'
          ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
          : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '60vh'
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': {
                    boxShadow: '0 0 0 0 rgba(102, 126, 234, 0.7)',
                  },
                  '70%': {
                    boxShadow: '0 0 0 20px rgba(102, 126, 234, 0)',
                  },
                  '100%': {
                    boxShadow: '0 0 0 0 rgba(102, 126, 234, 0)',
                  },
                }
              }}
            >
              <CircularProgress size={40} thickness={4} sx={{ color: 'white' }} />
            </Box>
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, mb: 1, fontWeight: 600 }}>
              Загрузка истории сеансов...
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Пожалуйста, подождите
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: theme.palette.mode === 'light'
        ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
        : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      pt: 4,
      pb: 8,
      position: 'relative'
    }}>
      {/* Стили для анимаций */}
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(10deg); }
            75% { transform: rotate(-10deg); }
          }
          
          @keyframes pulse {
            0%, 100% { 
              transform: scale(1);
              opacity: 0.5;
            }
            50% { 
              transform: scale(1.2);
              opacity: 1;
            }
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Анимированный фон */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: theme.palette.mode === 'light'
          ? `radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 50%),
             radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.05)} 0%, transparent 50%)`
          : `radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 50%),
             radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 50%)`,
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ mb: 4 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
              <Box>
                <Typography 
                  variant="h4" 
                  component="h1" 
                  sx={{ 
                    color: theme.palette.text.primary,
                    mb: 1,
                    fontWeight: 800,
                    letterSpacing: '0.5px'
                  }}
                >
                  История анализов осанки
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: theme.palette.text.secondary,
                  maxWidth: 600
                }}>
                  Просматривайте все сеансы анализа, статистику и отслеживайте прогресс
                </Typography>
              </Box>
              
              <Stack direction="row" spacing={1}>
                {selectedSessions.length === 2 && (
                  <Zoom in={selectedSessions.length === 2}>
                    <Button
                      startIcon={<CompareArrows />}
                      onClick={() => setActiveTab(1)}
                      variant="contained"
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                        }
                      }}
                    >
                      Сравнить выбранные
                    </Button>
                  </Zoom>
                )}
                
                {selectedSessions.length > 0 && (
                  <Button
                    startIcon={<Clear />}
                    onClick={clearSelection}
                    variant="outlined"
                    sx={{
                      color: theme.palette.text.secondary,
                      borderColor: theme.palette.divider,
                      '&:hover': {
                        borderColor: theme.palette.text.primary,
                        background: alpha(theme.palette.primary.main, 0.05)
                      }
                    }}
                  >
                    Отмена ({selectedSessions.length})
                  </Button>
                )}
                
                <Tooltip title="Обновить данные">
                  <IconButton
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    sx={{
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        color: theme.palette.primary.main
                      }
                    }}
                  >
                    <Refresh sx={{
                      animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                    }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 3,
                  background: alpha(theme.palette.error.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                  color: theme.palette.error.main,
                  '& .MuiAlert-icon': {
                    color: theme.palette.error.main
                  }
                }}
                action={
                  <Button 
                    color="inherit" 
                    size="small"
                    onClick={() => loadSessions(page, rowsPerPage)}
                    startIcon={<Refresh />}
                    sx={{ color: theme.palette.error.main }}
                  >
                    Повторить
                  </Button>
                }
              >
                {error}
              </Alert>
            )}
          </Box>
        </motion.div>

        {/* Статистика */}
        {statsCard}

        {/* Фильтры */}
        {filtersPanel}

        {/* Вкладки */}
        <Paper
          elevation={theme.palette.mode === 'light' ? 1 : 0}
          sx={{
            mb: 3,
            background: theme.palette.mode === 'light'
              ? alpha(theme.palette.background.paper, 0.7)
              : alpha(theme.palette.background.paper, 0.4),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 4,
            overflow: 'hidden'
          }}
        >
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': { 
                color: theme.palette.text.secondary,
                fontWeight: 600,
                fontSize: '0.95rem',
                minHeight: 56,
                transition: 'all 0.2s',
                '&:hover': {
                  color: theme.palette.text.primary,
                  background: alpha(theme.palette.primary.main, 0.02)
                }
              },
              '& .Mui-selected': { 
                color: `${theme.palette.primary.main} !important`,
                fontWeight: 700
              },
              '& .MuiTabs-indicator': { 
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                height: 3,
                borderRadius: '3px 3px 0 0'
              }
            }}
          >
            <Tab 
              icon={<History />} 
              iconPosition="start" 
              label="История сеансов" 
            />
            <Tab 
              icon={<TimelineIcon />} 
              iconPosition="start" 
              label="Прогресс" 
            />
          </Tabs>
        </Paper>

        {/* Содержимое вкладок */}
        <TabPanel value={activeTab} index={0}>
          {sessions.length === 0 ? (
            emptyState
          ) : (
            <>
              {/* Панель управления видом */}
              <Stack 
                direction="row" 
                justifyContent="space-between" 
                alignItems="center" 
                sx={{ mb: 3 }}
              >
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Найдено сеансов: {totalSessions}
                </Typography>
                
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={handleViewModeChange}
                  size="small"
                  sx={{
                    background: theme.palette.mode === 'light'
                      ? alpha(theme.palette.background.paper, 0.7)
                      : alpha(theme.palette.background.paper, 0.4),
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
                  <ToggleButton value="cards">
                    <GridView />
                  </ToggleButton>
                  <ToggleButton value="table">
                    <TableRows />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              {/* Сеансы */}
              <AnimatePresence mode="wait">
                {viewMode === 'cards' ? (
                  <Grid container spacing={2} key="cards">
                    {sessions.map((session, index) => renderSessionCard(session, index))}
                  </Grid>
                ) : (
                  <Fade in={true} key="table">
                    <Box>
                      {tableComponent}
                    </Box>
                  </Fade>
                )}
              </AnimatePresence>

              {/* Пагинация */}
              {sessions.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <TablePagination
                    component="div"
                    count={totalSessions}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Строк на странице:"
                    labelDisplayedRows={({ from, to, count }) => 
                      `${from}-${to} из ${count !== -1 ? count : `более ${to}`}`
                    }
                    sx={{
                      color: theme.palette.text.secondary,
                      '& .MuiTablePagination-select': {
                        color: theme.palette.text.primary
                      },
                      '& .MuiTablePagination-selectIcon': {
                        color: theme.palette.text.secondary
                      },
                      '& .MuiTablePagination-actions button': {
                        color: theme.palette.text.secondary,
                        '&:disabled': {
                          color: theme.palette.action.disabled
                        }
                      }
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <SessionProgress 
            sessions={sessions} 
            loading={loading} 
          />
        </TabPanel>

        {/* Диалог удаления */}
        <Dialog
          open={deleteDialog.open}
          onClose={closeDeleteDialog}
          TransitionComponent={Transition}
          keepMounted
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: theme.palette.background.paper,
              backgroundImage: theme.palette.mode === 'light'
                ? `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.05)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`
                : `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.1)} 100%)`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              borderRadius: 4,
              boxShadow: theme.shadows[10],
              overflow: 'hidden',
              position: 'relative',
              '&:before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.warning.main})`
              }
            }
          }}
        >
          {/* Анимированный фон */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 30% 50%, ${alpha(theme.palette.error.main, 0.1)} 0%, transparent 50%),
                        radial-gradient(circle at 70% 50%, ${alpha(theme.palette.warning.main, 0.1)} 0%, transparent 50%)`,
            pointerEvents: 'none'
          }} />

          <DialogTitle sx={{ 
            pb: 1, 
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}>
            <Box sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.error.main, 0.2),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s infinite'
            }}>
              <WarningAmber sx={{ 
                fontSize: 28, 
                color: theme.palette.error.main,
                animation: 'shake 0.5s ease-in-out infinite'
              }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ 
                color: theme.palette.text.primary,
                fontWeight: 700,
                letterSpacing: '-0.02em'
              }}>
                Подтверждение удаления
              </Typography>
              <Typography sx={{ 
                color: theme.palette.text.secondary,
                fontSize: '0.9rem',
                mt: 0.5
              }}>
                Это действие нельзя будет отменить
              </Typography>
            </Box>
            <IconButton
              onClick={closeDeleteDialog}
              sx={{
                position: 'absolute',
                right: 16,
                top: 16,
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.text.primary,
                  bgcolor: alpha(theme.palette.common.white, 0.1)
                }
              }}
            >
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ position: 'relative', py: 3 }}>
            <Fade in={true} timeout={500}>
              <Box>
                {/* Предупреждение */}
                <Paper sx={{ 
                  p: 2.5,
                  mb: 3,
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                  borderRadius: 3
                }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <ErrorOutline sx={{ 
                      color: theme.palette.error.main,
                      fontSize: 24,
                      flexShrink: 0
                    }} />
                    <Box>
                      <Typography sx={{ 
                        color: theme.palette.error.main,
                        fontWeight: 600,
                        mb: 0.5
                      }}>
                        Внимание!
                      </Typography>
                      <Typography sx={{ 
                        color: theme.palette.error.main,
                        fontSize: '0.95rem'
                      }}>
                        Вы собираетесь удалить сеанс анализа. Это действие необратимо, и все данные будут безвозвратно потеряны.
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                {/* Информация о сеансе */}
                <Box sx={{ 
                  p: 3,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`
                }}>
                  <Typography sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: '0.9rem',
                    mb: 1,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Удаляемый сеанс
                  </Typography>
                  
                  <Typography sx={{ 
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    mb: 2
                  }}>
                    Сеанс анализа от {deleteDialog.sessionDate}
                  </Typography>
                  
                  <Stack direction="row" spacing={3} sx={{ mb: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Star sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                      <Typography sx={{ color: theme.palette.warning.main, fontWeight: 600 }}>
                        Оценка: {deleteDialog.sessionScore}%
                      </Typography>
                    </Stack>
                    
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Timer sx={{ fontSize: 16, color: theme.palette.info.main }} />
                      <Typography sx={{ color: theme.palette.info.main, fontWeight: 600 }}>
                        Длительность: {formatSessionDuration(deleteDialog.sessionDuration)}
                      </Typography>
                    </Stack>
                  </Stack>
                  
                  <Typography sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mt: 2
                  }}>
                    <Dangerous sx={{ fontSize: 16, color: theme.palette.error.main }} />
                    После удаления восстановить данные будет невозможно
                  </Typography>
                </Box>

                {/* Анимация предупреждения */}
                <Box sx={{
                  mt: 3,
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <Zoom in={true} timeout={1000}>
                    <Box sx={{
                      display: 'flex',
                      gap: 1
                    }}>
                      {[...Array(3)].map((_, i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: alpha(theme.palette.error.main, 0.5 - i * 0.1),
                            animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`
                          }}
                        />
                      ))}
                    </Box>
                  </Zoom>
                </Box>
              </Box>
            </Fade>
          </DialogContent>

          <DialogActions sx={{ 
            p: 3, 
            pt: 0,
            gap: 2,
            position: 'relative'
          }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={closeDeleteDialog}
              disabled={deleteDialog.deleting}
              sx={{
                py: 1.5,
                borderRadius: 3,
                borderColor: alpha(theme.palette.text.secondary, 0.5),
                color: theme.palette.text.secondary,
                fontWeight: 600,
                fontSize: '1rem',
                '&:hover': {
                  borderColor: theme.palette.text.primary,
                  bgcolor: alpha(theme.palette.common.white, 0.05)
                }
              }}
            >
              Отмена
            </Button>
            
            <Button
              fullWidth
              variant="contained"
              onClick={handleDeleteConfirm}
              disabled={deleteDialog.deleting}
              sx={{
                py: 1.5,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                color: theme.palette.error.contrastText,
                fontWeight: 700,
                fontSize: '1rem',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`,
                  transform: 'scale(1.02)'
                },
                '&:active': {
                  transform: 'scale(0.98)'
                },
                '&.Mui-disabled': {
                  background: alpha(theme.palette.error.main, 0.3)
                }
              }}
            >
              {deleteDialog.deleting ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CircularProgress size={20} sx={{ color: theme.palette.error.contrastText }} />
                  <Typography>Удаление...</Typography>
                </Stack>
              ) : (
                'Удалить навсегда'
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default SessionsHistory;