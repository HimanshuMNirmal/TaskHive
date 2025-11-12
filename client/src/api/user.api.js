import api from './api';

export const userApi = {
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateUserProfile: async (data) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  updateUserSettings: async (data) => {
    const response = await api.put('/users/settings', data);
    return response.data;
  },

  updateUserPassword: async (data) => {
    const response = await api.put('/users/password', data);
    return response.data;
  },

  getUserTeams: async (params) => {
    const response = await api.get('/users/teams', { params });
    return response.data;
  },

  getUserTasks: async (params) => {
    const response = await api.get('/users/tasks', { params });
    return response.data;
  },

  getUserNotifications: async (params) => {
    const response = await api.get('/users/notifications', { params });
    return response.data;
  },

  updateNotificationSettings: async (data) => {
    const response = await api.put('/users/notifications/settings', data);
    return response.data;
  },

  getUserActivitySummary: async (params) => {
    const response = await api.get('/users/activity/summary', { params });
    return response.data;
  },

  deactivateAccount: async (data) => {
    const response = await api.post('/users/deactivate', data);
    return response.data;
  },

  getOrganizationUsers: async (search = '') => {
    const response = await api.get('/users/organization/users', {
      params: { search }
    });
    return response.data?.users ?? [];
  }
};

export default userApi;
