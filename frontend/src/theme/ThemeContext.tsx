import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeMode must be used within ThemeProvider');
  return context;
};

// Константы вынесены за пределы компонента
const LIGHT_THEME = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#3B82F6' },
    secondary: { main: '#8B5CF6' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none' }
      }
    }
  }
});

const DARK_THEME = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#3B82F6' },
    secondary: { main: '#8B5CF6' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none' }
      }
    }
  }
});

const getTheme = (mode: ThemeMode) => mode === 'light' ? LIGHT_THEME : DARK_THEME;

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Инициализация темы с синхронным чтением из localStorage
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Синхронная инициализация при монтировании компонента
    try {
      const savedMode = localStorage.getItem('themeMode') as ThemeMode | null;
      if (savedMode === 'light' || savedMode === 'dark') {
        return savedMode;
      }
      // Проверка системных предпочтений, если нет сохраненной темы
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    } catch (error) {
      console.error('Failed to load theme mode:', error);
      // Проверка системных предпочтений при ошибке
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
  });

  // Сохранение темы при изменении
  useEffect(() => {
    try {
      localStorage.setItem('themeMode', mode);
      // Добавляем класс к body для дополнительной стилизации, если нужно
      if (mode === 'dark') {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
      } else {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
      }
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  }, [mode]);

  // Слушаем изменения системной темы
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Меняем тему только если пользователь не сохранил свою
      const savedMode = localStorage.getItem('themeMode');
      if (!savedMode) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Мемоизируем тему
  const theme = useMemo(() => getTheme(mode), [mode]);

  // Мемоизируем toggleTheme
  const toggleTheme = useCallback(() => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Мемоизируем контекстное значение
  const contextValue = useMemo(() => ({ mode, toggleTheme }), [mode, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};