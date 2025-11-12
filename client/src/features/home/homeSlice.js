import { createSlice } from '@reduxjs/toolkit';
import {
  fetchHomeData
} from './homeThunks';

const initialState = {
  user: {
    name: '',
    email: '',
    role: '',
    settings: {},
    organizationId: null
  },
  tasks: { total: 0, dueSoon: [] },
  teams: [],
  activities: [],
  notifications: [],
  
  loading: true,
  isInitialLoad: true,
  
  error: null,
  tasksError: null,
  teamsError: null,
  activitiesError: null,
  notificationsError: null
};

const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearTasksError: (state) => {
      state.tasksError = null;
    },
    clearTeamsError: (state) => {
      state.teamsError = null;
    },
    clearActivitiesError: (state) => {
      state.activitiesError = null;
    },
    clearNotificationsError: (state) => {
      state.notificationsError = null;
    },
    setInitialLoadComplete: (state) => {
      state.isInitialLoad = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomeData.pending, (state, action) => {
        if (action.meta.arg?.isInitial) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchHomeData.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        
        const {
          user,
          tasks,
          teams,
          activities,
          notifications,
          userPermissions
        } = action.payload;

        if (user) {
          state.user = user;
        }

        if (userPermissions?.canReadTasks && tasks) {
          state.tasks = tasks;
          state.tasksError = null;
        } else {
          state.tasksError = null;
        }

        if (userPermissions?.canReadTeams && teams) {
          state.teams = teams;
          state.teamsError = null;
        } else {
          state.teamsError = null;
        }

        if (userPermissions?.canReadActivities && activities) {
          state.activities = activities;
          state.activitiesError = null;
        } else {
          state.activitiesError = null;
        }

        if (userPermissions?.canReadNotifications && notifications) {
          state.notifications = notifications;
          state.notificationsError = null;
        } else {
          state.notificationsError = null;
        }

        if (action.meta.arg?.isInitial) {
          state.isInitialLoad = false;
        }
      })
      .addCase(fetchHomeData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch home data';
        state.isInitialLoad = false;
      });
  }
});

export const {
  clearError,
  clearTasksError,
  clearTeamsError,
  clearActivitiesError,
  clearNotificationsError,
  setInitialLoadComplete
} = homeSlice.actions;

export default homeSlice.reducer;
