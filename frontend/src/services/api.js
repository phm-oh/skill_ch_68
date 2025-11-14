import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:7000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Dynamic import เพื่อหลีกเลี่ยง circular dependency
      const { useAuthStore } = await import('@/stores/auth');
      const authStore = useAuthStore();
      authStore.clearAuth();

      // ใช้ router.push แทน window.location.href เพื่อรักษา router state
      const router = (await import('@/router')).default;
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login');
      }
    }

    const message = error.response?.data?.message || 'เกิดข้อผิดพลาด';
    console.error('API Error:', message);

    return Promise.reject(error);
  }
);

export default api;
