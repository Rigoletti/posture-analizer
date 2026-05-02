/**
 * BackgroundMonitor — постоянный компонент, живущий вне <Routes>.
 *
 * Отвечает за:
 * 1. Звуковой сигнал при нарушениях (когда вкладка неактивна)
 * 2. Запрос разрешения на уведомления
 *
 * Системные уведомления (Notification API) отправляются напрямую из
 * PostureAnalysisService.sendNotification(), чтобы гарантировать
 * доставку даже когда React не рендерит компоненты.
 */

import { useEffect, useRef } from 'react';
import { usePostureAnalysis } from '../../contexts/PostureAnalysisContext';

const SOUND_ENABLED_KEY = 'posture_analyzer_sound_enabled';

const BackgroundMonitor: React.FC = () => {
  const state = usePostureAnalysis();
  const lastIssuesRef = useRef<string>('');
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Запрос разрешения на уведомления при монтировании
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Звуковой сигнал при нарушениях (только когда вкладка неактивна)
  useEffect(() => {
    if (!state.isRunning || !state.isSessionActive) return;
    if (state.issues.length === 0) {
      lastIssuesRef.current = '';
      return;
    }

    const issuesKey = state.issues.map(i => i.type).join(',');
    if (issuesKey === lastIssuesRef.current) return;
    lastIssuesRef.current = issuesKey;

    // Звуковой сигнал — только для скрытой вкладки
    const soundEnabled = localStorage.getItem(SOUND_ENABLED_KEY) !== 'false';
    if (soundEnabled && document.visibilityState === 'hidden') {
      playBeepSound();
    }
  }, [state.issues, state.isRunning, state.isSessionActive]);

  const playBeepSound = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  return null;
};

export default BackgroundMonitor;
