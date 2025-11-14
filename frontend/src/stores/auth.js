import { defineStore } from 'pinia';
import authService from '@/services/authService';
import userService from '@/services/userService';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('auth_token') || null,
    isAuthenticated: false
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
    async login(credentials) {
      try {
        const response = await authService.login(credentials);
        const { user, token } = response.data.data;

        this.user = user;
        this.token = token;
        this.isAuthenticated = true;

        localStorage.setItem('auth_token', token);
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
        this.user = response.data.data;
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
