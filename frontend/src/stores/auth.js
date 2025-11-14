import { defineStore } from 'pinia';
import authService from '@/services/authService';
import userService from '@/services/userService';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null, // จะโหลดใน init() แทน
    isAuthenticated: false,
    _hydrated: false // ป้องกันการ hydrate ซ้ำ
  }),

  getters: {
    isAdmin: (state) => state.user?.role === 'admin',
    isEvaluator: (state) => state.user?.role === 'evaluator',
    isEvaluatee: (state) => state.user?.role === 'evaluatee',
    userName: (state) => state.user?.full_name || state.user?.name || '',
    userRole: (state) => state.user?.role || '',
    userId: (state) => state.user?.id || null
  },

  actions: {
    // Initialize auth state จาก localStorage
    async init() {
      if (this._hydrated) return;

      const token = localStorage.getItem('auth_token');
      if (token) {
        this.token = token;
        try {
          await this.fetchCurrentUser();
          this.isAuthenticated = true;
        } catch (error) {
          // Token invalid หรือ expired - ล้าง auth
          console.warn('Token validation failed:', error);
          this.clearAuth();
        }
      }
      this._hydrated = true;
    },

    async login(credentials) {
      try {
        const response = await authService.login(credentials);
        // Backend ส่ง { success: true, accessToken, user } ไม่ได้ wrap ใน data
        const { user, accessToken } = response.data;

        this.user = user;
        this.token = accessToken;
        this.isAuthenticated = true;

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
        // ไม่ redirect ที่นี่ - ให้ caller (component) จัดการ redirect
        // เพื่อห้างการใช้ window.location.href ที่ทำให้สูญเสีย router state
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
      localStorage.removeItem('auth_token');
    }
  }
});
