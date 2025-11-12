import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '../hooks/useTheme';
import PermissionGuard from '../components/PermissionGuard';
import styles from "./HomePage.module.css";
import { fetchHomeData } from '../features/home/homeThunks';
export default function HomePage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    user,
    tasks,
    teams,
    activities,
    loading,
    isInitialLoad,
  } = useSelector(state => state.home);

  useEffect(() => {
    let isMounted = true;

    const loadHomeData = async (isInitial = false) => {
      if (!isMounted) return;
      try {
        await dispatch(fetchHomeData({ isInitial })).unwrap();
      } catch (err) {
        console.error('Error loading home data:', err);
      }
    };

    if (isInitialLoad) {
      loadHomeData(true);
    }

    const pollInterval = setInterval(() => {
      if (typeof window !== 'undefined' && isMounted) {
        loadHomeData(false);
      }
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [dispatch, isInitialLoad]);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles["page-container"]}>
      <div className={styles["welcome-section"]}>
        <h1>Welcome back, {user?.name ?? 'User'}</h1>
        <div className={styles["quick-actions"]}>
          <PermissionGuard require="task:create">
            <Link to="/tasks/new" className={styles["action-button"]}>Create New Task</Link>
          </PermissionGuard>

          <PermissionGuard require="team:create">
            <Link to="/teams/new" className={styles["action-button"]}>Create Team</Link>
          </PermissionGuard>

          {/* <PermissionGuard require="notification:read">
            <Link to="/notifications" className={styles["action-button"]}>
              View Notifications
              {(notifications?.length ?? 0) > 0 && (
                <span className={styles["notification-badge"]}>{notifications.length}</span>
              )}
            </Link>
          </PermissionGuard> */}
        </div>
      </div>

      <div className={styles["dashboard-grid"]}>
        <PermissionGuard require="task:read">
          <section className={`${styles["dashboard-card"]} ${styles["tasks-overview"]}`}>
            <h2>Your Tasks</h2>
            <div className={styles.stats}>
              <div className={styles["stat-item"]}>
                <span className={styles["stat-value"]}>{tasks?.total ?? 0}</span>
                <span className={styles["stat-label"]}>Total Tasks</span>
              </div>
              <div className={styles["stat-item"]}>
                <span className={styles["stat-value"]}>
                  {Array.isArray(tasks?.dueSoon) ? tasks.dueSoon.length : 0}
                </span>
                <span className={styles["stat-label"]}>Due Soon</span>
              </div>
            </div>
            <div className={styles["task-list"]}>
              {Array.isArray(tasks?.dueSoon) && tasks.dueSoon.length > 0 ? (
                tasks.dueSoon.map(task => (
                  <div
                    key={task._id}
                    className={styles["task-item"]}
                    onClick={() => navigate(`/tasks?selectedTask=${task._id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        navigate(`/tasks?selectedTask=${task._id}`);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles["task-info"]}>
                      <span className={styles["task-title"]}>{task.title}</span>
                      <div className={styles["task-meta"]}>
                        <span className={`${styles["task-priority"]} ${styles[task.priority]}`}>{task.priority}</span>
                        <span className={`${styles["task-status"]} ${styles[task.status]}`}>{task.status}</span>
                        {task.assignee && <span className={styles["task-assignee"]}>👤 {task.assignee}</span>}
                        {task.team && <span className={styles["task-team"]}>👥 {task.team}</span>}
                      </div>
                    </div>
                    <span className={styles["task-due"]}>
                      Due: {formatDateString(task.dueDate)}
                    </span>
                  </div>
                ))
              ) : (
                <div className={styles["empty-state"]}>No tasks due soon</div>
              )}
            </div>
          </section>
        </PermissionGuard>

        <PermissionGuard require="team:read">
          <section className={`${styles["dashboard-card"]} ${styles["teams-overview"]}`}>
            <h2>Your Teams</h2>
            <div className={styles["team-list"]}>
              {Array.isArray(teams) && teams.length > 0 ? (
                teams.map(team => (
                  <div
                    key={team._id}
                    className={styles["team-item"]}
                    onClick={() => navigate(`/teams?selectedTeam=${team._id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        navigate(`/teams?selectedTeam=${team._id}`);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className={styles["team-name"]}>{team.name}</span>
                    <span className={styles["team-member-count"]}>{team.members?.length || 0} members</span>
                    {team.settings?.isPrivate && <span className={styles["team-private"]}>🔒</span>}
                  </div>
                ))
              ) : (
                <div className={styles["empty-state"]}>No teams found</div>
              )}
            </div>
          </section>
        </PermissionGuard>

        <PermissionGuard require="activityLog:read">
          <section className={`${styles["dashboard-card"]} ${styles["activity-feed"]}`}>
            <h2>Recent Activity</h2>
            <div className={styles["activity-list"]}>
              {Array.isArray(activities) && activities.length > 0 ? (
                activities.map(activity => (
                  <div key={activity._id} className={styles["activity-item"]}>
                    <span className={styles["activity-icon"]}>{getActivityIcon(activity?.action)}</span>
                    <div className={styles["activity-details"]}>
                      <p className={styles["activity-message"]}>
                        {formatActivityMessage(activity)}
                      </p>
                      <span className={styles["activity-time"]}>
                        {formatDateTimeString(activity?.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles["empty-state"]}>No recent activities</div>
              )}
            </div>
          </section>
        </PermissionGuard>

        {/* <PermissionGuard require="notification:read">
          <section className={`${styles["dashboard-card"]} ${styles["notifications-panel"]}`}>
            <h2>Notifications</h2>
            <div className={styles["notification-list"]}>
              {Array.isArray(notifications) && notifications.length > 0 ? (
                notifications.map(notification => (
                  <div key={notification._id} className={styles["notification-item"]}>
                    <p className={styles["notification-message"]}>{notification?.message ?? ''}</p>
                    <span className={styles["notification-time"]}>
                      {formatDateTimeString(notification?.createdAt)}
                    </span>
                  </div>
                ))
              ) : (
                <div className={styles["empty-state"]}>No new notifications</div>
              )}
            </div>
          </section>
        </PermissionGuard> */}
      </div>
    </div>
  );
}

function getActivityIcon(action) {
  const act = action ?? 'unknown';
  switch (act) {
    case 'created':
      return '📝';
    case 'updated':
      return '✏️';
    case 'status_changed':
      return '🔄';
    case 'deleted':
      return '🗑️';
    case 'assigned':
      return '👤';
    case 'commented':
      return '💬';
    default:
      return '📌';
  }
}

function formatActivityMessage(activity) {
  if (!activity) return 'Activity';
  const entityType = activity.entityType ?? 'item';
  const action = activity.action ?? 'performed';
  const details = activity.details ?? {};
  const userName = activity.userId?.name;

  const userText = userName ? `${userName} ` : 'Someone ';

  switch (action) {
    case 'created':
      return `${userText}created a new ${entityType}`;
    case 'updated':
      return `${userText}updated ${entityType} ${details?.field ? `(${details.field})` : ''}`;
    case 'status_changed':
      return `${userText}changed ${entityType} status from ${details?.oldValue ?? 'unknown'} to ${details?.newValue ?? 'unknown'}`;
    case 'assigned':
      return `${userText}assigned ${entityType}${details?.assignee ? ` to ${details.assignee}` : ''}`;
    case 'commented':
      return `${userText}commented on ${entityType}`;
    case 'deleted':
      return `${userText}deleted ${entityType}`;
    default:
      return `${userText}${action} ${entityType}`;
  }
}

function formatDateString(dateStr) {
  try {
    if (!dateStr) return 'No due date';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return 'Invalid date';
    return d.toLocaleDateString();
  } catch {
    return 'Invalid date';
  }
}

function formatDateTimeString(dateStr) {
  try {
    if (!dateStr) return 'Unknown time';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return 'Unknown time';
    return d.toLocaleString();
  } catch {
    return 'Unknown time';
  }
}