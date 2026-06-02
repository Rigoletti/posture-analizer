import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
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

// Константы тем вынесены за пределы компонента и мемоизированы
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

// Кэш для тем
const themeCache = new Map<ThemeMode, typeof LIGHT_THEME>();
themeCache.set('light', LIGHT_THEME);
themeCache.set('dark', DARK_THEME);

const getTheme = (mode: ThemeMode) => themeCache.get(mode)!;

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
  // Используем ref для предотвращения лишних обновлений
  const isInitialized = useRef(false);
  
  // Инициализация темы с синхронным чтением из localStorage
  const [mode, setMode] = useState<ThemeMode>(() => {
    try {
      const savedMode = localStorage.getItem('themeMode') as ThemeMode | null;
      if (savedMode === 'light' || savedMode === 'dark') {
        return savedMode;
      }
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    } catch (error) {
      console.error('Failed to load theme mode:', error);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
  });

  // Используем ref для debounce
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Сохранение темы при изменении с debounce
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem('themeMode', mode);
        // Используем requestAnimationFrame для оптимизации
        requestAnimationFrame(() => {
          if (mode === 'dark') {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
          } else {
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
          }
        });
      } catch (error) {
        console.error('Failed to save theme mode:', error);
      }
    }, 100);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [mode]);

  // Слушаем изменения системной темы с throttling
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    let timeoutId: NodeJS.Timeout;
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Используем throttle
      if (timeoutId) return;
      
      timeoutId = setTimeout(() => {
        const savedMode = localStorage.getItem('themeMode');
        if (!savedMode) {
          setMode(e.matches ? 'dark' : 'light');
        }
        timeoutId = undefined as any;
      }, 50);
    };
    
    // Используем addEventListener с passive: true для производительности
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Мемоизируем тему - теперь просто берем из кэша
  const theme = useMemo(() => getTheme(mode), [mode]);

  // Мемоизируем toggleTheme с useCallback
  const toggleTheme = useCallback(() => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Мемоизируем контекстное значение
  const contextValue = useMemo(() => ({ mode, toggleTheme }), [mode, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
});

ThemeProvider.displayName = 'ThemeProvider';