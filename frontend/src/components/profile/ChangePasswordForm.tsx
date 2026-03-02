import React, { useState } from 'react';
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
  InputAdornment,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Lock as LockIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  CircleOutlined as CircleOutlinedIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const ChangePasswordForm: React.FC = () => {
  const { isLoading: authLoading } = useAuthStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Текущий пароль обязателен';
    }
    
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'Новый пароль обязателен';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Пароль должен содержать минимум 6 символов';
    } else if (!/(?=.*[A-Z])/.test(formData.newPassword)) {
      newErrors.newPassword = 'Добавьте хотя бы одну заглавную букву';
    } else if (!/(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = 'Добавьте хотя бы одну цифру';
    }
    
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Подтверждение пароля обязательно';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
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
      await authApi.updatePassword(formData);
      
      setSubmitSuccess(true);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setErrors({});
      setTouched({});
      
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.errors?.[0]?.message || 
                          'Ошибка при смене пароля';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
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
    navigate('/profile');
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const passwordStrength = (password: string) => {
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (/(?=.*[A-Z])/.test(password)) strength += 25;
    if (/(?=.*\d)/.test(password)) strength += 25;
    if (/(?=.*[!@#$%^&*])/.test(password)) strength += 25;
    
    return strength;
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 25) return theme.palette.error.main;
    if (strength < 50) return theme.palette.warning.main;
    if (strength < 75) return theme.palette.info.main;
    return theme.palette.success.main;
  };

  const getStrengthText = (strength: number) => {
    if (strength < 25) return 'Очень слабый';
    if (strength < 50) return 'Слабый';
    if (strength < 75) return 'Средний';
    if (strength < 100) return 'Сильный';
    return 'Очень сильный';
  };

  const requirements = [
    { 
      label: 'Минимум 6 символов', 
      met: formData.newPassword.length >= 6 
    },
    { 
      label: 'Хотя бы одна заглавная буква', 
      met: /(?=.*[A-Z])/.test(formData.newPassword) 
    },
    { 
      label: 'Хотя бы одна цифра', 
      met: /(?=.*\d)/.test(formData.newPassword) 
    },
    { 
      label: 'Рекомендуется специальный символ', 
      met: /(?=.*[!@#$%^&*])/.test(formData.newPassword) 
    }
  ];

  const strength = passwordStrength(formData.newPassword);

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

  return (
    <Fade in={true} timeout={800}>
      <Box>
        {/* Заголовок */}
        <Grow in={true} timeout={500}>
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 0.5,
                position: 'relative',
                display: 'inline-block',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -4,
                  left: 0,
                  width: 40,
                  height: 3,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  borderRadius: 2
                }
              }}
            >
              Смена пароля
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Обновите пароль для защиты вашего аккаунта
            </Typography>
          </Box>
        </Grow>

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
                  message="Пароль успешно изменен! Перенаправление на страницу профиля..." 
                />
              </Box>
            </Zoom>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          {/* Основная форма */}
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
                  <LockIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                </Box>
                <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                  Введите пароли
                </Typography>
              </Stack>

              <Stack spacing={3}>
                {/* Текущий пароль */}
                <TextField
                  fullWidth
                  label="Текущий пароль *"
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur('currentPassword')}
                  error={!!errors.currentPassword}
                  helperText={errors.currentPassword}
                  disabled={isSubmitting}
                  required
                  variant="outlined"
                  autoComplete="current-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('current')}
                          edge="end"
                          sx={{
                            color: theme.palette.text.secondary,
                            '&:hover': { color: theme.palette.primary.main }
                          }}
                        >
                          {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
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

                {/* Новый пароль */}
                <TextField
                  fullWidth
                  label="Новый пароль *"
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur('newPassword')}
                  error={!!errors.newPassword}
                  helperText={errors.newPassword}
                  disabled={isSubmitting}
                  required
                  variant="outlined"
                  autoComplete="new-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('new')}
                          edge="end"
                          sx={{
                            color: theme.palette.text.secondary,
                            '&:hover': { color: theme.palette.primary.main }
                          }}
                        >
                          {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
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

                {/* Индикатор сложности пароля */}
                <AnimatePresence>
                  {formData.newPassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: alpha(theme.palette.background.paper, 0.5),
                          borderColor: alpha(getStrengthColor(strength), 0.3),
                          borderRadius: 2
                        }}
                      >
                        <Stack spacing={1}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              Сложность пароля
                            </Typography>
                            <Typography variant="body2" sx={{ color: getStrengthColor(strength), fontWeight: 600 }}>
                              {getStrengthText(strength)}
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={strength}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: alpha(theme.palette.text.disabled, 0.1),
                              '& .MuiLinearProgress-bar': {
                                background: `linear-gradient(90deg, ${getStrengthColor(strength)}, ${alpha(getStrengthColor(strength), 0.7)})`,
                                borderRadius: 3
                              }
                            }}
                          />
                        </Stack>
                      </Paper>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Подтверждение пароля */}
                <TextField
                  fullWidth
                  label="Подтверждение пароля *"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur('confirmPassword')}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  disabled={isSubmitting}
                  required
                  variant="outlined"
                  autoComplete="new-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('confirm')}
                          edge="end"
                          sx={{
                            color: theme.palette.text.secondary,
                            '&:hover': { color: theme.palette.primary.main }
                          }}
                        >
                          {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
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
              </Stack>
            </Paper>
          </Slide>

          {/* Требования к паролю */}
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
                borderRadius: 4
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <SecurityIcon sx={{ color: theme.palette.info.main, fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                  Требования к паролю
                </Typography>
              </Stack>

              <List dense>
                {requirements.map((req, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {req.met ? (
                        <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 18 }} />
                      ) : (
                        <CircleOutlinedIcon sx={{ color: theme.palette.text.disabled, fontSize: 18 }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={req.label}
                      primaryTypographyProps={{
                        variant: 'body2',
                        sx: {
                          color: req.met ? theme.palette.success.main : theme.palette.text.secondary,
                          fontWeight: req.met ? 500 : 400
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Slide>

          {/* Кнопки действий */}
          <Slide in={true} direction="up" timeout={800}>
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
                  disabled={isSubmitting}
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
                  {isSubmitting ? 'Смена пароля...' : 'Сменить пароль'}
                </Button>
              </Stack>
            </Paper>
          </Slide>

          {/* Уведомление о безопасности */}
          <Fade in={true} timeout={900}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: alpha(theme.palette.warning.main, 0.05),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2
              }}
            >
              <WarningIcon sx={{ color: theme.palette.warning.main, fontSize: 20, mt: 0.5 }} />
              <Box>
                <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 1 }}>
                  Меры безопасности
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2, color: theme.palette.text.secondary }}>
                  <li style={{ marginBottom: 4 }}>Не используйте один и тот же пароль на разных сайтах</li>
                  <li style={{ marginBottom: 4 }}>Регулярно меняйте пароль (рекомендуется каждые 3 месяца)</li>
                  <li style={{ marginBottom: 4 }}>Никому не сообщайте ваш пароль</li>
                  <li>При подозрении на взлом немедленно смените пароль</li>
                </Box>
              </Box>
            </Paper>
          </Fade>
        </form>
      </Box>
    </Fade>
  );
};

export default ChangePasswordForm;