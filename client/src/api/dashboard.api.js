import api from './api';

export const dashboardApi = {
    getDashboardData: async () => {
        const response = await api.get('/dashboard');
        return response.data;
    }
};

export default dashboardApi;