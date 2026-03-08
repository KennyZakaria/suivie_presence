import api from './api';

export const getClasses = () => api.get('/classes').then(r => r.data);
export const getClass = (id) => api.get(`/classes/${id}`).then(r => r.data);
export const createClass = (data) => api.post('/classes', data).then(r => r.data);
export const updateClass = (id, data) => api.put(`/classes/${id}`, data).then(r => r.data);
export const assignTeacher = (classId, teacherId) =>
  api.post(`/classes/${classId}/assign-teacher`, { teacher_id: teacherId }).then(r => r.data);
export const assignStudents = (classId, studentIds) =>
  api.post(`/classes/${classId}/assign-students`, { student_ids: studentIds }).then(r => r.data);
export const removeStudentFromClass = (classId, studentId) =>
  api.delete(`/classes/${classId}/students/${studentId}`).then(r => r.data);
export const getClassStudents = (classId) =>
  api.get(`/classes/${classId}/students`).then(r => r.data);
