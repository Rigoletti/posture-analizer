import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Divider,
  useTheme
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface PrivacyPolicyModalProps {
  open: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ open, onClose }) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1a1a2e',
          backgroundImage: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          color: 'white',
        }
      }}
    >
      <DialogTitle sx={{ 
        padding: '24px 24px 16px',
        position: 'relative',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 1
        }}>
          Политика обработки персональных данных
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Система мониторинга осанки «POSTURE»
        </Typography>
        
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'rgba(255, 255, 255, 0.6)',
            '&:hover': {
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ padding: '24px' }}>
        <Box sx={{ 
          maxHeight: '60vh',
          overflowY: 'auto',
          paddingRight: '8px',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.3)',
            }
          }
        }}>
          {/* Раздел 1 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600,
              color: '#60a5fa',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Box component="span" sx={{ fontSize: '1.5rem' }}>1.</Box>
              Общие положения
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.7,
              mb: 2
            }}>
              1.1. Настоящая Политика обработки персональных данных (далее — Политика) определяет порядок обработки персональных данных и меры по обеспечению безопасности персональных данных в системе мониторинга осанки «POSTURE» (далее — Сервис).
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.7,
              mb: 2
            }}>
              1.2. Используя Сервис, Пользователь дает свое согласие на обработку его персональных данных в соответствии с настоящей Политикой.
            </Typography>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 4 }} />

          {/* Раздел 2 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600,
              color: '#60a5fa',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Box component="span" sx={{ fontSize: '1.5rem' }}>2.</Box>
              Какие данные мы собираем
            </Typography>
            
            <Box sx={{ pl: 3 }}>
              <Typography variant="subtitle1" sx={{ 
                color: '#93c5fd',
                mb: 1,
                fontWeight: 500
              }}>
                2.1. Данные, предоставляемые при регистрации:
              </Typography>
              <Box component="ul" sx={{ 
                pl: 2, 
                mb: 2,
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                <li>Фамилия, имя, отчество</li>
                <li>Адрес электронной почты (email)</li>
                <li>Пароль (хранится в зашифрованном виде)</li>
              </Box>

              <Typography variant="subtitle1" sx={{ 
                color: '#93c5fd',
                mb: 1,
                fontWeight: 500
              }}>
                2.2. Данные, собираемые при использовании Сервиса:
              </Typography>
              <Box component="ul" sx={{ 
                pl: 2, 
                mb: 2,
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                <li>Данные о сессиях мониторинга осанки</li>
                <li>Результаты анализа осанки</li>
                <li>История выполненных упражнений</li>
                <li>Технические данные (IP-адрес, тип устройства, версия браузера)</li>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 4 }} />

          {/* Раздел 3 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600,
              color: '#60a5fa',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Box component="span" sx={{ fontSize: '1.5rem' }}>3.</Box>
              Цели обработки данных
            </Typography>
            
            <Box component="ul" sx={{ 
              pl: 2, 
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              <li>Предоставление доступа к функционалу Сервиса</li>
              <li>Мониторинг и анализ осанки пользователя</li>
              <li>Формирование персонализированных рекомендаций</li>
              <li>Обеспечение безопасности учетной записи</li>
              <li>Отправка уведомлений и обновлений</li>
              <li>Улучшение работы Сервиса</li>
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 4 }} />

          {/* Раздел 4 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600,
              color: '#60a5fa',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Box component="span" sx={{ fontSize: '1.5rem' }}>4.</Box>
              Сроки хранения данных
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.7
            }}>
              4.1. Персональные данные хранятся в течение всего срока использования Сервиса Пользователем. После удаления аккаунта данные удаляются в течение 30 дней, за исключением случаев, когда законодательство требует более длительного хранения.
            </Typography>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 4 }} />

          {/* Раздел 5 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600,
              color: '#60a5fa',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Box component="span" sx={{ fontSize: '1.5rem' }}>5.</Box>
              Меры безопасности
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.7,
              mb: 2
            }}>
              5.1. Мы принимаем все необходимые технические и организационные меры для защиты персональных данных от неправомерного или случайного доступа, уничтожения, изменения, блокирования, копирования, распространения.
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.7
            }}>
              5.2. Данные передаются по защищенным SSL-соединениям и хранятся в зашифрованном виде.
            </Typography>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 4 }} />

          {/* Раздел 6 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600,
              color: '#60a5fa',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Box component="span" sx={{ fontSize: '1.5rem' }}>6.</Box>
              Права пользователя
            </Typography>
            
            <Box component="ul" sx={{ 
              pl: 2, 
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              <li>Получить информацию об обработке своих персональных данных</li>
              <li>Требовать уточнения своих персональных данных</li>
              <li>Требовать блокирования или уничтожения своих данных</li>
              <li>Отозвать согласие на обработку данных</li>
              <li>Обжаловать действия или бездействие оператора</li>
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 4 }} />

          {/* Раздел 7 */}
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 600,
              color: '#60a5fa',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Box component="span" sx={{ fontSize: '1.5rem' }}>7.</Box>
              Контактная информация
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.7,
              mb: 2
            }}>
              По всем вопросам, связанным с обработкой персональных данных, вы можете обращаться по электронной почте:
            </Typography>
            <Box sx={{ 
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px',
              padding: '12px 16px',
              mb: 2
            }}>
              <Typography sx={{ 
                color: '#60a5fa',
                fontWeight: 500,
                textAlign: 'center'
              }}>
                privacy@posture-system.com
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              fontStyle: 'italic',
              textAlign: 'center'
            }}>
              Дата последнего обновления: {new Date().toLocaleDateString('ru-RU')}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        padding: '16px 24px 24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            padding: '10px 24px',
            borderRadius: '12px',
            fontSize: '0.9375rem',
            fontWeight: 600,
            textTransform: 'none',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)',
              transform: 'translateY(-1px)',
            }
          }}
        >
          Понятно
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrivacyPolicyModal;