import { createSlice } from '@reduxjs/toolkit';
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
} from './tasksThunks';

const initialState = {
  tasks: [],
  teams: [],
  currentTask: null,
  comments: [],
  taskActivities: [],
  selectedTasks: [],
  
  filters: {
    status: '',
    priority: '',
    assignee: '',
    team: '',
    dueDate: '',
    search: ''
  },
  sort: { field: 'dueDate', order: 'asc' },
  groupBy: 'none',
  
  loadingTasks: false,
  loadingTeams: false,
  loadingTaskDetails: false,
  loadingComments: false,
  loadingActivities: false,
  
  isCreatingTask: false,
  isUpdatingTask: false,
  isDeletingTask: false,
  isAddingComment: false,
  isUploadingFile: false,
  isBulkUpdating: false,
  
  error: null,
  tasksError: null,
  teamsError: null,
  taskDetailsError: null,
  commentsError: null,
  activitiesError: null,
  
  isLoading: true
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSort: (state, action) => {
      state.sort = action.payload;
    },
    setGroupBy: (state, action) => {
      state.groupBy = action.payload;
    },
    setSelectedTasks: (state, action) => {
      state.selectedTasks = action.payload;
    },
    toggleTaskSelection: (state, action) => {
      const taskId = action.payload;
      const index = state.selectedTasks.indexOf(taskId);
      if (index > -1) {
        state.selectedTasks.splice(index, 1);
      } else {
        state.selectedTasks.push(taskId);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    clearTasksError: (state) => {
      state.tasksError = null;
    },
    clearTaskDetailsError: (state) => {
      state.taskDetailsError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loadingTasks = true;
        state.tasksError = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loadingTasks = false;
        state.tasks = action.payload || [];
        state.tasksError = null;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loadingTasks = false;
        state.tasksError = action.payload || 'Failed to fetch tasks';
      });

    builder
      .addCase(fetchTeamsForTasks.pending, (state) => {
        state.loadingTeams = true;
        state.teamsError = null;
      })
      .addCase(fetchTeamsForTasks.fulfilled, (state, action) => {
        state.loadingTeams = false;
        state.teams = action.payload || [];
        state.teamsError = null;
      })
      .addCase(fetchTeamsForTasks.rejected, (state, action) => {
        state.loadingTeams = false;
        state.teamsError = action.payload || 'Failed to fetch teams';
      });

    builder
      .addCase(fetchTaskDetails.pending, (state) => {
        state.loadingTaskDetails = true;
        state.taskDetailsError = null;
      })
      .addCase(fetchTaskDetails.fulfilled, (state, action) => {
        state.loadingTaskDetails = false;
        state.currentTask = action.payload;
        state.taskDetailsError = null;
      })
      .addCase(fetchTaskDetails.rejected, (state, action) => {
        state.loadingTaskDetails = false;
        state.taskDetailsError = action.payload || 'Failed to fetch task details';
      });

    builder
      .addCase(fetchTaskComments.pending, (state) => {
        state.loadingComments = true;
        state.commentsError = null;
      })
      .addCase(fetchTaskComments.fulfilled, (state, action) => {
        state.loadingComments = false;
        state.comments = action.payload || [];
        state.commentsError = null;
      })
      .addCase(fetchTaskComments.rejected, (state, action) => {
        state.loadingComments = false;
        state.commentsError = action.payload || 'Failed to fetch comments';
      });

    builder
      .addCase(fetchTaskActivities.pending, (state) => {
        state.loadingActivities = true;
        state.activitiesError = null;
      })
      .addCase(fetchTaskActivities.fulfilled, (state, action) => {
        state.loadingActivities = false;
        state.taskActivities = action.payload || [];
        state.activitiesError = null;
      })
      .addCase(fetchTaskActivities.rejected, (state, action) => {
        state.loadingActivities = false;
        state.activitiesError = action.payload || 'Failed to fetch activities';
      });

    builder
      .addCase(createTask.pending, (state) => {
        state.isCreatingTask = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.isCreatingTask = false;
        state.tasks.push(action.payload);
        state.error = null;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isCreatingTask = false;
        state.error = action.payload || 'Failed to create task';
      });

    builder
      .addCase(updateTask.pending, (state) => {
        state.isUpdatingTask = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.isUpdatingTask = false;
        const index = state.tasks.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        if (state.currentTask?._id === action.payload._id) {
          state.currentTask = action.payload;
        }
        state.error = null;
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.isUpdatingTask = false;
        state.error = action.payload || 'Failed to update task';
      });

    builder
      .addCase(deleteTask.pending, (state) => {
        state.isDeletingTask = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.isDeletingTask = false;
        state.tasks = state.tasks.filter(t => t._id !== action.payload);
        if (state.currentTask?._id === action.payload) {
          state.currentTask = null;
          state.comments = [];
          state.taskActivities = [];
        }
        state.error = null;
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.isDeletingTask = false;
        state.error = action.payload || 'Failed to delete task';
      });

    builder
      .addCase(addTaskComment.pending, (state) => {
        state.isAddingComment = true;
        state.commentsError = null;
      })
      .addCase(addTaskComment.fulfilled, (state, action) => {
        state.isAddingComment = false;
        state.comments.push(action.payload);
        state.commentsError = null;
      })
      .addCase(addTaskComment.rejected, (state, action) => {
        state.isAddingComment = false;
        state.commentsError = action.payload || 'Failed to add comment';
      });

    builder
      .addCase(addTaskAttachment.pending, (state) => {
        state.isUploadingFile = true;
        state.error = null;
      })
      .addCase(addTaskAttachment.fulfilled, (state, action) => {
        state.isUploadingFile = false;
        state.error = null;
      })
      .addCase(addTaskAttachment.rejected, (state, action) => {
        state.isUploadingFile = false;
        state.error = action.payload || 'Failed to upload file';
      });

    builder
      .addCase(bulkUpdateTasks.pending, (state) => {
        state.isBulkUpdating = true;
        state.error = null;
      })
      .addCase(bulkUpdateTasks.fulfilled, (state, action) => {
        state.isBulkUpdating = false;
        state.selectedTasks = [];
        state.error = null;
      })
      .addCase(bulkUpdateTasks.rejected, (state, action) => {
        state.isBulkUpdating = false;
        state.error = action.payload || 'Failed to update tasks';
      });
  }
});

export const {
  setFilters,
  setSort,
  setGroupBy,
  setSelectedTasks,
  toggleTaskSelection,
  clearError,
  clearTasksError,
  clearTaskDetailsError
} = tasksSlice.actions;

export default tasksSlice.reducer;
