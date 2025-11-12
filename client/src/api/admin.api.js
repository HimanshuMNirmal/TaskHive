import api from './api';

export const adminApi = {
  getAllUsers: async (params) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  createUser: async (data) => {
    const response = await api.post('/admin/users', data);
    return response.data;
  },

  updateUser: async (userId, data) => {
    const response = await api.put(`/admin/users/${userId}`, data);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  getRoles: async () => {
    const response = await api.get('/admin/roles');
    return response.data;
  },

  createRole: async (data) => {
    const response = await api.post('/admin/roles', data);
    return response.data;
  },

  updateRole: async (roleId, data) => {
    const response = await api.put(`/admin/roles/${roleId}`, data);
    return response.data;
  },

  deleteRole: async (roleId) => {
    const response = await api.delete(`/admin/roles/${roleId}`);
    return response.data;
  },

  removePermissionFromRole: async (roleId, permissionId) => {
    const response = await api.delete(`/admin/roles/${roleId}/permissions/${permissionId}`);
    return response.data;
  },

  getSystemSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  updateSystemSettings: async (data) => {
    const response = await api.put('/admin/settings', data);
    return response.data;
  },

  getSystemStats: async (params) => {
    const response = await api.get('/admin/stats', { params });
    return response.data;
  },

  getUserActivityLogs: async (params) => {
    const response = await api.get('/admin/activity-logs', { params });
    return response.data;
  },

  getAccessLogs: async (params) => {
    const response = await api.get('/admin/access-logs', { params });
    return response.data;
  },

  getSystemLogs: async (params) => {
    const response = await api.get('/admin/system-logs', { params });
    return response.data;
  },

  createBackup: async () => {
    const response = await api.post('/admin/backups');
    return response.data;
  },

  getBackups: async () => {
    const response = await api.get('/admin/backups');
    return response.data;
  },

  restoreBackup: async (backupId) => {
    const response = await api.post(`/admin/backups/${backupId}/restore`);
    return response.data;
  },

  clearCache: async (type) => {
    const response = await api.post('/admin/cache/clear', { type });
    return response.data;
  },

  createAnnouncement: async (data) => {
    const response = await api.post('/admin/announcements', data);
    return response.data;
  },

  getAnnouncements: async (params) => {
    const response = await api.get('/admin/announcements', { params });
    return response.data;
  },

  deleteAnnouncement: async (id) => {
    const response = await api.delete(`/admin/announcements/${id}`);
    return response.data;
  }
};

export default adminApi;
