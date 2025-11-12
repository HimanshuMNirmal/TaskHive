import api from './api';

export const taskApi = {
  createTask: async (data) => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  getTasks: async (params) => {
    const response = await api.post('/tasks/list', params);
    return response.data;
  },

  getTaskById: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  updateTask: async (id, data) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  addTaskComment: async (taskId, data) => {
    const response = await api.post(`/tasks/${taskId}/comments`, data);
    return response.data;
  },

  getTaskComments: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}/comments`);
    return response.data;
  },

  addTaskAttachment: async (taskId, data) => {
    const response = await api.post(`/tasks/${taskId}/attachments`, data);
    return response.data;
  }
};

export default taskApi;
