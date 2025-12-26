import api from './api';

const dashboardService = {
  getDashboardStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
  getChartData: async (period = '30') => {
    const response = await api.get('/dashboard/chart-data', { params: { period } });
    return response.data;
  },
};

export default dashboardService;

