import api from './api';

export default {
  getAll: () => api.get('/periods'),
  getActive: () => api.get('/periods/active'),
  getById: (id) => api.get(`/periods/${id}`),
  create: (data) => api.post('/periods', data),
  update: (id, data) => api.put(`/periods/${id}`, data),
  delete: (id) => api.delete(`/periods/${id}`)
};
