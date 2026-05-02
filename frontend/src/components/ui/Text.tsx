import React from 'react';
import { useTheme } from '../../theme/SimpleThemeContext';

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body1' | 'body2' | 'caption';
  color?: keyof ReturnType<typeof useTheme>['theme']['colors'];
  bold?: boolean;
  center?: boolean;
}

export const Text: React.FC<TextProps> = ({ 
  children, 
  variant = 'body1',
  color = 'text',
  bold = false,
  center = false,
  style,
  ...props 
}) => {
  const { theme } = useTheme();
  
  const fontSize = {
    h1: 32,
    h2: 28,
    h3: 24,
    h4: 20,
    body1: 16,
    body2: 14,
    caption: 12
  }[variant];

  const styles: React.CSSProperties = {
    color: theme.colors[color],
    fontSize,
    fontWeight: bold ? 600 : 400,
    textAlign: center ? 'center' : undefined,
    margin: 0,
    ...style
  };

  const Component = variant.startsWith('h') ? variant : 'p';
  
  return React.createElement(Component, { style: styles, ...props }, children);
};