
import { createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardApi } from '../../api/dashboard.api';
export const fetchHomeData = createAsyncThunk(
  'home/fetchData',
  async ({ isInitial = false, can = null } = {}, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.getDashboardData();

      if (!response || !response.user) {
        return rejectWithValue('No user data received');
      }

      const {
        user: userData,
        tasks: { total: totalTasks, dueSoon: dueSoonTasks } = { total: 0, dueSoon: [] },
        teams: teamsData = [],
        activities: activitiesData = [],
        notifications: notificationsData = []
      } = response;

      const permissions = {
        canReadTasks: true,
        canReadTeams: true,
        canReadActivities: true,
        canReadNotifications: true
      };

      return {
        user: userData,
        tasks: {
          total: totalTasks,
          dueSoon: Array.isArray(dueSoonTasks)
            ? dueSoonTasks.map(task => ({
              _id: task._id,
              title: task.title,
              dueDate: task.dueDate,
              priority: task.priority,
              status: task.status,
              assignee: task.assigneeId?.name,
              team: task.teamId?.name
            }))
            : []
        },
        teams: Array.isArray(teamsData) ? teamsData : [],
        activities: Array.isArray(activitiesData) ? activitiesData : [],
        notifications: Array.isArray(notificationsData) ? notificationsData : [],
        userPermissions: permissions
      };
    } catch (error) {
      console.error('Error fetching home data:', error);
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);
