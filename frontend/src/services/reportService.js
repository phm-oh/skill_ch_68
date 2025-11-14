import api from './api';

export default {
  getIndividual: (evaluateeId, periodId) =>
    api.get(`/reports/individual/${evaluateeId}/${periodId}`),
  getOverall: (periodId) =>
    api.get(`/reports/overall/${periodId}`),
  getDepartment: (departmentId, periodId) =>
    api.get(`/reports/department/${departmentId}/${periodId}`),
  getTopics: (periodId) =>
    api.get(`/reports/topics/${periodId}`),
  exportPDF: (evaluateeId, periodId) =>
    api.get(`/reports/export-pdf/${evaluateeId}/${periodId}`, {
      responseType: 'blob'
    })
};
