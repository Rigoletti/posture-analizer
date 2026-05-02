import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import '../../assets/styles/auth/Auth.css';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const [prevPage, setPrevPage] = useState(isLoginPage);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  useEffect(() => {
    // Определяем направление анимации
    if (prevPage !== isLoginPage) {
      setDirection(isLoginPage ? 'right' : 'left');
    }
    setPrevPage(isLoginPage);
  }, [isLoginPage]);

  return (
    <div className="auth-layout">
      {/* Animated Background Elements */}
      <div className="bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
        <div className="shape shape-5"></div>
      </div>

      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <div className="logo-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 4L28 16L16 28L4 16L16 4Z" stroke="url(#gradient)" strokeWidth="2" />
                <path d="M16 10L22 16L16 22L10 16L16 10Z" stroke="url(#gradient)" strokeWidth="2" />
                <defs>
                  <linearGradient id="gradient" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3B82F6" />
                    <stop offset="1" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="auth-logo-text">POSTURE</span>
          </Link>
          
          <div className="auth-tabs">
            <Link 
              to="/login" 
              className={`auth-tab ${isLoginPage ? 'active' : ''}`}
            >
              <div className="tab-content">
                <span className="tab-text">Вход</span>
                <div className="tab-indicator"></div>
              </div>
            </Link>
            <Link 
              to="/register" 
              className={`auth-tab ${!isLoginPage ? 'active' : ''}`}
            >
              <div className="tab-content">
                <span className="tab-text">Регистрация</span>
                <div className="tab-indicator"></div>
              </div>
            </Link>
            <div className={`tab-slider ${isLoginPage ? 'left' : 'right'}`}></div>
          </div>
        </div>

        <SwitchTransition mode="out-in">
          <CSSTransition
            key={location.pathname}
            timeout={400}
            classNames={`page-transition-${direction}`}
          >
            <div className={`auth-card ${direction}`}>
              <div className="card-glow"></div>
              
              <div className="auth-card-header">
                <div className="title-wrapper">
                  <h1 className="auth-title">{title}</h1>
                  <div className="title-underline">
                    <div className="underline-fill"></div>
                  </div>
                </div>
                {subtitle && (
                  <div className="subtitle-container">
                    <p className="auth-subtitle">{subtitle}</p>
                  </div>
                )}
              </div>

              <div className="auth-card-body">
                <div className="form-wrapper">
                  {children}
                </div>
              </div>

              <div className="auth-card-footer">
                {isLoginPage ? (
                  <p className="auth-switch">
                    Нет аккаунта? <Link to="/register" className="switch-link">Зарегистрируйтесь</Link>
                  </p>
                ) : (
                  <p className="auth-switch">
                    Уже есть аккаунт? <Link to="/login" className="switch-link">Войдите</Link>
                  </p>
                )}
              </div>
            </div>
          </CSSTransition>
        </SwitchTransition>

     
        <div className="decoration">
          <div className="decoration-item deco-1"></div>
          <div className="decoration-item deco-2"></div>
          <div className="decoration-item deco-3"></div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;