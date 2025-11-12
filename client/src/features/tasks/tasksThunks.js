import { createAsyncThunk } from '@reduxjs/toolkit';
import { taskApi } from '../../api/task.api';
import { teamApi } from '../../api/team.api';
import { activityLogApi } from '../../api/activityLog.api';

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (
    { filters = {}, sort = 'dueDate', order = 'asc' } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await taskApi.getTasks({
        ...filters,
        sort,
        order
      });
      const tasksData = response?.data?.tasks || response?.tasks || response?.items || [];
      return Array.isArray(tasksData) ? tasksData : [];
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const fetchTeamsForTasks = createAsyncThunk(
  'tasks/fetchTeams',
  async (_, { rejectWithValue }) => {
    try {
      const response = await teamApi.getTeams();
      const teamsData = response?.data?.teams || response?.teams || response || [];
      return Array.isArray(teamsData) ? teamsData : [];
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const fetchTaskDetails = createAsyncThunk(
  'tasks/fetchTaskDetails',
  async (taskId, { rejectWithValue }) => {
    try {
      if (!taskId) {
        return rejectWithValue('No task ID provided');
      }
      const response = await taskApi.getTaskById(taskId);
      const task = response?.data?.task || response?.task || response;
      return task;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const fetchTaskComments = createAsyncThunk(
  'tasks/fetchComments',
  async (taskId, { rejectWithValue }) => {
    try {
      if (!taskId) {
        return rejectWithValue('No task ID provided');
      }
      const response = await taskApi.getTaskComments(taskId);
      const comments = Array.isArray(response) ? response : response?.data || [];
      return comments;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const fetchTaskActivities = createAsyncThunk(
  'tasks/fetchActivities',
  async (taskId, { rejectWithValue }) => {
    try {
      if (!taskId) {
        return rejectWithValue('No task ID provided');
      }
      const response = await activityLogApi.getTaskActivityLogs(taskId);
      const activities = Array.isArray(response) ? response : response?.data || [];
      return activities;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const response = await taskApi.createTask(taskData);
      const newTask = response?.data?.task || response?.task || response;
      
      if (newTask?._id) {
        const fullTask = await taskApi.getTaskById(newTask._id);
        return fullTask?.data?.task || fullTask?.task || fullTask;
      }
      return newTask;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ taskId, updates }, { rejectWithValue }) => {
    debugger
    try {
      if (!taskId) {
        return rejectWithValue('No task ID provided');
      }
      const response = await taskApi.updateTask(taskId, updates);
      const updatedTask = response?.data?.task || response?.task || response;
      return updatedTask;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId, { rejectWithValue }) => {
    try {
      if (!taskId) {
        return rejectWithValue('No task ID provided');
      }
      await taskApi.deleteTask(taskId);
      return taskId;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const addTaskComment = createAsyncThunk(
  'tasks/addComment',
  async ({ taskId, comment }, { rejectWithValue }) => {
    try {
      if (!taskId || !comment) {
        return rejectWithValue('Task ID and comment are required');
      }
      const response = await taskApi.addTaskComment(taskId, comment);
      const newComment = response?.data?.comment || response?.comment || response;
      return newComment;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const addTaskAttachment = createAsyncThunk(
  'tasks/addAttachment',
  async ({ taskId, formData }, { rejectWithValue }) => {
    try {
      if (!taskId || !formData) {
        return rejectWithValue('Task ID and file are required');
      }
      const response = await taskApi.addTaskAttachment(taskId, formData);
      return response;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const bulkUpdateTasks = createAsyncThunk(
  'tasks/bulkUpdate',
  async ({ taskIds, updates }, { rejectWithValue }) => {
    try {
      if (!taskIds || taskIds.length === 0 || !updates) {
        return rejectWithValue('Task IDs and updates are required');
      }
      const updatePromises = taskIds.map(taskId =>
        taskApi.updateTask(taskId, updates)
      );
      await Promise.all(updatePromises);
      return { count: taskIds.length };
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);
