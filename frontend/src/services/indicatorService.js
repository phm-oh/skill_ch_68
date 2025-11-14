import api from './api';

export default {
  getAll: () => api.get('/indicators'),
  getById: (id) => api.get(`/indicators/${id}`),
  getByTopic: (topicId) => api.get(`/indicators/topic/${topicId}`),
  getByType: (type) => api.get(`/indicators/type/${type}`),
  create: (data) => api.post('/indicators', data),
  update: (id, data) => api.put(`/indicators/${id}`, data),
  delete: (id) => api.delete(`/indicators/${id}`)
};
