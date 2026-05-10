import React, { memo, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Alert,
  AlertTitle,
  IconButton,
  Slide,
  useMediaQuery,
  useTheme,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import HeadsetIcon from '@mui/icons-material/Headset';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

interface PostureNotificationProps {
  isVisible: boolean;
  message: string;
  postureType: string;
  severity: 'warning' | 'critical';
  onClose: () => void;
}

// Константы вынесены за пределы компонента
const TIPS_MAP = {
  shoulders: [
    'Опустите плечи вниз',
    'Сведите лопатки вместе',
    'Выпрямите спину'
  ],
  head: [
    'Поднимите подбородок',
    'Смотрите прямо перед собой',
    'Уши должны быть над плечами'
  ],
  hips: [
    'Выпрямите таз',
    'Напрягите мышцы живота',
    'Равномерно распределите вес'
  ]
} as const;

const ICON_MAP = {
  shoulders: <AccessibilityNewIcon />,
  head: <HeadsetIcon />,
  hips: <FitnessCenterIcon />,
  default: <WarningIcon />
} as const;

const SEVERITY_CONFIG = {
  warning: { color: 'warning', severity: 'warning' as const, label: 'Предупреждение' },
  critical: { color: 'error', severity: 'error' as const, label: 'Критично' }
} as const;

// Анимация появления - без использования TransitionProps
const Transition = React.forwardRef((props: any, ref) => {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Мемоизированный компонент списка рекомендаций
const TipsList = memo(({ postureType }: { postureType: string }) => {
  const tips = TIPS_MAP[postureType as keyof typeof TIPS_MAP] || TIPS_MAP.shoulders;
  
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Рекомендации:
      </Typography>
      <List dense disablePadding>
        {tips.map((tip, index) => (
          <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
            <ListItemText 
              primary={tip} 
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
});

TipsList.displayName = 'TipsList';

export const PostureNotification = memo<PostureNotificationProps>(({
  isVisible,
  message,
  postureType,
  severity,
  onClose
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Мемоизированные значения
  const icon = useMemo(() => 
    ICON_MAP[postureType as keyof typeof ICON_MAP] || ICON_MAP.default, 
    [postureType]
  );
  
  const config = useMemo(() => 
    SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.warning,
    [severity]
  );
  
  const alertSeverity = useMemo(() => config.severity, [config]);
  const alertColor = useMemo(() => config.color, [config]);
  
  // Мемоизированный обработчик
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);
  
  if (!isVisible) return null;
  
  return (
    <Dialog
      open={isVisible}
      onClose={handleClose}
      TransitionComponent={Transition}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 3 },
          m: { xs: 0, sm: 2 },
          overflow: 'hidden',
        }
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Alert
          severity={alertSeverity}
          icon={icon}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleClose}
              sx={{ ml: 1 }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{
            borderRadius: 0,
            '& .MuiAlert-message': {
              flex: 1,
            },
            '& .MuiAlert-icon': {
              alignItems: 'center',
            }
          }}
        >
          <AlertTitle sx={{ fontWeight: 700, mb: 0.5 }}>
            Нарушение осанки
          </AlertTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label={config.label} 
              size="small" 
              color={alertColor}
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Box>
        </Alert>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body1" gutterBottom fontWeight={500}>
          {message}
        </Typography>
        <TipsList postureType={postureType} />
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={handleClose} 
          variant="contained" 
          color={alertColor}
          fullWidth
          size="large"
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Понятно
        </Button>
      </DialogActions>
    </Dialog>
  );
});

PostureNotification.displayName = 'PostureNotification';

export default PostureNotification;