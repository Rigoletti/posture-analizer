import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/auth';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Send, ArrowBack, Email, CheckCircle, Visibility, VisibilityOff } from '@mui/icons-material';

const VerifyCodePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  
 
  const [email, setEmail] = useState<string>(location.state?.email || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [attemptsLeft, setAttemptsLeft] = useState<number>(5);
  const [countdown, setCountdown] = useState<number>(0);
  const [showCode, setShowCode] = useState(false);

  // Проверка наличия email при загрузке
  useEffect(() => {
    if (!email) {
      // Если email нет в state, перенаправляем на регистрацию
      navigate('/register');
    }
  }, [email, navigate]);

  // Таймер для повторной отправки
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  const handleVerifyCode = async () => {
    if (!email || !code || code.length !== 6) {
      setMessage('');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const result = await authApi.verifyEmailCode({ email, code });
      setMessage(result.message || 'Email успешно подтвержден!');
      setMessageType('success');
      
      // Обновляем хранилище авторизации
      if (result.user) {
        setAuth(result.user);
      }
      
      // Редирект через 2 секунды
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      setMessage(error.message || 'Неверный код подтверждения');
      setMessageType('error');
      
      // Обновляем количество попыток
      if (error.attemptsLeft !== undefined) {
        setAttemptsLeft(error.attemptsLeft);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email || resendLoading || countdown > 0) return;

    setResendLoading(true);
    setMessage('');
    
    try {
      await authApi.resendVerificationCode(email);
      setMessage('Новый код подтверждения отправлен на ваш email');
      setMessageType('success');
      setCountdown(60); // 60 секунд до следующей возможности отправки
    } catch (error: any) {
      setMessage(error.message || 'Не удалось отправить новый код');
      setMessageType('error');
    } finally {
      setResendLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    
    // Автоподтверждение при вводе 6 цифр
    if (value.length === 6) {
      setTimeout(() => handleVerifyCode(), 300); // Небольшая задержка для UX
    }
  };

  const formatCode = (value: string) => {
    if (value.length <= 3) return value;
    return `${value.slice(0, 3)} ${value.slice(3)}`;
  };

  // Если нет email, показываем ошибку
  if (!email) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
        <Paper 
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.05) 100%)',
            borderRadius: 4,
            border: '1px solid rgba(239, 68, 68, 0.1)',
            backdropFilter: 'blur(10px)',
            p: 4
          }}
        >
          <Alert severity="error" sx={{ mb: 3 }}>
            Email не найден. Пожалуйста, вернитесь к регистрации.
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/register')}
            fullWidth
          >
            Вернуться к регистрации
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Paper 
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          p: 4
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Email sx={{ fontSize: 64, color: '#3b82f6', mb: 2 }} />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1e293b' }}>
            Подтверждение email
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Введите 6-значный код, отправленный на:
          </Typography>
          <Typography variant="h6" color="#3b82f6" sx={{ mt: 1 }}>
            {email}
          </Typography>
        </Box>
        
        {message && (
          <Alert 
            severity={messageType} 
            sx={{ 
              mb: 3,
              borderRadius: 2,
            }}
          >
            {message}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <Typography variant="body1" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>
            Код подтверждения:
          </Typography>
          
          <TextField
            fullWidth
            value={formatCode(code)}
            onChange={handleCodeChange}
            placeholder="123456"
            variant="outlined"
            type={showCode ? "text" : "password"}
            inputProps={{
              style: {
                textAlign: 'center',
                fontSize: '24px',
                letterSpacing: '10px',
                fontFamily: 'monospace'
              },
              maxLength: 7 // 6 цифр + 1 пробел
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowCode(!showCode)}
                    edge="end"
                  >
                    {showCode ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'white',
                fontSize: '24px',
                height: '60px',
                '& input': {
                  textAlign: 'center',
                  letterSpacing: '10px',
                  fontFamily: 'monospace'
                }
              }
            }}
          />
          
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1, textAlign: 'center' }}>
            Введите 6 цифр, отправленных на вашу почту
          </Typography>
          
          {attemptsLeft < 5 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Осталось попыток: {attemptsLeft}
            </Alert>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
          <Button
            variant="contained"
            onClick={handleVerifyCode}
            disabled={loading || code.length !== 6}
            startIcon={loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <CheckCircle />}
            fullWidth
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0da271 0%, #2563eb 100%)',
              },
              '&:disabled': {
                background: 'rgba(16, 185, 129, 0.5)',
              }
            }}
          >
            {loading ? 'Проверка...' : 'Подтвердить'}
          </Button>
          
          <Button
            variant="outlined"
            onClick={handleResendCode}
            disabled={resendLoading || countdown > 0}
            startIcon={resendLoading ? <CircularProgress size={20} /> : <Send />}
            fullWidth
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontSize: '0.95rem',
              textTransform: 'none',
              borderColor: 'rgba(59, 130, 246, 0.3)',
              color: '#3b82f6',
              '&:hover': {
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
              },
              '&:disabled': {
                color: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgba(59, 130, 246, 0.2)',
              }
            }}
          >
            {resendLoading ? 'Отправка...' : 
             countdown > 0 ? `Отправить повторно (${countdown}с)` : 
             'Отправить код повторно'}
          </Button>
          
          <Button
            variant="text"
            onClick={() => navigate('/login')}
            startIcon={<ArrowBack />}
            fullWidth
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontSize: '0.95rem',
              textTransform: 'none',
              color: '#64748b',
              '&:hover': {
                backgroundColor: 'rgba(100, 116, 139, 0.05)',
              }
            }}
          >
            Вернуться ко входу
          </Button>
        </Box>

        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            <strong>Не получили код?</strong>
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#64748b' }}>
            <li>
              <Typography variant="body2" component="span">
                Проверьте папку "Спам" или "Нежелательная почта"
              </Typography>
            </li>
            <li>
              <Typography variant="body2" component="span">
                Убедитесь, что email адрес указан верно: <strong>{email}</strong>
              </Typography>
            </li>
            <li>
              <Typography variant="body2" component="span">
                Код действителен 15 минут
              </Typography>
            </li>
            <li>
              <Typography variant="body2" component="span">
                Вы можете запросить новый код через 60 секунд
              </Typography>
            </li>
          </ul>
        </Box>
      </Paper>
    </Container>
  );
};

export default VerifyCodePage;