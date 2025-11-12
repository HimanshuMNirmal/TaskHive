import { createSlice } from '@reduxjs/toolkit';
import {
  fetchDashboardTasks,
  fetchDashboardTeams,
  fetchDashboardActivities,
  calculateDashboardAnalytics
} from './dashboardThunks';

const initialState = {
  tasks: { items: [], total: 0 },
  teamMembers: [],
  activities: [],
  analytics: {
    completion: { rate: 0, total: 0, completed: 0 },
    deadlines: { met: 0, missed: 0, upcoming: 0 },
    priorities: { low: 0, medium: 0, high: 0, critical: 0 }
  },
  
  loadingTasks: false,
  loadingTeams: false,
  loadingActivities: false,
  loadingAnalytics: false,
  
  tasksError: null,
  teamsError: null,
  activitiesError: null,
  analyticsError: null,
  
  isLoading: false
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearTasksError: (state) => {
      state.tasksError = null;
    },
    clearTeamsError: (state) => {
      state.teamsError = null;
    },
    clearActivitiesError: (state) => {
      state.activitiesError = null;
    },
    clearAnalyticsError: (state) => {
      state.analyticsError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardTasks.pending, (state) => {
        state.loadingTasks = true;
        state.tasksError = null;
      })
      .addCase(fetchDashboardTasks.fulfilled, (state, action) => {
        state.loadingTasks = false;
        state.tasks = action.payload;
        state.tasksError = null;
      })
      .addCase(fetchDashboardTasks.rejected, (state, action) => {
        state.loadingTasks = false;
        state.tasksError = action.payload || 'Failed to fetch tasks';
      });

    builder
      .addCase(fetchDashboardTeams.pending, (state) => {
        state.loadingTeams = true;
        state.teamsError = null;
      })
      .addCase(fetchDashboardTeams.fulfilled, (state, action) => {
        state.loadingTeams = false;
        state.teamMembers = action.payload;
        state.teamsError = null;
      })
      .addCase(fetchDashboardTeams.rejected, (state, action) => {
        state.loadingTeams = false;
        state.teamsError = action.payload || 'Failed to fetch teams';
      });

    builder
      .addCase(fetchDashboardActivities.pending, (state) => {
        state.loadingActivities = true;
        state.activitiesError = null;
      })
      .addCase(fetchDashboardActivities.fulfilled, (state, action) => {
        state.loadingActivities = false;
        state.activities = action.payload;
        state.activitiesError = null;
      })
      .addCase(fetchDashboardActivities.rejected, (state, action) => {
        state.loadingActivities = false;
        state.activitiesError = action.payload || 'Failed to fetch activities';
      });

    builder
      .addCase(calculateDashboardAnalytics.pending, (state) => {
        state.loadingAnalytics = true;
        state.analyticsError = null;
      })
      .addCase(calculateDashboardAnalytics.fulfilled, (state, action) => {
        state.loadingAnalytics = false;
        state.analytics = action.payload;
        state.analyticsError = null;
      })
      .addCase(calculateDashboardAnalytics.rejected, (state, action) => {
        state.loadingAnalytics = false;
        state.analyticsError = action.payload || 'Failed to calculate analytics';
      });
  }
});

export const {
  clearTasksError,
  clearTeamsError,
  clearActivitiesError,
  clearAnalyticsError
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
