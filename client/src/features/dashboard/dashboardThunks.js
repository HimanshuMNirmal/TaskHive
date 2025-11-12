import { createAsyncThunk } from '@reduxjs/toolkit';
import { taskApi } from '../../api/task.api';
import { teamApi } from '../../api/team.api';
import { activityLogApi } from '../../api/activityLog.api';

const calculateAnalytics = (tasks) => {
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return {
      completion: { rate: 0, total: 0, completed: 0 },
      deadlines: { met: 0, missed: 0, upcoming: 0 },
      priorities: { low: 0, medium: 0, high: 0, critical: 0 }
    };
  }

  const completed = tasks.filter(t => t?.status === 'done').length;
  const total = tasks.length;

  const deadlineMet = tasks.filter(t =>
    t?.status === 'done' &&
    t?.dueDate &&
    t?.updatedAt &&
    new Date(t.dueDate) >= new Date(t.updatedAt)
  ).length;

  const deadlineMissed = tasks.filter(t =>
    (t?.status === 'done' && t?.dueDate && t?.updatedAt && new Date(t.dueDate) < new Date(t.updatedAt)) ||
    (t?.status !== 'done' && t?.dueDate && new Date(t.dueDate) < new Date())
  ).length;

  const upcomingDeadlines = tasks.filter(t =>
    t?.status !== 'done' &&
    t?.dueDate &&
    new Date(t.dueDate) > new Date() &&
    new Date(t.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ).length;

  const priorities = tasks.reduce((acc, task) => {
    const priority = task?.priority || 'low';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, { low: 0, medium: 0, high: 0, critical: 0 });

  return {
    completion: {
      rate: total ? (completed / total) * 100 : 0,
      total,
      completed
    },
    deadlines: {
      met: deadlineMet,
      missed: deadlineMissed,
      upcoming: upcomingDeadlines
    },
    priorities
  };
};

export const fetchDashboardTasks = createAsyncThunk(
  'dashboard/fetchTasks',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await taskApi.getTasks({
        ...filters,
        sort: 'dueDate',
        limit: 100
      });
      const tasksData = response?.data?.tasks || response?.tasks || [];
      return {
        items: tasksData,
        total: tasksData.length
      };
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const fetchDashboardTeams = createAsyncThunk(
  'dashboard/fetchTeams',
  async (_, { rejectWithValue }) => {
    try {
      const response = await teamApi.getTeams();
      const teamsData = response?.data?.teams || response?.teams || response || [];
      
      if (teamsData && teamsData.length > 0) {
        const memberMap = new Map();
        
        teamsData.forEach(team => {
          (team?.members || []).forEach(member => {
            const memberId = member?.userId?._id || member?._id;
        
            if (!memberMap.has(memberId)) {
              memberMap.set(memberId, {
                _id: memberId,
                name: member?.userId?.name || member?.name || 'Unknown',
                role: member?.role || 'member',
                teamId: team?._id,
                status: member?.status || 'offline'
              });
            }
          });
        });

        return Array.from(memberMap.values());
      }
      
      return [];
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const fetchDashboardActivities = createAsyncThunk(
  'dashboard/fetchActivities',
  async (_, { rejectWithValue }) => {
    try {
      const response = await activityLogApi.getUserActivityLogs({
        limit: 20,
        sort: '-createdAt'
      });
      const activitiesData = response?.data?.logs || response?.logs || [];
      return activitiesData;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const calculateDashboardAnalytics = createAsyncThunk(
  'dashboard/calculateAnalytics',
  async (tasks, { rejectWithValue }) => {
    try {
      if (!tasks || !Array.isArray(tasks)) {
        return {
          completion: { rate: 0, total: 0, completed: 0 },
          deadlines: { met: 0, missed: 0, upcoming: 0 },
          priorities: { low: 0, medium: 0, high: 0, critical: 0 }
        };
      }
      
      const analytics = calculateAnalytics(tasks);
      return analytics;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to calculate analytics');
    }
  }
);
