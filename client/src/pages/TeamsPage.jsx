import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { usePermission } from '../hooks/usePermission';
import PermissionGuard from '../components/PermissionGuard';
import styles from './TeamsPage.module.css';
import pageStyles from './Pages.module.css';
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
} from '../features/teams/teamsThunks';
import { setSelectedTeam, clearTeamDetailsError } from '../features/teams/teamsSlice';

export default function TeamsPage() {
  const { theme } = useTheme();
  const { can, canAny, isAdmin, isManager } = usePermission();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  
  const teams = useSelector(state => state?.teams?.teams ?? []);
  const selectedTeam = useSelector(state => state?.teams?.selectedTeam ?? null);
  const teamStats = useSelector(state => state?.teams?.teamStats ?? null);
  const teamTasks = useSelector(state => state?.teams?.teamTasks ?? []);
  const organizationUsers = useSelector(state => state?.teams?.organizationUsers ?? []);
  
  
  const loadingTeams = useSelector(state => state?.teams?.loadingTeams ?? false);
  const loadingTeamDetails = useSelector(state => state?.teams?.loadingTeamDetails ?? false);
  const loadingOrganizationUsers = useSelector(state => state?.teams?.loadingOrganizationUsers ?? false);
  
  const isCreatingTeam = useSelector(state => state?.teams?.isCreatingTeam ?? false);
  const isUpdatingTeam = useSelector(state => state?.teams?.isUpdatingTeam ?? false);
  const isDeletingTeam = useSelector(state => state?.teams?.isDeletingTeam ?? false);
  const isAddingMember = useSelector(state => state?.teams?.isAddingMember ?? false);
  const isRemovingMember = useSelector(state => state?.teams?.isRemovingMember ?? false);
  const isUpdatingRole = useSelector(state => state?.teams?.isUpdatingRole ?? false);
  const isAddingStatus = useSelector(state => state?.teams?.isAddingStatus ?? false);
  
  const teamsError = useSelector(state => state?.teams?.teamsError ?? null);
  const teamDetailsError = useSelector(state => state?.teams?.teamDetailsError ?? null);
  const organizationUsersError = useSelector(state => state?.teams?.organizationUsersError ?? null);
  
  const currentUser = useSelector(state => state?.auth?.user ?? null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [customStatus, setCustomStatus] = useState({ name: '', color: '#000000' });

  const formatDate = (value, fallback = '—') => {
    if (!value) return fallback;
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return fallback;
      return d.toLocaleDateString();
    } catch {
      return fallback;
    }
  };

  useEffect(() => {
    if (can('team:read')) {
      dispatch(fetchTeams());
      dispatch(fetchOrganizationUsers());
    }
  }, []);

  useEffect(() => {
    const selectedTeamId = searchParams.get('selectedTeam');
    if (selectedTeamId && teams.length > 0) {
      const team = teams.find(t => t?._id === selectedTeamId);
      if (team) {
        dispatch(setSelectedTeam(team));
      }
    }
  }, [searchParams, teams]);

  useEffect(() => {
    if (selectedTeam?._id) {
      dispatch(fetchTeamDetails(selectedTeam._id));
    }
  }, [selectedTeam?._id]);

  const handleCreateTeam = async (data) => {
    try {
      const result = await dispatch(createTeam(data)).unwrap();
      if (result) {
        setIsCreating(false);
        dispatch(setSelectedTeam(result));
      }
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const handleUpdateTeam = async (teamId, data) => {
    if (!teamId) return;
    try {
      const result = await dispatch(updateTeam({ teamId, data })).unwrap();
      if (result) {
        dispatch(setSelectedTeam(result));
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating team:', error);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!teamId) return;
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    try {
      await dispatch(deleteTeam(teamId)).unwrap();
      dispatch(setSelectedTeam(null));
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const handleAddMember = async (teamId, data = {}) => {
    if (!teamId) return;
    const userIdToInvite = data.userId ?? selectedUserId;
    if (!userIdToInvite) return;
    try {
      const result = await dispatch(addTeamMember({
        teamId,
        memberData: {
          userId: userIdToInvite,
          role: 'member',
          ...data
        }
      })).unwrap();
      if (result) {
        dispatch(setSelectedTeam(result));
        setSelectedUserId('');
      }
    } catch (error) {
      console.error('Error adding team member:', error);
    }
  };

  const handleRemoveMember = async (teamId, userId) => {
    if (!teamId || !userId) return;
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      const result = await dispatch(removeTeamMember({ teamId, userId })).unwrap();
      if (result?.updatedTeam) {
        dispatch(setSelectedTeam(result.updatedTeam));
      }
    } catch (error) {
      console.error('Error removing team member:', error);
    }
  };

  const handleUpdateMemberRole = async (teamId, userId, role) => {
    if (!teamId || !userId) return;
    try {
      const result = await dispatch(updateMemberRole({
        teamId,
        userId,
        roleData: { role }
      })).unwrap();
      if (result?.updatedTeam) {
        dispatch(setSelectedTeam(result.updatedTeam));
      }
    } catch (error) {
      console.error('Error updating member role:', error);
    }
  };

  const handleAddCustomStatus = async (teamId) => {
    if (!teamId || !customStatus?.name) return;
    try {
      const result = await dispatch(addCustomStatus({
        teamId,
        statusData: customStatus,
        currentSettings: selectedTeam?.settings
      })).unwrap();
      if (result) {
        dispatch(setSelectedTeam(result));
        setCustomStatus({ name: '', color: '#000000' });
      }
    } catch (error) {
      console.error('Error adding custom status:', error);
    }
  };

  const isTeamAdmin = (team) => {
    if (!team || !currentUser) return false;
    const userMemberId = currentUser.id;
    const userMember = (team?.members ?? []).find(m => {
      const memberId = m?.userId?._id ?? m?.userId;
      const ownerId = team?.ownerId?._id ?? team?.ownerId;
      return memberId === userMemberId || ownerId === userMemberId;
    });
    return userMember?.role === 'admin' || team?.ownerId?._id === userMemberId || team?.ownerId === userMemberId;
  };

  if (loadingTeams) {
    return <div className={styles["loading"]}>Loading teams...</div>;
  }

  if (!can('team:read')) {
    return (
      <div className={pageStyles["page-container"]}>
        <div className={styles["teams-header"]}>
          <h1>Teams</h1>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
          <p>You don't have permission to view teams.</p>
          <p>Please contact your administrator for access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={pageStyles["page-container"]}>
      <div className={styles["teams-header"]}>
        <h1>Teams</h1>
        <PermissionGuard require="team:create">
          <button
            className={styles["create-team-btn"]}
            onClick={() => setIsCreating(true)}
          >
            Create Team
          </button>
        </PermissionGuard>
      </div>

      <div className={styles["teams-content"]}>
        <div className={styles["teams-list"]}>
          {(teams ?? []).map(team => (
            <div
              key={team?._id ?? Math.random()}
              className={`${styles["team-card"]} ${selectedTeam?._id === team?._id ? styles["selected"] : ''}`}
              onClick={() => {
                team?._id && dispatch(setSelectedTeam(team));
              }}
              role="button"
              tabIndex={0}
            >
              <h3 className={styles["team-name"]}>{team?.name ?? 'Untitled Team'}</h3>
              <div className={styles["team-meta"]}>
                <span>{team?.members?.length ?? 0} members</span>
                {team?.settings?.isPrivate && <span>🔒 Private</span>}
              </div>
            </div>
          ))}

        </div>

        {selectedTeam ? (
          <div className={styles["team-details"]}>
            <div className={styles["details-header"]}>
              <div className={styles["header-content"]}>
                <h2>{selectedTeam?.name ?? 'Untitled Team'}</h2>
                {isAdmin(selectedTeam?._id) && can('team:update') && (
                  <div className={styles["header-actions"]}>
                    <button onClick={() => setIsEditing(true)}>Edit</button>
                    <PermissionGuard require="team:delete">
                      <button
                        className={styles["danger"]}
                        onClick={() => selectedTeam?._id && handleDeleteTeam(selectedTeam._id)}
                        disabled={!selectedTeam?._id}
                        title={!selectedTeam?._id ? 'No team selected' : 'Delete team'}
                      >
                        Delete
                      </button>
                    </PermissionGuard>
                  </div>
                )}
              </div>
              <p className={styles["team-description"]}>{selectedTeam?.description ?? ''}</p>
            </div>

            {teamStats ? (
              <div className={styles["team-stats"]}>
                <div className={styles["stat-card"]}>
                  <span className={styles["stat-value"]}>{teamStats.totalTasks ?? 0}</span>
                  <span className={styles["stat-label"]}>Total Tasks</span>
                </div>
                <div className={styles["stat-card"]}>
                  <span className={styles["stat-value"]}>
                    {teamStats.totalTasks ? `${Math.round((teamStats.completedTasks / teamStats.totalTasks) * 100)}` : 0}%
                  </span>
                  <span className={styles["stat-label"]}>Completion Rate</span>
                </div>
                <div className={styles["stat-card"]}>
                  <span className={styles["stat-value"]}>{teamStats.activeMembers ?? 0}</span>
                  <span className={styles["stat-label"]}>Active Members</span>
                </div>
              </div>
            ) : (
              <div className={styles["team-stats"]}>No stats available</div>
            )}

            <div className={styles["team-sections"]}>
              <section className={styles["members-section"]}>
                <h3>Team Members</h3>
                {isTeamAdmin(selectedTeam) && can('team:manage_members') && (
                  <div className={styles["invite-form"]}>
                    <select
                      value={selectedUserId}
                      onChange={e => setSelectedUserId(e.target.value)}
                      disabled={loadingOrganizationUsers}
                    >
                      <option value="">
                        {loadingOrganizationUsers ? 'Loading users...' : 'Select user to invite'}
                      </option>
                      {(organizationUsers ?? [])
                        .filter(user => !selectedTeam?.members?.some(
                          m => (m?.userId?._id ?? m?.userId) === user?._id
                        ))
                        .map(user => (
                          <option key={user?._id} value={user?._id}>
                            {user?.name} ({user?.email})
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => handleAddMember(selectedTeam._id)}
                      disabled={!selectedUserId || !selectedTeam?._id}
                      title={!selectedUserId ? 'Select a user' : (!selectedTeam?._id ? 'No team selected' : 'Invite')}
                    >
                      Invite
                    </button>
                  </div>
                )}
                <div className={styles["members-list"]}>
                  {(selectedTeam?.members ?? []).map(member => {
                    const memberObj = member?.userId;
                    const memberId = memberObj?._id ?? member?.userId;
                    return (
                      <div key={memberId ?? Math.random()} className={styles["member-item"]}>
                        <div className={styles["member-info"]}>
                          <span className={styles["member-name"]}>
                            {memberObj?.name ?? memberObj?.email ?? 'Loading...'}
                          </span>
                          {isTeamAdmin(selectedTeam) && can('team:manage_members') ? (
                            <select
                              value={member?.role ?? 'member'}
                              onChange={e => handleUpdateMemberRole(selectedTeam._id, memberId, e.target.value)}
                            >
                              <option value="member">Member</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className={styles["member-role"]}>{member?.role ?? 'member'}</span>
                          )}
                        </div>
                        {isTeamAdmin(selectedTeam) && can('team:manage_members') && (
                          <button
                            className={styles["remove-member"]}
                            onClick={() => handleRemoveMember(selectedTeam._id, memberId)}
                            disabled={!memberId}
                            title={!memberId ? 'Cannot remove: missing id' : 'Remove member'}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* <section className={styles["settings-section"]}>
                <h3>Team Settings</h3>
                {isTeamAdmin(selectedTeam) && can('team:update') && (
                  <div className={styles["settings-form"]}>
                    <div className={styles["setting-item"]}>
                      <label>
                        <input
                          type="checkbox"
                          checked={Boolean(selectedTeam?.settings?.isPrivate)}
                          onChange={e => selectedTeam?._id && handleUpdateTeam(selectedTeam._id, {
                            settings: {
                              ...selectedTeam?.settings,
                              isPrivate: e.target.checked
                            }
                          })}
                        />
                        Private Team
                      </label>
                    </div>

                    <div className={styles["setting-item"]}>
                      <h4>Custom Statuses</h4>
                      <div className={styles["status-form"]}>
                        <input
                          type="text"
                          placeholder="Status name"
                          value={customStatus.name}
                          onChange={e => setCustomStatus(prev => ({
                            ...prev,
                            name: e.target.value
                          }))}
                        />
                        <input
                          type="color"
                          value={customStatus.color}
                          onChange={e => setCustomStatus(prev => ({
                            ...prev,
                            color: e.target.value
                          }))}
                        />
                        <button
                          onClick={() => handleAddCustomStatus(selectedTeam._id)}
                          disabled={!customStatus.name || !selectedTeam?._id}
                        >
                          Add
                        </button>
                      </div>
                      <div className={styles["custom-statuses"]}>
                        {(selectedTeam?.settings?.customStatuses ?? []).map(status => (
                          <div
                            key={status?.name ?? JSON.stringify(status)}
                            className={styles["status-tag"]}
                            style={{ backgroundColor: status?.color ?? '#000' }}
                          >
                            {status?.name ?? 'status'}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section> */}

              {/* <section className={styles["tasks-section"]}>
                <h3>Team Tasks</h3>
                <div className={styles["tasks-list"]}>
                  {(teamTasks ?? []).map(task => (
                    <div key={task?._id ?? Math.random()} className={styles["task-item"]}>
                      <div className={styles["task-info"]}>
                        <span className={styles["task-title"]}>{task?.title ?? 'Untitled'}</span>
                        <span className={`task-status ${task?.status ?? ''}`}>
                          {task?.status ?? '—'}
                        </span>
                      </div>
                      <span className={styles["task-due"]}>
                        Due: {task?.dueDate ? formatDate(task.dueDate) : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </section> */}
            </div>
          </div>
        ) : (
          <div className={styles["team-details empty"]}>Select a team to view details</div>
        )}
      </div>

      <PermissionGuard require="team:create">
        {isCreating && (
          <div className={styles["modal"]}>
            <div className={styles["modal-content"]}>
              <h2>Create New Team</h2>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const fd = new FormData(e.target);
                  handleCreateTeam({
                    name: fd.get('name'),
                    description: fd.get('description'),
                    settings: {
                      isPrivate: fd.get('isPrivate') === 'on'
                    }
                  });
                }}
              >
                <input
                  name="name"
                  placeholder="Team name"
                  required
                />
                <textarea
                  name="description"
                  placeholder="Team description"
                />
                <label>
                  <input
                    type="checkbox"
                    name="isPrivate"
                  />
                  Private Team
                </label>
                <div className={styles["modal-actions"]}>
                  <button type="submit">Create</button>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PermissionGuard>
      <PermissionGuard require="team:update">
        {isEditing && selectedTeam && (
          <div className={styles["modal"]}>
            <div className={styles["modal-content"]}>
              <h2>Edit Team</h2>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const fd = new FormData(e.target);
                  handleUpdateTeam(selectedTeam._id, {
                    name: fd.get('name'),
                    description: fd.get('description'),
                    settings: {
                      ...selectedTeam?.settings,
                      isPrivate: fd.get('isPrivate') === 'on'
                    }
                  });
                }}
              >
                <input
                  name="name"
                  placeholder="Team name"
                  defaultValue={selectedTeam?.name ?? ''}
                  required
                />
                <textarea
                  name="description"
                  placeholder="Team description"
                  defaultValue={selectedTeam?.description ?? ''}
                />
                <label>
                  <input
                    type="checkbox"
                    name="isPrivate"
                    defaultChecked={Boolean(selectedTeam?.settings?.isPrivate)}
                  />
                  Private Team
                </label>
                <div className={styles["modal-actions"]}>
                  <button type="submit">Save</button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
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
