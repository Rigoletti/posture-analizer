import { create } from 'zustand';
import { authApi } from '../api/auth';
import { yandexAuthApi } from '../api/yandexAuth';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: string;
  emailVerified: boolean;
  fullName?: string;
  shortName?: string;
  postureSettings?: {
    notificationsEnabled: boolean;
    calibrationDone: boolean;
  };
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
  hasPremiumAccess?: boolean;
  trialEndsAt?: string;
  subscription?: string;
  authProvider?: 'local' | 'yandex';
  yandexAvatar?: string;
  avatar?: string;
  avatarThumbnail?: string;
  avatarUrl?: string;
  avatarThumbnailUrl?: string;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  
  login: (email: string, password: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  
  yandexLogin: () => Promise<void>;
  checkYandexStatus: () => Promise<void>;
  disconnectYandex: (password?: string) => Promise<any>;
  handleYandexCallback: () => { user: any; token: string } | null;
  
  clearError: () => void;
  clearUser: () => void;
  setUser: (user: User) => void;
  setAuth: (user: User) => void;
  
  hasPremiumAccess: () => boolean;
  isAdmin: () => boolean;
  isEmailVerified: () => boolean;
  isYandexUser: () => boolean;
  getYandexAvatar: () => string | undefined;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  setUser: (user: User) => {
    set({ user });
  },

  setAuth: (user: User) => {
    set({ 
      user, 
      isAuthenticated: true,
      error: null
    });
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authApi.login({ email, password });
      const { user } = result;
      
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null
      });
      
      // Проверяем статус Яндекса без ожидания, чтобы не блокировать
      get().checkYandexStatus().catch(e => console.log('Yandex status check error:', e));
      
      return result;
    } catch (error: any) {
      console.error('Login error:', error);
      set({ 
        error: error.message || 'Ошибка авторизации', 
        isLoading: false 
      });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authApi.register(data);
      
      set({ 
        user: null,
        isAuthenticated: false, 
        isLoading: false,
        error: null
      });
      
      return result;
    } catch (error: any) {
      console.error('Registration error:', error);
      set({ 
        error: error.message || 'Ошибка регистрации', 
        isLoading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      set({ isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const result = await authApi.getProfile();
      const { user } = result;
      
      console.log('✅ Auth check received user:', user);
      console.log('Avatar URL from server:', user?.avatarUrl);
      
      if (user) {
        set({ 
          user, 
          isAuthenticated: true, 
          isLoading: false,
          error: null
        });
        
        // Проверяем статус Яндекса без ожидания
        get().checkYandexStatus().catch(e => console.log('Yandex status check error:', e));
      } else {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
      }
    } catch (error: any) {
      console.error('Auth check error:', error);
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
    }
  },

  refreshUserData: async () => {
    const currentUser = get().user;
    if (!currentUser) return;
    
    try {
      const result = await authApi.getProfile();
      const { user } = result;
      
      if (user) {
        console.log('🔄 Refreshing user data, received avatarUrl:', user?.avatarUrl);
        
        const updatedUser = {
          ...user,
          avatarUrl: user.avatarUrl || currentUser?.avatarUrl,
          avatar: user.avatar || currentUser?.avatar,
          avatarThumbnail: user.avatarThumbnail || currentUser?.avatarThumbnail,
          avatarThumbnailUrl: user.avatarThumbnailUrl || currentUser?.avatarThumbnailUrl,
        };
        
        console.log('Updated user with avatarUrl:', updatedUser.avatarUrl);
        
        set({ 
          user: updatedUser, 
          isAuthenticated: true 
        });
        
        // Проверяем статус Яндекса без ожидания
        get().checkYandexStatus().catch(e => console.log('Yandex status check error:', e));
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  },

  yandexLogin: async () => {
    set({ isLoading: true, error: null });
    try {
      await yandexAuthApi.redirectToYandex();
    } catch (error: any) {
      console.error('Yandex login error:', error);
      set({ 
        error: error.message || 'Ошибка авторизации через Яндекс', 
        isLoading: false 
      });
      throw error;
    }
  },

  checkYandexStatus: async () => {
    // Проверяем статус только если пользователь авторизован
    if (!get().isAuthenticated || !get().user) {
      return;
    }
    
    try {
      const response = await yandexAuthApi.getYandexAuthStatus();
      
      if (get().user && response.isYandexUser) {
        const currentUser = get().user;
        
        console.log('📱 Yandex status check - keeping uploaded avatar:', currentUser.avatarUrl);
        
        // ВАЖНО: Сохраняем все поля загруженного аватара
        set({
          user: {
            ...currentUser,
            authProvider: 'yandex',
            yandexAvatar: response.yandexAvatar,
            avatar: currentUser.avatar,
            avatarThumbnail: currentUser.avatarThumbnail,
            avatarUrl: currentUser.avatarUrl,
            avatarThumbnailUrl: currentUser.avatarThumbnailUrl
          }
        });
      }
    } catch (error) {
      console.error('Error checking Yandex status:', error);
    }
  },

  disconnectYandex: async (password?: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await yandexAuthApi.disconnectYandex();
      
      const currentUser = get().user;
      if (currentUser) {
        set({
          user: {
            ...currentUser,
            authProvider: 'local',
            yandexAvatar: undefined,
            avatar: currentUser.avatar,
            avatarThumbnail: currentUser.avatarThumbnail,
            avatarUrl: currentUser.avatarUrl,
            avatarThumbnailUrl: currentUser.avatarThumbnailUrl
          },
          isLoading: false
        });
      }
      
      return result;
    } catch (error: any) {
      console.error('Error disconnecting Yandex:', error);
      set({ 
        error: error.message || 'Ошибка при отключении Яндекса', 
        isLoading: false 
      });
      throw error;
    }
  },

  handleYandexCallback: () => {
    try {
      const result = yandexAuthApi.handleYandexCallback();
      
      if (result) {
        const { user, token } = result;
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        return { user, token };
      }
      
      return null;
    } catch (error: any) {
      console.error('Error handling Yandex callback:', error);
      set({ 
        error: error.message || 'Ошибка при обработке данных от Яндекса', 
        isLoading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  clearUser: () => {
    set({ user: null, isAuthenticated: false });
  },

  hasPremiumAccess: () => {
    const { user } = get();
    if (!user) return false;
    
    if (user.role === 'admin') return true;
    if (user.hasPremiumAccess) return true;
    
    if (user.trialEndsAt) {
      const trialEnd = new Date(user.trialEndsAt);
      const now = new Date();
      if (trialEnd > now) return true;
    }
    
    return false;
  },

  isAdmin: () => {
    const { user } = get();
    return user?.role === 'admin';
  },

  isEmailVerified: () => {
    const { user } = get();
    return user?.emailVerified || false;
  },

  isYandexUser: () => {
    const { user } = get();
    return user?.authProvider === 'yandex';
  },

  getYandexAvatar: () => {
    const { user } = get();
    return user?.yandexAvatar;
  }
}));