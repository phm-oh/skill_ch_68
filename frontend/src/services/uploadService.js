import api from './api';

export default {
  uploadEvidence: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post('/upload/evidence', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        if (onProgress) onProgress(progress);
      }
    });
  },

  getMine: () => api.get('/upload/mine'),
  getForEvaluatee: (evaluateeId) => api.get(`/upload/evaluatee/${evaluateeId}`),
  delete: (id) => api.delete(`/upload/${id}`),
  updateFile: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.put(`/upload/${id}/file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  updateMeta: (id, data) => api.patch(`/upload/${id}`, data)
};
