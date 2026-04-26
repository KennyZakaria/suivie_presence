import api from './api';

export const getReviews = () => api.get('/reviews').then(r => r.data);
export const getStudentReviews = (studentId) =>
  api.get(`/reviews/student/${studentId}`).then(r => r.data);
export const resolveReview = (reviewId) =>
  api.put(`/reviews/${reviewId}/resolve`, {}).then(r => r.data);
export const unresolveReview = (reviewId) =>
  api.put(`/reviews/${reviewId}/unresolve`, {}).then(r => r.data);
export const getReviewStats = () => api.get('/reviews/stats').then(r => r.data);

export const createConseilDiscipline = (data) =>
  api.post('/reviews/conseil-discipline', data).then(r => r.data);
