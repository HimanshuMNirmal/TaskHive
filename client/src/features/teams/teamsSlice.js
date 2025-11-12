import { createSlice } from '@reduxjs/toolkit';
import {
  fetchTeams,
  fetchTeamDetails,
  fetchOrganizationUsers,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  updateMemberRole,
  addCustomStatus
} from './teamsThunks';

const initialState = {
  teams: [],
  selectedTeam: null,
  teamStats: null,
  teamTasks: [],
  organizationUsers: [],
  
  loadingTeams: false,
  loadingTeamDetails: false,
  loadingOrganizationUsers: false,
  
  isCreatingTeam: false,
  isUpdatingTeam: false,
  isDeletingTeam: false,
  isAddingMember: false,
  isRemovingMember: false,
  isUpdatingMember: false,
  isAddingStatus: false,
  
  error: null,
  teamsError: null,
  teamDetailsError: null,
  usersError: null,
  
  isLoading: true
};

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    setSelectedTeam: (state, action) => {
      state.selectedTeam = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearTeamsError: (state) => {
      state.teamsError = null;
    },
    clearTeamDetailsError: (state) => {
      state.teamDetailsError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeams.pending, (state) => {
        state.loadingTeams = true;
        state.teamsError = null;
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.loadingTeams = false;
        state.teams = action.payload || [];
        state.teamsError = null;
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.loadingTeams = false;
        state.teamsError = action.payload || 'Failed to fetch teams';
      });

    builder
      .addCase(fetchTeamDetails.pending, (state) => {
        state.loadingTeamDetails = true;
        state.teamDetailsError = null;
      })
      .addCase(fetchTeamDetails.fulfilled, (state, action) => {
        state.loadingTeamDetails = false;
        const { stats, tasks, team } = action.payload;
        state.teamStats = stats;
        state.teamTasks = tasks;
        if (team) {
          state.selectedTeam = team;
        } else {
        }
        state.teamDetailsError = null;
      })
      .addCase(fetchTeamDetails.rejected, (state, action) => {
        console.error('[DEBUG] fetchTeamDetails.rejected - error:', action.payload);
        state.loadingTeamDetails = false;
        state.teamDetailsError = action.payload || 'Failed to fetch team details';
      });

    builder
      .addCase(fetchOrganizationUsers.pending, (state) => {
        state.loadingOrganizationUsers = true;
        state.usersError = null;
      })
      .addCase(fetchOrganizationUsers.fulfilled, (state, action) => {
        state.loadingOrganizationUsers = false;
        state.organizationUsers = action.payload || [];
        state.usersError = null;
      })
      .addCase(fetchOrganizationUsers.rejected, (state, action) => {
        state.loadingOrganizationUsers = false;
        state.usersError = action.payload || 'Failed to fetch organization users';
      });

    builder
      .addCase(createTeam.pending, (state) => {
        state.isCreatingTeam = true;
        state.error = null;
      })
      .addCase(createTeam.fulfilled, (state, action) => {
        state.isCreatingTeam = false;
        state.teams.push(action.payload);
        state.selectedTeam = action.payload;
        state.error = null;
      })
      .addCase(createTeam.rejected, (state, action) => {
        state.isCreatingTeam = false;
        state.error = action.payload || 'Failed to create team';
      });

    builder
      .addCase(updateTeam.pending, (state) => {
        state.isUpdatingTeam = true;
        state.error = null;
      })
      .addCase(updateTeam.fulfilled, (state, action) => {
        state.isUpdatingTeam = false;
        const index = state.teams.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.teams[index] = action.payload;
        }
        if (state.selectedTeam?._id === action.payload._id) {
          state.selectedTeam = action.payload;
        }
        state.error = null;
      })
      .addCase(updateTeam.rejected, (state, action) => {
        state.isUpdatingTeam = false;
        state.error = action.payload || 'Failed to update team';
      });

    builder
      .addCase(deleteTeam.pending, (state) => {
        state.isDeletingTeam = true;
        state.error = null;
      })
      .addCase(deleteTeam.fulfilled, (state, action) => {
        state.isDeletingTeam = false;
        state.teams = state.teams.filter(t => t._id !== action.payload);
        if (state.selectedTeam?._id === action.payload) {
          state.selectedTeam = null;
          state.teamStats = null;
          state.teamTasks = [];
        }
        state.error = null;
      })
      .addCase(deleteTeam.rejected, (state, action) => {
        state.isDeletingTeam = false;
        state.error = action.payload || 'Failed to delete team';
      });

    builder
      .addCase(addTeamMember.pending, (state) => {
        state.isAddingMember = true;
        state.error = null;
      })
      .addCase(addTeamMember.fulfilled, (state, action) => {
        state.isAddingMember = false;
        if (state.selectedTeam?._id === action.payload._id) {
          state.selectedTeam = action.payload;
        }
        state.error = null;
      })
      .addCase(addTeamMember.rejected, (state, action) => {
        state.isAddingMember = false;
        state.error = action.payload || 'Failed to add team member';
      });

    builder
      .addCase(removeTeamMember.pending, (state) => {
        state.isRemovingMember = true;
        state.error = null;
      })
      .addCase(removeTeamMember.fulfilled, (state, action) => {
        state.isRemovingMember = false;
        const { teamId, updatedTeam } = action.payload;
        if (state.selectedTeam?._id === teamId) {
          state.selectedTeam = updatedTeam;
        }
        state.error = null;
      })
      .addCase(removeTeamMember.rejected, (state, action) => {
        state.isRemovingMember = false;
        state.error = action.payload || 'Failed to remove team member';
      });

    builder
      .addCase(updateMemberRole.pending, (state) => {
        state.isUpdatingMember = true;
        state.error = null;
      })
      .addCase(updateMemberRole.fulfilled, (state, action) => {
        state.isUpdatingMember = false;
        const { teamId, updatedTeam } = action.payload;
        if (state.selectedTeam?._id === teamId) {
          state.selectedTeam = updatedTeam;
        }
        state.error = null;
      })
      .addCase(updateMemberRole.rejected, (state, action) => {
        state.isUpdatingMember = false;
        state.error = action.payload || 'Failed to update member role';
      });

    builder
      .addCase(addCustomStatus.pending, (state) => {
        state.isAddingStatus = true;
        state.error = null;
      })
      .addCase(addCustomStatus.fulfilled, (state, action) => {
        state.isAddingStatus = false;
        if (state.selectedTeam?._id === action.payload._id) {
          state.selectedTeam = action.payload;
        }
        state.error = null;
      })
      .addCase(addCustomStatus.rejected, (state, action) => {
        state.isAddingStatus = false;
        state.error = action.payload || 'Failed to add custom status';
      });
  }
});

export const {
  setSelectedTeam,
  clearError,
  clearTeamsError,
  clearTeamDetailsError
} = teamsSlice.actions;

export default teamsSlice.reducer;
