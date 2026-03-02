import React from 'react';
import '../../assets/styles/ui/PostureNotification.css';

interface PostureNotificationProps {
  isVisible: boolean;
  message: string;
  postureType: string;
  severity: 'warning' | 'critical';
  onClose: () => void;
}

export const PostureNotification: React.FC<PostureNotificationProps> = ({
  isVisible,
  message,
  postureType,
  severity,
  onClose
}) => {
  if (!isVisible) return null;

  const getIcon = () => {
    switch (postureType) {
      case 'shoulders':
        return '🔺';
      case 'head':
        return '📱';
      case 'hips':
        return '🔄';
      default:
        return '⚠️';
    }
  };

  const getSeverityColor = () => {
    return severity === 'warning' ? '#f59e0b' : '#ef4444';
  };

  return (
    <div className="posture-notification">
      <div className="notification-backdrop" onClick={onClose}></div>
      
      <div 
        className="notification-card"
        style={{ 
          borderLeft: `4px solid ${getSeverityColor()}`,
          boxShadow: `0 0 30px ${getSeverityColor()}40`
        }}
      >
        <div className="notification-header">
          <div className="notification-title">
            <span className="notification-icon">{getIcon()}</span>
            <div>
              <div className="notification-main-title">Нарушение осанки</div>
              <div 
                className="notification-severity"
                style={{ color: getSeverityColor() }}
              >
                {severity === 'warning' ? 'Предупреждение' : 'Критично'}
              </div>
            </div>
          </div>
          
          <button className="close-button" onClick={onClose}>
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
          
          <div className="posture-tips">
            <div className="tips-title">Рекомендации:</div>
            {postureType === 'shoulders' && (
              <ul>
                <li>🔺 Опустите плечи вниз</li>
                <li>💪 Сведите лопатки вместе</li>
                <li>📏 Выпрямите спину</li>
              </ul>
            )}
            {postureType === 'head' && (
              <ul>
                <li>📱 Поднимите подбородок</li>
                <li>👀 Смотрите прямо перед собой</li>
                <li>📐 Уши должны быть над плечами</li>
              </ul>
            )}
            {postureType === 'hips' && (
              <ul>
                <li>🔄 Выпрямите таз</li>
                <li>🦵 Напрягите мышцы живота</li>
                <li>⚖️ Равномерно распределите вес</li>
              </ul>
            )}
          </div>
        </div>

        <div className="notification-footer">
          <button 
            className="action-button"
            style={{ backgroundColor: getSeverityColor() }}
            onClick={onClose}
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostureNotification;