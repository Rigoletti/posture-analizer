import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  FormControlLabel,
  Checkbox,
  alpha,
  InputAdornment,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  PersonOutline as PersonOutlineIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon2,
  Key as KeyIcon
} from '@mui/icons-material';
import { adminApi } from '../../api/admin';

interface UserFormData {
  lastName: string;
  firstName: string;
  middleName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  isActive: boolean;
}

interface User {
  _id: string;
  lastName: string;
  firstName: string;
  middleName: string;
  fullName: string;
  email: string;
  role: 'guest' | 'user' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

const UserForm: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isEditMode = Boolean(id);
  
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    lastName: '',
    firstName: '',
    middleName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    isActive: true
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      fetchUser(id);
    }
  }, [id, isEditMode]);

  const fetchUser = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminApi.getUserById(userId);
      const userData = response.data.user;
      
      setUser(userData);
      setFormData({
        lastName: userData.lastName || '',
        firstName: userData.firstName || '',
        middleName: userData.middleName || '',
        email: userData.email || '',
        password: '',
        confirmPassword: '',
        role: userData.role || 'user',
        isActive: userData.isActive !== undefined ? userData.isActive : true
      });
      
    } catch (err: any) {
      console.error('Error fetching user:', err);
      setError(err.message || 'Ошибка при загрузке пользователя');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.lastName.trim()) {
      errors.push('Фамилия обязательна для заполнения');
    }
    
    if (!formData.firstName.trim()) {
      errors.push('Имя обязательно для заполнения');
    }
    
    if (!formData.email.trim()) {
      errors.push('Email обязателен для заполнения');
    }
    
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(formData.email)) {
      errors.push('Пожалуйста, введите корректный email');
    }
    
    if (showPasswordFields) {
      if (!formData.password) {
        errors.push('Пароль обязателен для заполнения');
      } else if (formData.password.length < 6) {
        errors.push('Пароль должен содержать минимум 6 символов');
      }
      
      if (formData.password !== formData.confirmPassword) {
        errors.push('Пароли не совпадают');
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
      setSuccess(null);
      
      // Подготавливаем данные для отправки
      const userData: any = {
        lastName: formData.lastName.trim(),
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim(),
        email: formData.email.toLowerCase().trim(),
        role: formData.role,
        isActive: formData.isActive
      };
      
      // Добавляем пароль только если он был изменен
      if (showPasswordFields && formData.password) {
        userData.password = formData.password;
      }
      
      console.log('Отправка данных пользователя:', userData);
      
      let response;
      if (isEditMode && id) {
        response = await adminApi.updateUser(id, userData);
      } else {
        response = await adminApi.createUser(userData);
      }
      
      console.log('Ответ сервера:', response);
      
      setSuccess(isEditMode ? 'Пользователь успешно обновлен!' : 'Пользователь успешно создан!');
      
      setTimeout(() => {
        navigate('/admin/users');
      }, 2000);
      
    } catch (err: any) {
      console.error('Ошибка при сохранении пользователя:', err);
      const errorMessage = err.message || 'Ошибка при сохранении пользователя';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/users');
  };

  const togglePasswordFields = () => {
    setShowPasswordFields(!showPasswordFields);
    if (!showPasswordFields) {
      // Очищаем поля пароля при скрытии
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
    }
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Администратор',
          color: '#ef4444',
          icon: <AdminPanelSettingsIcon sx={{ fontSize: 16 }} />
        };
      case 'user':
        return {
          label: 'Пользователь',
          color: '#3b82f6',
          icon: <PersonIcon sx={{ fontSize: 16 }} />
        };
      case 'guest':
        return {
          label: 'Гость',
          color: '#6b7280',
          icon: <PersonOutlineIcon sx={{ fontSize: 16 }} />
        };
      default:
        return {
          label: role,
          color: '#6b7280',
          icon: <PersonOutlineIcon sx={{ fontSize: 16 }} />
        };
    }
  };

  const getStatusInfo = (isActive: boolean) => {
    return {
      label: isActive ? 'Активен' : 'Неактивен',
      color: isActive ? '#10b981' : '#ef4444',
      icon: isActive ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <CancelIcon2 sx={{ fontSize: 16 }} />
    };
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (loading && isEditMode) {
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
            Загрузка данных пользователя...
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

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
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
              {isEditMode ? 'Редактирование пользователя' : 'Создание нового пользователя'}
            </Typography>
          </Stack>
          
          {isEditMode && user && (
            <Paper sx={{ 
              p: 2, 
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
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                justifyContent="space-between" 
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={2}
              >
                <Stack spacing={0.5}>
                  <Typography variant="body1" sx={{ 
                    color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                    fontWeight: 500 
                  }}>
                    ID: {user._id}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                  }}>
                    Зарегистрирован: {formatDate(user.createdAt)}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                  }}>
                    Email подтвержден: {user.emailVerified ? 'Да' : 'Нет'}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Chip
                    icon={getRoleInfo(user.role).icon}
                    label={getRoleInfo(user.role).label}
                    size="small"
                    sx={{
                      bgcolor: alpha(getRoleInfo(user.role).color, 0.1),
                      color: getRoleInfo(user.role).color,
                      border: `1px solid ${alpha(getRoleInfo(user.role).color, 0.3)}`
                    }}
                  />
                  <Chip
                    icon={getStatusInfo(user.isActive).icon}
                    label={getStatusInfo(user.isActive).label}
                    size="small"
                    sx={{
                      bgcolor: alpha(getStatusInfo(user.isActive).color, 0.1),
                      color: getStatusInfo(user.isActive).color,
                      border: `1px solid ${alpha(getStatusInfo(user.isActive).color, 0.3)}`
                    }}
                  />
                </Stack>
              </Stack>
            </Paper>
          )}
        </Box>

        {/* Сообщения об ошибках/успехе */}
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

        <form onSubmit={handleSubmit}>
          <Card sx={{ 
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
            <CardContent>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                  mb: 3,
                  fontWeight: 600
                }}
              >
                Основная информация
              </Typography>
              
              <Stack spacing={3}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                  <TextField
                    label="Фамилия *"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: theme.palette.mode === 'light'
                          ? alpha('#ffffff', 0.8)
                          : 'rgba(15, 23, 42, 0.8)',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8'
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: theme.palette.primary.main
                      },
                      '& .MuiOutlinedInput-input': {
                        color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff'
                      }
                    }}
                  />
                  
                  <TextField
                    label="Имя *"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: theme.palette.mode === 'light'
                          ? alpha('#ffffff', 0.8)
                          : 'rgba(15, 23, 42, 0.8)',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8'
                      },
                      '& .MuiOutlinedInput-input': {
                        color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff'
                      }
                    }}
                  />
                </Stack>
                
                <TextField
                  label="Отчество"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: theme.palette.mode === 'light'
                        ? alpha('#ffffff', 0.8)
                        : 'rgba(15, 23, 42, 0.8)',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8'
                    },
                    '& .MuiOutlinedInput-input': {
                      color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff'
                    }
                  }}
                />
                
                <TextField
                  label="Email *"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: theme.palette.mode === 'light'
                        ? alpha('#ffffff', 0.8)
                        : 'rgba(15, 23, 42, 0.8)',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8'
                    },
                    '& .MuiOutlinedInput-input': {
                      color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff'
                    }
                  }}
                />
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ 
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
            <CardContent>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                  mb: 3,
                  fontWeight: 600
                }}
              >
                Роль и статус
              </Typography>
              
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8' }}>
                    Роль пользователя *
                  </InputLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleSelectChange}
                    label="Роль пользователя *"
                    sx={{
                      bgcolor: theme.palette.mode === 'light'
                        ? alpha('#ffffff', 0.8)
                        : 'rgba(15, 23, 42, 0.8)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'light'
                          ? 'rgba(0, 0, 0, 0.1)'
                          : 'rgba(255, 255, 255, 0.1)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main
                      },
                      '& .MuiSelect-select': {
                        color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff'
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
                    <MenuItem value="user">
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <PersonIcon sx={{ color: '#3b82f6' }} />
                        <Box>
                          <Typography sx={{ 
                            color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff'
                          }}>
                            Пользователь
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                          }}>
                            Стандартные права
                          </Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="admin">
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <AdminPanelSettingsIcon sx={{ color: '#ef4444' }} />
                        <Box>
                          <Typography sx={{ 
                            color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff'
                          }}>
                            Администратор
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                          }}>
                            Полный доступ к системе
                          </Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="guest">
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <PersonOutlineIcon sx={{ color: '#6b7280' }} />
                        <Box>
                          <Typography sx={{ 
                            color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff'
                          }}>
                            Гость
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                          }}>
                            Ограниченные права
                          </Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                  </Select>
                </FormControl>
                
                <FormControlLabel
                  control={
                    <Checkbox
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      sx={{
                        color: theme.palette.primary.main,
                        '&.Mui-checked': {
                          color: theme.palette.primary.main
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
                        Аккаунт активен
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                      }}>
                        {formData.isActive 
                          ? 'Пользователь может войти в систему'
                          : 'Пользователь не может войти в систему'}
                      </Typography>
                    </Stack>
                  }
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Пароль - только при создании или при явном запросе */}
          {(!isEditMode || showPasswordFields) && (
            <Card sx={{ 
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
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                      fontWeight: 600
                    }}
                  >
                    Пароль
                  </Typography>
                  
                  {isEditMode && (
                    <Button
                      startIcon={<KeyIcon />}
                      onClick={togglePasswordFields}
                      size="small"
                      sx={{
                        color: showPasswordFields 
                          ? theme.palette.warning.main 
                          : theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                        borderColor: showPasswordFields 
                          ? alpha(theme.palette.warning.main, 0.3)
                          : theme.palette.mode === 'light'
                            ? 'rgba(0, 0, 0, 0.2)'
                            : 'rgba(255, 255, 255, 0.2)',
                        '&:hover': {
                          borderColor: showPasswordFields 
                            ? theme.palette.warning.dark
                            : theme.palette.primary.main,
                          bgcolor: showPasswordFields 
                            ? alpha(theme.palette.warning.main, 0.1)
                            : alpha(theme.palette.primary.main, 0.1)
                        }
                      }}
                      variant="outlined"
                    >
                      {showPasswordFields ? 'Отменить изменение пароля' : 'Изменить пароль'}
                    </Button>
                  )}
                </Stack>
                
                <Stack spacing={3}>
                  <TextField
                    label="Новый пароль"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={!isEditMode || showPasswordFields}
                    fullWidth
                    helperText="Минимум 6 символов"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: theme.palette.mode === 'light'
                          ? alpha('#ffffff', 0.8)
                          : 'rgba(15, 23, 42, 0.8)',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8'
                      },
                      '& .MuiOutlinedInput-input': {
                        color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff'
                      },
                      '& .MuiFormHelperText-root': {
                        color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                      }
                    }}
                  />
                  
                  <TextField
                    label="Подтверждение пароля"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required={!isEditMode || showPasswordFields}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: theme.palette.mode === 'light'
                          ? alpha('#ffffff', 0.8)
                          : 'rgba(15, 23, 42, 0.8)',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8'
                      },
                      '& .MuiOutlinedInput-input': {
                        color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff'
                      }
                    }}
                  />
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Кнопки действий */}
          <Paper
            sx={{
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
                {saving ? 'Сохранение...' : isEditMode ? 'Обновить пользователя' : 'Создать пользователя'}
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

export default UserForm;