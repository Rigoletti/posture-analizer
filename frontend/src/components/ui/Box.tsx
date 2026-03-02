import React from 'react';
import { useTheme } from '../../theme/SimpleThemeContext';

interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  bg?: keyof ReturnType<typeof useTheme>['theme']['colors'];
  color?: keyof ReturnType<typeof useTheme>['theme']['colors'];
  p?: number;
  m?: number;
  rounded?: boolean;
  border?: boolean;
  flex?: boolean;
  center?: boolean;
}

export const Box: React.FC<BoxProps> = ({ 
  children, 
  bg, 
  color, 
  p = 0, 
  m = 0,
  rounded = false,
  border = false,
  flex = false,
  center = false,
  style,
  ...props 
}) => {
  const { theme } = useTheme();
  
  const styles: React.CSSProperties = {
    backgroundColor: bg ? theme.colors[bg] : undefined,
    color: color ? theme.colors[color] : undefined,
    padding: p * 8,
    margin: m * 8,
    borderRadius: rounded ? 8 : 0,
    border: border ? `1px solid ${theme.colors.border}` : undefined,
    display: flex ? 'flex' : undefined,
    alignItems: center ? 'center' : undefined,
    justifyContent: center ? 'center' : undefined,
    ...style
  };

  return <div style={styles} {...props}>{children}</div>;
};