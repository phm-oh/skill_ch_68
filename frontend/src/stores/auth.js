import { defineStore } from 'pinia';
import authService from '@/services/authService';
import userService from '@/services/userService';

export const useAuthStore = defineStore('auth', {
  state: () => {
    const token = localStorage.getItem('auth_token');
    return {
      user: null,
      token: token,
      isAuthenticated: !!token, // ✅ ถ้ามี token = authenticated
      isInitialized: false
    };
  },

  getters: {
    isAdmin: (state) => state.user?.role === 'admin',
    isEvaluator: (state) => state.user?.role === 'evaluator',
    isEvaluatee: (state) => state.user?.role === 'evaluatee',
    userName: (state) => state.user?.full_name || state.user?.name || '',
    userRole: (state) => state.user?.role || '',
    userId: (state) => state.user?.id || null
  },

  actions: {
    // ✅ Initialize: ถ้ามี token ให้ fetch user
    async initialize() {
      if (this.isInitialized) return;

      if (this.token) {
        try {
          await this.fetchCurrentUser();
        } catch (error) {
          console.error('[Auth] Initialize failed, clearing auth:', error);
          this.clearAuth();
        }
      }

      this.isInitialized = true;
    },

    async login(credentials) {
      try {
        const response = await authService.login(credentials);
        // Backend ส่ง { success: true, accessToken, user } ไม่ได้ wrap ใน data
        const { user, accessToken } = response.data;

        this.user = user;
        this.token = accessToken;
        this.isAuthenticated = true;
        this.isInitialized = true;

        localStorage.setItem('auth_token', accessToken);
        return user;
      } catch (error) {
        this.clearAuth();
        throw error;
      }
    },

    async logout() {
      try {
        await authService.logout();
      } finally {
        this.clearAuth();
        window.location.href = '/login';
      }
    },

    async fetchCurrentUser() {
      try {
        const response = await userService.getMe();
        // Backend อาจส่ง response.data.data หรือ response.data
        this.user = response.data.data || response.data;
        this.isAuthenticated = true;
        return this.user;
      } catch (error) {
        this.clearAuth();
        throw error;
      }
    },

    clearAuth() {
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
      this.isInitialized = false;
      localStorage.removeItem('auth_token');
    }
  }
});
