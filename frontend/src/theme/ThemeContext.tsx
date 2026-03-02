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

// Создаем тему один раз вне компонента
const createAppTheme = (mode: ThemeMode) => createTheme({
  palette: {
    mode,
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

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  // Инициализация темы при монтировании
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('themeMode') as ThemeMode;
      if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
        setMode(savedMode);
      }
    } catch (error) {
      console.error('Failed to load theme mode:', error);
    }
  }, []);

  // Сохранение темы при изменении
  useEffect(() => {
    try {
      localStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  }, [mode]);

  // Мемоизируем тему
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  // Мемоизируем toggleTheme
  const toggleTheme = useCallback(() => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Мемоизируем контекстное значение
  const contextValue = useMemo(() => ({ 
    mode, 
    toggleTheme 
  }), [mode, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};