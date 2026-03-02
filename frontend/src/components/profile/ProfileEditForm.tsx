import React, { useState, useEffect } from 'react';
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
  Fade,
  Zoom,
  Grow,
  Slide,
  Avatar,
  IconButton,
  Tooltip,
  InputAdornment
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileEditForm: React.FC = () => {
  const { user, isLoading: authLoading } = useAuthStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  
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

  useEffect(() => {
    if (user) {
      setFormData({
        lastName: user.lastName || '',
        firstName: user.firstName || '',
        middleName: user.middleName || '',
        postureSettings: {
          notificationsEnabled: user.postureSettings?.notificationsEnabled ?? true,
          calibrationDone: user.postureSettings?.calibrationDone ?? false
        }
      });
    }
  }, [user]);

  useEffect(() => {
    const originalData = user ? {
      lastName: user.lastName || '',
      firstName: user.firstName || '',
      middleName: user.middleName || '',
      postureSettings: {
        notificationsEnabled: user.postureSettings?.notificationsEnabled ?? true,
        calibrationDone: user.postureSettings?.calibrationDone ?? false
      }
    } : null;

    if (originalData) {
      const changes = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(changes);
    }
  }, [formData, user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Фамилия обязательна для заполнения';
    } else if (formData.lastName.length > 50) {
      newErrors.lastName = 'Фамилия не может превышать 50 символов';
    }
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Имя обязательно для заполнения';
    } else if (formData.firstName.length > 50) {
      newErrors.firstName = 'Имя не может превышать 50 символов';
    }
    
    if (formData.middleName && formData.middleName.length > 50) {
      newErrors.middleName = 'Отчество не может превышать 50 символов';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    
    try {
      await authApi.updateProfile(formData);
      
      // Обновляем данные в store
      const response = await authApi.getProfile();
      useAuthStore.setState({ user: response.user });
      
      setSubmitSuccess(true);
      setHasChanges(false);
      
      // Автоматически скрываем уведомление об успехе через 3 секунды
      setTimeout(() => setSubmitSuccess(false), 3000);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.errors?.[0]?.message || 
                          'Ошибка при обновлении профиля';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('postureSettings.')) {
      const settingName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        postureSettings: {
          ...prev.postureSettings,
          [settingName]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateForm();
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        lastName: user.lastName || '',
        firstName: user.firstName || '',
        middleName: user.middleName || '',
        postureSettings: {
          notificationsEnabled: user.postureSettings?.notificationsEnabled ?? true,
          calibrationDone: user.postureSettings?.calibrationDone ?? false
        }
      });
    }
    setErrors({});
    setSubmitError(null);
    setHasChanges(false);
    navigate('/profile');
  };

  const getUserInitials = () => {
    const first = formData.firstName?.charAt(0) || '';
    const last = formData.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || 'U';
  };

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
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': {
                boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0.7)}`,
              },
              '70%': {
                boxShadow: `0 0 0 20px ${alpha(theme.palette.primary.main, 0)}`,
              },
              '100%': {
                boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0)}`,
              },
            }
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
    <Fade in={true} timeout={800}>
      <Box>
        {/* Уведомления */}
        <AnimatePresence mode="wait">
          {submitError && (
            <Zoom in={true} key="error">
              <Box sx={{ mb: 3 }}>
                <Alert 
                  type="error" 
                  message={submitError} 
                  onClose={() => setSubmitError(null)} 
                />
              </Box>
            </Zoom>
          )}
          
          {submitSuccess && (
            <Zoom in={true} key="success">
              <Box sx={{ mb: 3 }}>
                <Alert 
                  type="success" 
                  message="Профиль успешно обновлен!" 
                />
              </Box>
            </Zoom>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          {/* Превью аватара */}
          <Grow in={true} timeout={500}>
            <Paper
              elevation={isLight ? 1 : 0}
              sx={{
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
                flexWrap: { xs: 'wrap', sm: 'nowrap' }
              }}
            >
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                  color: theme.palette.primary.main,
                  fontSize: '2rem',
                  fontWeight: 600,
                  border: `3px solid ${theme.palette.primary.main}`,
                  boxShadow: theme.shadows[3]
                }}
              >
                {getUserInitials()}
              </Avatar>
              
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
          </Grow>

          {/* Основная информация */}
          <Slide in={true} direction="right" timeout={600}>
            <Paper
              elevation={isLight ? 1 : 0}
              sx={{
                p: { xs: 2, sm: 3 },
                mb: 3,
                bgcolor: isLight
                  ? alpha(theme.palette.background.paper, 0.8)
                  : alpha(theme.palette.background.paper, 0.4),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 4,
                transition: 'all 0.3s ease'
              }}
            >
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
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                    disabled={isSubmitting}
                    required
                    variant="outlined"
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
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                    disabled={isSubmitting}
                    required
                    variant="outlined"
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
                    error={!!errors.middleName}
                    helperText={errors.middleName}
                    disabled={isSubmitting}
                    variant="outlined"
                    placeholder="Необязательное поле"
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
          </Slide>

          {/* Контактная информация */}
          <Slide in={true} direction="right" timeout={700}>
            <Paper
              elevation={isLight ? 1 : 0}
              sx={{
                p: { xs: 2, sm: 3 },
                mb: 3,
                bgcolor: isLight
                  ? alpha(theme.palette.background.paper, 0.8)
                  : alpha(theme.palette.background.paper, 0.4),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 4,
                transition: 'all 0.3s ease'
              }}
            >
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
          </Slide>

          {/* Кнопки действий */}
          <Slide in={true} direction="up" timeout={800}>
            <Paper
              elevation={isLight ? 1 : 0}
              sx={{
                p: { xs: 2, sm: 3 },
                bgcolor: isLight
                  ? alpha(theme.palette.background.paper, 0.8)
                  : alpha(theme.palette.background.paper, 0.4),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 4
              }}
            >
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
              <AnimatePresence>
                {hasChanges && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Divider sx={{ my: 2, borderColor: theme.palette.divider }} />
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <InfoIcon sx={{ color: theme.palette.info.main, fontSize: 18 }} />
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        У вас есть несохраненные изменения
                      </Typography>
                    </Stack>
                  </motion.div>
                )}
              </AnimatePresence>
            </Paper>
          </Slide>

          {/* Справка */}
          <Fade in={true} timeout={900}>
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
          </Fade>
        </form>
      </Box>
    </Fade>
  );
};

export default ProfileEditForm;