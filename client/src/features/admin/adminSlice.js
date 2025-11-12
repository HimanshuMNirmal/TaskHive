import { createSlice } from '@reduxjs/toolkit';
import {
  fetchUsers,
  fetchRoles,
  fetchSystemStats,
  fetchActivityLogs,
  fetchAccessLogs,
  fetchSystemLogs,
  fetchBackups,
  fetchSystemSettings,
  fetchAnnouncements,
  createUser,
  updateUser,
  deleteUser,
  createRole,
  updateRole,
  removePermissionFromRole,
  createBackup,
  restoreBackup,
  clearCache,
  createAnnouncement,
  updateSystemSettings
} from './adminThunks';

const initialState = {
  users: [],
  roles: [],
  systemStats: null,
  activityLogs: [],
  accessLogs: [],
  systemLogs: [],
  backups: [],
  settings: {},
  announcements: [],
  
  loadingUsers: false,
  loadingRoles: false,
  loadingStats: false,
  loadingLogs: false,
  loadingBackups: false,
  loadingSettings: false,
  loadingAnnouncements: false,
  
  isCreatingUser: false,
  isUpdatingUser: false,
  isDeletingUser: false,
  isCreatingRole: false,
  isUpdatingRole: false,
  isRemovingPermission: false,
  isCreatingBackup: false,
  isRestoringBackup: false,
  isClearingCache: false,
  isCreatingAnnouncement: false,
  isUpdatingSettings: false,
  
  error: null,
  userError: null,
  roleError: null,
  statsError: null,
  backupError: null,
  settingsError: null
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearUserError: (state) => {
      state.userError = null;
    },
    clearRoleError: (state) => {
      state.roleError = null;
    }
  },
  extraReducers: (builder) => {

    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loadingUsers = true;
        state.userError = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loadingUsers = false;
        state.users = action.payload || [];
        state.userError = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loadingUsers = false;
        state.userError = action.payload || 'Failed to fetch users';
      });


    builder
      .addCase(fetchRoles.pending, (state) => {
        state.loadingRoles = true;
        state.roleError = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loadingRoles = false;
        state.roles = action.payload || [];
        state.roleError = null;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loadingRoles = false;
        state.roleError = action.payload || 'Failed to fetch roles';
      });


    builder
      .addCase(fetchSystemStats.pending, (state) => {
        state.loadingStats = true;
        state.statsError = null;
      })
      .addCase(fetchSystemStats.fulfilled, (state, action) => {
        state.loadingStats = false;
        state.systemStats = action.payload;
        state.statsError = null;
      })
      .addCase(fetchSystemStats.rejected, (state, action) => {
        state.loadingStats = false;
        state.statsError = action.payload || 'Failed to fetch system stats';
      });


    builder
      .addCase(fetchActivityLogs.pending, (state) => {
        state.loadingLogs = true;
      })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.loadingLogs = false;
        state.activityLogs = action.payload || [];
      })
      .addCase(fetchActivityLogs.rejected, (state) => {
        state.loadingLogs = false;
      });


    builder
      .addCase(fetchAccessLogs.pending, (state) => {
        state.loadingLogs = true;
      })
      .addCase(fetchAccessLogs.fulfilled, (state, action) => {
        state.loadingLogs = false;
        state.accessLogs = action.payload || [];
      })
      .addCase(fetchAccessLogs.rejected, (state) => {
        state.loadingLogs = false;
      });


    builder
      .addCase(fetchSystemLogs.pending, (state) => {
        state.loadingLogs = true;
      })
      .addCase(fetchSystemLogs.fulfilled, (state, action) => {
        state.loadingLogs = false;
        state.systemLogs = action.payload || [];
      })
      .addCase(fetchSystemLogs.rejected, (state) => {
        state.loadingLogs = false;
      });


    builder
      .addCase(fetchBackups.pending, (state) => {
        state.loadingBackups = true;
        state.backupError = null;
      })
      .addCase(fetchBackups.fulfilled, (state, action) => {
        state.loadingBackups = false;
        state.backups = action.payload || [];
        state.backupError = null;
      })
      .addCase(fetchBackups.rejected, (state, action) => {
        state.loadingBackups = false;
        state.backupError = action.payload || 'Failed to fetch backups';
      });


    builder
      .addCase(fetchSystemSettings.pending, (state) => {
        state.loadingSettings = true;
        state.settingsError = null;
      })
      .addCase(fetchSystemSettings.fulfilled, (state, action) => {
        state.loadingSettings = false;
        state.settings = action.payload || {};
        state.settingsError = null;
      })
      .addCase(fetchSystemSettings.rejected, (state, action) => {
        state.loadingSettings = false;
        state.settingsError = action.payload || 'Failed to fetch settings';
      });


    builder
      .addCase(fetchAnnouncements.pending, (state) => {
        state.loadingAnnouncements = true;
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.loadingAnnouncements = false;
        state.announcements = action.payload || [];
      })
      .addCase(fetchAnnouncements.rejected, (state) => {
        state.loadingAnnouncements = false;
      });


    builder
      .addCase(createUser.pending, (state) => {
        state.isCreatingUser = true;
        state.userError = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.isCreatingUser = false;
        state.users.push(action.payload);
        state.userError = null;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isCreatingUser = false;
        state.userError = action.payload || 'Failed to create user';
      });


    builder
      .addCase(updateUser.pending, (state) => {
        state.isUpdatingUser = true;
        state.userError = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isUpdatingUser = false;
        const index = state.users.findIndex(u => u._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        state.userError = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isUpdatingUser = false;
        state.userError = action.payload || 'Failed to update user';
      });


    builder
      .addCase(deleteUser.pending, (state) => {
        state.isDeletingUser = true;
        state.userError = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isDeletingUser = false;
        state.users = state.users.filter(u => u._id !== action.payload);
        state.userError = null;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isDeletingUser = false;
        state.userError = action.payload || 'Failed to delete user';
      });


    builder
      .addCase(createRole.pending, (state) => {
        state.isCreatingRole = true;
        state.roleError = null;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.isCreatingRole = false;
        state.roles.push(action.payload);
        state.roleError = null;
      })
      .addCase(createRole.rejected, (state, action) => {
        state.isCreatingRole = false;
        state.roleError = action.payload || 'Failed to create role';
      });


    builder
      .addCase(updateRole.pending, (state) => {
        state.isUpdatingRole = true;
        state.roleError = null;
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.isUpdatingRole = false;
        const index = state.roles.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.roles[index] = action.payload;
        }
        state.roleError = null;
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.isUpdatingRole = false;
        state.roleError = action.payload || 'Failed to update role';
      });


    builder
      .addCase(removePermissionFromRole.pending, (state) => {
        state.isRemovingPermission = true;
        state.roleError = null;
      })
      .addCase(removePermissionFromRole.fulfilled, (state, action) => {
        state.isRemovingPermission = false;
        const { roleId, updatedRole } = action.payload;
        const index = state.roles.findIndex(r => r._id === roleId);
        if (index !== -1) {
          state.roles[index] = updatedRole;
        }
        state.roleError = null;
      })
      .addCase(removePermissionFromRole.rejected, (state, action) => {
        state.isRemovingPermission = false;
        state.roleError = action.payload || 'Failed to remove permission';
      });


    builder
      .addCase(createBackup.pending, (state) => {
        state.isCreatingBackup = true;
        state.backupError = null;
      })
      .addCase(createBackup.fulfilled, (state, action) => {
        state.isCreatingBackup = false;
        state.backups.unshift(action.payload);
        state.backupError = null;
      })
      .addCase(createBackup.rejected, (state, action) => {
        state.isCreatingBackup = false;
        state.backupError = action.payload || 'Failed to create backup';
      });


    builder
      .addCase(restoreBackup.pending, (state) => {
        state.isRestoringBackup = true;
        state.backupError = null;
      })
      .addCase(restoreBackup.fulfilled, (state) => {
        state.isRestoringBackup = false;
        state.backupError = null;
      })
      .addCase(restoreBackup.rejected, (state, action) => {
        state.isRestoringBackup = false;
        state.backupError = action.payload || 'Failed to restore backup';
      });


    builder
      .addCase(clearCache.pending, (state) => {
        state.isClearingCache = true;
        state.error = null;
      })
      .addCase(clearCache.fulfilled, (state) => {
        state.isClearingCache = false;
        state.error = null;
      })
      .addCase(clearCache.rejected, (state, action) => {
        state.isClearingCache = false;
        state.error = action.payload || 'Failed to clear cache';
      });


    builder
      .addCase(createAnnouncement.pending, (state) => {
        state.isCreatingAnnouncement = true;
      })
      .addCase(createAnnouncement.fulfilled, (state, action) => {
        state.isCreatingAnnouncement = false;
        state.announcements.push(action.payload);
      })
      .addCase(createAnnouncement.rejected, (state) => {
        state.isCreatingAnnouncement = false;
      });


    builder
      .addCase(updateSystemSettings.pending, (state) => {
        state.isUpdatingSettings = true;
        state.settingsError = null;
      })
      .addCase(updateSystemSettings.fulfilled, (state, action) => {
        state.isUpdatingSettings = false;
        state.settings = action.payload || {};
        state.settingsError = null;
      })
      .addCase(updateSystemSettings.rejected, (state, action) => {
        state.isUpdatingSettings = false;
        state.settingsError = action.payload || 'Failed to update settings';
      });
  }
});

export const { clearError, clearUserError, clearRoleError } = adminSlice.actions;
export default adminSlice.reducer;
