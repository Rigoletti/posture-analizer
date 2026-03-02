import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Paper,
  alpha,
  InputAdornment,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Fade,
  useTheme,
  useMediaQuery
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Warning as WarningIcon,
  ModelTraining as ModelIcon,
  FitnessCenter as FitnessCenterIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  SportsGymnastics as SportsGymnasticsIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { adminApi } from '../../api/admin';

interface Exercise {
  _id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  duration: number;
  has3dModel: boolean;
  modelType?: string;
  modelFile?: {
    originalName: string;
    filename: string;
    path: string;
  };
  isActive: boolean;
  createdAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const ExerciseList: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [modelFilter, setModelFilter] = useState<string>('');
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExercises = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page,
        limit: pagination.limit
      };
      
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (difficultyFilter) params.difficulty = difficultyFilter;
      if (statusFilter) params.isActive = statusFilter === 'active';
      if (modelFilter) params.has3dModel = modelFilter === 'with-model';
      
      const response = await adminApi.getExercises(params);
      setExercises(response.data.exercises);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при загрузке упражнений');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [search, typeFilter, difficultyFilter, statusFilter, modelFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleTypeFilter = (e: SelectChangeEvent) => {
    setTypeFilter(e.target.value);
  };

  const handleDifficultyFilter = (e: SelectChangeEvent) => {
    setDifficultyFilter(e.target.value);
  };

  const handleStatusFilter = (e: SelectChangeEvent) => {
    setStatusFilter(e.target.value);
  };

  const handleModelFilter = (e: SelectChangeEvent) => {
    setModelFilter(e.target.value);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchExercises(pagination.page);
  };

  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setDifficultyFilter('');
    setStatusFilter('');
    setModelFilter('');
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    fetchExercises(newPage + 1);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
    fetchExercises(1);
  };

  const handleEditExercise = (exerciseId: string) => {
    navigate(`/admin/exercises/edit/${exerciseId}`);
  };

  const handleViewExercise = (exerciseId: string) => {
    navigate(`/exercises/${exerciseId}`);
  };

  const handleCreateExercise = () => {
    navigate('/admin/exercises/create');
  };

  const handleDeleteClick = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedExercise) return;
    
    try {
      setDeleting(true);
      await adminApi.deleteExercise(selectedExercise._id);
      setSuccess('Упражнение успешно удалено');
      setDeleteDialogOpen(false);
      setSelectedExercise(null);
      fetchExercises(pagination.page);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при удалении упражнения');
    } finally {
      setDeleting(false);
    }
  };

  const getTypeInfo = (type: string) => {
    const types: Record<string, { label: string; color: string; icon: JSX.Element }> = {
      stretching: { 
        label: 'Растяжка', 
        color: '#10b981', 
        icon: <SportsGymnasticsIcon sx={{ fontSize: 16 }} /> 
      },
      cardio: { 
        label: 'Кардио', 
        color: '#ef4444', 
        icon: <TimelineIcon sx={{ fontSize: 16 }} /> 
      },
      strength: { 
        label: 'Силовые', 
        color: '#f59e0b', 
        icon: <FitnessCenterIcon sx={{ fontSize: 16 }} /> 
      },
      posture: { 
        label: 'Осанка', 
        color: '#3b82f6', 
        icon: <AccessTimeIcon sx={{ fontSize: 16 }} /> 
      },
      flexibility: { 
        label: 'Гибкость', 
        color: '#8b5cf6', 
        icon: <SpeedIcon sx={{ fontSize: 16 }} /> 
      },
      warmup: { 
        label: 'Разминка', 
        color: '#06b6d4', 
        icon: <TimelineIcon sx={{ fontSize: 16 }} /> 
      },
      cooldown: { 
        label: 'Заминка', 
        color: '#6b7280', 
        icon: <TimelineIcon sx={{ fontSize: 16 }} /> 
      }
    };
    return types[type] || { label: type, color: '#6b7280', icon: <FitnessCenterIcon sx={{ fontSize: 16 }} /> };
  };

  const getDifficultyInfo = (difficulty: string) => {
    const difficulties: Record<string, { label: string; color: string }> = {
      beginner: { label: 'Начальный', color: '#10b981' },
      intermediate: { label: 'Средний', color: '#f59e0b' },
      advanced: { label: 'Продвинутый', color: '#ef4444' }
    };
    return difficulties[difficulty] || { label: difficulty, color: '#6b7280' };
  };

  const getModelTypeLabel = (modelType: string) => {
    const modelTypes: Record<string, string> = {
      'arm-stretching': 'Растяжка рук',
      'jumping-jacks': 'Прыжки Джек',
      'neck-stretch': 'Растяжка шеи',
      'bicycle-crunch': 'Велосипед',
      'burpee': 'Берпи',
      'capoeira': 'Капоэйра',
      'press': 'Пресс',
      'custom': 'Кастомная'
    };
    return modelTypes[modelType] || modelType;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading && exercises.length === 0) {
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
            Загрузка упражнений...
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
            spacing={3}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="h4" sx={{ 
                color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                mb: 1,
                fontWeight: 700,
                fontSize: { xs: '1.5rem', md: '1.75rem' }
              }}>
                🏋️ Управление упражнениями
              </Typography>
              <Typography variant="body1" sx={{ 
                color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8'
              }}>
                Всего упражнений: {pagination.total}
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateExercise}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                borderRadius: 2,
                px: 3,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.3)}`,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Новое упражнение
            </Button>
          </Stack>

          {/* Сообщения об ошибках/успехе */}
          <Fade in={!!error || !!success}>
            <Box>
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'light' 
                      ? alpha(theme.palette.error.main, 0.1)
                      : alpha(theme.palette.error.main, 0.2),
                    border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                    color: theme.palette.mode === 'light' 
                      ? theme.palette.error.dark
                      : theme.palette.error.light,
                    '& .MuiAlert-icon': {
                      color: theme.palette.error.main
                    }
                  }}
                  onClose={() => setError(null)}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {error}
                  </Typography>
                </Alert>
              )}
              
              {success && (
                <Alert 
                  severity="success" 
                  sx={{ 
                    mb: 3,
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'light' 
                      ? alpha(theme.palette.success.main, 0.1)
                      : alpha(theme.palette.success.main, 0.2),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                    color: theme.palette.mode === 'light' 
                      ? theme.palette.success.dark
                      : theme.palette.success.light,
                    '& .MuiAlert-icon': {
                      color: theme.palette.success.main
                    }
                  }}
                  onClose={() => setSuccess(null)}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {success}
                  </Typography>
                </Alert>
              )}
            </Box>
          </Fade>

          {/* Фильтры */}
          <Paper sx={{ 
            p: { xs: 2, md: 3 }, 
            mb: 3,
            bgcolor: theme.palette.mode === 'light'
              ? alpha(theme.palette.background.paper, 0.8)
              : alpha(theme.palette.background.paper, 0.4),
            border: `1px solid ${theme.palette.mode === 'light'
              ? 'rgba(0, 0, 0, 0.1)'
              : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: 2,
            backdropFilter: 'blur(10px)'
          }}>
            <Stack spacing={3}>
              <Stack 
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                alignItems={{ xs: 'stretch', md: 'center' }}
              >
                <TextField
                  fullWidth
                  placeholder="Поиск по названию или описанию..."
                  value={search}
                  onChange={handleSearch}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8' }} />
                      </InputAdornment>
                    ),
                    endAdornment: search ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setSearch('')}
                          sx={{ color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8' }}
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                    sx: {
                      bgcolor: theme.palette.mode === 'light'
                        ? alpha('#ffffff', 0.8)
                        : 'rgba(15, 23, 42, 0.8)',
                      color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'light'
                          ? 'rgba(0, 0, 0, 0.1)'
                          : 'rgba(255, 255, 255, 0.1)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main
                      }
                    }
                  }}
                />
                
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ minWidth: { md: '600px' } }}
                >
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel sx={{ color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8' }}>
                      Тип
                    </InputLabel>
                    <Select
                      value={typeFilter}
                      onChange={handleTypeFilter}
                      label="Тип"
                      startAdornment={
                        <InputAdornment position="start">
                          <FilterListIcon sx={{ color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8', mr: 1 }} />
                        </InputAdornment>
                      }
                      sx={{
                        bgcolor: theme.palette.mode === 'light'
                          ? alpha('#ffffff', 0.8)
                          : 'rgba(15, 23, 42, 0.8)',
                        color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.mode === 'light'
                            ? 'rgba(0, 0, 0, 0.1)'
                            : 'rgba(255, 255, 255, 0.1)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main
                        },
                        '& .MuiSvgIcon-root': {
                          color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                        }
                      }}
                    >
                      <MenuItem value="">Все типы</MenuItem>
                      <MenuItem value="stretching">Растяжка</MenuItem>
                      <MenuItem value="cardio">Кардио</MenuItem>
                      <MenuItem value="strength">Силовые</MenuItem>
                      <MenuItem value="posture">Осанка</MenuItem>
                      <MenuItem value="flexibility">Гибкость</MenuItem>
                      <MenuItem value="warmup">Разминка</MenuItem>
                      <MenuItem value="cooldown">Заминка</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel sx={{ color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8' }}>
                      Сложность
                    </InputLabel>
                    <Select
                      value={difficultyFilter}
                      onChange={handleDifficultyFilter}
                      label="Сложность"
                      sx={{
                        bgcolor: theme.palette.mode === 'light'
                          ? alpha('#ffffff', 0.8)
                          : 'rgba(15, 23, 42, 0.8)',
                        color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.mode === 'light'
                            ? 'rgba(0, 0, 0, 0.1)'
                            : 'rgba(255, 255, 255, 0.1)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main
                        }
                      }}
                    >
                      <MenuItem value="">Все уровни</MenuItem>
                      <MenuItem value="beginner">Начальный</MenuItem>
                      <MenuItem value="intermediate">Средний</MenuItem>
                      <MenuItem value="advanced">Продвинутый</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel sx={{ color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8' }}>
                      3D Модель
                    </InputLabel>
                    <Select
                      value={modelFilter}
                      onChange={handleModelFilter}
                      label="3D Модель"
                      sx={{
                        bgcolor: theme.palette.mode === 'light'
                          ? alpha('#ffffff', 0.8)
                          : 'rgba(15, 23, 42, 0.8)',
                        color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.mode === 'light'
                            ? 'rgba(0, 0, 0, 0.1)'
                            : 'rgba(255, 255, 255, 0.1)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main
                        }
                      }}
                    >
                      <MenuItem value="">Все модели</MenuItem>
                      <MenuItem value="with-model">С 3D моделью</MenuItem>
                      <MenuItem value="without-model">Без 3D модели</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel sx={{ color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8' }}>
                      Статус
                    </InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={handleStatusFilter}
                      label="Статус"
                      sx={{
                        bgcolor: theme.palette.mode === 'light'
                          ? alpha('#ffffff', 0.8)
                          : 'rgba(15, 23, 42, 0.8)',
                        color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.mode === 'light'
                            ? 'rgba(0, 0, 0, 0.1)'
                            : 'rgba(255, 255, 255, 0.1)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main
                        }
                      }}
                    >
                      <MenuItem value="">Все статусы</MenuItem>
                      <MenuItem value="active">Активные</MenuItem>
                      <MenuItem value="inactive">Неактивные</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Stack>
              
              <Stack direction="row" spacing={2} justifyContent="space-between">
                <Stack direction="row" spacing={1}>
                  <Button
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    disabled={refreshing}
                    variant="outlined"
                    sx={{
                      color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
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
                    {refreshing ? 'Обновление...' : 'Обновить'}
                  </Button>
                  
                  {(search || typeFilter || difficultyFilter || statusFilter || modelFilter) && (
                    <Button
                      startIcon={<ClearIcon />}
                      onClick={handleClearFilters}
                      variant="outlined"
                      sx={{
                        color: '#f59e0b',
                        borderColor: alpha('#f59e0b', 0.3),
                        '&:hover': {
                          borderColor: '#f59e0b',
                          bgcolor: alpha('#f59e0b', 0.1)
                        }
                      }}
                    >
                      Очистить фильтры
                    </Button>
                  )}
                </Stack>
                
                <Typography variant="body2" sx={{ 
                  color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                  alignSelf: 'center'
                }}>
                  Показано: {exercises.length} из {pagination.total}
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        </Box>

        {/* Таблица упражнений */}
        <Card sx={{ 
          bgcolor: theme.palette.mode === 'light'
            ? alpha(theme.palette.background.paper, 0.8)
            : alpha(theme.palette.background.paper, 0.4),
          border: `1px solid ${theme.palette.mode === 'light'
            ? 'rgba(0, 0, 0, 0.1)'
            : 'rgba(255, 255, 255, 0.1)'}`,
          borderRadius: 2,
          backdropFilter: 'blur(10px)',
          overflow: 'hidden'
        }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={60} sx={{ color: theme.palette.primary.main, mb: 2 }} />
              <Typography sx={{ 
                color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8'
              }}>
                Загрузка упражнений...
              </Typography>
            </Box>
          ) : exercises.length === 0 ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <FitnessCenterIcon sx={{ 
                fontSize: 64, 
                color: theme.palette.mode === 'light' ? '#cbd5e1' : '#475569',
                mb: 2 
              }} />
              <Typography variant="h6" sx={{ 
                color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                mb: 1
              }}>
                Упражнения не найдены
              </Typography>
              <Typography variant="body2" sx={{ 
                color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                mb: 3
              }}>
                {search || typeFilter || difficultyFilter || statusFilter || modelFilter
                  ? 'Попробуйте изменить параметры поиска'
                  : 'Пока нет созданных упражнений'}
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleCreateExercise}
                variant="contained"
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                  }
                }}
              >
                Создать упражнение
              </Button>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ 
                      bgcolor: theme.palette.mode === 'light'
                        ? alpha('#f8fafc', 0.9)
                        : 'rgba(15, 23, 42, 0.9)'
                    }}>
                      <TableCell sx={{ 
                        color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                        fontWeight: 600, 
                        py: 2,
                        width: '25%'
                      }}>
                        Название
                      </TableCell>
                      <TableCell sx={{ 
                        color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                        fontWeight: 600, 
                        py: 2,
                        width: '12%'
                      }}>
                        Тип
                      </TableCell>
                      <TableCell sx={{ 
                        color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                        fontWeight: 600, 
                        py: 2,
                        width: '12%'
                      }}>
                        Сложность
                      </TableCell>
                      <TableCell sx={{ 
                        color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                        fontWeight: 600, 
                        py: 2,
                        width: '10%'
                      }}>
                        Длительность
                      </TableCell>
                      <TableCell sx={{ 
                        color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                        fontWeight: 600, 
                        py: 2,
                        width: '15%'
                      }}>
                        3D Модель
                      </TableCell>
                      <TableCell sx={{ 
                        color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                        fontWeight: 600, 
                        py: 2,
                        width: '10%'
                      }}>
                        Статус
                      </TableCell>
                      <TableCell sx={{ 
                        color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                        fontWeight: 600, 
                        py: 2,
                        width: '10%'
                      }}>
                        Создано
                      </TableCell>
                      <TableCell sx={{ 
                        color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                        fontWeight: 600, 
                        py: 2,
                        width: '6%'
                      }} align="center">
                        Действия
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {exercises.map((exercise) => {
                      const typeInfo = getTypeInfo(exercise.type);
                      const difficultyInfo = getDifficultyInfo(exercise.difficulty);
                      
                      return (
                        <TableRow 
                          key={exercise._id}
                          sx={{ 
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.05)
                            }
                          }}
                        >
                          <TableCell sx={{ py: 2 }}>
                            <Stack spacing={0.5}>
                              <Typography variant="body2" sx={{ 
                                color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                                fontWeight: 500,
                                fontSize: '0.875rem'
                              }}>
                                {exercise.title}
                              </Typography>
                              <Typography variant="caption" sx={{ 
                                color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                                fontSize: '0.75rem'
                              }}>
                                {exercise.description.substring(0, 50)}...
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Chip
                              icon={typeInfo.icon}
                              label={typeInfo.label}
                              size="small"
                              sx={{
                                bgcolor: alpha(typeInfo.color, 0.1),
                                color: typeInfo.color,
                                border: `1px solid ${alpha(typeInfo.color, 0.3)}`,
                                fontWeight: 500,
                                fontSize: '0.75rem',
                                '& .MuiChip-icon': {
                                  color: typeInfo.color
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Chip
                              label={difficultyInfo.label}
                              size="small"
                              sx={{
                                bgcolor: alpha(difficultyInfo.color, 0.1),
                                color: difficultyInfo.color,
                                border: `1px solid ${alpha(difficultyInfo.color, 0.3)}`,
                                fontWeight: 500,
                                fontSize: '0.75rem'
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body2" sx={{ 
                              color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                              fontSize: '0.875rem'
                            }}>
                              {exercise.duration} мин
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            {exercise.has3dModel ? (
                              <Stack spacing={0.5}>
                                <Chip
                                  icon={<ModelIcon sx={{ fontSize: 14 }} />}
                                  label={getModelTypeLabel(exercise.modelType || 'custom')}
                                  size="small"
                                  sx={{
                                    bgcolor: alpha('#10b981', 0.1),
                                    color: '#10b981',
                                    border: `1px solid ${alpha('#10b981', 0.3)}`,
                                    fontWeight: 500,
                                    fontSize: '0.75rem',
                                    maxWidth: '100%',
                                    '& .MuiChip-label': {
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }
                                  }}
                                />
                                {exercise.modelFile && (
                                  <Typography variant="caption" sx={{ 
                                    color: theme.palette.mode === 'light' ? '#94a3b8' : '#64748b',
                                    fontSize: '0.7rem',
                                    display: 'block'
                                  }}>
                                    {exercise.modelFile.originalName}
                                  </Typography>
                                )}
                              </Stack>
                            ) : (
                              <Chip
                                label="Нет модели"
                                size="small"
                                sx={{
                                  bgcolor: alpha('#6b7280', 0.1),
                                  color: '#6b7280',
                                  border: `1px solid ${alpha('#6b7280', 0.3)}`,
                                  fontWeight: 500,
                                  fontSize: '0.75rem'
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Chip
                              label={exercise.isActive ? 'Активно' : 'Неактивно'}
                              size="small"
                              sx={{
                                bgcolor: alpha(exercise.isActive ? '#10b981' : '#ef4444', 0.1),
                                color: exercise.isActive ? '#10b981' : '#ef4444',
                                border: `1px solid ${alpha(exercise.isActive ? '#10b981' : '#ef4444', 0.3)}`,
                                fontWeight: 500,
                                fontSize: '0.75rem'
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Stack spacing={0.5}>
                              <Typography variant="body2" sx={{ 
                                color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                                fontSize: '0.875rem'
                              }}>
                                {formatDate(exercise.createdAt)}
                              </Typography>
                              <Typography variant="caption" sx={{ 
                                color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                                fontSize: '0.75rem'
                              }}>
                                {exercise.createdBy?.firstName 
                                  ? `${exercise.createdBy.firstName} ${exercise.createdBy.lastName || ''}`
                                  : 'Система'}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 2 }}>
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title="Просмотр">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewExercise(exercise._id)}
                                  sx={{
                                    color: '#3b82f6',
                                    bgcolor: alpha('#3b82f6', 0.1),
                                    '&:hover': { 
                                      bgcolor: alpha('#3b82f6', 0.2),
                                      transform: 'scale(1.1)'
                                    }
                                  }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Редактировать">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditExercise(exercise._id)}
                                  sx={{
                                    color: '#f59e0b',
                                    bgcolor: alpha('#f59e0b', 0.1),
                                    '&:hover': { 
                                      bgcolor: alpha('#f59e0b', 0.2),
                                      transform: 'scale(1.1)'
                                    }
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Удалить">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(exercise)}
                                  sx={{
                                    color: '#ef4444',
                                    bgcolor: alpha('#ef4444', 0.1),
                                    '&:hover': { 
                                      bgcolor: alpha('#ef4444', 0.2),
                                      transform: 'scale(1.1)'
                                    }
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
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
              
              <TablePagination
                rowsPerPageOptions={[10, 20, 50, 100]}
                component="div"
                count={pagination.total}
                rowsPerPage={pagination.limit}
                page={pagination.page - 1}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                labelRowsPerPage="Строк на странице:"
                labelDisplayedRows={({ from, to, count }) => 
                  `${from}-${to} из ${count !== -1 ? count : `больше чем ${to}`}`
                }
                sx={{
                  color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                  },
                  '& .MuiSelect-select': {
                    color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff'
                  },
                  '& .MuiSvgIcon-root': {
                    color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                  },
                  '& .MuiButtonBase-root': {
                    color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                    '&.Mui-disabled': {
                      color: theme.palette.mode === 'light' ? '#cbd5e1' : '#475569'
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }
                }}
              />
            </>
          )}
        </Card>
      </Container>

      {/* Диалог подтверждения удаления */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'light' ? '#ffffff' : '#1e293b',
            color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
            borderRadius: 2,
            width: '100%',
            maxWidth: '400px'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
          pb: 2,
          color: 'inherit',
          fontWeight: 600
        }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <WarningIcon sx={{ color: theme.palette.error.main }} />
            <span>Подтверждение удаления</span>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          {selectedExercise && (
            <>
              <Typography sx={{ color: 'inherit', mb: 2 }}>
                Вы уверены, что хотите удалить упражнение <strong>{selectedExercise.title}</strong>?
              </Typography>
              
              {selectedExercise.has3dModel && selectedExercise.modelFile && (
                <Box sx={{ 
                  p: 2, 
                  mb: 2,
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5
                }}>
                  <WarningIcon sx={{ color: theme.palette.warning.main }} />
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.warning.main,
                    fontWeight: 500
                  }}>
                    3D модель также будет удалена
                  </Typography>
                </Box>
              )}
              
              <Alert 
                severity="warning" 
                sx={{ 
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                  color: theme.palette.mode === 'light' 
                    ? theme.palette.warning.dark
                    : theme.palette.warning.light
                }}
              >
                <Typography variant="caption">
                  Это действие нельзя отменить.
                </Typography>
              </Alert>
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            sx={{
              color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
              '&:hover': {
                color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                backgroundColor: alpha(theme.palette.text.primary, 0.1)
              }
            }}
          >
            Отмена
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            disabled={deleting}
            sx={{
              bgcolor: theme.palette.error.main,
              color: 'white',
              px: 3,
              '&:hover': {
                bgcolor: theme.palette.error.dark,
                boxShadow: `0 4px 20px ${alpha(theme.palette.error.main, 0.3)}`
              },
              '&.Mui-disabled': {
                bgcolor: theme.palette.mode === 'light' 
                  ? alpha(theme.palette.error.main, 0.3)
                  : alpha(theme.palette.error.main, 0.2),
                color: theme.palette.mode === 'light' 
                  ? alpha('#ffffff', 0.5)
                  : alpha(theme.palette.error.light, 0.5)
              }
            }}
          >
            {deleting ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={16} sx={{ color: 'white' }} />
                <span>Удаление...</span>
              </Stack>
            ) : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default ExerciseList;