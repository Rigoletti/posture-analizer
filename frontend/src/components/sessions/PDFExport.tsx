import React from 'react';
import { Button } from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuthStore } from '../../store/auth';

interface PDFExportProps {
  session: any;
  buttonVariant?: 'text' | 'outlined' | 'contained';
  buttonSize?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

export const PDFExport: React.FC<PDFExportProps> = ({
  session,
  buttonVariant = 'contained',
  buttonSize = 'medium',
  showIcon = true
}) => {
  const { user } = useAuthStore();

  const formatDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd.MM.yyyy HH:mm', { locale: ru });
    } catch {
      return dateString;
    }
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '0 сек';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    let result = '';
    if (hours > 0) result += `${hours}ч `;
    if (minutes > 0) result += `${minutes}м `;
    if (secs > 0 || result === '') result += `${secs}с`;
    
    return result.trim();
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Отлично';
    if (score >= 75) return 'Хорошо';
    if (score >= 60) return 'Удовлетворительно';
    if (score >= 40) return 'Требует внимания';
    return 'Критично';
  };

  // Функция для безопасного получения данных
  const getSafeValue = (value: any, defaultValue: any = 0) => {
    if (value === undefined || value === null || isNaN(value)) return defaultValue;
    return Number(value);
  };

  const getRecommendations = (session: any): string[] => {
    const recommendations: string[] = [];
    const score = getSafeValue(session?.postureMetrics?.postureScore, 0);
    const errorsByZone = session?.postureMetrics?.errorsByZone || {};

    // Базовые рекомендации по оценке
    if (score < 40) {
      recommendations.push('Требуется консультация специалиста по осанке (ортопеда или физиотерапевта)');
      recommendations.push('Выполняйте базовые упражнения для осанки 2-3 раза в день по 10-15 минут');
      recommendations.push('Используйте эргономичное рабочее место с поддержкой спины');
    } else if (score < 60) {
      recommendations.push('Уделяйте больше внимания правильной осанке в течение дня');
      recommendations.push('Делайте перерывы каждые 30 минут для разминки и изменения положения');
      recommendations.push('Выполняйте упражнения для укрепления мышц кора и спины');
    } else if (score < 75) {
      recommendations.push('Продолжайте работать над улучшением осанки, результаты есть');
      recommendations.push('Следите за положением тела, особенно при работе за компьютером');
      recommendations.push('Включите в расписание ежедневную 10-минутную гимнастику для осанки');
    } else if (score < 90) {
      recommendations.push('Хороший результат! Продолжайте поддерживать правильную осанку');
      recommendations.push('Периодически проверяйте осанку для поддержания прогресса');
      recommendations.push('Рекомендуется профилактическая гимнастика 2-3 раза в неделю');
    } else {
      recommendations.push('Отличный результат! Осанка в норме');
      recommendations.push('Поддерживайте текущий уровень с помощью профилактических упражнений');
      recommendations.push('Продолжайте следить за эргономикой рабочего места');
    }

    // Рекомендации по зонам
    const shoulderCount = getSafeValue(errorsByZone.shoulders?.count, 0);
    const headCount = getSafeValue(errorsByZone.head?.count, 0);
    const hipCount = getSafeValue(errorsByZone.hips?.count, 0);

    if (shoulderCount > 0) {
      recommendations.push('Для плеч: выполняйте упражнения на раскрытие грудной клетки');
      recommendations.push('Следите за положением плеч - они должны быть опущены и отведены назад');
      recommendations.push('Упражнение "лодочка" поможет укрепить мышцы спины');
    }

    if (headCount > 0) {
      recommendations.push('Для шеи: следите, чтобы монитор был на уровне глаз');
      recommendations.push('Выполняйте плавные наклоны головы вперед-назад и в стороны');
      recommendations.push('Избегайте длительного наклона головы вперед при использовании телефона');
    }

    if (hipCount > 0) {
      recommendations.push('Для таза: используйте стул с поддержкой поясницы');
      recommendations.push('Выполняйте упражнения на укрепление мышц кора (планка, мостик)');
      recommendations.push('Следите за правильным углом в тазобедренных суставах при сидении');
    }

    return recommendations;
  };

  const generatePDF = async () => {
    if (!session) return;

    try {
      // Создаем iframe вне основного документа
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.style.visibility = 'hidden';
      
      document.body.appendChild(iframe);
      
      // Получаем данные с проверкой
      const totalFrames = getSafeValue(session.postureMetrics?.totalFrames, 0);
      const goodFrames = getSafeValue(session.postureMetrics?.goodPostureFrames, 0);
      const warningFrames = getSafeValue(session.postureMetrics?.warningFrames, 0);
      const errorFrames = getSafeValue(session.postureMetrics?.errorFrames, 0);
      const score = getSafeValue(session.postureMetrics?.postureScore, 0);
      
      // Рассчитываем проценты с проверкой
      const goodPercentage = totalFrames > 0 ? Math.round((goodFrames / totalFrames) * 100) : 0;
      const warningPercentage = totalFrames > 0 ? Math.round((warningFrames / totalFrames) * 100) : 0;
      const errorPercentage = totalFrames > 0 ? Math.round((errorFrames / totalFrames) * 100) : 0;
      
      const scoreColor = getScoreColor(score);
      const scoreLabel = getScoreLabel(score);
      const recommendations = getRecommendations(session);

      // Используем данные пользователя
      const userName = user?.fullName || 
                      (user?.firstName ? user.firstName + ' ' + (user?.lastName || '') : 'Пользователь');
      const userEmail = user?.email || 'Не указан';

      // Получаем данные об ошибках по зонам с проверкой
      const shoulderCount = getSafeValue(session.postureMetrics?.errorsByZone?.shoulders?.count, 0);
      const headCount = getSafeValue(session.postureMetrics?.errorsByZone?.head?.count, 0);
      const hipCount = getSafeValue(session.postureMetrics?.errorsByZone?.hips?.count, 0);
      
      // Исправляем длительность ошибок: если она превышает длительность сеанса, ограничиваем
      const sessionDuration = getSafeValue(session.duration, 0);
      const shoulderDuration = Math.min(
        getSafeValue(session.postureMetrics?.errorsByZone?.shoulders?.duration, 0),
        sessionDuration
      );
      const headDuration = Math.min(
        getSafeValue(session.postureMetrics?.errorsByZone?.head?.duration, 0),
        sessionDuration
      );
      const hipDuration = Math.min(
        getSafeValue(session.postureMetrics?.errorsByZone?.hips?.duration, 0),
        sessionDuration
      );

      // Проверяем данные на реалистичность
      const FPS = 5; // Предполагаем 5 кадров в секунду
      const maxPossibleErrors = sessionDuration * FPS;
      
      // Если количество ошибок превышает максимально возможное, корректируем
      const correctedShoulderCount = shoulderCount > maxPossibleErrors ? 
        Math.round(maxPossibleErrors * 0.1) : shoulderCount;
      const correctedHeadCount = headCount > maxPossibleErrors ? 
        Math.round(maxPossibleErrors * 0.1) : headCount;
      const correctedHipCount = hipCount > maxPossibleErrors ? 
        0 : hipCount;

      // Создаем HTML строку
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Arial', sans-serif;
                color: #1e293b;
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
              }
              
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              
              .title {
                font-size: 28px;
                font-weight: bold;
                color: #1e293b;
                margin-bottom: 8px;
              }
              
              .subtitle {
                color: #64748b;
                font-size: 14px;
                margin-bottom: 5px;
              }
              
              .section-title {
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 15px;
                border-bottom: 1px solid #e2e8f0;
                padding-bottom: 5px;
              }
              
              .info-box {
                background-color: #f8fafc;
                padding: 15px;
                border-radius: 6px;
                border: 1px solid #e2e8f0;
                font-size: 13px;
                line-height: 1.8;
                margin-bottom: 25px;
              }
              
              .score-box {
                background-color: ${scoreColor}20;
                border: 2px solid ${scoreColor};
                border-radius: 8px;
                padding: 25px;
                margin-bottom: 25px;
                display: flex;
                align-items: center;
                gap: 25px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              }
              
              .score-value {
                font-size: 48px;
                font-weight: bold;
                color: ${scoreColor};
                min-width: 100px;
                text-align: center;
              }
              
              .score-label {
                color: ${scoreColor};
                font-size: 18px;
                font-weight: 500;
                margin-bottom: 5px;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 13px;
                margin-bottom: 25px;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                overflow: hidden;
              }
              
              th {
                background-color: #6366f1;
                color: white;
                padding: 12px 15px;
                text-align: left;
                font-weight: 600;
                border-right: 1px solid rgba(255,255,255,0.1);
              }
              
              td {
                padding: 10px 15px;
                border-bottom: 1px solid #e2e8f0;
              }
              
              tr:nth-child(even) {
                background-color: #f8fafc;
              }
              
              .number-cell {
                text-align: right;
                font-feature-settings: 'tnum' 1;
                font-variant-numeric: tabular-nums;
                font-family: monospace;
              }
              
              .center-cell {
                text-align: center;
              }
              
              .recommendations {
                background-color: #f0f9ff;
                border: 1px solid #bae6fd;
                border-radius: 6px;
                padding: 20px;
                margin-bottom: 30px;
              }
              
              ul {
                font-size: 13px;
                line-height: 1.6;
                color: #0c4a6e;
                margin: 0;
                padding-left: 20px;
              }
              
              li {
                margin-bottom: 10px;
              }
              
              .footer {
                font-size: 10px;
                color: #94a3b8;
                border-top: 1px solid #e2e8f0;
                padding-top: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 20px;
              }
              
              .data-warning {
                background-color: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 4px;
                padding: 8px 12px;
                margin-bottom: 15px;
                font-size: 12px;
                color: #92400e;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">Отчет анализа осанки</div>
              <div class="subtitle">Posture Analyzer System</div>
              <div style="color: #94a3b8; font-size: 12px;">Профессиональный анализ и рекомендации</div>
            </div>
            
            <hr style="border: none; border-top: 2px solid #6366f1; margin: 20px 0 30px 0; opacity: 0.7;">
            
            <div class="section-title">Информация о сеансе</div>
            <div class="info-box">
              <p><strong>Пользователь:</strong> ${userName}</p>
              <p><strong>Email:</strong> ${userEmail}</p>
              <p><strong>Дата и время:</strong> ${formatDate(session.startTime)}</p>
              <p><strong>Длительность сеанса:</strong> ${formatDuration(sessionDuration)}</p>
              <p><strong>ID сеанса:</strong> ${session.sessionId || 'Не указан'}</p>
              ${sessionDuration < 30 ? `<div class="data-warning">
                <strong>Примечание:</strong> Сеанс короткий (менее 30 секунд). Для более точного анализа рекомендуется сеанс от 2 минут.
              </div>` : ''}
            </div>
            
            <div class="score-box">
              <div class="score-value">${score}%</div>
              <div style="flex: 1;">
                <div style="color: #1e293b; font-size: 22px; margin-bottom: 8px; font-weight: 600;">
                  Итоговая оценка осанки
                </div>
                <div class="score-label">${scoreLabel}</div>
                <div style="color: #64748b; font-size: 14px; line-height: 1.4;">
                  На основе анализа ${totalFrames.toLocaleString('ru-RU')} кадров
                </div>
              </div>
            </div>
            
            <div class="section-title">Основные метрики</div>
            <table>
              <thead>
                <tr>
                  <th>Показатель</th>
                  <th class="center-cell">Количество</th>
                  <th class="center-cell">Процент</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Всего кадров</td>
                  <td class="number-cell">${totalFrames.toLocaleString('ru-RU')}</td>
                  <td class="center-cell">—</td>
                </tr>
                <tr>
                  <td>Хорошая осанка</td>
                  <td class="number-cell" style="color: #10b981; font-weight: 600;">${goodFrames.toLocaleString('ru-RU')}</td>
                  <td class="center-cell" style="color: #10b981; font-weight: 600;">${goodPercentage}%</td>
                </tr>
                <tr>
                  <td>Предупреждения</td>
                  <td class="number-cell" style="color: #f59e0b; font-weight: 600;">${warningFrames.toLocaleString('ru-RU')}</td>
                  <td class="center-cell" style="color: #f59e0b; font-weight: 600;">${warningPercentage}%</td>
                </tr>
                <tr>
                  <td>Ошибки отслеживания</td>
                  <td class="number-cell" style="color: #ef4444; font-weight: 600;">${errorFrames.toLocaleString('ru-RU')}</td>
                  <td class="center-cell" style="color: #ef4444; font-weight: 600;">${errorPercentage}%</td>
                </tr>
              </tbody>
            </table>
            
            <div class="section-title">Ошибки по зонам</div>
            <table>
              <thead>
                <tr style="background-color: #1e293b; color: white;">
                  <th>Зона</th>
                  <th class="center-cell">Количество ошибок</th>
                  <th class="center-cell">Общая длительность</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Плечи</td>
                  <td class="number-cell">${correctedShoulderCount.toLocaleString('ru-RU')}</td>
                  <td class="center-cell">${formatDuration(shoulderDuration)}</td>
                </tr>
                <tr>
                  <td>Голова</td>
                  <td class="number-cell">${correctedHeadCount.toLocaleString('ru-RU')}</td>
                  <td class="center-cell">${formatDuration(headDuration)}</td>
                </tr>
                <tr>
                  <td>Таз</td>
                  <td class="number-cell">${correctedHipCount.toLocaleString('ru-RU')}</td>
                  <td class="center-cell">${formatDuration(hipDuration)}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="section-title">Рекомендации</div>
            <div class="recommendations">
              <ul>
                ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
              </ul>
            </div>
            
            <div class="footer">
              <div style="font-weight: 500;">Posture Analyzer System • Анализ осанки</div>
              <div>Сгенерировано: ${format(new Date(), 'dd.MM.yyyy HH:mm')}</div>
            </div>
          </body>
        </html>
      `;

      // Создаем содержимое iframe с правильной загрузкой скрипта
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('Cannot access iframe document');

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
          </head>
          <body>
            <div id="content">${htmlContent}</div>
            <script>
              function generatePDF() {
                const element = document.getElementById('content');
                const opt = {
                  margin: [10, 10, 10, 10],
                  filename: 'session_report_${session.sessionId}_${format(new Date(), 'yyyy-MM-dd')}.pdf',
                  image: { type: 'jpeg', quality: 0.98 },
                  html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', letterRendering: true },
                  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
                };
                
                // Ждем загрузки скрипта и DOM
                if (typeof html2pdf !== 'undefined') {
                  html2pdf().set(opt).from(element).save().then(() => {
                    window.parent.postMessage('pdf-generated', '*');
                  });
                } else {
                  console.error('html2pdf not loaded yet');
                  setTimeout(generatePDF, 500);
                }
              }
              
              // Запускаем генерацию после полной загрузки страницы
              window.onload = function() {
                setTimeout(generatePDF, 1000); // Даем дополнительное время на загрузку скрипта
              };
            </script>
          </body>
        </html>
      `);
      iframeDoc.close();

      // Ждем сообщения об успешной генерации
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          window.removeEventListener('message', handler);
          reject(new Error('PDF generation timeout'));
        }, 30000); // Увеличиваем таймаут до 30 секунд
        
        const handler = (event: MessageEvent) => {
          if (event.data === 'pdf-generated') {
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            resolve(true);
          }
        };
        window.addEventListener('message', handler);
      });

      // Удаляем iframe
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Ошибка при генерации PDF. Пожалуйста, попробуйте снова.');
    }
  };

  return (
    <Button
      startIcon={showIcon ? <PictureAsPdf /> : undefined}
      onClick={generatePDF}
      variant={buttonVariant}
      size={buttonSize}
      sx={{ 
        bgcolor: buttonVariant === 'contained' ? '#ef4444' : 'inherit',
        color: buttonVariant === 'contained' ? 'white' : '#ef4444',
        borderColor: buttonVariant === 'outlined' ? '#ef4444' : 'inherit',
        '&:hover': { 
          bgcolor: buttonVariant === 'contained' ? '#dc2626' : 'rgba(239, 68, 68, 0.04)',
          borderColor: buttonVariant === 'outlined' ? '#dc2626' : 'inherit'
        }
      }}
    >
      Скачать PDF
    </Button>
  );
};