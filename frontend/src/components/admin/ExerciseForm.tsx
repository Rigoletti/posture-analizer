import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  IconButton,
  Stack,
  Chip,
  Paper,
  Divider,
  alpha,
  useTheme,
  Container,
  LinearProgress,
  OutlinedInput,
  InputAdornment,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  FitnessCenter as FitnessCenterIcon,
  Timer as TimerIcon,
  Whatshot as WhatshotIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  VideoLibrary as VideoLibraryIcon,
  Image as ImageIcon,
  Spa as SpaIcon
} from '@mui/icons-material';
import { adminApi } from '../../api/admin';

interface ExerciseFormData {
  title: string;
  description: string;
  type: string;
  difficulty: string;
  duration: string;
  instructions: string[];
  benefits: string[];
  warnings: string[];
  videoUrl: string;
  imageUrl: string;
  muscleGroups: string[];
  caloriesBurned: string;
  has3dModel: boolean;
  modelType: string;
  modelFile: File | null;
  existingModelFile: any;
  removeModel: boolean;
  isActive: boolean;
}

const ExerciseForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState<ExerciseFormData>({
    title: '',
    description: '',
    type: 'stretching',
    difficulty: 'beginner',
    duration: '10',
    instructions: [''],
    benefits: [''],
    warnings: [''],
    videoUrl: '',
    imageUrl: '',
    muscleGroups: [],
    caloriesBurned: '',
    has3dModel: false,
    modelType: 'custom',
    modelFile: null,
    existingModelFile: null,
    removeModel: false,
    isActive: true
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (isEditMode && id) {
      fetchExercise(id);
    }
  }, [id, isEditMode]);

  const fetchExercise = async (exerciseId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminApi.getExerciseById(exerciseId);
      const exercise = response.data.exercise;
      
      setFormData({
        title: exercise.title,
        description: exercise.description,
        type: exercise.type,
        difficulty: exercise.difficulty,
        duration: exercise.duration.toString(),
        instructions: exercise.instructions || [''],
        benefits: exercise.benefits || [''],
        warnings: exercise.warnings || [''],
        videoUrl: exercise.videoUrl || '',
        imageUrl: exercise.imageUrl || '',
        muscleGroups: exercise.muscleGroups || [],
        caloriesBurned: exercise.caloriesBurned?.toString() || '',
        has3dModel: exercise.has3dModel || false,
        modelType: exercise.modelType || 'custom',
        modelFile: null,
        existingModelFile: exercise.modelFile || null,
        removeModel: false,
        isActive: exercise.isActive
      });

    } catch (err: any) {
      console.error('Error fetching exercise:', err);
      setError(err.response?.data?.error || 'Ошибка при загрузке упражнения');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    
    if (name) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleArrayChange = (field: 'instructions' | 'benefits' | 'warnings' | 'muscleGroups', index: number, value: string) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (field: 'instructions' | 'benefits' | 'warnings' | 'muscleGroups') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'instructions' | 'benefits' | 'warnings' | 'muscleGroups', index: number) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    setUploadProgress(0);
    
    if (file) {
      const maxSize = 200 * 1024 * 1024;
      if (file.size > maxSize) {
        setFileError(`Файл слишком большой. Максимальный размер: 200MB. Ваш файл: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        return;
      }
      
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.glb') && !fileName.endsWith('.gltf')) {
        setFileError('Только файлы формата .glb и .gltf разрешены');
        return;
      }
      
      setSelectedFile(file);
      setFormData(prev => ({
        ...prev,
        modelFile: file,
        has3dModel: true,
        modelType: 'custom',
        removeModel: false
      }));
      
      setError(null);
    }
  };

  const handleRemoveModel = () => {
    setSelectedFile(null);
    setFormData(prev => ({
      ...prev,
      modelFile: null,
      existingModelFile: null,
      has3dModel: false,
      modelType: 'custom',
      removeModel: true
    }));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.title.trim()) {
      errors.push('Название упражнения обязательно');
    }
    
    if (!formData.description.trim()) {
      errors.push('Описание обязательно');
    }
    
    if (!formData.duration || parseInt(formData.duration) < 1) {
      errors.push('Длительность должна быть не менее 1 минуты');
    }
    
    if (formData.instructions.length === 0 || formData.instructions.every(inst => !inst.trim())) {
      errors.push('Добавьте хотя бы одну инструкцию');
    }
    
    if (formData.benefits.length === 0 || formData.benefits.every(benefit => !benefit.trim())) {
      errors.push('Добавьте хотя бы одно преимущество');
    }
    
    if (formData.has3dModel && formData.modelType === 'custom') {
      if (!selectedFile && !formData.existingModelFile && !formData.removeModel) {
        errors.push('Для кастомной модели необходимо загрузить файл');
      }
    }
    
    if (errors.length > 0) {
      setError(errors.join('. '));
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setFileError(null);
      
      const formDataToSend = new FormData();
      
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('type', formData.type);
      formDataToSend.append('difficulty', formData.difficulty);
      formDataToSend.append('duration', formData.duration);
      formDataToSend.append('has3dModel', formData.has3dModel.toString());
      formDataToSend.append('modelType', formData.modelType);
      formDataToSend.append('isActive', formData.isActive.toString());
      
      if (formData.videoUrl.trim()) {
        formDataToSend.append('videoUrl', formData.videoUrl.trim());
      }
      
      if (formData.imageUrl.trim()) {
        formDataToSend.append('imageUrl', formData.imageUrl.trim());
      }
      
      if (formData.caloriesBurned) {
        formDataToSend.append('caloriesBurned', formData.caloriesBurned);
      }
      
      formData.instructions.forEach((instruction, index) => {
        if (instruction.trim()) {
          formDataToSend.append(`instructions[${index}]`, instruction.trim());
        }
      });
      
      formData.benefits.forEach((benefit, index) => {
        if (benefit.trim()) {
          formDataToSend.append(`benefits[${index}]`, benefit.trim());
        }
      });
      
      formData.warnings.forEach((warning, index) => {
        if (warning.trim()) {
          formDataToSend.append(`warnings[${index}]`, warning.trim());
        }
      });
      
      formData.muscleGroups.forEach((group, index) => {
        if (group.trim()) {
          formDataToSend.append(`muscleGroups[${index}]`, group.trim());
        }
      });
      
      if (selectedFile) {
        formDataToSend.append('modelFile', selectedFile);
      }
      
      if (isEditMode && formData.removeModel) {
        formDataToSend.append('removeModel', 'true');
      }
      
      let response;
      if (isEditMode && id) {
        response = await adminApi.updateExercise(id, formDataToSend);
      } else {
        response = await adminApi.createExercise(formDataToSend);
      }
      
      setSuccess(isEditMode ? 'Упражнение успешно обновлено!' : 'Упражнение успешно создано!');
      
      setTimeout(() => {
        navigate('/admin/exercises');
      }, 2000);
      
    } catch (err: any) {
      let errorMessage = err.message || 'Ошибка при сохранении упражнения';
      if (errorMessage.includes('200MB')) {
        errorMessage = 'Размер файла превышает 200MB. Пожалуйста, выберите файл меньшего размера.';
      } else if (errorMessage.includes('glb') || errorMessage.includes('gltf')) {
        errorMessage = 'Неподдерживаемый формат файла. Пожалуйста, загрузите файл в формате .glb или .gltf';
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };
  
  const handleCancel = () => {
    navigate('/admin/exercises');
  };

  const modelTypes = [
    { value: 'custom', label: 'Кастомная модель' },
    { value: 'arm-stretching', label: 'Растяжка рук' },
    { value: 'jumping-jacks', label: 'Прыжки Джек' },
    { value: 'neck-stretch', label: 'Растяжка шеи' },
    { value: 'bicycle-crunch', label: 'Велосипед' },
    { value: 'burpee', label: 'Берпи' },
    { value: 'capoeira', label: 'Капоэйра' },
    { value: 'press', label: 'Пресс' }
  ];

  const exerciseTypes = [
    { value: 'stretching', label: 'Растяжка' },
    { value: 'cardio', label: 'Кардио' },
    { value: 'strength', label: 'Силовые' },
    { value: 'posture', label: 'Осанка' },
    { value: 'flexibility', label: 'Гибкость' },
    { value: 'warmup', label: 'Разминка' },
    { value: 'cooldown', label: 'Заминка' }
  ];

  const difficulties = [
    { value: 'beginner', label: 'Начальный' },
    { value: 'intermediate', label: 'Средний' },
    { value: 'advanced', label: 'Продвинутый' }
  ];

  // Стили для текстовых полей с поддержкой темы
  const getTextFieldStyles = () => ({
    '& .MuiOutlinedInput-root': {
      bgcolor: theme.palette.mode === 'light'
        ? alpha('#ffffff', 0.8)
        : 'rgba(15, 23, 42, 0.8)',
      borderColor: theme.palette.mode === 'light'
        ? 'rgba(0, 0, 0, 0.1)'
        : 'rgba(255, 255, 255, 0.1)',
      '&:hover': {
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.main
        }
      },
      '&.Mui-focused': {
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.main,
          borderWidth: 2
        }
      },
      '& input': {
        color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
        fontSize: '0.875rem'
      },
      '& textarea': {
        color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
        fontSize: '0.875rem'
      }
    },
    '& .MuiInputLabel-root': {
      color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8'
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: theme.palette.primary.main
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.mode === 'light'
        ? 'rgba(0, 0, 0, 0.1)'
        : 'rgba(255, 255, 255, 0.1)'
    },
    '& .MuiFormHelperText-root': {
      color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
    }
  });

  // Стили для Select с поддержкой темы
  const getSelectStyles = () => ({
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
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
      borderWidth: 2
    },
    '& .MuiSvgIcon-root': {
      color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
    }
  });

  if (loading) {
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
            Загрузка упражнения...
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
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <IconButton
              onClick={handleCancel}
              sx={{
                color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                '&:hover': {
                  color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography 
              variant="h4" 
              component="h1" 
              fontWeight="bold"
              sx={{ 
                color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                fontSize: { xs: '1.75rem', md: '2rem' }
              }}
            >
              {isEditMode ? 'Редактирование упражнения' : 'Создание нового упражнения'}
            </Typography>
          </Stack>
        </Box>

        {/* Ошибки и успех */}
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
            {error}
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
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Основная информация */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  bgcolor: theme.palette.mode === 'light'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${theme.palette.mode === 'light'
                    ? 'rgba(0, 0, 0, 0.1)'
                    : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <CardContent>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                      mb: 3,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <FitnessCenterIcon sx={{ color: theme.palette.primary.main }} />
                    Основная информация
                  </Typography>
                  
                  <Stack spacing={3}>
                    <TextField
                      label="Название упражнения *"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      fullWidth
                      sx={getTextFieldStyles()}
                    />
                    
                    <TextField
                      label="Описание *"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      multiline
                      rows={3}
                      fullWidth
                      sx={getTextFieldStyles()}
                    />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <FormControl fullWidth>
                          <InputLabel sx={{ color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8' }}>
                            Тип упражнения *
                          </InputLabel>
                          <Select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            label="Тип упражнения *"
                            sx={getSelectStyles()}
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
                            {exerciseTypes.map(type => (
                              <MenuItem key={type.value} value={type.value}>
                                {type.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6}>
                        <FormControl fullWidth>
                          <InputLabel sx={{ color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8' }}>
                            Уровень сложности *
                          </InputLabel>
                          <Select
                            name="difficulty"
                            value={formData.difficulty}
                            onChange={handleChange}
                            label="Уровень сложности *"
                            sx={getSelectStyles()}
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
                            {difficulties.map(diff => (
                              <MenuItem key={diff.value} value={diff.value}>
                                {diff.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          label="Длительность (минуты) *"
                          name="duration"
                          type="number"
                          value={formData.duration}
                          onChange={handleChange}
                          required
                          fullWidth
                          sx={getTextFieldStyles()}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <TimerIcon sx={{ color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8' }} />
                              </InputAdornment>
                            ),
                            inputProps: {
                              min: 1
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Калории (за подход)"
                          name="caloriesBurned"
                          type="number"
                          value={formData.caloriesBurned}
                          onChange={handleChange}
                          fullWidth
                          sx={getTextFieldStyles()}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <WhatshotIcon sx={{ color: '#ef4444' }} />
                              </InputAdornment>
                            ),
                            inputProps: {
                              min: 0
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* 3D Модель */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  bgcolor: theme.palette.mode === 'light'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${theme.palette.mode === 'light'
                    ? 'rgba(0, 0, 0, 0.1)'
                    : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <CardContent>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                      mb: 3,
                      fontWeight: 600
                    }}
                  >
                    3D Модель для демонстрации
                  </Typography>
                  
                  <Stack spacing={3}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="has3dModel"
                          checked={formData.has3dModel}
                          onChange={handleCheckboxChange}
                          sx={{
                            color: theme.palette.primary.main,
                            '&.Mui-checked': {
                              color: theme.palette.primary.main
                            }
                          }}
                        />
                      }
                      label={
                        <Typography sx={{ 
                          color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff'
                        }}>
                          Включить 3D демонстрацию
                        </Typography>
                      }
                    />
                    
                    {formData.has3dModel && (
                      <>
                        <FormControl fullWidth>
                          <InputLabel sx={{ color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8' }}>
                            Тип модели
                          </InputLabel>
                          <Select
                            name="modelType"
                            value={formData.modelType}
                            onChange={handleChange}
                            label="Тип модели"
                            sx={getSelectStyles()}
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  bgcolor: theme.palette.mode === 'light' ? '#ffffff' : '#1e293b',
                                  '& .MuiMenuItem-root': {
                                    color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.primary.main, 0.1)
                                    }
                                  }
                                }
                              }
                            }}
                          >
                            {modelTypes.map(model => (
                              <MenuItem key={model.value} value={model.value}>
                                {model.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        
                        {formData.modelType === 'custom' && (
                          <Box>
                            <Typography variant="body2" sx={{ 
                              color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                              mb: 1 
                            }}>
                              Загрузить 3D модель (.glb, .gltf)
                              {(!selectedFile && !formData.existingModelFile) && ' *'}
                            </Typography>
                            
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 2,
                                bgcolor: theme.palette.mode === 'light'
                                  ? alpha('#ffffff', 0.5)
                                  : 'rgba(15, 23, 42, 0.3)',
                                border: '2px dashed',
                                borderColor: theme.palette.mode === 'light'
                                  ? 'rgba(0, 0, 0, 0.1)'
                                  : 'rgba(255, 255, 255, 0.1)',
                                borderRadius: 2,
                                textAlign: 'center',
                                cursor: 'pointer',
                                '&:hover': {
                                  borderColor: theme.palette.primary.main,
                                  bgcolor: alpha(theme.palette.primary.main, 0.05)
                                }
                              }}
                              onClick={() => document.getElementById('modelFile')?.click()}
                            >
                              <input
                                type="file"
                                id="modelFile"
                                onChange={handleFileChange}
                                accept=".glb,.gltf"
                                style={{ display: 'none' }}
                              />
                              <UploadIcon sx={{ 
                                color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                                fontSize: 40, 
                                mb: 1 
                              }} />
                              <Typography sx={{ 
                                color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                                mb: 0.5 
                              }}>
                                {selectedFile 
                                  ? selectedFile.name 
                                  : formData.existingModelFile
                                  ? formData.existingModelFile.originalName
                                  : 'Нажмите для выбора файла'}
                              </Typography>
                              <Typography variant="caption" sx={{ 
                                color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                              }}>
                                Максимальный размер: 200MB. Форматы: .glb, .gltf
                              </Typography>
                            </Paper>
                            
                            {fileError && (
                              <Alert 
                                severity="error" 
                                sx={{ 
                                  mt: 1,
                                  bgcolor: theme.palette.mode === 'light' 
                                    ? alpha(theme.palette.error.main, 0.1)
                                    : alpha(theme.palette.error.main, 0.2),
                                  color: theme.palette.mode === 'light' 
                                    ? theme.palette.error.dark
                                    : theme.palette.error.light
                                }}
                              >
                                {fileError}
                              </Alert>
                            )}
                            
                            {uploadProgress > 0 && uploadProgress < 100 && (
                              <Box sx={{ mt: 2 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={uploadProgress}
                                  sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: theme.palette.primary.main,
                                      borderRadius: 4
                                    }
                                  }}
                                />
                                <Typography variant="caption" sx={{ 
                                  color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                                  mt: 0.5 
                                }}>
                                  {uploadProgress}%
                                </Typography>
                              </Box>
                            )}
                            
                            {(selectedFile || formData.existingModelFile) && (
                              <Paper
                                sx={{
                                  mt: 2,
                                  p: 2,
                                  bgcolor: theme.palette.mode === 'light'
                                    ? alpha('#ffffff', 0.5)
                                    : 'rgba(15, 23, 42, 0.5)',
                                  border: `1px solid ${theme.palette.mode === 'light'
                                    ? 'rgba(0, 0, 0, 0.1)'
                                    : 'rgba(255, 255, 255, 0.1)'}`,
                                  borderRadius: 2
                                }}
                              >
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                  <Stack spacing={0.5}>
                                    <Typography variant="body2" sx={{ 
                                      color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff'
                                    }}>
                                      {selectedFile 
                                        ? selectedFile.name 
                                        : formData.existingModelFile?.originalName}
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                                    }}>
                                      {selectedFile 
                                        ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                                        : `${(formData.existingModelFile?.size / 1024 / 1024).toFixed(2)} MB`}
                                    </Typography>
                                  </Stack>
                                  <IconButton
                                    onClick={handleRemoveModel}
                                    sx={{ color: theme.palette.error.main }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Stack>
                              </Paper>
                            )}
                          </Box>
                        )}
                      </>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Медиа и настройки */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  bgcolor: theme.palette.mode === 'light'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${theme.palette.mode === 'light'
                    ? 'rgba(0, 0, 0, 0.1)'
                    : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <CardContent>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                      mb: 3,
                      fontWeight: 600
                    }}
                  >
                    Медиа и настройки
                  </Typography>
                  
                  <Stack spacing={3}>
                    <TextField
                      label="URL видео (опционально)"
                      name="videoUrl"
                      value={formData.videoUrl}
                      onChange={handleChange}
                      fullWidth
                      sx={getTextFieldStyles()}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <VideoLibraryIcon sx={{ color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8' }} />
                          </InputAdornment>
                        )
                      }}
                    />
                    
                    <TextField
                      label="URL изображения (опционально)"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleChange}
                      fullWidth
                      sx={getTextFieldStyles()}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ImageIcon sx={{ color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8' }} />
                          </InputAdornment>
                        )
                      }}
                    />
                    
                    <TextField
                      label="Группы мышц (через запятую)"
                      value={formData.muscleGroups.join(', ')}
                      onChange={(e) => {
                        const value = e.target.value;
                        const groups = value.split(',').map(g => g.trim()).filter(g => g);
                        setFormData(prev => ({ ...prev, muscleGroups: groups }));
                      }}
                      fullWidth
                      sx={getTextFieldStyles()}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SpaIcon sx={{ color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8' }} />
                          </InputAdornment>
                        )
                      }}
                    />
                    
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleCheckboxChange}
                          sx={{
                            color: theme.palette.primary.main,
                            '&.Mui-checked': {
                              color: theme.palette.primary.main
                            }
                          }}
                        />
                      }
                      label={
                        <Typography sx={{ 
                          color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff'
                        }}>
                          Активно (отображается пользователям)
                        </Typography>
                      }
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Инструкции */}
            <Grid item xs={12}>
              <Card 
                sx={{ 
                  bgcolor: theme.palette.mode === 'light'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${theme.palette.mode === 'light'
                    ? 'rgba(0, 0, 0, 0.1)'
                    : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <CardContent>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                      mb: 3,
                      fontWeight: 600
                    }}
                  >
                    Инструкции по выполнению *
                  </Typography>
                  
                  <Stack spacing={2}>
                    {formData.instructions.map((instruction, index) => (
                      <Paper
                        key={index}
                        sx={{
                          p: 2,
                          bgcolor: theme.palette.mode === 'light'
                            ? alpha('#ffffff', 0.5)
                            : 'rgba(15, 23, 42, 0.5)',
                          border: `1px solid ${theme.palette.mode === 'light'
                            ? 'rgba(0, 0, 0, 0.1)'
                            : 'rgba(255, 255, 255, 0.1)'}`,
                          borderRadius: 1
                        }}
                      >
                        <Stack direction="row" spacing={2}>
                          <Chip
                            label={`Шаг ${index + 1}`}
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main
                            }}
                          />
                          <TextField
                            value={instruction}
                            onChange={(e) => handleArrayChange('instructions', index, e.target.value)}
                            required
                            multiline
                            fullWidth
                            placeholder="Встаньте прямо, ноги на ширине плеч..."
                            sx={getTextFieldStyles()}
                          />
                          {formData.instructions.length > 1 && (
                            <IconButton
                              onClick={() => removeArrayItem('instructions', index)}
                              sx={{ color: theme.palette.error.main }}
                            >
                              <RemoveIcon />
                            </IconButton>
                          )}
                        </Stack>
                      </Paper>
                    ))}
                    
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => addArrayItem('instructions')}
                      sx={{
                        color: theme.palette.primary.main,
                        borderColor: theme.palette.primary.main,
                        '&:hover': {
                          borderColor: theme.palette.primary.dark,
                          bgcolor: alpha(theme.palette.primary.main, 0.1)
                        }
                      }}
                      variant="outlined"
                    >
                      Добавить шаг
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Преимущества */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  bgcolor: theme.palette.mode === 'light'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${theme.palette.mode === 'light'
                    ? 'rgba(0, 0, 0, 0.1)'
                    : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <CardContent>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                      mb: 3,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <CheckCircleIcon sx={{ color: theme.palette.success.main }} />
                    Преимущества *
                  </Typography>
                  
                  <Stack spacing={2}>
                    {formData.benefits.map((benefit, index) => (
                      <Stack key={index} direction="row" spacing={1}>
                        <TextField
                          value={benefit}
                          onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                          required
                          fullWidth
                          placeholder="Улучшает осанку..."
                          sx={getTextFieldStyles()}
                        />
                        {formData.benefits.length > 1 && (
                          <IconButton
                            onClick={() => removeArrayItem('benefits', index)}
                            sx={{ color: theme.palette.error.main }}
                          >
                            <RemoveIcon />
                          </IconButton>
                        )}
                      </Stack>
                    ))}
                    
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => addArrayItem('benefits')}
                      sx={{
                        color: theme.palette.success.main,
                        borderColor: theme.palette.success.main,
                        '&:hover': {
                          borderColor: theme.palette.success.dark,
                          bgcolor: alpha(theme.palette.success.main, 0.1)
                        }
                      }}
                      variant="outlined"
                    >
                      Добавить преимущество
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Предупреждения */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  bgcolor: theme.palette.mode === 'light'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${theme.palette.mode === 'light'
                    ? 'rgba(0, 0, 0, 0.1)'
                    : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <CardContent>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                      mb: 3,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <WarningIcon sx={{ color: theme.palette.warning.main }} />
                    Предупреждения
                  </Typography>
                  
                  <Stack spacing={2}>
                    {formData.warnings.map((warning, index) => (
                      <Stack key={index} direction="row" spacing={1}>
                        <TextField
                          value={warning}
                          onChange={(e) => handleArrayChange('warnings', index, e.target.value)}
                          fullWidth
                          placeholder="Избегайте резких движений..."
                          sx={getTextFieldStyles()}
                        />
                        {formData.warnings.length > 0 && (
                          <IconButton
                            onClick={() => removeArrayItem('warnings', index)}
                            sx={{ color: theme.palette.error.main }}
                          >
                            <RemoveIcon />
                          </IconButton>
                        )}
                      </Stack>
                    ))}
                    
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => addArrayItem('warnings')}
                      sx={{
                        color: theme.palette.warning.main,
                        borderColor: theme.palette.warning.main,
                        '&:hover': {
                          borderColor: theme.palette.warning.dark,
                          bgcolor: alpha(theme.palette.warning.main, 0.1)
                        }
                      }}
                      variant="outlined"
                    >
                      Добавить предупреждение
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Кнопки действий */}
          <Paper
            sx={{
              mt: 4,
              p: 3,
              bgcolor: theme.palette.mode === 'light'
                ? alpha(theme.palette.background.paper, 0.8)
                : alpha(theme.palette.background.paper, 0.4),
              border: `1px solid ${theme.palette.mode === 'light'
                ? 'rgba(0, 0, 0, 0.1)'
                : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: 2,
              backdropFilter: 'blur(10px)'
            }}
          >
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              justifyContent="flex-end"
            >
              <Button
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={saving}
                sx={{
                  color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                  borderColor: theme.palette.mode === 'light'
                    ? 'rgba(0, 0, 0, 0.2)'
                    : 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    borderColor: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                    bgcolor: alpha(theme.palette.text.primary, 0.1)
                  }
                }}
                variant="outlined"
                fullWidth={isMobile}
              >
                Отмена
              </Button>
              
              <Button
                startIcon={saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <SaveIcon />}
                type="submit"
                disabled={saving}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  color: 'white',
                  px: 4,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                    boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.3)}`
                  }
                }}
                variant="contained"
                fullWidth={isMobile}
              >
                {saving ? 'Сохранение...' : isEditMode ? 'Обновить упражнение' : 'Создать упражнение'}
              </Button>
            </Stack>
          </Paper>
        </form>
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

export default ExerciseForm;