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
  useMediaQuery
} from '@mui/material';
import {
  People as PeopleIcon,
  FitnessCenter as FitnessCenterIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  PersonAdd as PersonAddIcon,
  NoteAdd as NoteAddIcon,
  Groups as GroupsIcon,
  SportsGymnastics as SportsGymnasticsIcon,
  Security as SecurityIcon,
  AccountCircle as AccountCircleIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { adminApi } from '../../api/admin';

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
  lastUpdated: string;
}

const AdminDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setError(null);
      const response = await adminApi.getAdminStats();
      setStats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при загрузке статистики');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
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
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      onClick: () => navigate('/admin/exercises/create')
    },
    {
      title: 'Управление пользователями',
      description: 'Просмотр и редактирование всех пользователей',
      icon: <GroupsIcon />,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
      onClick: () => navigate('/admin/users')
    },
    {
      title: 'Управление упражнениями',
      description: 'Редактирование упражнений и категорий',
      icon: <SportsGymnasticsIcon />,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
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
      title: 'Статус системы',
      value: 'Активна',
      change: '24/7 доступ',
      icon: <AccessTimeIcon />,
      color: '#3b82f6'
    }
  ];

  const roleData = {
    admin: { label: 'Администраторы', color: '#ef4444', icon: <SecurityIcon /> },
    user: { label: 'Пользователи', color: '#3b82f6', icon: <AccountCircleIcon /> },
    guest: { label: 'Гости', color: '#6b7280', icon: <PeopleIcon /> }
  };

  const exerciseData = {
    stretching: { label: 'Растяжка', color: '#10b981', icon: '🧘' },
    cardio: { label: 'Кардио', color: '#ef4444', icon: '🏃' },
    strength: { label: 'Силовые', color: '#f59e0b', icon: '💪' },
    posture: { label: 'Осанка', color: '#0ea5e9', icon: '🚶' },
    flexibility: { label: 'Гибкость', color: '#8b5cf6', icon: '🤸' }
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
          <Typography variant="h6" sx={{ 
            color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8'
          }}>
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
        <Box sx={{ mb: 6 }}>
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
                  color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                  fontSize: { xs: '1rem', md: '1.25rem' }
                }}
              >
                Обзор системы и управление контентом
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<BarChartIcon />}
                onClick={() => navigate('/admin/users')}
                sx={{
                  color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                  borderColor: theme.palette.mode === 'light' 
                    ? 'rgba(0, 0, 0, 0.2)' 
                    : 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.1)
                  }
                }}
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
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                    boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.4)}`,
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
            sx={{ 
              mb: 4,
              borderRadius: 2,
              bgcolor: theme.palette.mode === 'light' 
                ? alpha(theme.palette.error.main, 0.1)
                : alpha(theme.palette.error.main, 0.2),
              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
              color: theme.palette.mode === 'light' 
                ? theme.palette.error.dark
                : theme.palette.error.light
            }}
            onClose={() => setError(null)}
          >
            <Typography fontWeight="medium">{error}</Typography>
          </Alert>
        )}
        
        <Box sx={{ mb: 8 }}>
          <Typography 
            variant="h5" 
            component="h2" 
            gutterBottom 
            sx={{ 
              mb: 4,
              color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
              fontWeight: 600,
              fontSize: '1.5rem'
            }}
          >
            Быстрые действия
          </Typography>
          <Grid container spacing={3}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} lg={3} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    bgcolor: theme.palette.mode === 'light'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : alpha(theme.palette.background.paper, 0.4),
                    border: `1px solid ${theme.palette.mode === 'light'
                      ? 'rgba(0, 0, 0, 0.1)'
                      : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: 2,
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: action.color,
                      boxShadow: `0 12px 30px ${alpha(action.color, 0.2)}`
                    }
                  }}
                  onClick={action.onClick}
                >
                  <CardContent sx={{ p: 3, height: '100%' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        background: action.gradient,
                        color: 'white',
                        mb: 3
                      }}
                    >
                      {React.cloneElement(action.icon, { 
                        sx: { fontSize: 28 }
                      })}
                    </Box>
                    <Typography 
                      variant="h6" 
                      component="h3"
                      sx={{ 
                        color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                        fontWeight: 600,
                        mb: 1,
                        fontSize: '1.125rem'
                      }}
                    >
                      {action.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                        lineHeight: 1.6
                      }}
                    >
                      {action.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
        
        {stats && (
          <>
            <Box sx={{ mb: 6 }}>
              <Typography 
                variant="h5" 
                component="h2"
                sx={{ 
                  mb: 4,
                  color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                  fontWeight: 600,
                  fontSize: '1.5rem'
                }}
              >
                Общая статистика
              </Typography>
              
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {statCards.map((card, index) => (
                  <Grid item xs={12} sm={6} lg={3} key={index}>
                    <Card 
                      sx={{ 
                        bgcolor: theme.palette.mode === 'light'
                          ? alpha(theme.palette.background.paper, 0.8)
                          : alpha(theme.palette.background.paper, 0.4),
                        border: `1px solid ${theme.palette.mode === 'light'
                          ? 'rgba(0, 0, 0, 0.1)'
                          : 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: 2,
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        cursor: card.onClick ? 'pointer' : 'default',
                        '&:hover': {
                          borderColor: card.color,
                          boxShadow: `0 8px 25px ${alpha(card.color, 0.15)}`,
                          transform: card.onClick ? 'translateY(-2px)' : 'none'
                        }
                      }}
                      onClick={card.onClick}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                          <Box>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                                fontWeight: 500,
                                fontSize: '0.875rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}
                            >
                              {card.title}
                            </Typography>
                            <Typography 
                              variant="h3" 
                              component="div" 
                              sx={{ 
                                color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                                fontWeight: 700,
                                mt: 1,
                                fontSize: '2.5rem'
                              }}
                            >
                              {card.value}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 48,
                              height: 48,
                              borderRadius: '12px',
                              bgcolor: alpha(card.color, 0.1),
                              color: card.color
                            }}
                          >
                            {card.icon}
                          </Box>
                        </Stack>
                        <Chip
                          label={card.change}
                          size="small"
                          sx={{
                            bgcolor: alpha(card.color, 0.1),
                            color: card.color,
                            fontWeight: 500,
                            border: `1px solid ${alpha(card.color, 0.3)}`,
                            borderRadius: '6px'
                          }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Детальная статистика */}
              <Grid container spacing={3}>
                {/* Распределение по ролям */}
                <Grid item xs={12} lg={6}>
                  <Card 
                    sx={{ 
                      bgcolor: theme.palette.mode === 'light'
                        ? alpha(theme.palette.background.paper, 0.8)
                        : alpha(theme.palette.background.paper, 0.4),
                      border: `1px solid ${theme.palette.mode === 'light'
                        ? 'rgba(0, 0, 0, 0.1)'
                        : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: 2,
                      backdropFilter: 'blur(10px)',
                      height: '100%'
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Typography 
                        variant="h6" 
                        gutterBottom
                        sx={{ 
                          color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                          fontWeight: 600,
                          mb: 3,
                          fontSize: '1.25rem'
                        }}
                      >
                        Распределение по ролям
                      </Typography>
                      
                      <Stack spacing={3}>
                        {Object.entries(stats.users.roles).map(([role, count]) => {
                          const percentage = getPercentage(count || 0, stats.users.total);
                          const roleInfo = roleData[role as keyof typeof roleData];
                          
                          if (!roleInfo) return null;
                          
                          return (
                            <Box key={role}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: 36,
                                      height: 36,
                                      borderRadius: '8px',
                                      bgcolor: alpha(roleInfo.color, 0.1),
                                      color: roleInfo.color
                                    }}
                                  >
                                    {roleInfo.icon}
                                  </Box>
                                  <Box>
                                    <Typography variant="body1" sx={{ color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff', fontWeight: 500 }}>
                                      {roleInfo.label}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8', fontSize: '0.875rem' }}>
                                      {count} пользователей
                                    </Typography>
                                  </Box>
                                </Stack>
                                <Typography 
                                  variant="h6" 
                                  sx={{ 
                                    color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                                    fontWeight: 600,
                                    minWidth: '60px',
                                    textAlign: 'right'
                                  }}
                                >
                                  {percentage}%
                                </Typography>
                              </Stack>
                              <LinearProgress
                                variant="determinate"
                                value={percentage}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: alpha(roleInfo.color, 0.1),
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 3,
                                    background: `linear-gradient(90deg, ${roleInfo.color}, ${alpha(roleInfo.color, 0.8)})`
                                  }
                                }}
                              />
                            </Box>
                          );
                        })}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Типы упражнений */}
                <Grid item xs={12} lg={6}>
                  <Card 
                    sx={{ 
                      bgcolor: theme.palette.mode === 'light'
                        ? alpha(theme.palette.background.paper, 0.8)
                        : alpha(theme.palette.background.paper, 0.4),
                      border: `1px solid ${theme.palette.mode === 'light'
                        ? 'rgba(0, 0, 0, 0.1)'
                        : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: 2,
                      backdropFilter: 'blur(10px)',
                      height: '100%'
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Typography 
                        variant="h6" 
                        gutterBottom
                        sx={{ 
                          color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                          fontWeight: 600,
                          mb: 3,
                          fontSize: '1.25rem'
                        }}
                      >
                        Типы упражнений
                      </Typography>
                      
                      <Stack spacing={3}>
                        {Object.entries(stats.exercises.types).map(([type, count]) => {
                          const percentage = getPercentage(count || 0, stats.exercises.total);
                          const typeInfo = exerciseData[type as keyof typeof exerciseData];
                          
                          if (!typeInfo) return null;
                          
                          return (
                            <Box key={type}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: 36,
                                      height: 36,
                                      borderRadius: '8px',
                                      bgcolor: alpha(typeInfo.color, 0.1),
                                      color: typeInfo.color,
                                      fontSize: '1.25rem'
                                    }}
                                  >
                                    {typeInfo.icon}
                                  </Box>
                                  <Box>
                                    <Typography variant="body1" sx={{ color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff', fontWeight: 500 }}>
                                      {typeInfo.label}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8', fontSize: '0.875rem' }}>
                                      {count} упражнений
                                    </Typography>
                                  </Box>
                                </Stack>
                                <Typography 
                                  variant="h6" 
                                  sx={{ 
                                    color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                                    fontWeight: 600,
                                    minWidth: '60px',
                                    textAlign: 'right'
                                  }}
                                >
                                  {percentage}%
                                </Typography>
                              </Stack>
                              <LinearProgress
                                variant="determinate"
                                value={percentage}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: alpha(typeInfo.color, 0.1),
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 3,
                                    background: `linear-gradient(90deg, ${typeInfo.color}, ${alpha(typeInfo.color, 0.8)})`
                                  }
                                }}
                              />
                            </Box>
                          );
                        })}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            {/* Футер с информацией */}
            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: theme.palette.mode === 'light'
                  ? alpha(theme.palette.background.paper, 0.8)
                  : alpha(theme.palette.background.paper, 0.4),
                border: `1px solid ${theme.palette.mode === 'light'
                  ? 'rgba(0, 0, 0, 0.1)'
                  : 'rgba(255, 255, 255, 0.1)'}`,
                backdropFilter: 'blur(10px)'
              }}
            >
              <Stack 
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between" 
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={2}
              >
                <Stack spacing={0.5}>
                  <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8', fontWeight: 500 }}>
                    Последнее обновление
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff', fontWeight: 600 }}>
                    {new Date(stats.lastUpdated).toLocaleString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8' }}>
                    Данные обновляются автоматически
                  </Typography>
                  <IconButton
                    onClick={handleRefresh}
                    disabled={refreshing}
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                        transform: 'rotate(180deg)',
                        transition: 'transform 0.5s ease'
                      }
                    }}
                  >
                    {refreshing ? (
                      <CircularProgress size={20} sx={{ color: theme.palette.primary.main }} />
                    ) : (
                      <RefreshIcon />
                    )}
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>
          </>
        )}
      </Container>

      {/* Стили для анимации */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
    </Box>
  );
};

export default AdminDashboard;