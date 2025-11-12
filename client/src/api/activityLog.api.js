import api from './api';

export const activityLogApi = {
  createActivityLog: async (data) => {
    const response = await api.post('/activity-logs', data);
    return response.data;
  },

  getTeamActivityLogs: async (teamId, params) => {
    const response = await api.get(`/activity-logs/team/${teamId}`, { params });
    return response.data;
  },

  getTaskActivityLogs: async (taskId, params) => {
    const response = await api.get(`/activity-logs/task/${taskId}`, { params });
    return response.data;
  },

  getUserActivityLogs: async (params) => {
    const response = await api.get('/activity-logs/user', { params });
    return response.data;
  },

  getActivityLogsByDateRange: async (params) => {
    const response = await api.get('/activity-logs/range', { params });
    return response.data;
  }
};

export default activityLogApi;
