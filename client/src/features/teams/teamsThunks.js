
import { createAsyncThunk } from '@reduxjs/toolkit';
import { teamApi } from '../../api/team.api';
import { userApi } from '../../api/user.api';
import { taskApi } from '../../api/task.api';

export const fetchTeams = createAsyncThunk(
  'teams/fetchTeams',
  async (_, { rejectWithValue }) => {
    try {
      const response = await teamApi.getTeams();
      const teamsData = Array.isArray(response) ? response : (response?.teams ?? []);
      return Array.isArray(teamsData) ? teamsData : [];
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const fetchTeamDetails = createAsyncThunk(
  'teams/fetchTeamDetails',
  async (teamId, { rejectWithValue }) => {
    try {
      
      if (!teamId) {
        return rejectWithValue('No team ID provided');
      }
      const [team, tasksResp] = await Promise.all([
        teamApi.getTeamById(teamId),
        taskApi.getTasks({ teamId })
      ]);

      const tasksItems = tasksResp?.items || tasksResp?.data?.items || [];
      
      const totalTasks = tasksItems.length;
      const completedTasks = tasksItems.filter(t => t?.status === 'done').length;
      const activeMembers = (team?.members?.length) ?? 0;
      const tasksByStatus = tasksItems.reduce((acc, task) => {
        const s = task?.status ?? 'unknown';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});
      
      const result = {
        team: team,
        stats: {
          totalTasks,
          completedTasks,
          activeMembers,
          tasksByStatus
        },
        tasks: Array.isArray(tasksItems) ? tasksItems : []
      };
      
      return result;
    } catch (error) {
      console.error('[DEBUG] fetchTeamDetails ERROR:', error);
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const fetchOrganizationUsers = createAsyncThunk(
  'teams/fetchOrganizationUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApi.getOrganizationUsers();
      return Array.isArray(response) ? response : [];
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const createTeam = createAsyncThunk(
  'teams/createTeam',
  async (teamData, { rejectWithValue }) => {
    try {
      const response = await teamApi.createTeam(teamData);
      const newTeam = response?.data?.team || response?.team || response;
      
      if (newTeam?._id) {
        const fullTeam = await teamApi.getTeamById(newTeam._id);
        return fullTeam;
      }
      return newTeam;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const updateTeam = createAsyncThunk(
  'teams/updateTeam',
  async ({ teamId, data }, { rejectWithValue }) => {
    try {
      if (!teamId) {
        return rejectWithValue('No team ID provided');
      }
      const response = await teamApi.updateTeam(teamId, data);
      const updatedTeam = response?.data?.team || response?.team || response;
      return updatedTeam;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const deleteTeam = createAsyncThunk(
  'teams/deleteTeam',
  async (teamId, { rejectWithValue }) => {
    try {
      if (!teamId) {
        return rejectWithValue('No team ID provided');
      }
      await teamApi.deleteTeam(teamId);
      return teamId;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const addTeamMember = createAsyncThunk(
  'teams/addMember',
  async ({ teamId, memberData }, { rejectWithValue }) => {
    try {
      if (!teamId || !memberData?.userId) {
        return rejectWithValue('Team ID and user ID are required');
      }
      const response = await teamApi.addTeamMember(teamId, memberData);
      const updatedTeam = response?.data?.team || response?.team || response;
      return updatedTeam;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const removeTeamMember = createAsyncThunk(
  'teams/removeMember',
  async ({ teamId, userId }, { rejectWithValue }) => {
    try {
      if (!teamId || !userId) {
        return rejectWithValue('Team ID and user ID are required');
      }
      await teamApi.removeTeamMember(teamId, userId);
      const updatedTeam = await teamApi.getTeamById(teamId);
      return { teamId, updatedTeam };
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const updateMemberRole = createAsyncThunk(
  'teams/updateMemberRole',
  async ({ teamId, userId, roleData }, { rejectWithValue }) => {
    try {
      if (!teamId || !userId) {
        return rejectWithValue('Team ID and user ID are required');
      }
      await teamApi.updateMemberRole(teamId, userId, roleData);
      const updatedTeam = await teamApi.getTeamById(teamId);
      return { teamId, updatedTeam };
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const addCustomStatus = createAsyncThunk(
  'teams/addCustomStatus',
  async ({ teamId, statusData, currentSettings }, { rejectWithValue }) => {
    try {
      if (!teamId || !statusData?.name) {
        return rejectWithValue('Team ID and status name are required');
      }
      const existing = currentSettings?.customStatuses ?? [];
      const updatedSettings = {
        ...currentSettings,
        customStatuses: [...existing, statusData]
      };
      const response = await teamApi.updateTeam(teamId, { settings: updatedSettings });
      const updatedTeam = response?.data?.team || response?.team || response;
      return updatedTeam;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);
