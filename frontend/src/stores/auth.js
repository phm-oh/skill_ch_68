import { defineStore } from 'pinia';
import authService from '@/services/authService';

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
    userName: (state) => state.user?.name || '',
    userRole: (state) => state.user?.role || ''
  },

  actions: {
    async login(credentials) {
      try {
        const response = await authService.login(credentials);
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
      }
    },

    async fetchCurrentUser() {
      try {
        const response = await authService.getCurrentUser();
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
