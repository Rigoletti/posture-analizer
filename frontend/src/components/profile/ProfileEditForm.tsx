import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { authApi } from '../../api/auth';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Alert } from '../ui/Alert';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Grid,
  Divider,
  alpha,
  useTheme,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Save as SaveIcon,
  Info as InfoIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  PhotoCamera as PhotoCameraIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

// Регулярное выражение для проверки кириллицы (включая пробелы и дефисы)
const CYRILLIC_REGEX = /^[А-Яа-яЁё\s-]*$/;
// Регулярное выражение для проверки что строка не пустая и содержит только кириллицу
const CYRILLIC_ONLY_REGEX = /^[А-Яа-яЁё]+(?:[-\s][А-Яа-яЁё]+)*$/;

const ProfileEditForm: React.FC = () => {
  const { user, isLoading: authLoading, refreshUserData } = useAuthStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    postureSettings: {
      notificationsEnabled: true,
      calibrationDone: false
    }
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Состояния для аватара
  const [avatarMenuAnchor, setAvatarMenuAnchor] = useState<null | HTMLElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [avatarUpdateKey, setAvatarUpdateKey] = useState(0);

  // Функция для преобразования строки в формат с заглавной первой буквой
  const capitalizeName = useCallback((value: string): string => {
    if (!value) return value;
    
    // Разбиваем строку на слова (по пробелам и дефисам)
    const words = value.split(/([\s-]+)/);
    
    const capitalizedWords = words.map(word => {
      // Если это разделитель (пробел или дефис), оставляем как есть
      if (/^[\s-]+$/.test(word)) {
        return word;
      }
      
      // Если слово не пустое, делаем первую букву заглавной, остальные строчными
      if (word.length > 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      
      return word;
    });
    
    return capitalizedWords.join('');
  }, []);

  // Вспомогательная функция для валидации кириллицы
  const validateCyrillic = useCallback((value: string, fieldName: string): string | null => {
    if (!value.trim()) {
      return `${fieldName} обязательна для заполнения`;
    }
    
    if (!CYRILLIC_REGEX.test(value)) {
      return `${fieldName} должна содержать только буквы кириллицы, дефисы и пробелы`;
    }
    
    if (!CYRILLIC_ONLY_REGEX.test(value.trim())) {
      return `${fieldName} должна содержать хотя бы одну букву и не может начинаться/заканчиваться дефисом или пробелом`;
    }
    
    if (value.length > 50) {
      return `${fieldName} не может превышать 50 символов`;
    }
    
    // Проверка на повторяющиеся дефисы или пробелы
    if (value.includes('--') || value.includes('  ')) {
      return `${fieldName} не может содержать повторяющиеся дефисы или пробелы`;
    }
    
    return null;
  }, []);

  // Мемоизация начальных данных с форматированием
  const originalData = useMemo(() => user ? {
    lastName: capitalizeName(user.lastName || ''),
    firstName: capitalizeName(user.firstName || ''),
    middleName: capitalizeName(user.middleName || ''),
    postureSettings: {
      notificationsEnabled: user.postureSettings?.notificationsEnabled ?? true,
      calibrationDone: user.postureSettings?.calibrationDone ?? false
    }
  } : null, [user, capitalizeName]);

  // Инициализация формы
  useEffect(() => {
    if (originalData) {
      setFormData(originalData);
    }
  }, [originalData]);

  // Проверка изменений
  useEffect(() => {
    if (originalData) {
      const changes = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(changes);
    }
  }, [formData, originalData]);

  // Валидация формы
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    // Валидация фамилии
    const lastNameError = validateCyrillic(formData.lastName, 'Фамилия');
    if (lastNameError) newErrors.lastName = lastNameError;
    
    // Валидация имени
    const firstNameError = validateCyrillic(formData.firstName, 'Имя');
    if (firstNameError) newErrors.firstName = firstNameError;
    
    // Валидация отчества (необязательное поле)
    if (formData.middleName && formData.middleName.trim()) {
      const middleNameError = validateCyrillic(formData.middleName, 'Отчество');
      if (middleNameError) newErrors.middleName = middleNameError;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.lastName, formData.firstName, formData.middleName, validateCyrillic]);

  // Показ уведомления
  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'error') {
      setSubmitError(message);
    } else {
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    }
  }, []);

  // Обработчик отправки
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Применяем форматирование перед отправкой
    const formattedData = {
      ...formData,
      lastName: capitalizeName(formData.lastName),
      firstName: capitalizeName(formData.firstName),
      middleName: formData.middleName ? capitalizeName(formData.middleName) : '',
    };
    
    // Обновляем formData с отформатированными значениями
    setFormData(formattedData);
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    
    try {
      await authApi.updateProfile(formattedData);
      
      const response = await authApi.getProfile();
      useAuthStore.setState({ user: response.user });
      
      setSubmitSuccess(true);
      setHasChanges(false);
      
      setTimeout(() => setSubmitSuccess(false), 3000);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.errors?.[0]?.message || 
                          'Ошибка при обновлении профиля';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, capitalizeName]);

  // Обработчик изменения полей с фильтрацией ввода и автоформатированием
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Фильтрация ввода: разрешаем только кириллицу, дефисы, пробелы
    let filteredValue = value.replace(/[^А-Яа-яЁё\s-]/g, '');
    
    // Для полей ФИО применяем автоформатирование после ввода
    if (name === 'lastName' || name === 'firstName' || name === 'middleName') {
      // Если пользователь ввел пробел или дефис, не применяем автоформатирование сразу
      // Чтобы не мешать вводу двойных имен
      if (!filteredValue.endsWith(' ') && !filteredValue.endsWith('-')) {
        // Разбиваем на слова и форматируем каждое слово
        const words = filteredValue.split(/([\s-]+)/);
        const formattedWords = words.map((word, index) => {
          // Пропускаем разделители
          if (/^[\s-]+$/.test(word)) return word;
          // Форматируем слово: первая буква заглавная, остальные строчные
          if (word.length > 0) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          }
          return word;
        });
        filteredValue = formattedWords.join('');
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: filteredValue }));
    
    // Очищаем ошибку для поля, если она была
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (submitError) {
      setSubmitError(null);
    }
  }, [errors, submitError]);

  // Обработчик потери фокуса - финальное форматирование
  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // При потере фокуса применяем финальное форматирование
    if (field === 'lastName' || field === 'firstName' || field === 'middleName') {
      const currentValue = formData[field as keyof typeof formData] as string;
      if (currentValue) {
        const formattedValue = capitalizeName(currentValue);
        if (formattedValue !== currentValue) {
          setFormData(prev => ({ ...prev, [field]: formattedValue }));
        }
      }
    }
    
    validateForm();
  }, [formData, capitalizeName, validateForm]);

  // Отмена
  const handleCancel = useCallback(() => {
    if (originalData) {
      setFormData(originalData);
    }
    setErrors({});
    setSubmitError(null);
    setHasChanges(false);
    navigate('/profile');
  }, [originalData, navigate]);

  // Обработчики аватара
  const handleAvatarClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAvatarMenuAnchor(event.currentTarget);
  }, []);

  const handleAvatarMenuClose = useCallback(() => {
    setAvatarMenuAnchor(null);
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Пожалуйста, выберите изображение', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('Файл слишком большой. Максимальный размер: 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setSelectedFile(file);
    setUploadDialogOpen(true);
    handleAvatarMenuClose();
  }, [showNotification, handleAvatarMenuClose]);

  const handleUploadAvatar = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      
      const response = await authApi.uploadAvatar(selectedFile);
      
      if (response.success) {
        await refreshUserData();
        setAvatarUpdateKey(prev => prev + 1);
        showNotification('Аватар успешно загружен', 'success');
        setUploadDialogOpen(false);
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      showNotification(error.message || 'Ошибка при загрузке аватара', 'error');
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, refreshUserData, showNotification]);

  const handleDeleteAvatar = useCallback(async () => {
    try {
      setIsDeleting(true);
      const response = await authApi.deleteAvatar();
      
      if (response.success) {
        await refreshUserData();
        setAvatarUpdateKey(prev => prev + 1);
        showNotification('Аватар успешно удален', 'success');
        setDeleteDialogOpen(false);
      }
    } catch (error: any) {
      showNotification(error.message || 'Ошибка при удалении аватара', 'error');
    } finally {
      setIsDeleting(false);
    }
  }, [refreshUserData, showNotification]);

  const handleUploadDialogClose = useCallback(() => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Получение источника аватара
  const avatarSource = useMemo(() => {
    if (!user) return undefined;
    if (user.avatarUrl) return user.avatarUrl;
    if (user.authProvider === 'yandex' && user.yandexAvatar) return user.yandexAvatar;
    return undefined;
  }, [user?.avatarUrl, user?.authProvider, user?.yandexAvatar, avatarUpdateKey]);

  // Получение инициалов с учетом форматирования
  const getUserInitials = useMemo(() => {
    const first = formData.firstName?.charAt(0) || '';
    const last = formData.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || 'U';
  }, [formData.firstName, formData.lastName]);

  // Мемоизация стилей
  const avatarPreviewStyle = useMemo(() => ({
    p: 3,
    mb: 3,
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    bgcolor: isLight
      ? alpha(theme.palette.background.paper, 0.8)
      : alpha(theme.palette.background.paper, 0.4),
    backdropFilter: 'blur(10px)',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4,
    flexWrap: { xs: 'wrap', sm: 'nowrap' } as const
  }), [isLight, theme.palette.background.paper, theme.palette.divider]);

  const mainInfoStyle = useMemo(() => ({
    p: { xs: 2, sm: 3 },
    mb: 3,
    bgcolor: isLight
      ? alpha(theme.palette.background.paper, 0.8)
      : alpha(theme.palette.background.paper, 0.4),
    backdropFilter: 'blur(10px)',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4,
    transition: 'all 0.3s ease'
  }), [isLight, theme.palette.background.paper, theme.palette.divider]);

  const contactInfoStyle = useMemo(() => ({
    p: { xs: 2, sm: 3 },
    mb: 3,
    bgcolor: isLight
      ? alpha(theme.palette.background.paper, 0.8)
      : alpha(theme.palette.background.paper, 0.4),
    backdropFilter: 'blur(10px)',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4,
    transition: 'all 0.3s ease'
  }), [isLight, theme.palette.background.paper, theme.palette.divider]);

  const actionsStyle = useMemo(() => ({
    p: { xs: 2, sm: 3 },
    bgcolor: isLight
      ? alpha(theme.palette.background.paper, 0.8)
      : alpha(theme.palette.background.paper, 0.4),
    backdropFilter: 'blur(10px)',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4
  }), [isLight, theme.palette.background.paper, theme.palette.divider]);

  if (authLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          gap: 2
        }}
      >
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LoadingSpinner size="medium" />
        </Box>
        <Typography sx={{ color: theme.palette.text.secondary }}>
          Загрузка данных...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Box>
      {/* Скрытый input для загрузки файла */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: 'none' }}
      />

      {/* Уведомления */}
      {submitError && (
        <Box sx={{ mb: 3 }}>
          <Alert 
            type="error" 
            message={submitError} 
            onClose={() => setSubmitError(null)} 
          />
        </Box>
      )}
      
      {submitSuccess && (
        <Box sx={{ mb: 3 }}>
          <Alert 
            type="success" 
            message="Профиль успешно обновлен!" 
          />
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        {/* Превью аватара */}
        <Paper sx={avatarPreviewStyle}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <IconButton
                onClick={handleAvatarClick}
                size="small"
                sx={{
                  bgcolor: theme.palette.primary.main,
                  border: `2px solid ${theme.palette.background.paper}`,
                  padding: '6px',
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark
                  }
                }}
              >
                <PhotoCameraIcon sx={{ fontSize: 16, color: '#ffffff' }} />
              </IconButton>
            }
          >
            <Avatar
              src={avatarSource}
              onClick={handleAvatarClick}
              sx={{
                width: 80,
                height: 80,
                bgcolor: alpha(theme.palette.primary.main, 0.2),
                color: theme.palette.primary.main,
                fontSize: '2rem',
                fontWeight: 600,
                border: `3px solid ${theme.palette.primary.main}`,
                boxShadow: theme.shadows[3],
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              {!avatarSource && getUserInitials}
            </Avatar>
          </Badge>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
              {formData.lastName} {formData.firstName} {formData.middleName}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
              <EmailIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                {user.email}
              </Typography>
            </Stack>
          </Box>
          
          <Tooltip title="Вернуться в профиль">
            <IconButton
              onClick={() => navigate('/profile')}
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
        </Paper>

        {/* Меню аватара */}
        <Menu
          anchorEl={avatarMenuAnchor}
          open={Boolean(avatarMenuAnchor)}
          onClose={handleAvatarMenuClose}
        >
          <MenuItem onClick={() => fileInputRef.current?.click()}>
            <ListItemIcon>
              <CloudUploadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Загрузить фото</ListItemText>
          </MenuItem>
          
          {avatarSource && (
            <MenuItem onClick={() => setDeleteDialogOpen(true)}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Удалить фото</ListItemText>
            </MenuItem>
          )}
        </Menu>

        {/* Диалог загрузки аватара */}
        <Dialog open={uploadDialogOpen} onClose={handleUploadDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>Загрузка аватара</DialogTitle>
          <DialogContent>
            {previewUrl && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Avatar src={previewUrl} sx={{ width: 150, height: 150 }} />
              </Box>
            )}
            <Typography variant="body2" color="text.secondary">
              Выберите изображение для аватара. Рекомендуемый размер: 400x400 пикселей.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleUploadDialogClose}>Отмена</Button>
            <Button onClick={handleUploadAvatar} variant="contained" disabled={isUploading}>
              {isUploading ? <CircularProgress size={24} /> : 'Загрузить'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Диалог удаления аватара */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Удалить аватар?</DialogTitle>
          <DialogContent>
            <Typography>Вы уверены, что хотите удалить аватар?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleDeleteAvatar} color="error" disabled={isDeleting}>
              {isDeleting ? <CircularProgress size={24} /> : 'Удалить'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Основная информация */}
        <Paper sx={mainInfoStyle}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <PersonIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
              Основная информация
            </Typography>
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Фамилия *"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                onBlur={() => handleBlur('lastName')}
                error={!!errors.lastName && touched.lastName}
                helperText={touched.lastName && errors.lastName}
                disabled={isSubmitting}
                required
                variant="outlined"
                placeholder="Иванов"
                inputProps={{
                  autoComplete: 'family-name',
                }}
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
                  '& .MuiFormHelperText-root': {
                    color: theme.palette.error.main,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Имя *"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                onBlur={() => handleBlur('firstName')}
                error={!!errors.firstName && touched.firstName}
                helperText={touched.firstName && errors.firstName}
                disabled={isSubmitting}
                required
                variant="outlined"
                placeholder="Иван"
                inputProps={{
                  autoComplete: 'given-name',
                }}
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
                  '& .MuiFormHelperText-root': {
                    color: theme.palette.error.main,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Отчество"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                onBlur={() => handleBlur('middleName')}
                error={!!errors.middleName && touched.middleName}
                helperText={touched.middleName && errors.middleName}
                disabled={isSubmitting}
                variant="outlined"
                placeholder="Иванович (необязательно)"
                inputProps={{
                  autoComplete: 'additional-name',
                }}
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
                  '& .MuiFormHelperText-root': {
                    color: theme.palette.error.main,
                  },
                }}
              />
            </Grid>
          </Grid>
 
        </Paper>

        {/* Контактная информация */}
        <Paper sx={contactInfoStyle}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                bgcolor: alpha(theme.palette.info.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              }}
            >
              <EmailIcon sx={{ color: theme.palette.info.main, fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
              Контактная информация
            </Typography>
          </Stack>

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              borderColor: theme.palette.divider,
              borderRadius: 3
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  color: theme.palette.info.main
                }}
              >
                <EmailIcon />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
                  Email
                </Typography>
                <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                  {user.email}
                </Typography>
              </Box>
              <Tooltip title="Email нельзя изменить">
                <InfoIcon sx={{ color: theme.palette.text.disabled, fontSize: 20 }} />
              </Tooltip>
            </Stack>
            <Typography variant="caption" sx={{ color: theme.palette.text.disabled, display: 'block', mt: 1, ml: 7 }}>
              Для изменения email обратитесь к администратору
            </Typography>
          </Paper>
        </Paper>

        {/* Кнопки действий */}
        <Paper sx={actionsStyle}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end">
            <Button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              variant="outlined"
              startIcon={<CancelIcon />}
              sx={{
                borderColor: theme.palette.divider,
                color: theme.palette.text.secondary,
                textTransform: 'none',
                px: 3,
                py: 1.5,
                '&:hover': {
                  borderColor: theme.palette.error.main,
                  color: theme.palette.error.main,
                  bgcolor: alpha(theme.palette.error.main, 0.1)
                }
              }}
            >
              Отмена
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || !hasChanges}
              startIcon={isSubmitting ? <LoadingSpinner size="small" /> : <SaveIcon />}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                color: theme.palette.primary.contrastText,
                textTransform: 'none',
                px: 4,
                py: 1.5,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                },
                '&:disabled': {
                  background: alpha(theme.palette.primary.main, 0.3)
                }
              }}
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </Stack>

          {/* Индикатор изменений */}
          {hasChanges && (
            <>
              <Divider sx={{ my: 2, borderColor: theme.palette.divider }} />
              <Stack direction="row" alignItems="center" spacing={1}>
                <InfoIcon sx={{ color: theme.palette.info.main, fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  У вас есть несохраненные изменения
                </Typography>
              </Stack>
            </>
          )}
        </Paper>

        {/* Справка */}
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 2,
            bgcolor: alpha(theme.palette.info.main, 0.05),
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2
          }}
        >
          <InfoIcon sx={{ color: theme.palette.info.main, fontSize: 20, mt: 0.5 }} />
          <Box>
            <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 0.5 }}>
              Информация
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.5 }}>
              После сохранения изменений система автоматически обновит ваши данные.
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
              Для изменения email или других критических данных обратитесь к администратору.
            </Typography>
          </Box>
        </Paper>
      </form>
    </Box>
  );
};

export default ProfileEditForm;