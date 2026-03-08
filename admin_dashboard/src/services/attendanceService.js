import api from './api';

export const getClassAttendance = (classId, date) =>
  api.get(`/attendance/class/${classId}`, { params: { date } }).then(r => r.data);
export const getStudentAttendance = (studentId, params = {}) =>
  api.get(`/attendance/student/${studentId}`, { params }).then(r => r.data);
export const getStudentSummary = (studentId) =>
  api.get(`/attendance/student/${studentId}/summary`).then(r => r.data);
export const getAttendanceReport = (classId, startDate, endDate) =>
  api.get(`/attendance/report/class/${classId}`, {
    params: { start_date: startDate, end_date: endDate },
  }).then(r => r.data);
export const updateAttendanceRecord = (recordId, data) =>
  api.put(`/attendance/${recordId}`, data).then(r => r.data);
