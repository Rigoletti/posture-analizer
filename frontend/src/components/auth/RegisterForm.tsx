import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import {
  Box,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
  Typography,
  LinearProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
  }, []);

  const handleOpenPrivacyModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setPrivacyModalOpen(true);
  };

  const handleClosePrivacyModal = () => {
    setPrivacyModalOpen(false);
  };

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
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен для заполнения';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Пожалуйста, введите корректный email';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Пароль обязателен для заполнения';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Добавьте хотя бы одну заглавную букву';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Добавьте хотя бы одну цифру';
    }
    
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Подтверждение пароля обязательно';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'Необходимо согласие на обработку данных';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    
    if (!validateForm()) {
      return;
    }
    
    clearError();
    
    try {
      const result = await register(formData);
      
      if (result?.requiresVerification) {
        navigate('/verify-email', { 
          state: { email: formData.email } 
        });
      }
    } catch (error) {
      // Ошибка обрабатывается в сторе
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (error) {
      clearError();
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (touched[field] || isSubmitted) {
      validateForm();
    }
  };

  const shouldShowError = (field: string) => {
    return (touched[field] && errors[field]) || (isSubmitted && errors[field]);
  };

  const passwordStrength = () => {
    if (!formData.password) return 0;
    
    let strength = 0;
    if (formData.password.length >= 6) strength += 25;
    if (/(?=.*[A-Z])/.test(formData.password)) strength += 25;
    if (/(?=.*\d)/.test(formData.password)) strength += 25;
    if (/(?=.*[!@#$%^&*])/.test(formData.password)) strength += 25;
    
    return Math.min(strength, 100);
  };

  const getPasswordStrengthColor = () => {
    const strength = passwordStrength();
    if (strength < 50) return 'error';
    if (strength < 75) return 'warning';
    return 'success';
  };

  const getPasswordStrengthText = () => {
    const strength = passwordStrength();
    if (strength < 50) return 'Слабый пароль';
    if (strength < 75) return 'Средний пароль';
    return 'Надежный пароль';
  };

  const textFieldStyles = {
    width: '100%',
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.2)',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'rgba(59, 130, 246, 0.8)',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.6) !important',
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#3b82f6 !important',
    },
    '& .MuiOutlinedInput-input': {
      color: 'white !important',
    },
    '& .MuiFormHelperText-root': {
      color: '#f87171 !important',
    },
    '& .MuiInputBase-input::placeholder': {
      color: 'rgba(255, 255, 255, 0.4) !important',
    }
  };

  return (
    <>
      <Box 
        component="form" 
        onSubmit={handleSubmit} 
        noValidate 
        sx={{ 
          width: '100%',
          maxWidth: '500px',
          mx: 'auto'
        }}
      >
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              width: '100%'
            }}
            action={
              <IconButton
                aria-label="close"
                size="small"
                onClick={clearError}
                sx={{ color: '#fca5a5' }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
          >
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2, width: '100%' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              <TextField
                fullWidth
                required
                id="lastName"
                name="lastName"
                label="Фамилия"
                value={formData.lastName}
                onChange={handleChange}
                onBlur={() => handleBlur('lastName')}
                error={shouldShowError('lastName')}
                helperText={shouldShowError('lastName') ? errors.lastName : ''}
                disabled={isLoading}
                variant="outlined"
                sx={textFieldStyles}
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              <TextField
                fullWidth
                required
                id="firstName"
                name="firstName"
                label="Имя"
                value={formData.firstName}
                onChange={handleChange}
                onBlur={() => handleBlur('firstName')}
                error={shouldShowError('firstName')}
                helperText={shouldShowError('firstName') ? errors.firstName : ''}
                disabled={isLoading}
                variant="outlined"
                sx={textFieldStyles}
              />
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mb: 2, width: '100%' }}>
          <TextField
            fullWidth
            id="middleName"
            name="middleName"
            label="Отчество (необязательно)"
            value={formData.middleName}
            onChange={handleChange}
            onBlur={() => handleBlur('middleName')}
            error={shouldShowError('middleName')}
            helperText={shouldShowError('middleName') ? errors.middleName : ''}
            disabled={isLoading}
            variant="outlined"
            sx={textFieldStyles}
          />
        </Box>

        <Box sx={{ mb: 2, width: '100%' }}>
          <TextField
            fullWidth
            required
            id="email"
            name="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={() => handleBlur('email')}
            error={shouldShowError('email')}
            helperText={shouldShowError('email') ? errors.email : ''}
            disabled={isLoading}
            autoComplete="email"
            variant="outlined"
            sx={textFieldStyles}
          />
        </Box>

        <Box sx={{ mb: 2, width: '100%' }}>
          <TextField
            fullWidth
            required
            id="password"
            name="password"
            label="Пароль"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            onBlur={() => handleBlur('password')}
            error={shouldShowError('password')}
            helperText={shouldShowError('password') ? errors.password : ''}
            disabled={isLoading}
            autoComplete="new-password"
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    disabled={isLoading}
                    sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={textFieldStyles}
          />
          
          {formData.password && (
            <Box sx={{ mt: 1, width: '100%' }}>
              <LinearProgress 
                variant="determinate" 
                value={passwordStrength()} 
                color={getPasswordStrengthColor()}
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  width: '100%'
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, width: '100%' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  {getPasswordStrengthText()}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  {passwordStrength()}%
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        <Box sx={{ mb: 2, width: '100%' }}>
          <TextField
            fullWidth
            required
            id="confirmPassword"
            name="confirmPassword"
            label="Подтверждение пароля"
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={() => handleBlur('confirmPassword')}
            error={shouldShowError('confirmPassword')}
            helperText={shouldShowError('confirmPassword') ? errors.confirmPassword : ''}
            disabled={isLoading}
            autoComplete="new-password"
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showConfirmPassword ? "Скрыть пароль" : "Показать пароль"}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    disabled={isLoading}
                    sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={textFieldStyles}
          />
        </Box>

        <Box sx={{ mt: 3, mb: 2, width: '100%' }}>
          <FormControlLabel
            control={
              <Checkbox
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  '&.Mui-checked': {
                    color: '#3b82f6',
                  },
                }}
                disabled={isLoading}
                required
              />
            }
            label={
              <Box component="span" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9375rem' }}>
                Я согласен(на) на{' '}
                <Link 
                  href="#"
                  onClick={handleOpenPrivacyModal}
                  sx={{
                    color: '#60a5fa',
                    textDecoration: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  }}
                >
                  обработку персональных данных
                </Link>
              </Box>
            }
            sx={{ 
              alignItems: 'flex-start',
              width: '100%',
              m: 0
            }}
          />
          {shouldShowError('agreeToTerms') && (
            <Typography sx={{ 
              color: '#f87171', 
              fontSize: '0.75rem',
              ml: 4, 
              display: 'block', 
              mt: 0.5 
            }}>
              {errors.agreeToTerms}
            </Typography>
          )}
        </Box>

        <Alert 
          severity="info"
          icon={<InfoIcon />}
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            width: '100%',
            '& .MuiAlert-icon': {
              color: '#60a5fa',
            },
            '& .MuiAlert-message': {
              color: 'rgba(255, 255, 255, 0.8)',
            }
          }}
        >
          <Typography sx={{ 
            color: 'rgba(255, 255, 255, 0.8)', 
            fontSize: '0.875rem',
            lineHeight: 1.5
          }}>
            Поля, отмеченные звездочкой (*), обязательны для заполнения
          </Typography>
        </Alert>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <PersonAddIcon />}
          sx={{
            py: 1.5,
            borderRadius: 2,
            fontSize: '1rem',
            fontWeight: 600,
            textTransform: 'none',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            boxShadow: '0 6px 20px rgba(59, 130, 246, 0.3)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              boxShadow: '0 12px 30px rgba(59, 130, 246, 0.4)',
              transform: 'translateY(-1px)',
            },
            '&:disabled': {
              background: 'rgba(59, 130, 246, 0.5)',
              color: 'rgba(255, 255, 255, 0.7)',
            }
          }}
        >
          {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
        </Button>
      </Box>

      <Dialog 
        open={privacyModalOpen} 
        onClose={handleClosePrivacyModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Политика обработки персональных данных</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" paragraph>
            Настоящая Политика конфиденциальности персональных данных (далее – Политика конфиденциальности) действует в отношении всей информации, которую сайт "Posture Analyzer" может получить о Пользователе во время использования сайта.
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            1. Обрабатываемые данные
          </Typography>
          <Typography variant="body2" paragraph>
            Мы обрабатываем следующие персональные данные:
            • Фамилия, имя, отчество
            • Адрес электронной почты
            • Данные о сеансах мониторинга осанки
            • Статистика использования приложения
          </Typography>

          <Typography variant="h6" gutterBottom>
            2. Цели обработки данных
          </Typography>
          <Typography variant="body2" paragraph>
            Персональные данные обрабатываются в целях:
            • Предоставления услуг мониторинга осанки
            • Связи с пользователем
            • Улучшения качества сервиса
            • Обеспечения безопасности системы
          </Typography>

          <Typography variant="h6" gutterBottom>
            3. Хранение и защита данных
          </Typography>
          <Typography variant="body2" paragraph>
            Все данные хранятся на защищенных серверах и передаются по шифрованным каналам связи. Мы применяем современные методы защиты от несанкционированного доступа.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePrivacyModal} color="primary">
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RegisterForm;