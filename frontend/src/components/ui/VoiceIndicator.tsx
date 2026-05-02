// frontend/components/ui/VoiceIndicator.tsx
import React, { memo } from 'react';
import { Box, IconButton, Tooltip, CircularProgress, alpha } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import WarningIcon from '@mui/icons-material/Warning';

interface VoiceIndicatorProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  onToggle: () => void;
  error?: string | null;
}

export const VoiceIndicator = memo<VoiceIndicatorProps>(({
  isListening,
  isSpeaking,
  isProcessing,
  onToggle,
  error
}) => {
  const getStatusColor = () => {
    if (error) return '#ef4444';
    if (isListening) return '#10b981';
    if (isSpeaking) return '#3b82f6';
    return '#94a3b8';
  };

  const getTooltipText = () => {
    if (error) return `⚠️ ${error}`;
    if (isSpeaking) return '🎤 Ассистент говорит...';
    if (isProcessing) return '🔄 Обработка команды...';
    if (isListening) return '🎙️ Слушаю... скажите команду';
    return '🎤 Включить голосовое управление';
  };

  return (
    <Tooltip title={getTooltipText()} arrow placement="left">
      <IconButton
        onClick={onToggle}
        sx={{
          bgcolor: alpha(getStatusColor(), 0.1),
          color: getStatusColor(),
          transition: 'all 0.3s ease',
          '&:hover': {
            bgcolor: alpha(getStatusColor(), 0.2),
            transform: 'scale(1.05)',
          },
          ...(isListening && {
            animation: 'pulse 1.5s ease-in-out infinite',
          }),
          ...(isSpeaking && {
            animation: 'pulse 0.8s ease-in-out infinite',
          }),
        }}
        size="large"
      >
        {isProcessing ? (
          <CircularProgress size={24} sx={{ color: getStatusColor() }} />
        ) : isSpeaking ? (
          <GraphicEqIcon />
        ) : isListening ? (
          <MicIcon />
        ) : error ? (
          <WarningIcon />
        ) : (
          <MicOffIcon />
        )}
      </IconButton>
    </Tooltip>
  );
});

VoiceIndicator.displayName = 'VoiceIndicator';