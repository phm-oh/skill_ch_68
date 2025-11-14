import api from './api';

export default {
  // Topics
  getAll: () => api.get('/topics'),
  getActive: () => api.get('/topics/active'),
  getById: (id) => api.get(`/topics/${id}`),
  create: (data) => api.post('/topics', data),
  update: (id, data) => api.put(`/topics/${id}`, data),
  delete: (id) => api.delete(`/topics/${id}`)
};
