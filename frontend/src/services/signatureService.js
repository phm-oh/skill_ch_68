import api from './api';

export default {
  create: (data) => api.post('/signatures', data),
  getByEvaluatee: (evaluateeId, periodId) => api.get(`/signatures/evaluatee/${evaluateeId}/${periodId}`)
};
