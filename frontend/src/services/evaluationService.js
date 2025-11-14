import api from './api';

export default {
  // Evaluatee APIs
  getMyResults: (periodId) => api.get(`/results/me/${periodId}`),
  saveSelfEvaluation: (data) => api.post('/results/self', data),
  saveSelfBulk: (data) => api.post('/results/self/bulk', data),
  initResultsForMe: () => api.post('/results/init-for-me'),
  getSummary: (evaluateeId, periodId) => api.get(`/results/summary/${evaluateeId}/${periodId}`),

  // Committee APIs
  getByEvaluatee: (evaluateeId, periodId) => api.get(`/results/evaluatee/${evaluateeId}/${periodId}`),
  evaluate: (data) => api.post('/results/evaluate', data),
  evaluateBulk: (data) => api.post('/results/evaluate/bulk', data),

  // Common
  getAll: () => api.get('/results'),
  getById: (id) => api.get(`/results/${id}`),
  delete: (id) => api.delete(`/results/${id}`)
};
