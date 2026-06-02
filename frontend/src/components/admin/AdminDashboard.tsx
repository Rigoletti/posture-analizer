import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Stack,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  alpha,
  Paper,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Drawer,
  SwipeableDrawer,
  Divider,
  BottomNavigation,
  BottomNavigationAction,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  People as PeopleIcon,
  FitnessCenter as FitnessCenterIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Groups as GroupsIcon,
  SportsGymnastics as SportsGymnasticsIcon,
  NoteAdd as NoteAddIcon,
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  ShowChart as ShowChartIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  DirectionsRun as DirectionsRunIcon,
} from '@mui/icons-material';
import { adminApi } from '../../api/admin';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsData {
  timelineData: {
    date: string;
    sessions: number;
    avgScore: number;
  }[];
  userActivity: {
    hour: number;
    activeUsers: number;
  }[];
  sessionTrends: {
    date: string;
    avgScore: number;
    totalSessions: number;
    totalDuration: number;
  }[];
  lastUpdated: string;
}

interface StatsData {
  users: {
    total: number;
    active: number;
    newToday: number;
    roles: {
      guest?: number;
      user?: number;
      admin?: number;
    };
  };
  exercises: {
    total: number;
    active: number;
    types: {
      stretching?: number;
      cardio?: number;
      strength?: number;
      posture?: number;
      flexibility?: number;
    };
  };
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];

const AdminDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [stats, setStats] = useState<StatsData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('week');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileBottomNav, setMobileBottomNav] = useState(0);

  // Загрузка данных
  const fetchAllData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      const statsResponse = await adminApi.getAdminStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      } else {
        throw new Error(statsResponse.error || 'Ошибка загрузки статистики');
      }
      
      const analyticsResponse = await adminApi.getAnalytics(period);
      if (analyticsResponse.success) {
        setAnalytics(analyticsResponse.data);
      } else {
        throw new Error(analyticsResponse.error || 'Ошибка загрузки аналитики');
      }
      
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || err.message || 'Ошибка при загрузке данных');
      setStats(null);
      setAnalytics(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllData();
  }, [fetchAllData]);

  const getPercentage = useCallback((value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }, []);

  // Мемоизированные вычисления
  const getAverageScore = useCallback(() => {
    if (!analytics?.sessionTrends || analytics.sessionTrends.length === 0) {
      return 0;
    }
    const sum = analytics.sessionTrends.reduce((acc, curr) => acc + curr.avgScore, 0);
    return Math.round(sum / analytics.sessionTrends.length);
  }, [analytics]);

  const statCards = useMemo(() => [
    {
      title: 'Всего пользователей',
      value: stats?.users.total || 0,
      change: `+${stats?.users.newToday || 0} сегодня`,
      icon: <PeopleIcon />,
      color: '#6366f1',
      onClick: () => navigate('/admin/users')
    },
    {
      title: 'Активных пользователей',
      value: stats?.users.active || 0,
      change: `${stats ? getPercentage(stats.users.active, stats.users.total) : 0}% активны`,
      icon: <CheckCircleIcon />,
      color: '#10b981',
      onClick: () => navigate('/admin/users?status=active')
    },
    {
      title: 'Всего упражнений',
      value: stats?.exercises.total || 0,
      change: `${stats ? getPercentage(stats.exercises.active, stats.exercises.total) : 0}% активно`,
      icon: <FitnessCenterIcon />,
      color: '#f59e0b',
      onClick: () => navigate('/admin/exercises')
    },
    {
      title: 'Средний балл осанки',
      value: getAverageScore(),
      change: 'за неделю',
      icon: <TrendingUpIcon />,
      color: '#8b5cf6'
    }
  ], [stats, getPercentage, getAverageScore, navigate]);

  const quickActions = useMemo(() => [
    {
      title: 'Создать упражнение',
      description: 'Добавить новое упражнение в базу данных',
      icon: <NoteAddIcon />,
      color: '#10b981',
      onClick: () => navigate('/admin/exercises/create')
    },
    {
      title: 'Управление пользователями',
      description: 'Просмотр и редактирование всех пользователей',
      icon: <GroupsIcon />,
      color: '#3b82f6',
      onClick: () => navigate('/admin/users')
    },
    {
      title: 'Управление упражнениями',
      description: 'Редактирование упражнений и категорий',
      icon: <SportsGymnasticsIcon />,
      color: '#f59e0b',
      onClick: () => navigate('/admin/exercises')
    }
  ], [navigate]);

  // Мобильное меню
  const MobileMenuDrawer = useMemo(() => () => (
    <SwipeableDrawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      onOpen={() => setMobileMenuOpen(true)}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          bgcolor: theme.palette.background.paper,
          borderTopRightRadius: 20,
          borderBottomRightRadius: 20,
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Меню
          </Typography>
          <IconButton onClick={() => setMobileMenuOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <List>
          <ListItem 
            button 
            onClick={() => {
              navigate('/admin/users');
              setMobileMenuOpen(false);
            }}
            sx={{ borderRadius: 2, mb: 1 }}
          >
            <ListItemIcon><PeopleIcon /></ListItemIcon>
            <ListItemText primary="Пользователи" />
          </ListItem>
          <ListItem 
            button 
            onClick={() => {
              navigate('/admin/exercises');
              setMobileMenuOpen(false);
            }}
            sx={{ borderRadius: 2, mb: 1 }}
          >
            <ListItemIcon><FitnessCenterIcon /></ListItemIcon>
            <ListItemText primary="Упражнения" />
          </ListItem>
          <ListItem 
            button 
            onClick={() => {
              navigate('/admin/exercises/create');
              setMobileMenuOpen(false);
            }}
            sx={{ borderRadius: 2, mb: 1 }}
          >
            <ListItemIcon><NoteAddIcon /></ListItemIcon>
            <ListItemText primary="Создать упражнение" />
          </ListItem>
        </List>
      </Box>
    </SwipeableDrawer>
  ), [mobileMenuOpen, theme, navigate]);

  // График сессий
  const renderSessionChart = useCallback(() => (
    <Card sx={{ 
      bgcolor: alpha(theme.palette.background.paper, 0.8),
      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      borderRadius: 2,
      backdropFilter: 'blur(10px)',
      mb: 3,
    }}>
      <CardContent>
        <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ 
          mb: 3,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <ShowChartIcon sx={{ color: theme.palette.primary.main }} />
          Динамика сессий
        </Typography>
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Box sx={{ minWidth: isMobile ? 600 : '100%', height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.timelineData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="sessions" stroke={COLORS[0]} name="Количество сессий" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </CardContent>
    </Card>
  ), [analytics, isMobile, theme]);

  // График активности
  const renderActivityChart = useCallback(() => (
    <Card sx={{ 
      bgcolor: alpha(theme.palette.background.paper, 0.8),
      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      borderRadius: 2,
      backdropFilter: 'blur(10px)',
      mb: 3,
    }}>
      <CardContent>
        <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleIcon sx={{ color: theme.palette.info.main }} />
          Активность по часам
        </Typography>
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Box sx={{ minWidth: isMobile ? 600 : '100%', height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.userActivity || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={(value) => `${value}:00`} />
                <YAxis />
                <RechartsTooltip formatter={(value: number) => [`${value} пользователей`, 'Активных']} labelFormatter={(label) => `${label}:00`} />
                <Legend />
                <Area type="monotone" dataKey="activeUsers" stroke={COLORS[0]} fill={alpha(COLORS[0], 0.2)} name="Активные пользователи" />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </CardContent>
    </Card>
  ), [analytics, isMobile, theme]);

  if (loading && !stats && !analytics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: theme.palette.mode === 'light' 
        ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
        : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      py: { xs: 2, md: 4 },
      pb: { xs: isMobile ? 10 : 4 },
    }}>
      <Container maxWidth="xl">
        {/* Заголовок */}
        <Box sx={{ mb: 4 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Панель администратора
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Обзор системы и аналитика
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              {!isMobile && (
                <Button variant="outlined" startIcon={<BarChartIcon />} onClick={() => navigate('/admin/users')}>
                  Пользователи
                </Button>
              )}
              <Button 
                startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />} 
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outlined"
              >
                Обновить
              </Button>
              {isMobile && (
                <IconButton onClick={() => setMobileMenuOpen(true)}>
                  <MenuIcon />
                </IconButton>
              )}
            </Stack>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* КАРТОЧКИ СТАТИСТИКИ */}
        <Grid container spacing={isMobile ? 1.5 : 3} sx={{ mb: 4 }}>
          {statCards.map((card, index) => (
            <Grid 
              item 
              xs={6} 
              sm={6} 
              md={3} 
              key={index}
              sx={{ 
                display: 'flex',
                flexBasis: { xs: '50%', sm: '50%', md: '25%' },
                maxWidth: { xs: '50%', sm: '50%', md: '25%' },
                width: { xs: '50%', sm: '50%', md: '25%' },
              }}
            >
              <Card 
                sx={{ 
                  width: '100%',
                  minWidth: 0,
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: 2,
                  cursor: card.onClick ? 'pointer' : 'default',
                  '&:hover': !isMobile && card.onClick ? {
                    boxShadow: `0 8px 24px ${alpha(card.color, 0.15)}`,
                    borderColor: card.color
                  } : {}
                }}
                onClick={card.onClick}
              >
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ 
                      flex: 1, 
                      minWidth: 0,
                      overflow: 'hidden'
                    }}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                        {card.title}
                      </Typography>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 700, 
                          fontSize: { xs: '1.5rem', sm: '2rem' },
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word'
                        }}
                      >
                        {card.value}
                      </Typography>
                      <Chip
                        label={card.change}
                        size="small"
                        sx={{ 
                          mt: 1, 
                          bgcolor: alpha(card.color, 0.1), 
                          color: card.color, 
                          height: 20, 
                          fontSize: '0.65rem',
                          maxWidth: '100%',
                          '& .MuiChip-label': {
                            px: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }
                        }}
                      />
                    </Box>
                    <Box sx={{ 
                      p: 1, 
                      borderRadius: 2, 
                      bgcolor: alpha(card.color, 0.1),
                      color: card.color,
                      flexShrink: 0,
                      ml: 1
                    }}>
                      {React.cloneElement(card.icon, { sx: { fontSize: { xs: 20, sm: 24 } } })}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Быстрые действия */}
        <Box sx={{ mb: 4 }}>
          <Typography variant={isMobile ? "subtitle1" : "h5"} sx={{ mb: 2, fontWeight: 600 }}>
            Быстрые действия
          </Typography>
          <Grid container spacing={isMobile ? 1.5 : 3}>
            {quickActions.map((action, index) => (
              <Grid 
                item 
                xs={12} 
                sm={6} 
                lg={4} 
                key={index}
                sx={{
                  display: 'flex',
                  flexBasis: { xs: '100%', sm: '50%', lg: '33.333333%' },
                  maxWidth: { xs: '100%', sm: '50%', lg: '33.333333%' },
                }}
              >
                <Card 
                  sx={{ 
                    width: '100%',
                    cursor: 'pointer',
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha(action.color, 0.3)}`,
                    '&:hover': !isMobile && {
                      boxShadow: `0 8px 24px ${alpha(action.color, 0.15)}`
                    }
                  }}
                  onClick={action.onClick}
                >
                  <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                    <Box sx={{ 
                      width: { xs: 40, sm: 48 }, 
                      height: { xs: 40, sm: 48 }, 
                      borderRadius: 2, 
                      bgcolor: alpha(action.color, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1.5,
                      color: action.color
                    }}>
                      {React.cloneElement(action.icon, { sx: { fontSize: { xs: 20, sm: 24 } } })}
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {action.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                      {action.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Графики */}
        <Box>
          {renderSessionChart()}
          {renderActivityChart()}
        </Box>

        {analytics && (
          <Paper sx={{ mt: 4, p: 2, bgcolor: alpha(theme.palette.background.paper, 0.6), textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Последнее обновление: {new Date(analytics.lastUpdated).toLocaleString('ru-RU')}
            </Typography>
          </Paper>
        )}
      </Container>

      <MobileMenuDrawer />
      
      {isMobile && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            bgcolor: theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: { xs: 'block', md: 'none' }
          }}
          elevation={3}
        >
          <BottomNavigation
            value={mobileBottomNav}
            onChange={(_, newValue) => {
              setMobileBottomNav(newValue);
              if (newValue === 0) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            sx={{
              height: 65,
              '& .MuiBottomNavigationAction-root': {
                color: theme.palette.text.secondary,
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                },
              },
            }}
          >
            <BottomNavigationAction icon={<DashboardIcon />} label="Главная" />
            <BottomNavigationAction icon={<DirectionsRunIcon />} label="Тренировки" onClick={() => navigate('/exercises')} />
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
};

export default AdminDashboard;