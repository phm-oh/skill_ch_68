import api from './api';

export default {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/users/me')
};
