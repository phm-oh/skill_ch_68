import api from './api';

export default {
  getAll: (params) => api.get('/assignments', { params }),
  getById: (id) => api.get(`/assignments/${id}`),
  getMine: () => api.get('/assignments/mine'),
  create: (data) => api.post('/assignments', data),
  createBulk: (data) => api.post('/assignments/bulk', data),
  delete: (id) => api.delete(`/assignments/${id}`)
};
