import api from './api';

export const getTeachers = () => api.get('/users/teachers').then(r => r.data);
export const getStudents = () => api.get('/users/students').then(r => r.data);
export const getUser = (id) => api.get(`/users/${id}`).then(r => r.data);
export const createTeacher = (data) => api.post('/users/teachers', data).then(r => r.data);
export const createStudent = (data) => api.post('/users/students', data).then(r => r.data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data).then(r => r.data);
export const deleteUser = (id) => api.delete(`/users/${id}`).then(r => r.data);
export const resetUserPassword = (id) => api.post(`/users/${id}/reset-password`).then(r => r.data);
