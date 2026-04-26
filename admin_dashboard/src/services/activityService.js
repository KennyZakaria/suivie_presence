import api from './api';

export const getActivityLog = (limit = 200) =>
  api.get(`/activity?limit=${limit}`).then((r) => r.data);

export const exportActivityCSV = () =>
  api
    .get('/activity/export', { responseType: 'blob' })
    .then((r) => r.data);
