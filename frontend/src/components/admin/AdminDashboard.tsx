import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
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
  Fade,
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
  Security as SecurityIcon,
  NoteAdd as NoteAddIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  ShowChart as ShowChartIcon,
  Schedule as ScheduleIcon,
  Whatshot as WhatshotIcon,
  Close as CloseIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  DirectionsRun as DirectionsRunIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { adminApi } from '../../api/admin';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

interface AnalyticsData {
  timelineData: {
    date: string;
    users: number;
    exercises: number;
    sessions: number;
    avgScore: number;
  }[];
  userActivity: {
    hour: number;
    activeUsers: number;
  }[];
  topExercises: {
    name: string;
    count: number;
    duration: number;
  }[];
  sessionTrends: {
    date: string;
    avgScore: number;
    totalSessions: number;
    totalDuration: number;
  }[];
  geoDistribution: {
    city: string;
    users: number;
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
  const [tabValue, setTabValue] = useState(0);
  const [period, setPeriod] = useState('week');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileBottomNav, setMobileBottomNav] = useState(0);

  useEffect(() => {
    fetchAllData();
  }, [period]);

  const fetchAllData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const statsResponse = await adminApi.getAdminStats();
      setStats(statsResponse.data);
      
      const analyticsResponse = await adminApi.getAnalytics(period);
      setAnalytics(analyticsResponse.data);
      
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || 'Ошибка при загрузке данных');
      setStats(getMockStats());
      setAnalytics(getMockAnalytics());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getMockStats = (): StatsData => ({
    users: {
      total: 8,
      active: 8,
      newToday: 0,
      roles: { admin: 1, user: 7, guest: 0 }
    },
    exercises: {
      total: 28,
      active: 28,
      types: { stretching: 8, cardio: 6, strength: 8, posture: 3, flexibility: 3 }
    }
  });

  const getMockAnalytics = (): AnalyticsData => ({
    timelineData: [
      { date: 'Пн', users: 6, exercises: 28, sessions: 12, avgScore: 70 },
      { date: 'Вт', users: 7, exercises: 28, sessions: 15, avgScore: 72 },
      { date: 'Ср', users: 7, exercises: 28, sessions: 14, avgScore: 71 },
      { date: 'Чт', users: 8, exercises: 28, sessions: 18, avgScore: 73 },
      { date: 'Пт', users: 8, exercises: 28, sessions: 16, avgScore: 74 },
      { date: 'Сб', users: 8, exercises: 28, sessions: 14, avgScore: 73 },
      { date: 'Вс', users: 8, exercises: 28, sessions: 13, avgScore: 73 }
    ],
    userActivity: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      activeUsers: i > 8 && i < 22 ? Math.floor(Math.random() * 5) + 3 : Math.floor(Math.random() * 2) + 1
    })),
    topExercises: [
      { name: 'Растяжка спины', count: 45, duration: 45 },
      { name: 'Упражнения для осанки', count: 38, duration: 38 },
      { name: 'Кардио тренировка', count: 32, duration: 52 },
      { name: 'Силовой комплекс', count: 28, duration: 48 },
      { name: 'Йога для начинающих', count: 25, duration: 40 }
    ],
    sessionTrends: [
      { date: 'Пн', avgScore: 70, totalSessions: 12, totalDuration: 78 },
      { date: 'Вт', avgScore: 72, totalSessions: 15, totalDuration: 94 },
      { date: 'Ср', avgScore: 71, totalSessions: 14, totalDuration: 105 },
      { date: 'Чт', avgScore: 73, totalSessions: 18, totalDuration: 122 },
      { date: 'Пт', avgScore: 74, totalSessions: 16, totalDuration: 139 },
      { date: 'Сб', avgScore: 73, totalSessions: 14, totalDuration: 105 },
      { date: 'Вс', avgScore: 73, totalSessions: 13, totalDuration: 89 }
    ],
    geoDistribution: [
      { city: 'Москва', users: 3 },
      { city: 'Санкт-Петербург', users: 2 },
      { city: 'Новосибирск', users: 1 },
      { city: 'Екатеринбург', users: 1 },
      { city: 'Казань', users: 1 },
    ],
    lastUpdated: new Date().toISOString()
  });

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const getPercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  const quickActions = [
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
  ];

  const statCards = [
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
      value: analytics ? Math.round(analytics.sessionTrends.reduce((acc, curr) => acc + curr.avgScore, 0) / analytics.sessionTrends.length) : 73,
      change: '+5% за неделю',
      icon: <TrendingUpIcon />,
      color: '#8b5cf6'
    }
  ];

  const MobileMenuDrawer = () => (
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
  );

  const MobileBottomNav = () => (
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
          if (newValue === 0) setTabValue(0);
          if (newValue === 1) setTabValue(1);
          if (newValue === 2) setTabValue(2);
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
        <BottomNavigationAction icon={<DirectionsRunIcon />} label="Тренировки" />
        <BottomNavigationAction icon={<AssessmentIcon />} label="Аналитика" />
      </BottomNavigation>
    </Paper>
  );

  const renderUserChart = () => (
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
          Динамика пользователей и упражнений
        </Typography>
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Box sx={{ minWidth: isMobile ? 600 : '100%', height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analytics?.timelineData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="users" fill={alpha(COLORS[0], 0.2)} stroke={COLORS[0]} name="Пользователи" />
                <Bar yAxisId="right" dataKey="exercises" fill={COLORS[2]} name="Упражнения" radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="sessions" stroke={COLORS[1]} name="Сессии" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderActivityChart = () => (
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
  );

  const renderSessionTrendsChart = () => (
    <Card sx={{ 
      bgcolor: alpha(theme.palette.background.paper, 0.8),
      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      borderRadius: 2,
      backdropFilter: 'blur(10px)',
      mb: 3,
    }}>
      <CardContent>
        <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <WhatshotIcon sx={{ color: theme.palette.warning.main }} />
          Качество тренировок
        </Typography>
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Box sx={{ minWidth: isMobile ? 600 : '100%', height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analytics?.sessionTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip />
                <Legend />
                <Bar yAxisId="right" dataKey="totalSessions" fill={alpha(COLORS[2], 0.5)} name="Количество сессий" radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="avgScore" stroke={COLORS[1]} name="Средний балл" strokeWidth={2} dot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderTopExercisesChart = () => (
    <Card sx={{ 
      bgcolor: alpha(theme.palette.background.paper, 0.8),
      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      borderRadius: 2,
      backdropFilter: 'blur(10px)',
      height: '100%',
    }}>
      <CardContent>
        <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PieChartIcon sx={{ color: COLORS[4] }} />
          Популярные упражнения
        </Typography>
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Box sx={{ minWidth: isMobile ? 400 : '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.topExercises || []} layout={isMobile ? "horizontal" : "vertical"} margin={{ left: isMobile ? 0 : 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                {isMobile ? (
                  <>
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                  </>
                ) : (
                  <>
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={130} />
                  </>
                )}
                <RechartsTooltip />
                <Bar dataKey="count" fill={COLORS[4]} name="Выполнений" radius={[4, 4, 0, 0]}>
                  {(analytics?.topExercises || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderGeoDistribution = () => (
    <Card sx={{ 
      bgcolor: alpha(theme.palette.background.paper, 0.8),
      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      borderRadius: 2,
      backdropFilter: 'blur(10px)',
      height: '100%',
    }}>
      <CardContent>
        <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PieChartIcon sx={{ color: COLORS[0] }} />
          Геораспределение
        </Typography>
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Box sx={{ minWidth: isMobile ? 400 : '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.geoDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={!isMobile}
                  label={!isMobile ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : false}
                  outerRadius={isMobile ? 80 : 100}
                  dataKey="users"
                >
                  {(analytics?.geoDistribution || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number, name: string) => [`${value} пользователей`, name]} />
                {!isMobile && <Legend />}
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Box>
        {isMobile && (
          <Stack spacing={1.5} sx={{ mt: 2, maxHeight: 200, overflowY: 'auto' }}>
            {analytics?.geoDistribution.map((city, index) => (
              <Stack key={index} direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[index % COLORS.length] }} />
                  <Typography variant="body2">{city.city}</Typography>
                </Stack>
                <Typography variant="body2" fontWeight={600}>{city.users}</Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );

  const renderRoleDistribution = () => {
    const roleData = [
      { name: 'Администраторы', value: stats?.users.roles.admin || 0, color: '#ef4444' },
      { name: 'Пользователи', value: stats?.users.roles.user || 0, color: '#3b82f6' },
      { name: 'Гости', value: stats?.users.roles.guest || 0, color: '#6b7280' }
    ];

    return (
      <Card sx={{ 
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 2,
        backdropFilter: 'blur(10px)',
        height: '100%',
      }}>
        <CardContent>
          <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon sx={{ color: COLORS[0] }} />
            Распределение по ролям
          </Typography>
          <Box sx={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 60 : 80}
                  outerRadius={isMobile ? 90 : 120}
                  paddingAngle={5}
                  dataKey="value"
                  label={!isMobile ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : false}
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Box>
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {roleData.map((role) => (
              <Stack key={role.name} direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: role.color }} />
                  <Typography variant="body2">{role.name}</Typography>
                </Stack>
                <Typography variant="body2" fontWeight={600}>{role.value}</Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  if (loading && !stats) {
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

        {/* КАРТОЧКИ СТАТИСТИКИ  */}
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
                // ФИКСИРУЕМ ОДИНАКОВУЮ ШИРИНУ
                flexBasis: { xs: '50%', sm: '50%', md: '25%' },
                maxWidth: { xs: '50%', sm: '50%', md: '25%' },
                width: { xs: '50%', sm: '50%', md: '25%' },
              }}
            >
              <Card 
                sx={{ 
                  width: '100%',
                  minWidth: 0, // Важно для flex
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: 2,
                  cursor: card.onClick ? 'pointer' : 'default',
                  transition: 'all 0.3s ease',
                  '&:hover': !isMobile && card.onClick ? {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 30px ${alpha(card.color, 0.2)}`,
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
                    transition: 'all 0.3s ease',
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha(action.color, 0.3)}`,
                    '&:hover': !isMobile && {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 30px ${alpha(action.color, 0.2)}`
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

        {/* Вкладки для десктопа */}
        {!isMobile && (
          <>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                <Tab label="Пользователи и активность" />
                <Tab label="Упражнения и тренировки" />
                <Tab label="Аналитика и распределение" />
              </Tabs>
            </Box>

            {tabValue === 0 && (
              <Fade in={tabValue === 0}>
                <Box>
                  {renderUserChart()}
                  {renderActivityChart()}
                </Box>
              </Fade>
            )}

            {tabValue === 1 && (
              <Fade in={tabValue === 1}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    {renderSessionTrendsChart()}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    {renderTopExercisesChart()}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ 
                      bgcolor: alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      borderRadius: 2,
                      height: '100%',
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                          Типы упражнений
                        </Typography>
                        <Stack spacing={2}>
                          {stats?.exercises.types && Object.entries(stats.exercises.types).map(([type, count]) => {
                            const typeNames: Record<string, string> = {
                              stretching: 'Растяжка',
                              cardio: 'Кардио',
                              strength: 'Силовые',
                              posture: 'Осанка',
                              flexibility: 'Гибкость'
                            };
                            const percentage = getPercentage(count, stats.exercises.total);
                            return (
                              <Box key={type}>
                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {typeNames[type] || type}
                                  </Typography>
                                  <Typography variant="body2" fontWeight={600}>
                                    {count} ({percentage}%)
                                  </Typography>
                                </Stack>
                                <LinearProgress variant="determinate" value={percentage} sx={{ height: 8, borderRadius: 4 }} />
                              </Box>
                            );
                          })}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Fade>
            )}

            {tabValue === 2 && (
              <Fade in={tabValue === 2}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    {renderRoleDistribution()}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    {renderGeoDistribution()}
                  </Grid>
                </Grid>
              </Fade>
            )}
          </>
        )}

        {/* Мобильная версия */}
        {isMobile && (
          <Box>
            {mobileBottomNav === 0 && (
              <Fade in={mobileBottomNav === 0}>
                <Box>
                  {renderUserChart()}
                  {renderActivityChart()}
                </Box>
              </Fade>
            )}
            {mobileBottomNav === 1 && (
              <Fade in={mobileBottomNav === 1}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    {renderSessionTrendsChart()}
                  </Grid>
                  <Grid item xs={12}>
                    {renderTopExercisesChart()}
                  </Grid>
                  <Grid item xs={12}>
                    <Card sx={{ 
                      bgcolor: alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      borderRadius: 2,
                    }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                          Типы упражнений
                        </Typography>
                        <Stack spacing={1.5}>
                          {stats?.exercises.types && Object.entries(stats.exercises.types).map(([type, count]) => {
                            const typeNames: Record<string, string> = {
                              stretching: 'Растяжка',
                              cardio: 'Кардио',
                              strength: 'Силовые',
                              posture: 'Осанка',
                              flexibility: 'Гибкость'
                            };
                            const percentage = getPercentage(count, stats.exercises.total);
                            return (
                              <Box key={type}>
                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {typeNames[type] || type}
                                  </Typography>
                                  <Typography variant="caption" fontWeight={600}>
                                    {count} ({percentage}%)
                                  </Typography>
                                </Stack>
                                <LinearProgress variant="determinate" value={percentage} sx={{ height: 6, borderRadius: 3 }} />
                              </Box>
                            );
                          })}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Fade>
            )}
            {mobileBottomNav === 2 && (
              <Fade in={mobileBottomNav === 2}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    {renderRoleDistribution()}
                  </Grid>
                  <Grid item xs={12}>
                    {renderGeoDistribution()}
                  </Grid>
                </Grid>
              </Fade>
            )}
          </Box>
        )}

        {analytics && (
          <Paper sx={{ mt: 4, p: 2, bgcolor: alpha(theme.palette.background.paper, 0.6), textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Последнее обновление: {new Date(analytics.lastUpdated).toLocaleString('ru-RU')}
            </Typography>
          </Paper>
        )}
      </Container>

      <MobileMenuDrawer />
      {isMobile && <MobileBottomNav />}
    </Box>
  );
};

export default AdminDashboard;