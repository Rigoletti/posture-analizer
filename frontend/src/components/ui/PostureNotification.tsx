import React, { memo, useCallback, useMemo } from 'react';
import '../../assets/styles/ui/PostureNotification.css';

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
    '🔺 Опустите плечи вниз',
    '💪 Сведите лопатки вместе',
    '📏 Выпрямите спину'
  ],
  head: [
    '📱 Поднимите подбородок',
    '👀 Смотрите прямо перед собой',
    '📐 Уши должны быть над плечами'
  ],
  hips: [
    '🔄 Выпрямите таз',
    '🦵 Напрягите мышцы живота',
    '⚖️ Равномерно распределите вес'
  ]
} as const;

const ICON_MAP = {
  shoulders: '🔺',
  head: '📱',
  hips: '🔄',
  default: '⚠️'
} as const;

const SEVERITY_CONFIG = {
  warning: { color: '#f59e0b', label: 'Предупреждение' },
  critical: { color: '#ef4444', label: 'Критично' }
} as const;

// Мемоизированный компонент списка рекомендаций
const TipsList = memo(({ postureType }: { postureType: string }) => {
  const tips = TIPS_MAP[postureType as keyof typeof TIPS_MAP] || TIPS_MAP.shoulders;
  
  return (
    <div className="posture-tips">
      <div className="tips-title">Рекомендации:</div>
      <ul>
        {tips.map((tip, index) => (
          <li key={index}>{tip}</li>
        ))}
      </ul>
    </div>
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
  // Мемоизированные значения
  const icon = useMemo(() => 
    ICON_MAP[postureType as keyof typeof ICON_MAP] || ICON_MAP.default, 
    [postureType]
  );
  
  const config = useMemo(() => 
    SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.warning,
    [severity]
  );
  
  const borderStyle = useMemo(() => ({
    borderLeft: `4px solid ${config.color}`,
    boxShadow: `0 0 30px ${config.color}40`
  }), [config.color]);
  
  const severityStyle = useMemo(() => ({
    color: config.color
  }), [config.color]);
  
  const buttonStyle = useMemo(() => ({
    backgroundColor: config.color
  }), [config.color]);
  
  // Мемоизированный обработчик
  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  }, [onClose]);
  
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);
  
  if (!isVisible) return null;
  
  return (
    <div className="posture-notification">
      <div className="notification-backdrop" onClick={handleBackdropClick} />
      
      <div className="notification-card" style={borderStyle}>
        <div className="notification-header">
          <div className="notification-title">
            <span className="notification-icon">{icon}</span>
            <div>
              <div className="notification-main-title">Нарушение осанки</div>
              <div className="notification-severity" style={severityStyle}>
                {config.label}
              </div>
            </div>
          </div>
          
          <button className="close-button" onClick={handleClose} aria-label="Закрыть">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path 
                d="M13 1L1 13M1 1L13 13" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="notification-body">
          <p className="notification-message">{message}</p>
          <TipsList postureType={postureType} />
        </div>

        <div className="notification-footer">
          <button 
            className="action-button"
            style={buttonStyle}
            onClick={handleClose}
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
});

PostureNotification.displayName = 'PostureNotification';

export default PostureNotification;