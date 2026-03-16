import api from './api';

export const getJustifications = (status) =>
  api.get('/justifications', { params: status ? { status } : {} }).then(r => r.data);

export const reviewJustification = (id, data) =>
  api.put(`/justifications/${id}/review`, data).then(r => r.data);

export const getStudentJustifications = (studentId) =>
  api.get(`/justifications/student/${studentId}`).then(r => r.data);
