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
  Tooltip,
  Fade,
  Menu,
  MenuItem,
  FormControl,
  Select,
  InputLabel
} from '@mui/material';
import {
  People as PeopleIcon,
  FitnessCenter as FitnessCenterIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Groups as GroupsIcon,
  SportsGymnastics as SportsGymnasticsIcon,
  Security as SecurityIcon,
  AccountCircle as AccountCircleIcon,
  NoteAdd as NoteAddIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  ShowChart as ShowChartIcon,
  Schedule as ScheduleIcon,
  Whatshot as WhatshotIcon
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
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [stats, setStats] = useState<StatsData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [period, setPeriod] = useState('week');
  const [periodAnchorEl, setPeriodAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    fetchAllData();
  }, [period]);

  const fetchAllData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Получаем базовую статистику
      const statsResponse = await adminApi.getAdminStats();
      setStats(statsResponse.data);
      
      // Получаем аналитику для графиков
      const analyticsResponse = await adminApi.getAnalytics(period);
      setAnalytics(analyticsResponse.data);
      
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || 'Ошибка при загрузке данных');
      // Используем mock данные при ошибке
      setStats(getMockStats());
      setAnalytics(getMockAnalytics());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getMockStats = (): StatsData => ({
    users: {
      total: 1542,
      active: 1289,
      newToday: 23,
      roles: { admin: 3, user: 1250, guest: 289 }
    },
    exercises: {
      total: 45,
      active: 42,
      types: { stretching: 12, cardio: 10, strength: 15, posture: 5, flexibility: 3 }
    }
  });

  const getMockAnalytics = (): AnalyticsData => ({
    timelineData: [
      { date: 'Пн', users: 1230, exercises: 38, sessions: 156, avgScore: 78 },
      { date: 'Вт', users: 1250, exercises: 39, sessions: 189, avgScore: 82 },
      { date: 'Ср', users: 1280, exercises: 40, sessions: 210, avgScore: 85 },
      { date: 'Чт', users: 1300, exercises: 41, sessions: 245, avgScore: 84 },
      { date: 'Пт', users: 1320, exercises: 42, sessions: 278, avgScore: 86 },
      { date: 'Сб', users: 1289, exercises: 42, sessions: 210, avgScore: 88 },
      { date: 'Вс', users: 1250, exercises: 42, sessions: 178, avgScore: 87 }
    ],
    userActivity: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      activeUsers: i > 8 && i < 22 ? Math.floor(Math.random() * 300) + 300 : Math.floor(Math.random() * 100) + 20
    })),
    topExercises: [
      { name: 'Растяжка спины', count: 234, duration: 45 },
      { name: 'Упражнения для осанки', count: 189, duration: 38 },
      { name: 'Кардио тренировка', count: 167, duration: 52 },
      { name: 'Силовой комплекс', count: 145, duration: 48 },
      { name: 'Йога для начинающих', count: 123, duration: 40 }
    ],
    sessionTrends: [
      { date: 'Пн', avgScore: 78, totalSessions: 156, totalDuration: 78 },
      { date: 'Вт', avgScore: 82, totalSessions: 189, totalDuration: 94 },
      { date: 'Ср', avgScore: 85, totalSessions: 210, totalDuration: 105 },
      { date: 'Чт', avgScore: 84, totalSessions: 245, totalDuration: 122 },
      { date: 'Пт', avgScore: 86, totalSessions: 278, totalDuration: 139 },
      { date: 'Сб', avgScore: 88, totalSessions: 210, totalDuration: 105 },
      { date: 'Вс', avgScore: 87, totalSessions: 178, totalDuration: 89 }
    ],
    geoDistribution: [
      { city: 'Москва', users: 523 },
      { city: 'Санкт-Петербург', users: 234 },
      { city: 'Новосибирск', users: 98 },
      { city: 'Екатеринбург', users: 76 },
      { city: 'Казань', users: 65 },
      { city: 'Нижний Новгород', users: 54 }
    ],
    lastUpdated: new Date().toISOString()
  });

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    setPeriodAnchorEl(null);
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
      value: analytics ? Math.round(analytics.sessionTrends.reduce((acc, curr) => acc + curr.avgScore, 0) / analytics.sessionTrends.length) : 0,
      change: '+5% за неделю',
      icon: <TrendingUpIcon />,
      color: '#8b5cf6'
    }
  ];

  const renderUserChart = () => (
    <Card sx={{ 
      bgcolor: theme.palette.mode === 'light'
        ? alpha(theme.palette.background.paper, 0.8)
        : alpha(theme.palette.background.paper, 0.4),
      border: `1px solid ${theme.palette.mode === 'light'
        ? 'rgba(0, 0, 0, 0.1)'
        : 'rgba(255, 255, 255, 0.1)'}`,
      borderRadius: 2,
      backdropFilter: 'blur(10px)',
      mb: 3
    }}>
      <CardContent>
        <Typography variant="h6" sx={{ 
          color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
          mb: 3,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <ShowChartIcon sx={{ color: theme.palette.primary.main }} />
          Динамика пользователей и упражнений
        </Typography>
        
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={analytics?.timelineData || []}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.2)} />
            <XAxis dataKey="date" stroke={theme.palette.text.secondary} />
            <YAxis yAxisId="left" stroke={theme.palette.text.secondary} />
            <YAxis yAxisId="right" orientation="right" stroke={theme.palette.text.secondary} />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8
              }}
            />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="users"
              fill={alpha(COLORS[0], 0.2)}
              stroke={COLORS[0]}
              name="Пользователи"
            />
            <Bar
              yAxisId="right"
              dataKey="exercises"
              fill={COLORS[2]}
              name="Упражнения"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="sessions"
              stroke={COLORS[1]}
              name="Сессии"
              strokeWidth={2}
              dot={{ fill: COLORS[1], r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderActivityChart = () => (
    <Card sx={{ 
      bgcolor: theme.palette.mode === 'light'
        ? alpha(theme.palette.background.paper, 0.8)
        : alpha(theme.palette.background.paper, 0.4),
      border: `1px solid ${theme.palette.mode === 'light'
        ? 'rgba(0, 0, 0, 0.1)'
        : 'rgba(255, 255, 255, 0.1)'}`,
      borderRadius: 2,
      backdropFilter: 'blur(10px)',
      mb: 3
    }}>
      <CardContent>
        <Typography variant="h6" sx={{ 
          color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
          mb: 3,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <ScheduleIcon sx={{ color: theme.palette.info.main }} />
          Активность по часам
        </Typography>
        
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={analytics?.userActivity || []}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.2)} />
            <XAxis 
              dataKey="hour" 
              stroke={theme.palette.text.secondary}
              tickFormatter={(value) => `${value}:00`}
            />
            <YAxis stroke={theme.palette.text.secondary} />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8
              }}
              formatter={(value: number) => [`${value} пользователей`, 'Активных']}
              labelFormatter={(label) => `${label}:00`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="activeUsers"
              stroke={COLORS[0]}
              fill={alpha(COLORS[0], 0.2)}
              name="Активные пользователи"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderSessionTrendsChart = () => (
    <Card sx={{ 
      bgcolor: theme.palette.mode === 'light'
        ? alpha(theme.palette.background.paper, 0.8)
        : alpha(theme.palette.background.paper, 0.4),
      border: `1px solid ${theme.palette.mode === 'light'
        ? 'rgba(0, 0, 0, 0.1)'
        : 'rgba(255, 255, 255, 0.1)'}`,
      borderRadius: 2,
      backdropFilter: 'blur(10px)',
      mb: 3
    }}>
      <CardContent>
        <Typography variant="h6" sx={{ 
          color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
          mb: 3,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <WhatshotIcon sx={{ color: theme.palette.warning.main }} />
          Качество тренировок
        </Typography>
        
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={analytics?.sessionTrends || []}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.2)} />
            <XAxis dataKey="date" stroke={theme.palette.text.secondary} />
            <YAxis yAxisId="left" stroke={theme.palette.text.secondary} domain={[0, 100]} />
            <YAxis yAxisId="right" orientation="right" stroke={theme.palette.text.secondary} />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8
              }}
            />
            <Legend />
            <Bar
              yAxisId="right"
              dataKey="totalSessions"
              fill={alpha(COLORS[2], 0.5)}
              name="Количество сессий"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="avgScore"
              stroke={COLORS[1]}
              name="Средний балл"
              strokeWidth={3}
              dot={{ fill: COLORS[1], r: 6, strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderTopExercisesChart = () => (
    <Card sx={{ 
      bgcolor: theme.palette.mode === 'light'
        ? alpha(theme.palette.background.paper, 0.8)
        : alpha(theme.palette.background.paper, 0.4),
      border: `1px solid ${theme.palette.mode === 'light'
        ? 'rgba(0, 0, 0, 0.1)'
        : 'rgba(255, 255, 255, 0.1)'}`,
      borderRadius: 2,
      backdropFilter: 'blur(10px)',
      height: '100%'
    }}>
      <CardContent>
        <Typography variant="h6" sx={{ 
          color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
          mb: 3,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <PieChartIcon sx={{ color: COLORS[4] }} />
          Популярные упражнения
        </Typography>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={analytics?.topExercises || []}
            layout="vertical"
            margin={{ left: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.2)} />
            <XAxis type="number" stroke={theme.palette.text.secondary} />
            <YAxis type="category" dataKey="name" stroke={theme.palette.text.secondary} width={100} />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8
              }}
            />
            <Bar dataKey="count" fill={COLORS[4]} name="Выполнений" radius={[0, 4, 4, 0]}>
              {analytics?.topExercises.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderGeoDistribution = () => (
    <Card sx={{ 
      bgcolor: theme.palette.mode === 'light'
        ? alpha(theme.palette.background.paper, 0.8)
        : alpha(theme.palette.background.paper, 0.4),
      border: `1px solid ${theme.palette.mode === 'light'
        ? 'rgba(0, 0, 0, 0.1)'
        : 'rgba(255, 255, 255, 0.1)'}`,
      borderRadius: 2,
      backdropFilter: 'blur(10px)',
      height: '100%'
    }}>
      <CardContent>
        <Typography variant="h6" sx={{ 
          color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
          mb: 3,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <PieChartIcon sx={{ color: COLORS[0] }} />
          Геораспределение
        </Typography>
        
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={analytics?.geoDistribution || []}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="users"
            >
              {(analytics?.geoDistribution || []).map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8
              }}
              formatter={(value: number, name: string) => [`${value} пользователей`, name]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
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
        bgcolor: theme.palette.mode === 'light'
          ? alpha(theme.palette.background.paper, 0.8)
          : alpha(theme.palette.background.paper, 0.4),
        border: `1px solid ${theme.palette.mode === 'light'
          ? 'rgba(0, 0, 0, 0.1)'
          : 'rgba(255, 255, 255, 0.1)'}`,
        borderRadius: 2,
        backdropFilter: 'blur(10px)',
        height: '100%'
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ 
            color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
            mb: 3,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <SecurityIcon sx={{ color: COLORS[0] }} />
            Распределение по ролям
          </Typography>
          
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={roleData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {roleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          
          <Stack spacing={1} sx={{ mt: 2 }}>
            {roleData.map((role) => (
              <Stack key={role.name} direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: role.color }} />
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    {role.name}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                  {role.value}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  if (loading && !stats) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: theme.palette.mode === 'light' 
          ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
          : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} sx={{ color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
            Загрузка статистики...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: theme.palette.mode === 'light' 
        ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
        : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      py: 4,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Фоновые элементы */}
      <Box sx={{
        position: 'absolute',
        top: -100,
        right: -100,
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0)} 70%)`,
        zIndex: 0
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: -200,
        left: -100,
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.main, 0)} 70%)`,
        zIndex: 0
      }} />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Заголовок */}
        <Box sx={{ mb: 4 }}>
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            justifyContent="space-between" 
            alignItems={{ xs: 'flex-start', md: 'center' }} 
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography 
                variant="h3" 
                component="h1" 
                fontWeight="bold" 
                gutterBottom
                sx={{ 
                  color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                  fontSize: { xs: '2rem', md: '2.5rem' },
                  background: theme.palette.mode === 'light'
                    ? 'linear-gradient(90deg, #4f46e5, #7c3aed)'
                    : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Панель администратора
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '1rem', md: '1.25rem' }
                }}
              >
                Обзор системы и аналитика
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<BarChartIcon />}
                onClick={() => navigate('/admin/users')}
                sx={{ color: theme.palette.text.secondary }}
              >
                Пользователи
              </Button>
              
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {refreshing ? 'Обновление...' : 'Обновить'}
              </Button>
            </Stack>
          </Stack>
        </Box>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 4, borderRadius: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        
        {/* Карточки статистики */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statCards.map((card, index) => (
            <Grid item xs={12} sm={6} lg={3} key={index}>
              <Card 
                sx={{ 
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: 2,
                  cursor: card.onClick ? 'pointer' : 'default',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: card.onClick ? 'translateY(-4px)' : 'none',
                    boxShadow: `0 12px 30px ${alpha(card.color, 0.2)}`,
                    borderColor: card.color
                  }
                }}
                onClick={card.onClick}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                        {card.title}
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                        {card.value}
                      </Typography>
                      <Chip
                        label={card.change}
                        size="small"
                        sx={{ mt: 1, bgcolor: alpha(card.color, 0.1), color: card.color }}
                      />
                    </Box>
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 2, 
                      bgcolor: alpha(card.color, 0.1),
                      color: card.color
                    }}>
                      {card.icon}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Быстрые действия */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
            Быстрые действия
          </Typography>
          <Grid container spacing={3}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} lg={3} key={index}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha(action.color, 0.3)}`,
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 30px ${alpha(action.color, 0.2)}`
                    }
                  }}
                  onClick={action.onClick}
                >
                  <CardContent>
                    <Box sx={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: 2, 
                      background: action.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2
                    }}>
                      {action.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
                      {action.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      {action.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Вкладки с графиками */}
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
                  height: '100%'
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                      Типы упражнений
                    </Typography>
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
                        <Box key={type} sx={{ mb: 2 }}>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              {typeNames[type] || type}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                              {count} ({percentage}%)
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                      );
                    })}
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

        {/* Информация об обновлении */}
        {analytics && (
          <Paper sx={{ 
            mt: 4, 
            p: 2, 
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Последнее обновление: {new Date(analytics.lastUpdated).toLocaleString('ru-RU')}
            </Typography>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default AdminDashboard;