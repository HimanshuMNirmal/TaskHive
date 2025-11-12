import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '../hooks/useTheme';
import styles from './AdminPage.module.css';
import pageStyles from './Pages.module.css';
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
} from '../features/admin/adminThunks';
import {
  clearError,
  clearUserError,
  clearRoleError
} from '../features/admin/adminSlice';

export default function AdminPage() {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  
  const {
    users,
    roles,
    systemStats,
    activityLogs,
    accessLogs,
    systemLogs,
    backups,
    settings,
    announcements,
    loadingUsers,
    loadingRoles,
    loadingStats,
    loadingLogs,
    loadingBackups,
    loadingSettings,
    loadingAnnouncements,
    isCreatingUser: reduxIsCreatingUser,
    isUpdatingUser: reduxIsUpdatingUser,
    isDeletingUser: reduxIsDeletingUser,
    isCreatingRole: reduxIsCreatingRole,
    isUpdatingRole: reduxIsUpdatingRole,
    isRemovingPermission: reduxIsRemovingPermission,
    isCreatingBackup: reduxIsCreatingBackup,
    isRestoringBackup: reduxIsRestoringBackup,
    isClearingCache: reduxIsClearingCache,
    isCreatingAnnouncement: reduxIsCreatingAnnouncement,
    isUpdatingSettings: reduxIsUpdatingSettings,
    userError,
    roleError,
    statsError,
    backupError,
    settingsError,
    error
  } = useSelector(state => state.admin);

  const currentUser = useSelector(state => state?.auth?.user);

  const [activeTab, setActiveTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [isCreatingAnnouncement, setIsCreatingAnnouncement] = useState(false);

  const formatDate = (value, fallback = '—') => {
    if (!value) return fallback;
    try {
      return new Date(value).toLocaleString();
    } catch {
      return fallback;
    }
  };

  const generateKey = (prefix, id, index = 0) => {
    return `${prefix}_${id || 'no-id'}_${index}_${Math.random().toString(36).substr(2, 9)}`;
  };

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  const loadTabData = (tab) => {
    switch (tab) {
      case 'users': {
        dispatch(fetchUsers());
        dispatch(fetchRoles());
        break;
      }
      case 'analytics': {
        dispatch(fetchSystemStats());
        dispatch(fetchActivityLogs());
        break;
      }
      case 'access': {
        dispatch(fetchAccessLogs());
        break;
      }
      case 'maintenance': {
        dispatch(fetchSystemLogs());
        dispatch(fetchBackups());
        break;
      }
      case 'settings': {
        dispatch(fetchSystemSettings());
        break;
      }
      case 'notifications': {
        dispatch(fetchAnnouncements());
        break;
      }
      default:
        break;
    }
  };

  const handleCreateUser = async (data) => {
    try {
      await dispatch(createUser(data)).unwrap();
      setIsCreatingUser(false);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleUpdateUser = async (userId, data) => {
    try {
      await dispatch(updateUser({ userId, data })).unwrap();
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await dispatch(deleteUser(userId)).unwrap();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleCreateRole = async (data) => {
    try {
      await dispatch(createRole(data)).unwrap();
      setIsCreatingRole(false);
    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  const handleUpdateRole = async (roleId, data) => {
    try {
      await dispatch(updateRole({ roleId, data })).unwrap();
      setSelectedRole(null);
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleUpdateSettings = async (updates) => {
    try {
      await dispatch(updateSystemSettings(updates)).unwrap();
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleCreateBackup = async () => {
    try {
      await dispatch(createBackup()).unwrap();
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  };

  const handleRestoreBackup = async (backupId) => {
    if (!window.confirm('Are you sure you want to restore this backup? This will overwrite current data.')) return;
    try {
      await dispatch(restoreBackup(backupId)).unwrap();
      dispatch(fetchBackups());
    } catch (error) {
      console.error('Error restoring backup:', error);
    }
  };

  const handleClearCache = async (type) => {
    try {
      await dispatch(clearCache(type)).unwrap();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const handleCreateAnnouncement = async (data) => {
    try {
      await dispatch(createAnnouncement(data)).unwrap();
      setIsCreatingAnnouncement(false);
    } catch (error) {
      console.error('Error creating announcement:', error);
    }
  };

  const handleRemovePermission = async (roleId, permissionId) => {
    if (!window.confirm('Are you sure you want to remove this permission from the role?')) return;
    try {
      await dispatch(removePermissionFromRole({ roleId, permissionId })).unwrap();
    } catch (error) {
      console.error('Error removing permission:', error);
    }
  };

  const isLoading = loadingUsers || loadingRoles || loadingStats || loadingLogs || loadingBackups || loadingSettings || loadingAnnouncements;

  if (isLoading && activeTab === 'users' && users.length === 0) {
    return <div className={styles.loading}>Loading admin panel...</div>;
  }

  return (
    <div className={pageStyles["page-container"]}>
      <div className={styles["admin-header"]}>
        <h1>Admin Panel</h1>
      </div>

      <div className={styles["admin-content"]}>
        <div className={styles["admin-sidebar"]}>
          <nav className={styles["admin-nav"]}>
            <button
              className={`${styles["nav-item"]} ${activeTab === 'users' ? styles.active : ''}`}
              onClick={() => setActiveTab('users')}
              disabled={isLoading}
            >
              Users & Roles
            </button>
            <button
              className={`${styles["nav-item"]} ${activeTab === 'analytics' ? styles.active : ''}`}
              onClick={() => setActiveTab('analytics')}
              disabled={isLoading}
            >
              Analytics
            </button>
            {/* <button
              className={`${styles["nav-item"]} ${activeTab === 'access' ? styles.active : ''}`}
              onClick={() => setActiveTab('access')}
            >
              Access Control
            </button>
            <button
              className={`${styles["nav-item"]} ${activeTab === 'maintenance' ? styles.active : ''}`}
              onClick={() => setActiveTab('maintenance')}
            >
              Maintenance
            </button>
            <button
              className={`${styles["nav-item"]} ${activeTab === 'settings' ? styles.active : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
            <button
              className={`${styles["nav-item"]} ${activeTab === 'notifications' ? styles.active : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              Notifications
            </button> */}
          </nav>
        </div>

        <div className={styles["admin-main"]}>
          {activeTab === 'users' && (
            <div className={styles["section-content"]}>
              <div className={styles["section-header"]}>
                <h2>User Management</h2>
                <button onClick={() => setIsCreatingUser(true)} disabled={reduxIsCreatingUser}>
                  {reduxIsCreatingUser ? 'Creating User...' : 'Create User'}
                </button>
              </div>

              <div className={styles["users-grid"]}>
                {(users ?? []).map((user, index) => (
                  <div key={user?._id || generateKey('user', null, index)} className={styles["user-card"]}>
                    <div className={styles["user-info"]}>
                      <h3>{user?.name ?? 'Unnamed user'}</h3>
                      <p>{user?.email ?? '—'}</p>
                      <div className={styles["user-roles"]}>
                        {(user?.roles ?? []).map((role, roleIndex) => {
                          const roleId = role?._id || role?.name || generateKey('role', null, roleIndex);
                          return (
                            <span key={roleId} className={styles["role-badge"]}>
                              {role?.name ?? role ?? 'role'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    {/* <div className={styles["user-actions"]}>
                      <button onClick={() => setSelectedUser(user)}>Edit</button>
                      <button
                        className={styles.danger}
                        onClick={() => user?._id && handleDeleteUser(user._id)}
                        disabled={!user?._id}
                        title={!user?._id ? 'Cannot delete: missing id' : 'Delete user'}
                      >
                        Delete
                      </button>
                    </div> */}
                  </div>
                ))}
              </div>

              <div className={styles["section-header"]}>
                <h2>Role Management</h2>
                {/* <button onClick={() => setIsCreatingRole(true)}>
                  Create Role
                </button> */}
              </div>

              <div className={styles["roles-grid"]}>
                {(roles ?? []).map((role, index) => {
                  const roleId = role?._id || role?.name || generateKey('role', null, index);
                  return (
                    <div key={roleId} className={styles["role-card"]}>
                      <div className={styles["role-info"]}>
                        <h3>{role?.name ?? 'Unnamed role'}</h3>
                        <p>{role?.description ?? ''}</p>
                        <div className={styles["permissions-list"]}>
                          {(role?.permissions ?? []).map((permission, permIndex) => {
                            const permissionId = permission?._id || permission || generateKey('perm', null, permIndex);
                            const permissionName = typeof permission === 'object'
                              ? permission?.name ?? 'Unknown Permission'
                              : String(permission);

                            return (
                              <div key={permissionId} className={styles["permission-item"]}>
                                <span className={styles["permission-badge"]}>
                                  {permissionName}
                                </span>
                                <button
                                  className={styles["remove-permission"]}
                                  onClick={() => handleRemovePermission(role._id, permissionId)}
                                  disabled={reduxIsRemovingPermission}
                                  title={`${reduxIsRemovingPermission ? 'Removing...' : 'Remove'} ${permissionName} permission`}
                                >
                                  {reduxIsRemovingPermission ? '⏳' : '×'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* <div className={styles["role-actions"]}>
                        <button onClick={() => setSelectedRole(role)}>Edit</button>
                      </div> */}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {activeTab === 'analytics' && (
            <div className={styles["section-content"]}>
              <h2>System Analytics</h2>
              {systemStats ? (
                <div className={styles["stats-grid"]}>
                  <div className={styles["stat-card"]}>
                    <h3>Users</h3>
                    <div className={styles["stat-value"]}>{systemStats?.totalUsers ?? 0}</div>
                  </div>
                  <div className={styles["stat-card"]}>
                    <h3>Activity Breakdown</h3>
                    <div className={styles["activity-chart"]}>
                      {systemStats?.activityBreakdown
                        ? Object.entries(systemStats.activityBreakdown).map(([type, countData]) => {
                          const count = typeof countData === 'object' ? countData?.count ?? 0 : countData ?? 0;
                          const countNum = Number(count) || 0;
                          return (
                            <div key={type} className={styles["chart-bar"]}>
                              <div className={styles["bar-label"]}>{type}</div>
                              <div
                                className={styles["bar"]}
                                style={{
                                  width: `${systemStats.totalUsers ? (countNum / systemStats.totalUsers) * 100 : 0}%`
                                }}
                              >
                                {countNum}
                              </div>
                            </div>
                          );
                        })
                        : <div>No activity data</div>}
                    </div>
                  </div>
                </div>
              ) : (
                <div>No system stats available</div>
              )}

              <h3>Recent Activity</h3>
              <div className={styles["activity-logs"]}>
                {(activityLogs ?? []).map((log, index) => {
                  const logId = log?._id || generateKey('log', null, index);
                  return (
                    <div key={logId} className={styles["log-item"]}>
                      <span className={styles["log-time"]}>
                        {formatDate(log?.createdAt)}
                      </span>
                      <span className={styles["log-user"]}>
                        {typeof log?.userId === 'object'
                          ? log?.userId?.name ?? 'Unknown'
                          : String(log?.userId ?? 'Unknown')}
                      </span>
                      <span className={styles["log-action"]}>{log?.action ?? '—'}</span>
                      <span className={styles["log-details"]}>
                        {typeof log?.details === 'object'
                          ? JSON.stringify(log?.details ?? {})
                          : String(log?.details ?? '')}
                      </span>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* {activeTab === 'access' && (
            <div className={styles["section-content"]}>
              <h2>Access Logs</h2>
              <div className={styles["access-logs"]}>
                {(accessLogs ?? []).map(log => (
                  <div key={log?._id ?? Math.random()} className={styles["log-item"]}>
                    <span className={styles["log-time"]}>
                      {formatDate(log?.timestamp)}
                    </span>
                    <span className={styles["log-user"]}>{log?.user ?? 'Unknown'}</span>
                    <span className={styles["log-ip"]}>{log?.ip ?? '—'}</span>
                    <span className={styles["log-action"]}>{log?.action ?? '—'}</span>
                    <span className={`${styles["log-status"]} ${styles[log?.status ?? 'unknown']}`}>
                      {log?.status ?? 'Unknown'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )} */}

          {/* {activeTab === 'maintenance' && (
            <div className={styles["section-content"]}>
              <div className={styles["section-header"]}>
                <h2>System Maintenance</h2>
                <div className={styles["maintenance-actions"]}>
                  <button onClick={handleCreateBackup}>Create Backup</button>
                  <button onClick={() => handleClearCache('all')}>
                    Clear Cache
                  </button>
                </div>
              </div>

              <h3>System Logs</h3>
              <div className={styles["system-logs"]}>
                {(systemLogs ?? []).map(log => (
                  <div key={log?._id ?? Math.random()} className={styles["log-item"]}>
                    <span className={`${styles["log-level"]} ${styles[log?.level ?? 'info']}`}>
                      {log?.level ?? 'info'}
                    </span>
                    <span className={styles["log-time"]}>
                      {formatDate(log?.timestamp)}
                    </span>
                    <span className={styles["log-message"]}>{log?.message ?? ''}</span>
                  </div>
                ))}
              </div>

              <h3>Backups</h3>
              <div className={styles["backups-list"]}>
                {(backups ?? []).map(backup => (
                  <div key={backup?._id ?? Math.random()} className={styles["backup-item"]}>
                    <div className={styles["backup-info"]}>
                      <span className={styles["backup-time"]}>
                        {formatDate(backup?.createdAt)}
                      </span>
                      <span className={styles["backup-size"]}>{backup?.size ?? '—'}</span>
                    </div>
                    <div className={styles["backup-actions"]}>
                      <button
                        onClick={() => backup?._id && handleRestoreBackup(backup._id)}
                        disabled={!backup?._id}
                      >
                        Restore
                      </button>
                      {backup?.downloadUrl ? (
                        <a
                          href={backup.downloadUrl}
                          className={styles["download-link"]}
                          download
                        >
                          Download
                        </a>
                      ) : (
                        <span>No download</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )} */}

          {/* {activeTab === 'settings' && (
            <div className={styles["section-content"]}>
              <h2>System Settings</h2>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const updates = Object.fromEntries(formData.entries());
                  handleUpdateSettings(updates);
                }}
                className={styles["settings-form"]}
              >
                <div className={styles["settings-group"]}>
                  <h3>Email Settings</h3>
                  <div className={styles["setting-item"]}>
                    <label>SMTP Host</label>
                    <input
                      name="smtp_host"
                      defaultValue={settings?.smtp_host ?? ''}
                    />
                  </div>
                  <div className={styles["setting-item"]}>
                    <label>SMTP Port</label>
                    <input
                      name="smtp_port"
                      type="number"
                      defaultValue={settings?.smtp_port ?? ''}
                    />
                  </div>
                  <div className={styles["setting-item"]}>
                    <label>SMTP User</label>
                    <input
                      name="smtp_user"
                      defaultValue={settings?.smtp_user ?? ''}
                    />
                  </div>
                  <div className={styles["setting-item"]}>
                    <label>SMTP Password</label>
                    <input
                      name="smtp_password"
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className={styles["settings-group"]}>
                  <h3>Security Settings</h3>
                  <div className={styles["setting-item"]}>
                    <label>Session Timeout (minutes)</label>
                    <input
                      name="session_timeout"
                      type="number"
                      defaultValue={settings?.session_timeout ?? ''}
                    />
                  </div>
                  <div className={styles["setting-item"]}>
                    <label>
                      <input
                        type="checkbox"
                        name="force_2fa"
                        defaultChecked={Boolean(settings?.force_2fa)}
                      />
                      Require 2FA for all users
                    </label>
                  </div>
                  <div className={styles["setting-item"]}>
                    <label>Password Policy</label>
                    <select
                      name="password_policy"
                      defaultValue={settings?.password_policy ?? 'standard'}
                    >
                      <option value="standard">Standard</option>
                      <option value="strict">Strict</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>

                <div className={styles["settings-actions"]}>
                  <button type="submit">Save Settings</button>
                  <button type="reset">Reset</button>
                </div>
              </form>
            </div>
          )} */}

          {/* {activeTab === 'notifications' && (
            <div className={styles["section-content"]}>
              <div className={styles["section-header"]}>
                <h2>System Announcements</h2>
                <button onClick={() => setIsCreatingAnnouncement(true)}>
                  Create Announcement
                </button>
              </div>

              <div className={styles["announcements-list"]}>
                {(announcements ?? []).map(announcement => (
                  <div key={announcement?._id ?? Math.random()} className={styles["announcement-item"]}>
                    <div className={styles["announcement-header"]}>
                      <h3>{announcement?.title ?? 'Untitled'}</h3>
                      <span className={styles["announcement-date"]}>
                        {formatDate(announcement?.createdAt)}
                      </span>
                    </div>
                    <p className={styles["announcement-message"]}>
                      {announcement?.message ?? ''}
                    </p>
                    <div className={styles["announcement-meta"]}>
                      <span className={styles["announcement-type"]}>
                        {announcement?.type ?? 'info'}
                      </span>
                      <span className={styles["announcement-status"]}>
                        {announcement?.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )} */}
        </div>
      </div>

      {isCreatingUser && (
        <div className={styles["modal"]}>
          <div className={styles["modal-content"]}>
            <h2>Create User</h2>
            {userError && <div className={styles["error-message"]}>{userError}</div>}
            <form
              onSubmit={e => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const selectedRole = formData.get('role');

                handleCreateUser({
                  name: formData.get('name'),
                  email: formData.get('email'),
                  password: formData.get('password'),
                  role: selectedRole
                });
              }}
            >
              <input
                name="name"
                placeholder="Full name"
                required
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                required
              />
              <input
                name="password"
                type="password"
                placeholder="Password"
                required
              />
              <div className={styles["roles-select"]}>
                <label>Role</label>
                {(roles ?? []).map(role => (
                  <label key={role?._id ?? role?.name}>
                    <input
                      type="radio"
                      name="role"
                      value={role?._id ?? role?.name}
                      require
                    />
                    {role?.name ?? 'role'}
                  </label>
                ))}
              </div>
              <div className={styles["modal-actions"]}>
                <button type="submit" disabled={reduxIsCreatingUser}>
                  {reduxIsCreatingUser ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingUser(false)}
                  disabled={reduxIsCreatingUser}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreatingRole && (
        <div className={styles["modal"]}>
          <div className={styles["modal-content"]}>
            <h2>Create Role</h2>
            {roleError && <div className={styles["error-message"]}>{roleError}</div>}
            <form
              onSubmit={e => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleCreateRole({
                  name: formData.get('name'),
                  description: formData.get('description'),
                  permissions: Array.from(formData.getAll('permissions'))
                });
              }}
            >
              <input
                name="name"
                placeholder="Role name"
                required
              />
              <textarea
                name="description"
                placeholder="Role description"
              />
              <div className={styles["permissions-select"]}>
                <label>Permissions</label>
              </div>
              <div className={styles["modal-actions"]}>
                <button type="submit" disabled={reduxIsCreatingRole}>
                  {reduxIsCreatingRole ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingRole(false)}
                  disabled={reduxIsCreatingRole}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreatingAnnouncement && (
        <div className={styles["modal"]}>
          <div className={styles["modal-content"]}>
            <h2>Create Announcement</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleCreateAnnouncement({
                  title: formData.get('title'),
                  message: formData.get('message'),
                  type: formData.get('type'),
                  active: formData.get('active') === 'on'
                });
              }}
            >
              <input
                name="title"
                placeholder="Announcement title"
                required
              />
              <textarea
                name="message"
                placeholder="Announcement message"
                required
              />
              <select name="type" required>
                <option value="info">Information</option>
                <option value="warning">Warning</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <label>
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked
                />
                Make announcement active
              </label>
              <div className={styles["modal-actions"]}>
                <button type="submit" disabled={reduxIsCreatingAnnouncement}>
                  {reduxIsCreatingAnnouncement ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingAnnouncement(false)}
                  disabled={reduxIsCreatingAnnouncement}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
