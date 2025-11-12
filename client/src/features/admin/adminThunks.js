import { createAsyncThunk } from '@reduxjs/toolkit';
import { adminApi } from '../../api/admin.api';

export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.getAllUsers();
      const usersData = response?.data?.users ?? response?.users ?? [];
      return usersData;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const fetchRoles = createAsyncThunk(
  'admin/fetchRoles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.getRoles();
      const rolesData = response?.data?.roles ?? response?.roles ?? [];
      return rolesData;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const fetchSystemStats = createAsyncThunk(
  'admin/fetchSystemStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.getSystemStats();
      return response ?? null;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const fetchActivityLogs = createAsyncThunk(
  'admin/fetchActivityLogs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.getUserActivityLogs();
      const logsData = response?.logs ?? response?.data?.logs ?? [];
      return logsData;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const fetchAccessLogs = createAsyncThunk(
  'admin/fetchAccessLogs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.getAccessLogs();
      const logsData = response?.logs ?? response?.data?.logs ?? [];
      return logsData;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const fetchSystemLogs = createAsyncThunk(
  'admin/fetchSystemLogs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.getSystemLogs();
      const logsData = response?.logs ?? response?.data?.logs ?? [];
      return logsData;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const fetchBackups = createAsyncThunk(
  'admin/fetchBackups',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.getBackups();
      const backupsData = response?.backups ?? response?.data?.backups ?? [];
      return backupsData;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const fetchSystemSettings = createAsyncThunk(
  'admin/fetchSystemSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.getSystemSettings();
      const settingsData = response?.settings ?? response?.data?.settings ?? {};
      return settingsData;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const fetchAnnouncements = createAsyncThunk(
  'admin/fetchAnnouncements',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.getAnnouncements();
      const announcementsData = response?.announcements ?? response?.data?.announcements ?? [];
      return announcementsData;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const createUser = createAsyncThunk(
  'admin/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await adminApi.createUser(userData);
      const newUser = response?.data?.user ?? response?.user ?? response;
      return newUser;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ userId, data }, { rejectWithValue }) => {
    try {
      const updateData = {
        ...data,
        role: data.role || data.roles?.[0]
      };
      delete updateData.roles;

      const response = await adminApi.updateUser(userId, updateData);
      const updatedUser = response?.data?.user ?? response?.user ?? response;
      return updatedUser;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      await adminApi.deleteUser(userId);
      return userId;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const createRole = createAsyncThunk(
  'admin/createRole',
  async (roleData, { rejectWithValue }) => {
    try {
      const response = await adminApi.createRole(roleData);
      const newRole = response?.data?.role ?? response?.role ?? response;
      return newRole;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const updateRole = createAsyncThunk(
  'admin/updateRole',
  async ({ roleId, data }, { rejectWithValue }) => {
    try {
      const response = await adminApi.updateRole(roleId, data);
      const updatedRole = response?.data?.role ?? response?.role ?? response;
      return updatedRole;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const removePermissionFromRole = createAsyncThunk(
  'admin/removePermissionFromRole',
  async ({ roleId, permissionId }, { rejectWithValue }) => {
    try {
      const response = await adminApi.removePermissionFromRole(roleId, permissionId);
      const updatedRole = response?.data?.role ?? response?.role ?? response;
      return { roleId, updatedRole };
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const createBackup = createAsyncThunk(
  'admin/createBackup',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.createBackup();
      const backup = response?.data?.backup ?? response?.backup ?? response;
      return backup;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const restoreBackup = createAsyncThunk(
  'admin/restoreBackup',
  async (backupId, { rejectWithValue }) => {
    try {
      await adminApi.restoreBackup(backupId);
      return backupId;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const clearCache = createAsyncThunk(
  'admin/clearCache',
  async (cacheType = 'all', { rejectWithValue }) => {
    try {
      const response = await adminApi.clearCache(cacheType);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const createAnnouncement = createAsyncThunk(
  'admin/createAnnouncement',
  async (announcementData, { rejectWithValue }) => {
    try {
      const response = await adminApi.createAnnouncement(announcementData);
      const announcement = response?.data?.announcement ?? response?.announcement ?? response;
      return announcement;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const updateSystemSettings = createAsyncThunk(
  'admin/updateSystemSettings',
  async (updates, { rejectWithValue }) => {
    try {
      const response = await adminApi.updateSystemSettings(updates);
      const settings = response?.data?.settings ?? response?.settings ?? response;
      return settings;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);
