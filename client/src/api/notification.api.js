import api from './api';

export const notificationApi = {
  getNotifications: async (params) => {
    const response = await api.post('/notifications', params);
    return response.data;
  },

  markNotificationsAsRead: async () => {
    const response = await api.post('/notifications/mark-read');
    return response.data;
  }
};

export default notificationApi;
    