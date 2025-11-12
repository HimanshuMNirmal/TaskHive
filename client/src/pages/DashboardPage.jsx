import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { usePermission } from '../hooks/usePermission';
import PermissionGuard from '../components/PermissionGuard';
import styles from './DashboardPage.module.css';
import pageStyles from './Pages.module.css';
import {
  fetchDashboardTasks,
  fetchDashboardTeams,
  fetchDashboardActivities,
  calculateDashboardAnalytics
} from '../features/dashboard/dashboardThunks';
import {
  clearTasksError,
  clearTeamsError,
  clearActivitiesError,
  clearAnalyticsError
} from '../features/dashboard/dashboardSlice';

export default function DashboardPage() {
  const { theme } = useTheme();
  const { can, canAny, isAdmin, isManager } = usePermission();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const {
    tasks,
    teamMembers,
    activities,
    analytics,
    loadingTasks,
    loadingTeams,
    loadingActivities,
    loadingAnalytics,
    tasksError,
    teamsError,
    activitiesError,
    analyticsError,
    isLoading
  } = useSelector(state => state.dashboard);

  const user = useSelector(state => state.auth.user);

  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignee: '',
    dueDate: '',
    search: ''
  });

  useEffect(() => {
    loadDashboardData();
    const pollInterval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(pollInterval);
  }, [filters]);

  const loadDashboardData = async () => {
    try {
      if (can('task:read')) {
        const tasksAction = await dispatch(fetchDashboardTasks(filters));
        if (tasksAction.payload?.items) {
          dispatch(calculateDashboardAnalytics(tasksAction.payload.items));
        }
      }

      if (can('team:read')) {
        dispatch(fetchDashboardTeams());
      }

      if (can('activityLog:read')) {
        dispatch(fetchDashboardActivities());
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filterTasks = (status) => {
    return (tasks?.items || []).filter(task => task?.status === status);
  };

  const isDataLoading = loadingTasks || loadingTeams || loadingActivities || loadingAnalytics;

  if (isDataLoading && tasks.items.length === 0) {
    return <div className={styles.loading}>Loading dashboard...</div>;
  }

  if (!canAny('task:read', 'team:read', 'activityLog:read', 'notification:read')) {
    return (
      <div className={pageStyles["page-container"]}>
        <div className={styles["dashboard-header"]}>
          <h1>Dashboard</h1>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
          <p>You don't have permission to access the dashboard.</p>
          <p>Please contact your administrator for access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={pageStyles["page-container"]}>
      <div className={styles["dashboard-header"]}>
        <h1>Dashboard</h1>
        <PermissionGuard require="task:read">
          <div className={styles["filter-section"]}>
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              className={styles["search-input"]}
            />
            <select
              value={filters.priority}
              onChange={e => handleFilterChange('priority', e.target.value)}
              className={styles["filter-select"]}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
              <select
                value={filters.assignee}
                onChange={e => handleFilterChange('assignee', e.target.value)}
                className={styles["filter-select"]}
              >
                <option value="">All Assignees</option>
                {teamMembers.map(member => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            <input
              type="date"
              value={filters.dueDate}
              onChange={e => handleFilterChange('dueDate', e.target.value)}
              className={styles["date-input"]}
            />
          </div>
        </PermissionGuard>
      </div>

      <div className={styles["dashboard-grid"]}>
        <PermissionGuard require="task:read">
          <div className={styles["kanban-board"]}>
            {['todo', 'inprogress', 'review', 'done'].map(status => (
              <div key={status} className={styles["kanban-column"]}>
                <h3 className={styles["column-header"]}>{status.toUpperCase()}</h3>
                <div className={styles["task-list"]}>
                  {filterTasks(status).map(task => (
                    <div
                      key={task?._id}
                      className={styles["task-card"]}
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
                      <div className={styles["task-header"]}>
                        <span className={`${styles["priority-badge"]} ${styles[task?.priority] || ''}`}>
                          {task?.priority || 'medium'}
                        </span>
                        <span className={styles["due-date"]}>
                          {task?.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                        </span>
                      </div>
                      <h4 className={styles["task-title"]}>{task?.title || 'Untitled'}</h4>
                      <p className={styles["task-description"]}>{task?.description || ''}</p>
                      <div className={styles["task-footer"]}>
                        <span className={styles.assignee}>
                          {(() => {
                            const assigneeId = task?.assigneeId?._id ?? task?.assigneeId;
                            return teamMembers?.find(m => String(m?._id) === String(assigneeId))?.name ?? 'Unassigned';
                          })()}
                        </span>
                        <span className={styles["task-meta"]}>
                          {task?.comments?.length || 0} 💬
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PermissionGuard>

        <div className={styles["dashboard-sidebar"]}>
          <PermissionGuard require="task:read">
            <section className={styles["analytics-section"]}>
              <h3>Analytics</h3>
              <div className={styles["analytics-grid"]}>
                <div className={styles["analytics-card"]}>
                  <h4>Task Completion</h4>
                  <div className={styles["completion-rate"]}>
                    {analytics.completion.rate.toFixed(1)}%
                  </div>
                  <div className={styles["completion-details"]}>
                    {analytics.completion.completed} / {analytics.completion.total} tasks
                  </div>
                </div>
                <div className={styles["analytics-card"]}>
                  <h4>Deadlines</h4>
                  <div className={styles["deadline-stats"]}>
                    <div className={`${styles["stat-item"]} ${styles.success}`}>
                      {analytics.deadlines.met} Met
                    </div>
                    <div className={`${styles["stat-item"]} ${styles.danger}`}>
                      {analytics.deadlines.missed} Missed
                    </div>
                    <div className={`${styles["stat-item"]} ${styles.warning}`}>
                      {analytics.deadlines.upcoming} Upcoming
                    </div>
                  </div>
                </div>
                <div className={styles["analytics-card"]}>
                  <h4>Task Priorities</h4>
                  <div className={styles["priority-stats"]}>
                    {Object.entries(analytics.priorities).map(([priority, count]) => (
                      <div key={priority} className={`${styles["priority-bar"]} ${styles[priority]}`}>
                        <span className={styles["priority-label"]}>{priority}</span>
                        <span className={styles["priority-count"]}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </PermissionGuard>

          <PermissionGuard require="team:read">
            <section className={styles["team-section"]}>
              <h3>Team Members</h3>
              <div className={styles["team-list"]}>
                {(teamMembers || []).map(member => (
                  <div key={member._id} className={styles["team-member"]}>
                    <span className={`${styles["status-indicator"]} ${styles[member?.status || 'offline']}`} />
                    <span className={styles["member-name"]}>{member?.name || 'Unknown'}</span>
                    <span className={styles["member-role"]}>{member?.role || 'member'}</span>
                  </div>
                ))}
              </div>
            </section>
          </PermissionGuard>

          <PermissionGuard require="activityLog:read">
            <section className={styles["activity-section"]}>
              <h3>Recent Activities</h3>
              <div className={styles["activity-list"]}>
                {(activities || []).map(activity => (
                  <div key={activity?._id} className={styles["activity-item"]}>
                    <div className={styles["activity-header"]}>
                      <span className={`${styles["activity-type"]} ${styles[activity?.entityType] || ''}`}>
                        {activity?.entityType || 'unknown'}
                      </span>
                      <span className={styles["activity-time"]}>
                        {activity?.createdAt ? new Date(activity.createdAt).toLocaleString() : 'Unknown time'}
                      </span>
                    </div>
                    <p className={styles["activity-message"]}>
                      {activity?.action || 'Unknown action'}: {activity?.details?.field || ''}
                      {activity?.details?.oldValue && activity?.details?.newValue &&
                        ` from ${activity.details.oldValue} to ${activity.details.newValue}`
                      }
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </PermissionGuard>
        </div>
      </div>
    </div>
  );
}