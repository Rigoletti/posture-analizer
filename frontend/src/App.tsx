import React, { useEffect, useState, lazy, Suspense, useCallback, memo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, alpha } from '@mui/material';
import { useAuthStore } from './store/auth';
import Header from './components/layout/Header';
import { ProtectedRoute } from './components/ui/ProtectedRoute';
import { ThemeProvider } from './theme/ThemeContext';
import './App.css';

// Ленивая загрузка страниц
const Home = lazy(() => import('./pages/home/Home'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const Exercises = lazy(() => import('./pages/exercises/Exercises'));
const ExerciseDetail = lazy(() => import('./pages/exercises/ExerciseDetail'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const SessionsHistory = lazy(() => import('./pages/sessions/SessionsHistory'));
const SessionDetailPage = lazy(() => import('./pages/sessions/SessionDetailPage'));
const ReviewsPage = lazy(() => import('./pages/reviews/ReviewsPage'));
const PendingVerificationPage = lazy(() => import('./pages/auth/PendingVerificationPage'));
const VerifyCodePage = lazy(() => import('./pages/auth/VerifyCodePage'));
const YandexCallbackPage = lazy(() => import('./pages/auth/YandexCallbackPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const ProfileEditPage = lazy(() => import('./pages/profile/ProfileEditPage'));
const ProfileSecurityPage = lazy(() => import('./pages/profile/ProfileSecurityPage'));
const SubscriptionSuccessPage = lazy(() => import('./pages/profile/SubscriptionSuccessPage'));
const SubscriptionInfo = lazy(() => import('./components/profile/SubscriptionInfo'));

// Компонент загрузки
const PageLoader = memo(() => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
  }}>
    <Box sx={{ position: 'relative' }}>
      <CircularProgress 
        size={60} 
        thickness={3}
        sx={{ 
          color: '#3B82F6',
          animationDuration: '1.5s'
        }}
      />
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '0.8rem',
        color: alpha('#FFFFFF', 0.7)
      }}>
        P
      </Box>
    </Box>
  </Box>
));

PageLoader.displayName = 'PageLoader';

// Мемоизированный компонент глобальной загрузки
const GlobalLoader = memo(() => (
  <div className="global-loading-overlay">
    <Box sx={{ position: 'relative' }}>
      <CircularProgress 
        size={80} 
        thickness={2}
        sx={{ 
          color: '#3B82F6',
          animationDuration: '2s'
        }}
      />
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}>
        <Box sx={{
          width: 32,
          height: 32,
          borderRadius: 1,
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 16,
          fontWeight: 'bold'
        }}>
          P
        </Box>
      </Box>
    </Box>
  </div>
));

GlobalLoader.displayName = 'GlobalLoader';

function App() {
  const [appLoading, setAppLoading] = useState(true);
  const { checkAuth, checkYandexStatus } = useAuthStore();

  const initializeApp = useCallback(async () => {
    try {
      await Promise.all([
        checkAuth(),
        checkYandexStatus()
      ]);
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setAppLoading(false);
    }
  }, [checkAuth, checkYandexStatus]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  if (appLoading) {
    return <GlobalLoader />;
  }

  return (
    <ThemeProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Header />
          
          <main>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Публичные маршруты */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/exercises" element={<Exercises />} />
                <Route path="/exercises/:id" element={<ExerciseDetail />} />
                <Route path="/verify-email" element={<VerifyCodePage />} />
                <Route path="/pending-verification" element={<PendingVerificationPage />} />
                <Route path="/yandex-callback" element={<YandexCallbackPage />} />

                {/* Защищенные маршруты - только для авторизованных пользователей */}
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute requireAuth>
                      <ProfilePage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/profile/edit" 
                  element={
                    <ProtectedRoute requireAuth>
                      <ProfileEditPage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/profile/security" 
                  element={
                    <ProtectedRoute requireAuth>
                      <ProfileSecurityPage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/profile/subscription" 
                  element={
                    <ProtectedRoute requireAuth>
                      <SubscriptionInfo />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/profile/subscription/success" 
                  element={
                    <ProtectedRoute requireAuth>
                      <SubscriptionSuccessPage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/sessions" 
                  element={
                    <ProtectedRoute requireAuth>
                      <SessionsHistory />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/sessions/:sessionId" 
                  element={
                    <ProtectedRoute requireAuth>
                      <SessionDetailPage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/reviews" 
                  element={
                    <ProtectedRoute requireAuth>
                      <ReviewsPage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/reviews/:userId" 
                  element={
                    <ProtectedRoute requireAuth>
                      <ReviewsPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Админ маршруты - только для админов */}
                <Route 
                  path="/admin/*" 
                  element={
                    <ProtectedRoute requireAuth requireAdmin>
                      <AdminPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default memo(App);