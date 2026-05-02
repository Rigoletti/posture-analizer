import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  Switch,
  FormControlLabel,
  Tooltip,
  Grid,
  Paper,
  alpha,
  InputAdornment,
  Autocomplete,
  CircularProgress,
  TablePagination,
  Divider,
  Fade,
  LinearProgress,
  Snackbar,
  Slider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  FitnessCenter as FitnessCenterIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  PriorityHigh as PriorityHighIcon,
  Description as DescriptionIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { adminApi } from '../../api/admin';

interface Recommendation {
  _id: string;
  problemType: string;
  exerciseId: {
    _id: string;
    title: string;
    type: string;
    difficulty: string;
    duration: number;
    description: string;
    benefits?: string[];
    instructions?: string[];
  };
  priority: number;
  description: string;
  isActive: boolean;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ExerciseOption {
  _id: string;
  title: string;
  type: string;
  duration: number;
  difficulty: string;
  description: string;
  benefits?: string[];
  instructions?: string[];
}

interface Statistics {
  overview: {
    totalRecommendations: number;
    activeRecommendations: number;
    avgPriority: number;
  };
  problemStats: Array<{
    _id: string;
    count: number;
    activeCount: number;
    avgPriority: number;
  }>;
  lastUpdated: string;
}

const RecommendationsManager: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentRecommendation, setCurrentRecommendation] = useState<Recommendation | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Recommendation | null>(null);
  
  const [formData, setFormData] = useState({
    problemType: '',
    exerciseId: '',
    priority: 5,
    description: '',
    isActive: true
  });

  const [availableExercises, setAvailableExercises] = useState<ExerciseOption[]>([]);
  const [allExercises, setAllExercises] = useState<ExerciseOption[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [problemTypeFilter, setProblemTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [stats, setStats] = useState<Statistics | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const problemTypes = [
    { value: 'shoulders', label: 'Проблемы с плечами', color: '#ef4444', icon: '💪' },
    { value: 'head', label: 'Проблемы с положением головы', color: '#3b82f6', icon: '👤' },
    { value: 'hips', label: 'Проблемы с положением таза', color: '#10b981', icon: '🦵' },
    { value: 'general_posture', label: 'Общие проблемы с осанкой', color: '#f59e0b', icon: '🚶' },
    { value: 'balance', label: 'Нарушение баланса', color: '#8b5cf6', icon: '⚖️' },
    { value: 'flexibility', label: 'Недостаточная гибкость', color: '#ec4899', icon: '🤸' }
  ];

  const difficulties = {
    beginner: { label: 'Начальный', color: '#10b981' },
    intermediate: { label: 'Средний', color: '#f59e0b' },
    advanced: { label: 'Продвинутый', color: '#ef4444' }
  };

  const exerciseTypes = {
    stretching: { label: 'Растяжка', color: '#8b5cf6' },
    cardio: { label: 'Кардио', color: '#ef4444' },
    strength: { label: 'Силовые', color: '#3b82f6' },
    posture: { label: 'Осанка', color: '#10b981' },
    flexibility: { label: 'Гибкость', color: '#ec4899' },
    warmup: { label: 'Разминка', color: '#f59e0b' },
    cooldown: { label: 'Заминка', color: '#6b7280' }
  };

  const loadRecommendations = async (pageNum: number = page, limit: number = rowsPerPage) => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page: pageNum + 1,
        limit
      };
      
      if (problemTypeFilter !== 'all') {
        params.problemType = problemTypeFilter;
      }
      
      if (statusFilter !== 'all') {
        params.isActive = statusFilter === 'active';
      }
      
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      console.log('Loading recommendations with params:', params);
      
      const response = await adminApi.getRecommendations(params);
      console.log('Recommendations response:', response);
      
      if (response.success) {
        setRecommendations(response.data.recommendations || []);
        setTotalCount(response.data.pagination?.total || 0);
      } else {
        throw new Error(response.error || 'Ошибка загрузки рекомендаций');
      }
      
    } catch (err: any) {
      console.error('Error loading recommendations:', err);
      setError(err.message || 'Ошибка при загрузке рекомендаций');
      setRecommendations([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await adminApi.getRecommendationsStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  };

  const loadAllExercises = async () => {
    try {
      setExercisesLoading(true);
      const response = await adminApi.getExercises({ 
        limit: 200,
        isActive: 'true'
      });
      
      console.log('All exercises response:', response);
      
      if (response.success && response.data.exercises) {
        const exercises = response.data.exercises.map((ex: any) => ({
          _id: ex._id,
          title: ex.title || 'Без названия',
          description: ex.description || '',
          type: ex.type || 'stretching',
          duration: ex.duration || 10,
          difficulty: ex.difficulty || 'beginner',
          benefits: ex.benefits || [],
          instructions: ex.instructions || []
        }));
        
        setAllExercises(exercises);
        console.log(`Loaded ${exercises.length} exercises`);
      } else {
        setAllExercises([]);
        console.error('Failed to load exercises:', response.error);
      }
    } catch (err: any) {
      console.error('Error loading all exercises:', err);
      setAllExercises([]);
    } finally {
      setExercisesLoading(false);
    }
  };

  const loadAvailableExercises = async (problemType: string) => {
    try {
      setExercisesLoading(true);
      console.log('Loading available exercises for problem type:', problemType);
      
      const response = await adminApi.getAvailableExercises(problemType);
      console.log('Available exercises response:', response);
      
      let exercises: ExerciseOption[] = [];
      
      if (response.success) {
        if (response.data.availableExercises && Array.isArray(response.data.availableExercises)) {
          exercises = response.data.availableExercises.map((ex: any) => ({
            _id: ex._id,
            title: ex.title || 'Без названия',
            description: ex.description || '',
            type: ex.type || 'stretching',
            duration: ex.duration || 10,
            difficulty: ex.difficulty || 'beginner',
            benefits: ex.benefits || [],
            instructions: ex.instructions || []
          }));
        } else if (response.data.exercises && Array.isArray(response.data.exercises)) {
          exercises = response.data.exercises.map((ex: any) => ({
            _id: ex._id,
            title: ex.title || 'Без названия',
            description: ex.description || '',
            type: ex.type || 'stretching',
            duration: ex.duration || 10,
            difficulty: ex.difficulty || 'beginner',
            benefits: ex.benefits || [],
            instructions: ex.instructions || []
          }));
        }
      }
      
      console.log(`Loaded ${exercises.length} available exercises`);
      setAvailableExercises(exercises);
      
    } catch (err: any) {
      console.error('Error loading available exercises:', err);
      setAvailableExercises([]);
      setError('Не удалось загрузить доступные упражнения: ' + (err.message || 'Ошибка сервера'));
    } finally {
      setExercisesLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
    loadStatistics();
    loadAllExercises();
  }, []);

  useEffect(() => {
    if (formData.problemType && dialogOpen) {
      loadAvailableExercises(formData.problemType);
    } else if (dialogOpen && !formData.problemType) {
      setAvailableExercises([]);
    }
  }, [formData.problemType, dialogOpen]);

  const handleOpenDialog = (recommendation: Recommendation | null = null) => {
    if (recommendation) {
      setCurrentRecommendation(recommendation);
      setFormData({
        problemType: recommendation.problemType,
        exerciseId: recommendation.exerciseId._id,
        priority: recommendation.priority,
        description: recommendation.description || '',
        isActive: recommendation.isActive
      });
      setAvailableExercises([]);
    } else {
      setCurrentRecommendation(null);
      setFormData({
        problemType: '',
        exerciseId: '',
        priority: 5,
        description: '',
        isActive: true
      });
      setAvailableExercises([]);
    }
    setDialogOpen(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentRecommendation(null);
    setFormData({
      problemType: '',
      exerciseId: '',
      priority: 5,
      description: '',
      isActive: true
    });
    setAvailableExercises([]);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.problemType.trim()) {
        setError('Пожалуйста, выберите тип проблемы');
        return;
      }
      
      if (!formData.exerciseId.trim()) {
        setError('Пожалуйста, выберите упражнение');
        return;
      }
      
      if (formData.priority < 1 || formData.priority > 10) {
        setError('Приоритет должен быть в диапазоне от 1 до 10');
        return;
      }
      
      console.log('Submitting form data:', formData);
      
      let response;
      if (currentRecommendation) {
        response = await adminApi.updateRecommendation(currentRecommendation._id, formData);
        setSuccess('Рекомендация успешно обновлена');
      } else {
        response = await adminApi.createRecommendation(formData);
        setSuccess('Рекомендация успешно создана');
      }
      
      console.log('Submit response:', response);
      
      if (response.success) {
        handleCloseDialog();
        loadRecommendations();
        loadStatistics();
      } else {
        throw new Error(response.error || 'Ошибка сохранения');
      }
      
    } catch (err: any) {
      console.error('Error saving recommendation:', err);
      setError(err.message || 'Ошибка при сохранении рекомендации');
    }
  };

  const handleDeleteClick = (recommendation: Recommendation) => {
    setDeleteCandidate(recommendation);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    
    try {
      const response = await adminApi.deleteRecommendation(deleteCandidate._id);
      
      if (response.success) {
        setSuccess('Рекомендация успешно удалена');
        loadRecommendations();
        loadStatistics();
      } else {
        throw new Error(response.error || 'Ошибка удаления');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении рекомендации');
    } finally {
      setDeleteDialogOpen(false);
      setDeleteCandidate(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await adminApi.updateRecommendation(id, { isActive: !currentStatus });
      
      if (response.success) {
        setSuccess(`Рекомендация ${!currentStatus ? 'активирована' : 'деактивирована'}`);
        loadRecommendations();
        loadStatistics();
      } else {
        throw new Error(response.error || 'Ошибка изменения статуса');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка при изменении статуса');
    }
  };

  const getProblemTypeInfo = (type: string) => {
    return problemTypes.find(p => p.value === type) || { label: type, color: '#6b7280', icon: '❓' };
  };

  const getExerciseInfo = (exerciseId: any) => {
    if (!exerciseId) return { title: 'Удалено', type: 'unknown', difficulty: 'unknown', duration: 0 };
    
    return {
      title: exerciseId.title || 'Без названия',
      type: exerciseId.type || 'stretching',
      difficulty: exerciseId.difficulty || 'beginner',
      duration: exerciseId.duration || 0,
      description: exerciseId.description || ''
    };
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = () => {
    setPage(0);
    loadRecommendations(0);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setProblemTypeFilter('all');
    setStatusFilter('all');
    setPage(0);
    loadRecommendations(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    loadRecommendations(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    loadRecommendations(0, newRowsPerPage);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getExerciseDisplayText = (exercise: any) => {
    if (!exercise) return 'Неизвестно';
    return `${exercise.title} (${exerciseTypes[exercise.type as keyof typeof exerciseTypes]?.label || exercise.type}, ${exercise.duration} мин)`;
  };

  const filteredRecommendations = recommendations.filter(rec => {
    const exerciseInfo = getExerciseInfo(rec.exerciseId);
    const problemInfo = getProblemTypeInfo(rec.problemType);
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        exerciseInfo.title.toLowerCase().includes(searchLower) ||
        rec.description.toLowerCase().includes(searchLower) ||
        problemInfo.label.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

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
            Загрузка рекомендаций...
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
      px: { xs: 2, md: 4 },
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

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Статистика */}
        {stats && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ 
              color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
              mb: 3,
              fontWeight: 700,
              fontSize: { xs: '1.5rem', md: '1.75rem' }
            }}>
              📊 Статистика рекомендаций
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  bgcolor: theme.palette.mode === 'light'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.2)}`
                  }
                }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: theme.palette.primary.main 
                        }} />
                        <Typography variant="body2" sx={{ 
                          color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                        }}>
                          Всего рекомендаций
                        </Typography>
                      </Stack>
                      <Typography variant="h3" sx={{ 
                        color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                        fontWeight: 800,
                        fontSize: { xs: '2rem', md: '2.5rem' }
                      }}>
                        {stats.overview?.totalRecommendations || 0}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  bgcolor: theme.palette.mode === 'light'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 30px ${alpha(theme.palette.success.main, 0.2)}`
                  }
                }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: theme.palette.success.main 
                        }} />
                        <Typography variant="body2" sx={{ 
                          color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                        }}>
                          Активных
                        </Typography>
                      </Stack>
                      <Typography variant="h3" sx={{ 
                        color: theme.palette.success.main,
                        fontWeight: 800,
                        fontSize: { xs: '2rem', md: '2.5rem' }
                      }}>
                        {stats.overview?.activeRecommendations || 0}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  bgcolor: theme.palette.mode === 'light'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 30px ${alpha(theme.palette.warning.main, 0.2)}`
                  }
                }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: theme.palette.warning.main 
                        }} />
                        <Typography variant="body2" sx={{ 
                          color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                        }}>
                          Типов проблем
                        </Typography>
                      </Stack>
                      <Typography variant="h3" sx={{ 
                        color: theme.palette.warning.main,
                        fontWeight: 800,
                        fontSize: { xs: '2rem', md: '2.5rem' }
                      }}>
                        {stats.problemStats?.length || 0}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  bgcolor: theme.palette.mode === 'light'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 30px ${alpha(theme.palette.secondary.main, 0.2)}`
                  }
                }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: theme.palette.secondary.main 
                        }} />
                        <Typography variant="body2" sx={{ 
                          color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                        }}>
                          Средний приоритет
                        </Typography>
                      </Stack>
                      <Typography variant="h3" sx={{ 
                        color: theme.palette.secondary.main,
                        fontWeight: 800,
                        fontSize: { xs: '2rem', md: '2.5rem' }
                      }}>
                        {(stats.overview?.avgPriority || 0).toFixed(1)}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Заголовок и управление */}
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
                🎯 Управление рекомендациями
              </Typography>
              <Typography variant="body1" sx={{ 
                color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8'
              }}>
                Свяжите проблемы осанки с корректирующими упражнениями
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
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
              Новая рекомендация
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
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  placeholder="Поиск по названию упражнения или описанию..."
                  value={searchTerm}
                  onChange={handleSearch}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8' }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setSearchTerm('')}
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
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8' }}>
                    Тип проблемы
                  </InputLabel>
                  <Select
                    value={problemTypeFilter}
                    onChange={(e) => setProblemTypeFilter(e.target.value)}
                    label="Тип проблемы"
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
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: theme.palette.mode === 'light' ? '#ffffff' : '#1e293b',
                          '& .MuiMenuItem-root': {
                            color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.1)
                            },
                            '&.Mui-selected': {
                              bgcolor: alpha(theme.palette.primary.main, 0.2)
                            }
                          }
                        }
                      }
                    }}
                  >
                    <MenuItem value="all">Все типы</MenuItem>
                    {problemTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <span style={{ fontSize: '1.1rem' }}>{type.icon}</span>
                          <span>{type.label}</span>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8' }}>
                    Статус
                  </InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
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
                    <MenuItem value="all">Все</MenuItem>
                    <MenuItem value="active">Активные</MenuItem>
                    <MenuItem value="inactive">Неактивные</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    startIcon={<RefreshIcon />}
                    onClick={() => {
                      setPage(0);
                      loadRecommendations(0);
                    }}
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
                    Обновить
                  </Button>
                  
                  {(searchTerm || problemTypeFilter !== 'all' || statusFilter !== 'all') && (
                    <Button
                      onClick={handleClearFilters}
                      variant="outlined"
                      sx={{
                        color: theme.palette.warning.main,
                        borderColor: alpha(theme.palette.warning.main, 0.3),
                        minWidth: 'auto',
                        px: 1,
                        '&:hover': {
                          borderColor: theme.palette.warning.main,
                          bgcolor: alpha(theme.palette.warning.main, 0.1)
                        }
                      }}
                      title="Очистить фильтры"
                    >
                      <ClearIcon />
                    </Button>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Таблица рекомендаций */}
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
                Загрузка рекомендаций...
              </Typography>
            </Box>
          ) : recommendations.length === 0 ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <DescriptionIcon sx={{ 
                fontSize: 64, 
                color: theme.palette.mode === 'light' ? '#cbd5e1' : '#475569',
                mb: 2 
              }} />
              <Typography variant="h6" sx={{ 
                color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                mb: 1
              }}>
                Рекомендации не найдены
              </Typography>
              <Typography variant="body2" sx={{ 
                color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                mb: 3
              }}>
                {searchTerm || problemTypeFilter !== 'all' || statusFilter !== 'all' 
                  ? 'Попробуйте изменить параметры поиска'
                  : 'Создайте первую рекомендацию для улучшения осанки пользователей'}
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                variant="contained"
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                  }
                }}
              >
                Создать рекомендацию
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
                        width: '20%'
                      }}>
                        Тип проблемы
                      </TableCell>
                      <TableCell sx={{ 
                        color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                        fontWeight: 600, 
                        py: 2,
                        width: '25%'
                      }}>
                        Упражнение
                      </TableCell>
                      <TableCell sx={{ 
                        color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                        fontWeight: 600, 
                        py: 2,
                        width: '10%'
                      }}>
                        Приоритет
                      </TableCell>
                      <TableCell sx={{ 
                        color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                        fontWeight: 600, 
                        py: 2,
                        width: '25%'
                      }}>
                        Описание
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
                      }} align="right">
                        Действия
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRecommendations.map((recommendation) => {
                      const problemInfo = getProblemTypeInfo(recommendation.problemType);
                      const exerciseInfo = getExerciseInfo(recommendation.exerciseId);
                      const exerciseTypeInfo = exerciseTypes[exerciseInfo.type as keyof typeof exerciseTypes];
                      const difficultyInfo = difficulties[exerciseInfo.difficulty as keyof typeof difficulties];
                      
                      return (
                        <TableRow 
                          key={recommendation._id}
                          sx={{ 
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.05)
                            }
                          }}
                        >
                          <TableCell sx={{ py: 2 }}>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              <Box sx={{ 
                                width: 32, 
                                height: 32, 
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: alpha(problemInfo.color, 0.1),
                                color: problemInfo.color,
                                fontSize: '1.1rem'
                              }}>
                                {problemInfo.icon}
                              </Box>
                              <Box>
                                <Typography variant="body2" sx={{ 
                                  color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                                  fontWeight: 500,
                                  fontSize: '0.875rem'
                                }}>
                                  {problemInfo.label}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Stack spacing={0.5}>
                              <Typography variant="body2" sx={{ 
                                color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                                fontWeight: 500,
                                fontSize: '0.875rem'
                              }}>
                                {exerciseInfo.title}
                              </Typography>
                              <Stack direction="row" spacing={1}>
                                {exerciseTypeInfo && (
                                  <Chip
                                    label={exerciseTypeInfo.label}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.7rem',
                                      bgcolor: alpha(exerciseTypeInfo.color, 0.1),
                                      color: exerciseTypeInfo.color,
                                      border: `1px solid ${alpha(exerciseTypeInfo.color, 0.3)}`
                                    }}
                                  />
                                )}
                                {difficultyInfo && (
                                  <Chip
                                    label={difficultyInfo.label}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.7rem',
                                      bgcolor: alpha(difficultyInfo.color, 0.1),
                                      color: difficultyInfo.color,
                                      border: `1px solid ${alpha(difficultyInfo.color, 0.3)}`
                                    }}
                                  />
                                )}
                                <Chip
                                  icon={<TimerIcon sx={{ fontSize: 12 }} />}
                                  label={`${exerciseInfo.duration} мин`}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.7rem',
                                    bgcolor: alpha(theme.palette.text.secondary, 0.1),
                                    color: theme.palette.text.secondary,
                                    border: `1px solid ${alpha(theme.palette.text.secondary, 0.3)}`
                                  }}
                                />
                              </Stack>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Box sx={{ 
                                width: 32, 
                                height: 32, 
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 
                                  recommendation.priority >= 8 ? alpha(theme.palette.error.main, 0.1) :
                                  recommendation.priority >= 5 ? alpha(theme.palette.warning.main, 0.1) : 
                                  alpha(theme.palette.success.main, 0.1),
                                color: 
                                  recommendation.priority >= 8 ? theme.palette.error.main :
                                  recommendation.priority >= 5 ? theme.palette.warning.main : 
                                  theme.palette.success.main,
                                fontWeight: 600
                              }}>
                                {recommendation.priority}
                              </Box>
                              <Typography variant="body2" sx={{ 
                                color: 
                                  recommendation.priority >= 8 ? theme.palette.error.main :
                                  recommendation.priority >= 5 ? theme.palette.warning.main : 
                                  theme.palette.success.main,
                                fontWeight: 500
                              }}>
                                {recommendation.priority >= 8 ? 'Высокий' :
                                 recommendation.priority >= 5 ? 'Средний' : 
                                 'Низкий'}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body2" sx={{ 
                              color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                              fontSize: '0.875rem',
                              lineHeight: 1.4
                            }}>
                              {recommendation.description || '—'}
                            </Typography>
                            {!recommendation.description && (
                              <Typography variant="caption" sx={{ 
                                color: theme.palette.mode === 'light' ? '#94a3b8' : '#64748b',
                                fontStyle: 'italic'
                              }}>
                                Описание отсутствует
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Chip
                              icon={recommendation.isActive ? 
                                <CheckCircleIcon sx={{ fontSize: 14 }} /> : 
                                <CancelIcon sx={{ fontSize: 14 }} />
                              }
                              label={recommendation.isActive ? 'Активна' : 'Неактивна'}
                              size="small"
                              sx={{
                                bgcolor: recommendation.isActive 
                                  ? alpha(theme.palette.success.main, 0.1) 
                                  : alpha(theme.palette.text.secondary, 0.1),
                                color: recommendation.isActive 
                                  ? theme.palette.success.main 
                                  : theme.palette.text.secondary,
                                border: `1px solid ${recommendation.isActive 
                                  ? alpha(theme.palette.success.main, 0.3) 
                                  : alpha(theme.palette.text.secondary, 0.3)}`,
                                fontWeight: 500,
                                fontSize: '0.75rem'
                              }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ py: 2 }}>
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Tooltip title="Редактировать">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(recommendation)}
                                  sx={{
                                    color: theme.palette.info.main,
                                    bgcolor: alpha(theme.palette.info.main, 0.1),
                                    '&:hover': { 
                                      bgcolor: alpha(theme.palette.info.main, 0.2),
                                      transform: 'scale(1.1)'
                                    }
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title={recommendation.isActive ? 'Деактивировать' : 'Активировать'}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleToggleStatus(recommendation._id, recommendation.isActive)}
                                  sx={{
                                    color: recommendation.isActive 
                                      ? theme.palette.warning.main 
                                      : theme.palette.success.main,
                                    bgcolor: recommendation.isActive 
                                      ? alpha(theme.palette.warning.main, 0.1) 
                                      : alpha(theme.palette.success.main, 0.1),
                                    '&:hover': { 
                                      bgcolor: recommendation.isActive 
                                        ? alpha(theme.palette.warning.main, 0.2) 
                                        : alpha(theme.palette.success.main, 0.2),
                                      transform: 'scale(1.1)'
                                    }
                                  }}
                                >
                                  {recommendation.isActive ? 
                                    <CancelIcon fontSize="small" /> : 
                                    <CheckCircleIcon fontSize="small" />
                                  }
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Удалить">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(recommendation)}
                                  sx={{
                                    color: theme.palette.error.main,
                                    bgcolor: alpha(theme.palette.error.main, 0.1),
                                    '&:hover': { 
                                      bgcolor: alpha(theme.palette.error.main, 0.2),
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
              
              <Divider sx={{ 
                borderColor: theme.palette.mode === 'light'
                  ? 'rgba(0, 0, 0, 0.1)'
                  : 'rgba(255, 255, 255, 0.1)'
              }} />
              
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
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
      </Box>

      {/* Диалог создания/редактирования рекомендации */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'light' ? '#ffffff' : '#1e293b',
            color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
            borderRadius: 2,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          pb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {currentRecommendation ? 'Редактирование рекомендации' : 'Создание новой рекомендации'}
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
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
                  : theme.palette.error.light
              }}
            >
              {error}
            </Alert>
          )}
          
          <Stack spacing={3}>
            {/* Тип проблемы */}
            <FormControl fullWidth required>
              <InputLabel sx={{ color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8' }}>
                Тип проблемы *
              </InputLabel>
              <Select
                value={formData.problemType}
                onChange={(e) => setFormData({ ...formData, problemType: e.target.value })}
                label="Тип проблемы *"
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
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: theme.palette.mode === 'light' ? '#ffffff' : '#1e293b',
                      '& .MuiMenuItem-root': {
                        color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1)
                        },
                        '&.Mui-selected': {
                          bgcolor: alpha(theme.palette.primary.main, 0.2)
                        }
                      }
                    }
                  }
                }}
              >
                <MenuItem value="" disabled>Выберите тип проблемы</MenuItem>
                {problemTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(type.color, 0.1),
                        color: type.color
                      }}>
                        <span style={{ fontSize: '1rem' }}>{type.icon}</span>
                      </Box>
                      <Box>
                        <Typography sx={{ 
                          color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff'
                        }}>
                          {type.label}
                        </Typography>
                      </Box>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Выбор упражнения */}
            <FormControl fullWidth required>
              <Typography variant="body2" sx={{ 
                color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                mb: 1,
                fontWeight: 500
              }}>
                Выберите упражнение *
              </Typography>
              
              {formData.problemType ? (
                <>
                  <Autocomplete
                    id="exercise-select"
                    options={currentRecommendation ? allExercises : availableExercises}
                    loading={exercisesLoading}
                    value={(currentRecommendation ? allExercises : availableExercises)
                      .find(ex => ex._id === formData.exerciseId) || null}
                    onChange={(event, newValue) => {
                      console.log('Selected exercise:', newValue);
                      setFormData({ 
                        ...formData, 
                        exerciseId: newValue?._id || '',
                        description: formData.description || newValue?.description || ''
                      });
                    }}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') return option;
                      return getExerciseDisplayText(option);
                    }}
                    isOptionEqualToValue={(option, value) => option._id === value._id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Начните вводить название..."
                        error={!formData.exerciseId}
                        helperText={!formData.exerciseId ? "Выберите упражнение из списка" : ""}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <FitnessCenterIcon sx={{ color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <React.Fragment>
                              {exercisesLoading ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </React.Fragment>
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: theme.palette.mode === 'light'
                              ? alpha('#ffffff', 0.8)
                              : 'rgba(15, 23, 42, 0.8)',
                            color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: !formData.exerciseId 
                                ? alpha(theme.palette.error.main, 0.5)
                                : theme.palette.mode === 'light'
                                  ? 'rgba(0, 0, 0, 0.1)'
                                  : 'rgba(255, 255, 255, 0.1)'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: !formData.exerciseId 
                                ? theme.palette.error.main
                                : theme.palette.primary.main
                            }
                          },
                          '& .MuiFormHelperText-root': {
                            color: !formData.exerciseId 
                              ? theme.palette.error.main
                              : theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                          }
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props} style={{ 
                        backgroundColor: theme.palette.mode === 'light' ? '#ffffff' : '#1e293b',
                        padding: '8px 16px'
                      }}>
                        <Stack spacing={0.5}>
                          <Typography variant="body1" sx={{ 
                            color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                            fontWeight: 500 
                          }}>
                            {option.title}
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            <Chip
                              label={exerciseTypes[option.type as keyof typeof exerciseTypes]?.label || option.type}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                bgcolor: alpha(
                                  exerciseTypes[option.type as keyof typeof exerciseTypes]?.color || '#6b7280', 
                                  0.1
                                ),
                                color: exerciseTypes[option.type as keyof typeof exerciseTypes]?.color || '#94a3b8'
                              }}
                            />
                            <Chip
                              label={difficulties[option.difficulty as keyof typeof difficulties]?.label || option.difficulty}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                bgcolor: alpha(
                                  difficulties[option.difficulty as keyof typeof difficulties]?.color || '#6b7280', 
                                  0.1
                                ),
                                color: difficulties[option.difficulty as keyof typeof difficulties]?.color || '#94a3b8'
                              }}
                            />
                            <Chip
                              icon={<TimerIcon sx={{ fontSize: 12 }} />}
                              label={`${option.duration} мин`}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                bgcolor: alpha(theme.palette.text.secondary, 0.1),
                                color: theme.palette.text.secondary
                              }}
                            />
                          </Stack>
                          {option.description && (
                            <Typography variant="caption" sx={{ 
                              color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                              mt: 0.5,
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {option.description}
                            </Typography>
                          )}
                        </Stack>
                      </li>
                    )}
                  />
                  
                  {!currentRecommendation && formData.problemType && availableExercises.length === 0 && !exercisesLoading && (
                    <Alert 
                      severity="info" 
                      sx={{ 
                        mt: 2,
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                        color: theme.palette.mode === 'light' 
                          ? theme.palette.info.dark
                          : theme.palette.info.light
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Все упражнения уже используются для этой проблемы.
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: theme.palette.mode === 'light' 
                          ? theme.palette.info.dark
                          : theme.palette.info.light,
                        display: 'block', 
                        mt: 0.5 
                      }}>
                        Вы можете выбрать упражнение из общего списка или создать новое упражнение.
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ 
                          mt: 1,
                          color: theme.palette.info.main,
                          borderColor: theme.palette.info.main
                        }}
                        onClick={() => setAvailableExercises(allExercises)}
                      >
                        Показать все упражнения
                      </Button>
                    </Alert>
                  )}
                </>
              ) : (
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
                  <Typography variant="body2">
                    Сначала выберите тип проблемы, чтобы увидеть список доступных упражнений
                  </Typography>
                </Alert>
              )}
            </FormControl>

            {/* Приоритет */}
            <FormControl fullWidth>
              <Typography variant="body2" sx={{ 
                color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                mb: 1,
                fontWeight: 500
              }}>
                Приоритет рекомендации (1-10)
              </Typography>
              <Box sx={{ px: 1 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="body2" sx={{ 
                    color: formData.priority >= 8 ? theme.palette.error.main :
                           formData.priority >= 5 ? theme.palette.warning.main : 
                           theme.palette.success.main,
                    fontWeight: 600,
                    minWidth: 60
                  }}>
                    {formData.priority >= 8 ? 'Высокий' :
                     formData.priority >= 5 ? 'Средний' : 
                     'Низкий'}
                  </Typography>
                  <Slider
                    value={formData.priority}
                    onChange={(e, value) => setFormData({ ...formData, priority: value as number })}
                    min={1}
                    max={10}
                    step={1}
                    marks={[
                      { value: 1, label: '1' },
                      { value: 5, label: '5' },
                      { value: 10, label: '10' }
                    ]}
                    sx={{
                      color: formData.priority >= 8 ? theme.palette.error.main :
                             formData.priority >= 5 ? theme.palette.warning.main : 
                             theme.palette.success.main,
                      '& .MuiSlider-markLabel': {
                        color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                      }
                    }}
                  />
                  <Box sx={{ 
                    width: 36, 
                    height: 36, 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 
                      formData.priority >= 8 ? alpha(theme.palette.error.main, 0.1) :
                      formData.priority >= 5 ? alpha(theme.palette.warning.main, 0.1) : 
                      alpha(theme.palette.success.main, 0.1),
                    color: 
                      formData.priority >= 8 ? theme.palette.error.main :
                      formData.priority >= 5 ? theme.palette.warning.main : 
                      theme.palette.success.main,
                    fontWeight: 600
                  }}>
                    {formData.priority}
                  </Box>
                </Stack>
              </Box>
            </FormControl>

            {/* Описание */}
            <TextField
              label="Описание рекомендации"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={4}
              fullWidth
              placeholder="Опишите, как это упражнение помогает решить проблему. Например: 'Это упражнение помогает исправить сутулость, укрепляя мышцы спины и растягивая грудные мышцы...'"
              helperText="Рекомендуется заполнить для лучшего понимания пользователями"
              sx={{
                '& .MuiOutlinedInput-root': {
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
                },
                '& .MuiInputLabel-root': {
                  color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8'
                },
                '& .MuiFormHelperText-root': {
                  color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                }
              }}
            />

            {/* Статус */}
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: theme.palette.success.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.success.main, 0.08)
                      }
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: theme.palette.success.main
                    }
                  }}
                />
              }
              label={
                <Stack>
                  <Typography sx={{ 
                    color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                    fontWeight: 500 
                  }}>
                    Рекомендация активна
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                  }}>
                    Активные рекомендации отображаются пользователям
                  </Typography>
                </Stack>
              }
            />
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ 
          borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          pt: 2,
          px: 3,
          pb: 3
        }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{
              color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
              borderColor: theme.palette.mode === 'light'
                ? 'rgba(0, 0, 0, 0.2)'
                : 'rgba(255, 255, 255, 0.2)',
              '&:hover': {
                borderColor: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                backgroundColor: alpha(theme.palette.text.primary, 0.1)
              }
            }}
            variant="outlined"
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.problemType || !formData.exerciseId}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
              px: 4,
              fontWeight: 600,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`
              },
              '&.Mui-disabled': {
                background: theme.palette.mode === 'light' 
                  ? alpha('#94a3b8', 0.3)
                  : alpha('#475569', 0.5),
                color: theme.palette.mode === 'light' 
                  ? '#64748b'
                  : '#94a3b8'
              }
            }}
          >
            {currentRecommendation ? 'Обновить рекомендацию' : 'Создать рекомендацию'}
          </Button>
        </DialogActions>
      </Dialog>

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
          <Typography sx={{ color: 'inherit', mb: 2 }}>
            Вы уверены, что хотите удалить эту рекомендацию?
          </Typography>
          
          {deleteCandidate && (
            <Box sx={{ 
              p: 2, 
              mb: 2,
              bgcolor: alpha(theme.palette.error.main, 0.1),
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`
            }}>
              <Stack spacing={1}>
                <Typography variant="body2" sx={{ 
                  color: theme.palette.mode === 'light' 
                    ? theme.palette.error.dark
                    : theme.palette.error.light,
                  fontWeight: 500 
                }}>
                  <strong>Тип проблемы:</strong> {getProblemTypeInfo(deleteCandidate.problemType).label}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: theme.palette.mode === 'light' 
                    ? theme.palette.error.dark
                    : theme.palette.error.light
                }}>
                  <strong>Упражнение:</strong> {getExerciseInfo(deleteCandidate.exerciseId).title}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: theme.palette.mode === 'light' 
                    ? theme.palette.error.dark
                    : theme.palette.error.light
                }}>
                  <strong>Приоритет:</strong> {deleteCandidate.priority}
                </Typography>
              </Stack>
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
              Это действие нельзя отменить. Рекомендация будет удалена из системы.
            </Typography>
          </Alert>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
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
            sx={{
              bgcolor: theme.palette.error.main,
              color: 'white',
              px: 3,
              '&:hover': {
                bgcolor: theme.palette.error.dark,
                boxShadow: `0 4px 20px ${alpha(theme.palette.error.main, 0.3)}`
              }
            }}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar для уведомлений */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity="success" 
          sx={{ 
            bgcolor: theme.palette.success.main,
            color: 'white',
            '& .MuiAlert-icon': {
              color: 'white'
            }
          }}
        >
          {success}
        </Alert>
      </Snackbar>

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

export default RecommendationsManager;