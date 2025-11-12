import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { usePermission } from '../hooks/usePermission';
import PermissionGuard from '../components/PermissionGuard';
import styles from './TasksPage.module.css';
import pageStyles from './Pages.module.css';
import {
  fetchTasks,
  fetchTeamsForTasks,
  fetchTaskDetails,
  fetchTaskComments,
  fetchTaskActivities,
  createTask,
  updateTask,
  deleteTask,
  addTaskComment,
  addTaskAttachment,
  bulkUpdateTasks
} from '../features/tasks/tasksThunks';
import {
  setFilters,
  setSort,
  setGroupBy,
  setSelectedTasks,
} from '../features/tasks/tasksSlice';

export default function TasksPage() {
  const { theme } = useTheme();
  const { can, canAny } = usePermission();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const {
    tasks,
    teams,
    currentTask,
    comments,
    taskActivities,
    selectedTasks,
    filters,
    sort,
    groupBy,
    loadingTasks,
    loadingTeams,
    loadingTaskDetails,
    loadingComments,
    loadingActivities,
    isCreatingTask,
    isUpdatingTask,
    isDeletingTask,
    isAddingComment,
    isUploadingFile,
    isBulkUpdating,
    error,
    tasksError,
    teamsError,
    taskDetailsError,
    commentsError,
    activitiesError,
    isLoading
  } = useSelector(state => state.tasks);

  const user = useSelector(state => state?.auth?.user ?? null);

  const [isCreating, setIsCreating] = useState(false);
  const [selectedTeamForForm, setSelectedTeamForForm] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);

  const formatDate = (value, fallback = '—') => {
    if (!value) return fallback;
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return fallback;
      return d.toLocaleString();
    } catch {
      return fallback;
    }
  };

  useEffect(() => {
    loadTasksData();
  }, [filters, sort, groupBy]);

  useEffect(() => {
    const selectedTaskId = searchParams.get('selectedTask');
    if (selectedTaskId && tasks.length > 0) {
      const task = tasks.find(t => t?._id === selectedTaskId);
      if (task) {
        dispatch(fetchTaskDetails(selectedTaskId));
        dispatch(fetchTaskComments(selectedTaskId));
        dispatch(fetchTaskActivities(selectedTaskId));
      }
    }
  }, [searchParams, tasks.length]);

  const loadTasksData = async () => {
    try {
      if (can('task:read')) {
        dispatch(fetchTasks({
          filters,
          sort: sort.field,
          order: sort.order
        }));
      }

      if (can('team:read')) {
        dispatch(fetchTeamsForTasks());
      }
    } catch (err) {
      console.error('Error loading tasks data:', err);
    }
  };

  const fetchTeamMembers = async (teamId) => {
    if (!teamId) {
      setTeamMembers([]);
      return;
    }
    try {
      const team = teams.find(t => t?._id === teamId);
      const members = team?.members || [];
      setTeamMembers(members);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      await dispatch(createTask(taskData)).unwrap();
      setIsCreating(false);
      setSelectedTeamForForm('');
      setTeamMembers([]);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      await dispatch(updateTask({ taskId, updates })).unwrap();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!taskId) return;
    try {
      await dispatch(deleteTask(taskId)).unwrap();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleAddComment = async (taskId, comment) => {
    if (!taskId || !comment) return;
    try {
      await dispatch(addTaskComment({ taskId, comment })).unwrap();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleFileUpload = async (taskId, files) => {
    if (!taskId || !files || files.length === 0) return;
    try {
      const uploadPromises = Array.from(files).map(file => {
        const formData = new FormData();
        formData.append('file', file);
        return dispatch(addTaskAttachment({ taskId, formData })).unwrap();
      });
      await Promise.all(uploadPromises);
      dispatch(fetchTaskDetails(taskId));
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  const handleBulkUpdate = async (updates) => {
    if (!updates || (selectedTasks?.length ?? 0) === 0) return;
    try {
      await dispatch(bulkUpdateTasks({
        taskIds: selectedTasks,
        updates
      })).unwrap();
      await loadTasksData();
      dispatch(setSelectedTasks([]));
    } catch (error) {
      console.error('Error performing bulk update:', error);
    }
  };

  const groupTasks = (tasksList) => {
    const list = Array.isArray(tasksList) ? tasksList : [];
    if (groupBy === 'none') return { 'All Tasks': list };

    return list.reduce((groups, task) => {
      if (!task || typeof task !== 'object') return groups;
      let key;
      if (groupBy === 'team') {
        const teamName = teams?.find(t => t?._id === task?.teamId)?.name;
        key = teamName || 'No Team';
      } else {
        const val = task[groupBy];
        key = (val === undefined || val === null || val === '') ? 'None' : String(val);
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
      return groups;
    }, {});
  };

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
  };

  const handleSort = (field) => {
    dispatch(setSort({
      field,
      order: sort.field === field && sort.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'var(--text-secondary)';
      case 'inprogress': return 'var(--info)';
      case 'review': return 'var(--warning)';
      case 'done': return 'var(--success)';
      default: return 'var(--text-secondary)';
    }
  };

  const sortTasksList = (tasksList) => {
    if (!Array.isArray(tasksList)) return [];
    const sorted = [...tasksList];
    
    sorted.sort((a, b) => {
      let aValue = a?.[sort.field];
      let bValue = b?.[sort.field];
      
      if (sort.field === 'dueDate' || sort.field === 'startDate') {
        aValue = aValue ? new Date(aValue).getTime() : Infinity;
        bValue = bValue ? new Date(bValue).getTime() : Infinity;
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue || '').toString().toLowerCase();
      }
      
      if (aValue < bValue) return sort.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.order === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  };

  if (loadingTasks && tasks.length === 0) {
    return <div className={styles.loading}>Loading tasks...</div>;
  }

  if (!can('task:read')) {
    return (
      <div className={pageStyles["page-container"]}>
        <div className={styles["tasks-header"]}>
          <h1>Tasks</h1>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
          <p>You don't have permission to view tasks.</p>
          <p>Please contact your administrator for access.</p>
        </div>
      </div>
    );
  }

  const groupedTasks = groupTasks(tasks ?? []);

  return (
    <div className={pageStyles["page-container"]}>
      <div className={styles["tasks-header"]}>
        <div className={styles["header-main"]}>
          <h1>Tasks</h1>
          <PermissionGuard require="task:create">
            <button
              className={styles["create-task-btn"]}
              onClick={() => setIsCreating(true)}
              disabled={isCreatingTask}
            >
              Create Task
            </button>
          </PermissionGuard>
        </div>

        <div className={styles["filters-bar"]}>
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters?.search ?? ''}
            onChange={e => handleFilterChange('search', e.target.value)}
            className={styles["search-input"]}
          />
          <select
            value={filters?.status ?? ''}
            onChange={e => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="todo">Todo</option>
            <option value="inprogress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          <select
            value={filters?.priority ?? ''}
            onChange={e => handleFilterChange('priority', e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select
            value={filters?.team ?? ''}
            onChange={e => handleFilterChange('team', e.target.value)}
          >
            <option value="">All Teams</option>
            {Array.isArray(teams) && teams.map(team => (
              <option key={team?._id ?? `team-${Math.random()}`} value={team?._id ?? ''}>
                {team?.name ?? 'Unnamed Team'}
              </option>
            ))}
          </select>
          <select
            value={groupBy}
            onChange={e => setGroupBy(e.target.value)}
          >
            <option value="none">No Grouping</option>
            <option value="status">Group by Status</option>
            <option value="priority">Group by Priority</option>
            <option value="team">Group by Team</option>
          </select>
        </div>

        {(selectedTasks?.length ?? 0) > 0 && can('task:update') && (
          <div className={styles["bulk-actions"]}>
            <span>{selectedTasks.length} tasks selected</span>
            <select
              onChange={e => {
                const v = e.target.value;
                if (v) handleBulkUpdate({ status: v });
                e.target.value = '';
              }}
              disabled={isBulkUpdating}
              defaultValue=""
            >
              <option value="">Update Status</option>
              <option value="todo">Todo</option>
              <option value="inprogress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
            <select
              onChange={e => {
                const v = e.target.value;
                if (v) handleBulkUpdate({ priority: v });
                e.target.value = '';
              }}
              disabled={isBulkUpdating}
              defaultValue=""
            >
              <option value="">Update Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <button
              className={styles["clear-selection"]}
              onClick={() => dispatch(setSelectedTasks([]))}
              disabled={isBulkUpdating}
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      <div className={styles["tasks-content"]}>
        <div className={styles["tasks-list"]}>
          {Object.entries(groupedTasks ?? {}).map(([group, items]) => (
            <div key={group} className={styles["task-group"]}>
              <h3 className={styles["group-header"]}>{group}</h3>
              <div className={styles["task-items"]}>
                  {Array.isArray(items) && items.map(task => {
                  const taskId = task?._id ?? null;
                  const checked = taskId ? selectedTasks.includes(taskId) : false;
                  return (
                    <div
                      key={taskId ?? Math.random()}
                      className={`${styles["task-item"]} ${currentTask?._id === taskId ? styles["selected"] : ''}`}
                      onClick={() => {
                        if (taskId) {
                          dispatch(fetchTaskDetails(taskId));
                          dispatch(fetchTaskComments(taskId));
                          dispatch(fetchTaskActivities(taskId));
                        }
                      }}
                    >
                      <PermissionGuard require="task:update">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (!taskId) return;
                            const newSelected = [...selectedTasks];
                            if (e.target.checked) {
                              if (!newSelected.includes(taskId)) {
                                newSelected.push(taskId);
                              }
                            } else {
                              const idx = newSelected.indexOf(taskId);
                              if (idx > -1) {
                                newSelected.splice(idx, 1);
                              }
                            }
                            dispatch(setSelectedTasks(newSelected));
                          }}
                          onClick={e => e.stopPropagation()}
                        />
                      </PermissionGuard>
                      <div className={styles["task-info"]}>
                        <div className={styles["task-header"]}>
                          <h4 className={styles["task-title"]}>{task?.title ?? 'Untitled'}</h4>
                          <span className={`${styles["priority-badge"]} ${styles[task?.priority ?? '']}`}>
                            {task?.priority ?? '—'}
                          </span>
                        </div>
                        <p className={styles["task-description"]}>{task?.description ?? ''}</p>
                        <div className={styles["task-meta"]}>
                          <span className={styles["due-date"]}>
                            Due: {task?.dueDate 
                              ? (typeof task.dueDate === 'string' ? task.dueDate.split('T')[0] : String(task.dueDate))
                              : '—'
                            }
                          </span>
                          <span className={`${styles["status-badge"]} ${styles[task?.status ?? '']}`}>
                            {task?.status ?? '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {currentTask && (
          <div className={styles["task-details"]}>
            <div className={styles["details-header"]}>
              <h2>{currentTask?.title ?? 'Untitled'}</h2>
              <div className={styles["details-actions"]}>
                <PermissionGuard require="task:delete">
                  <button
                    onClick={() => currentTask?._id && handleDeleteTask(currentTask._id)}
                    disabled={!currentTask?._id || isDeletingTask}
                    title={!currentTask?._id ? 'Cannot delete: missing id' : (isDeletingTask ? 'Deleting...' : 'Delete task')}
                  >
                    {isDeletingTask ? 'Deleting...' : 'Delete'}
                  </button>
                </PermissionGuard>
              </div>
            </div>

            <div className={styles["details-content"]}>
              <div className={styles["details-section"]}>
                <h3>Description</h3>
                <p>{currentTask?.description ?? ''}</p>
              </div>

              <PermissionGuard require="task:update">
                <div className={styles["details-section"]}>
                  <h3>Status and Priority</h3>
                  <div className={styles["status-priority"]}>
                    <select
                      value={currentTask?.status ?? 'todo'}
                      onChange={e => currentTask?._id && handleUpdateTask(currentTask._id, {
                        status: e.target.value
                      })}
                    >
                      <option value="todo">Todo</option>
                      <option value="inprogress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                    <select
                      value={currentTask?.priority ?? 'medium'}
                      onChange={e => currentTask?._id && handleUpdateTask(currentTask._id, {
                        priority: e.target.value
                      })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
              </PermissionGuard>

              <PermissionGuard require="task:update">
                <div className={styles["details-section"]}>
                  <h3>Dates</h3>
                  <div className={styles["dates"]}>
                    <div className={styles["date-field"]}>
                      <label>Due Date</label>
                      <input
                        type="date"
                        value={currentTask?.dueDate ? (currentTask.dueDate.split ? currentTask.dueDate.split('T')[0] : String(currentTask.dueDate)) : ''}
                        onChange={e => currentTask?._id && handleUpdateTask(currentTask._id, {
                          dueDate: e.target.value
                        })}
                      />
                    </div>
                    <div className={styles["date-field"]}>
                      <label>Start Date</label>
                      <input
                        type="date"
                        value={currentTask?.startDate ? (currentTask.startDate.split ? currentTask.startDate.split('T')[0] : String(currentTask.startDate)) : ''}
                        onChange={e => currentTask?._id && handleUpdateTask(currentTask._id, {
                          startDate: e.target.value
                        })}
                      />
                    </div>
                  </div>
                </div>
              </PermissionGuard>

              {/* <div className={styles["details-section"]}>
                <h3>Attachments</h3>
                <div className={styles["attachments-list"]}>
                  {Array.isArray(currentTask?.attachments) && currentTask.attachments.map(attachment => (
                    <a
                      key={attachment?._id ?? attachment?.url ?? Math.random()}
                      href={attachment?.url ?? '#'}
                      className={styles["attachment-item"]}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {attachment?.name ?? 'attachment'}
                    </a>
                  ))}
                </div>
                <PermissionGuard require="task:update">
                  <div className={styles["upload-section"]}>
                    <input
                      type="file"
                      multiple
                      ref={fileInputRef}
                      onChange={e => handleFileUpload(currentTask?._id, e.target.files)}
                      style={{ display: 'none' }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!currentTask?._id}
                      title={!currentTask?._id ? 'Select a task first' : 'Add attachment'}
                    >
                      Add Attachment
                    </button>
                  </div>
                </PermissionGuard>
              </div> */}

              {/* <div className={styles["details-section"]}>
                <h3>Comments</h3>
                <div className={styles["comments-list"]}>
                  {Array.isArray(comments) && comments.map(comment => (
                    <div key={comment?._id ?? Math.random()} className={styles["comment"]}>
                      <div className={styles["comment-header"]}>
                        <span className={styles["comment-author"]}>
                          {comment?.userId?.name ?? comment?.userId ?? 'Unknown'}
                        </span>
                        <span className={styles["comment-time"]}>
                          {formatDate(comment?.createdAt)}
                        </span>
                      </div>
                      <p className={styles["comment-text"]}>{comment?.text ?? ''}</p>
                      {Array.isArray(comment?.attachments) && comment.attachments.length > 0 && (
                        <div className={styles["comment-attachments"]}>
                          {comment.attachments.map(att => (
                            <a
                              key={att?.url ?? Math.random()}
                              href={att?.url ?? '#'}
                              className={styles["attachment-link"]}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {att?.name ?? 'attachment'}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className={styles["add-comment"]}>
                  <textarea
                    placeholder="Add a comment..."
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const value = e.target.value?.trim();
                        if (value && currentTask?._id) {
                          handleAddComment(currentTask._id, { text: value });
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div> */}

              {/* <div className={styles["details-section"]}>
                <h3>Activity History</h3>
                <div className={styles["activity-list"]}>
                  {Array.isArray(taskActivities) && taskActivities.map(activity => (
                    <div key={activity?._id ?? Math.random()} className={styles["activity-item"]}>
                      <span className={styles["activity-time"]}>
                        {formatDate(activity?.createdAt)}
                      </span>
                      <span className={styles["activity-action"]}>{activity?.action ?? ''}</span>
                      {activity?.details && (
                        <span className={styles["activity-details"]}>
                          {activity.details.field ? `${activity.details.field} changed from ${activity.details.oldValue ?? '—'} to ${activity.details.newValue ?? '—'}` : ''}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div> */}
            </div>
          </div>
        )}
      </div>

      <PermissionGuard require="task:create">
        {isCreating && (
          <div className={styles["modal"]}>
            <div className={styles["modal-content"]}>
              <h2>Create New Task</h2>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  handleCreateTask({
                    title: formData.get('title'),
                    description: formData.get('description'),
                    priority: formData.get('priority'),
                    status: formData.get('status'),
                    dueDate: formData.get('dueDate'),
                    teamId: formData.get('teamId') || null,
                    assigneeId: formData.get('assigneeId') || null
                  });
                }}
              >
                <input
                  name="title"
                  placeholder="Task title"
                  required
                />
                <textarea
                  name="description"
                  placeholder="Task description"
                />
                <select name="priority" required defaultValue="medium">
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <select name="status" required defaultValue="todo">
                  <option value="todo">Todo</option>
                  <option value="inprogress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
                <input
                  type="date"
                  name="dueDate"
                  required
                />
                <select name="teamId" defaultValue="" onChange={(e) => {
                  const teamId = e.target.value;
                  setSelectedTeamForForm(teamId);
                  fetchTeamMembers(teamId);
                }}>
                  <option value="">No Team</option>
                  {Array.isArray(teams) && teams.map(team => (
                    <option key={team?._id ?? `team-${Math.random()}`} value={team?._id ?? ''}>
                      {team?.name ?? 'Unnamed Team'}
                    </option>
                  ))}
                </select>
                <select name="assigneeId" defaultValue="">
                  <option value="">No Assignee</option>
                  {selectedTeamForForm && Array.isArray(teamMembers) && teamMembers.map(member => (
                    <option key={member?.userId?._id ?? `member-${Math.random()}`} value={member?.userId?._id ?? ''}>
                      {member?.userId?.name ?? 'Unnamed User'}
                    </option>
                  ))}
                </select>
                <div className={styles["modal-actions"]}>
                  <button type="submit" disabled={isCreatingTask}>
                    {isCreatingTask ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedTeamForForm('');
                      setTeamMembers([]);
                    }}
                    disabled={isCreatingTask}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PermissionGuard>
    </div>
  );
}
