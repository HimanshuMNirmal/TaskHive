import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import adminReducer from '../features/admin/adminSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import homeReducer from '../features/home/homeSlice';
import tasksReducer from '../features/tasks/tasksSlice';
import teamsReducer from '../features/teams/teamsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    admin: adminReducer,
    dashboard: dashboardReducer,
    home: homeReducer,
    tasks: tasksReducer,
    teams: teamsReducer
  }
});

export default store;
