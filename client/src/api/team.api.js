import api from './api';

export const teamApi = {
  createTeam: async (data) => {
    const response = await api.post('/teams', data);
    return response.data?.team ?? response.data;
  },

  getTeams: async () => {
    const response = await api.get('/teams');
    return response.data?.teams ?? [];
  },

  getTeamById: async (id) => {
    const response = await api.get(`/teams/${id}`);
    return response.data?.team ?? response.data;
  },

  updateTeam: async (id, data) => {
    const response = await api.put(`/teams/${id}`, data);
    return response.data?.team ?? response.data;
  },

  deleteTeam: async (id) => {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
  },

  addTeamMember: async (teamId, data) => {
    const response = await api.post(`/teams/${teamId}/members`, data);
    return response.data?.team ?? response.data;
  },

  removeTeamMember: async (teamId, userId) => {
    const response = await api.delete(`/teams/${teamId}/members/${userId}`);
    return response.data?.team ?? response.data;
  },

  updateMemberRole: async (teamId, userId, data) => {
    const response = await api.put(`/teams/${teamId}/members/${userId}`, data);
    return response.data?.team ?? response.data;
  }
};

export default teamApi;
