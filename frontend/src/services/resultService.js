import api from './api';

export default {
  // Evaluatee APIs
  getAll: () => api.get('/results'),
  getById: (id) => api.get(`/results/${id}`),
  getMyResults: (periodId) => api.get(`/results/me/${periodId}`),
  getByEvaluatee: (evaluateeId, periodId) => api.get(`/results/evaluatee/${evaluateeId}/${periodId}`),
  getSummary: (evaluateeId, periodId) => api.get(`/results/summary/${evaluateeId}/${periodId}`),

  // Save self evaluation
  saveSelf: (data) => api.post('/results/self', data),
  saveSelfBulk: (data) => api.post('/results/self/bulk', data),

  // Evaluator APIs
  evaluate: (data) => api.post('/results/evaluate', data),
  evaluateBulk: (data) => api.post('/results/evaluate/bulk', data),

  // Initialize results
  initForPeriod: (periodId) => api.post('/results/init-for-period', { period_id: periodId }),
  initForMe: (periodId) => api.post('/results/init-for-me', { period_id: periodId }),

  // Delete
  delete: (id) => api.delete(`/results/${id}`)
};
