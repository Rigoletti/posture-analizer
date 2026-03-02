import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Divider,
  Typography,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import YandexLoginButton from './YandexLoginButton';

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [yandexError, setYandexError] = useState<string | null>(null);
  
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    
    if (errorParam) {
      setYandexError(decodeURIComponent(errorParam));
    }
  }, [location]);

  useEffect(() => {
    clearError();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен для заполнения';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Пожалуйста, введите корректный email';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Пароль обязателен для заполнения';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
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
      await login(formData.email, formData.password);
      navigate(from);
    } catch (error: any) {
      if (error.requiresVerification) {
        navigate('/pending-verification', { 
          state: { email: error.email } 
        });
      }
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
    
    if (yandexError) {
      setYandexError(null);
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

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
      {(error || yandexError) && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#fca5a5',
            '& .MuiAlert-icon': {
              color: '#fca5a5',
            }
          }}
          action={
            <IconButton
              size="small"
              onClick={() => {
                clearError();
                setYandexError(null);
              }}
              sx={{ color: '#fca5a5' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {error || yandexError}
        </Alert>
      )}

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
        margin="normal"
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#3b82f6',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.6)',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#3b82f6',
          },
          '& .MuiOutlinedInput-input': {
            color: 'white',
          },
        }}
      />

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
        autoComplete="current-password"
        margin="normal"
        variant="outlined"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
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
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#3b82f6',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.6)',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#3b82f6',
          },
          '& .MuiOutlinedInput-input': {
            color: 'white',
          },
        }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={isLoading}
        startIcon={isLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <LoginIcon />}
        sx={{
          mt: 2,
          mb: 2,
          py: 1.5,
          borderRadius: '12px',
          fontSize: '1rem',
          fontWeight: 600,
          textTransform: 'none',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          transition: 'all 0.2s ease',
          '&:hover': {
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&:disabled': {
            background: 'rgba(59, 130, 246, 0.5)',
          }
        }}
      >
        {isLoading ? 'Вход...' : 'Войти по паролю'}
      </Button>

      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: 2,
        my: 2
      }}>
        <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          или
        </Typography>
        <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
      </Box>
<YandexLoginButton 
  mode="login"
  variant="white"
  onError={(error) => setYandexError(error)}
  fullWidth
/>

    </Box>
  );
};

export default LoginForm;