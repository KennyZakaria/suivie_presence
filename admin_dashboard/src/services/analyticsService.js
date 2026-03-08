import api from './api';

export const getDashboardSummary = () =>
  api.get('/analytics/dashboard').then(r => r.data);
export const getAttendanceTrends = (days = 30) =>
  api.get('/analytics/attendance-trends', { params: { days } }).then(r => r.data);
export const getClassComparison = () =>
  api.get('/analytics/class-comparison').then(r => r.data);
export const getAtRiskStudents = (threshold = 70) =>
  api.get('/analytics/at-risk-students', { params: { threshold } }).then(r => r.data);
export const getReviewStats = () =>
  api.get('/analytics/review-stats').then(r => r.data);
