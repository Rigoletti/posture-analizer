import React, { useRef, useEffect } from 'react';
import { Box, alpha, useTheme } from '@mui/material';

interface PoseOverlayProps {
  imageUrl: string;
  poseData?: {
    keypoints?: Array<{
      x: number;
      y: number;
      score: number;
      name?: string;
    }>;
    normalizedPoints?: Array<{
      x: number;
      y: number;
      score: number;
      name?: string;
    }>;
  };
  referencePose?: {
    normalizedPoints?: Array<{
      x: number;
      y: number;
      score: number;
      name?: string;
    }>;
  };
  issues?: string[];
  width?: number;
  height?: number;
}

const KEYPOINT_CONNECTIONS = [
  // Голова и шея
  [0, 1], [1, 3], [0, 2], [2, 4], // Глаза и уши
  [5, 6], // Плечи
  [5, 7], [7, 9], // Левая рука
  [6, 8], [8, 10], // Правая рука
  [11, 12], // Таз
  [5, 11], [6, 12], // Торс
];

const KEYPOINT_NAMES = [
  'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_hip', 'right_hip'
];

export const PoseOverlay: React.FC<PoseOverlayProps> = ({
  imageUrl,
  poseData,
  referencePose,
  issues = [],
  width = 640,
  height = 480
}) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imageRef.current || !canvasRef.current || !poseData?.keypoints) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    
    const drawPose = () => {
      // Очищаем canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Рисуем изображение
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (!poseData.keypoints) return;

      // Масштабируем ключевые точки под размер canvas
      const scaleX = canvas.width / width;
      const scaleY = canvas.height / height;

      const scaledKeypoints = poseData.keypoints.map(kp => ({
        ...kp,
        x: kp.x * scaleX,
        y: kp.y * scaleY
      }));

      // Рисуем соединения (скелет)
      ctx.lineWidth = 3;
      
      KEYPOINT_CONNECTIONS.forEach(([i, j]) => {
        const kp1 = scaledKeypoints[i];
        const kp2 = scaledKeypoints[j];
        
        if (kp1 && kp2 && kp1.score > 0.3 && kp2.score > 0.3) {
          // Определяем цвет на основе проблем
          let color = theme.palette.success.main;
          
          if (issues.includes('shoulders') && (i === 5 || i === 6 || j === 5 || j === 6)) {
            color = theme.palette.error.main;
          } else if (issues.includes('head') && (i <= 4 || j <= 4)) {
            color = theme.palette.error.main;
          } else if (issues.includes('hips') && (i === 11 || i === 12 || j === 11 || j === 12)) {
            color = theme.palette.error.main;
          }

          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.moveTo(kp1.x, kp1.y);
          ctx.lineTo(kp2.x, kp2.y);
          ctx.stroke();

          // Добавляем свечение для проблемных зон
          if (color === theme.palette.error.main) {
            ctx.shadowColor = theme.palette.error.main;
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }
      });

      // Рисуем ключевые точки
      scaledKeypoints.forEach((kp, index) => {
        if (kp.score > 0.3) {
          // Определяем цвет точки
          let color = theme.palette.primary.main;
          
          if (issues.includes('shoulders') && (index === 5 || index === 6)) {
            color = theme.palette.error.main;
          } else if (issues.includes('head') && index <= 4) {
            color = theme.palette.error.main;
          } else if (issues.includes('hips') && (index === 11 || index === 12)) {
            color = theme.palette.error.main;
          }

          ctx.beginPath();
          ctx.fillStyle = color;
          ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
          ctx.fill();
          
          // Белая обводка
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // Если есть эталонная поза, рисуем её пунктиром
      if (referencePose?.normalizedPoints) {
        ctx.setLineDash([5, 5]);
        
        KEYPOINT_CONNECTIONS.forEach(([i, j]) => {
          const kp1 = referencePose.normalizedPoints?.[i];
          const kp2 = referencePose.normalizedPoints?.[j];
          
          if (kp1 && kp2 && kp1.score > 0.3 && kp2.score > 0.3) {
            ctx.beginPath();
            ctx.strokeStyle = alpha(theme.palette.info.main, 0.5);
            ctx.moveTo(kp1.x * scaleX, kp1.y * scaleY);
            ctx.lineTo(kp2.x * scaleX, kp2.y * scaleY);
            ctx.stroke();
          }
        });
        
        ctx.setLineDash([]);
      }
    };

    img.onload = drawPose;
    if (img.complete) drawPose();

  }, [poseData, referencePose, issues, width, height, theme]);

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Скрытое изображение для загрузки */}
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Pose reference"
        style={{ display: 'none' }}
        crossOrigin="anonymous"
      />
      
      {/* Canvas с наложенным скелетом */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          borderRadius: 8
        }}
      />

      {/* Легенда */}
      <Box sx={{
        position: 'absolute',
        bottom: 8,
        left: 8,
        right: 8,
        display: 'flex',
        gap: 2,
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {issues.includes('shoulders') && (
          <Box sx={{
            px: 1,
            py: 0.5,
            bgcolor: alpha(theme.palette.error.main, 0.8),
            color: 'white',
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 600
          }}>
            ⚠ Проблема с плечами
          </Box>
        )}
        {issues.includes('head') && (
          <Box sx={{
            px: 1,
            py: 0.5,
            bgcolor: alpha(theme.palette.error.main, 0.8),
            color: 'white',
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 600
          }}>
            ⚠ Проблема с головой
          </Box>
        )}
        {issues.includes('hips') && (
          <Box sx={{
            px: 1,
            py: 0.5,
            bgcolor: alpha(theme.palette.error.main, 0.8),
            color: 'white',
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 600
          }}>
            ⚠ Проблема с тазом
          </Box>
        )}
      </Box>
    </Box>
  );
};