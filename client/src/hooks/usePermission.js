import { useSelector } from 'react-redux';

export const usePermission = () => {
  const permissions = useSelector(state => state.auth.permissions);
  const user = useSelector(state => state.auth.user);
  const role = user?.role;
  const teams = useSelector(state => state.auth?.teams || []);

  const can = (permission) => {
    if (!permissions) {
      console.warn('[Permission] No permissions found for user:', user?.id);
      return false;
    }

    if (Array.isArray(permission)) {
      const hasAll = permission.every(p => permissions.includes(p));
      if (!hasAll) {
        const missing = permission.filter(p => !permissions.includes(p));
        console.warn('[Permission] User lacks permissions:', missing, 'User permissions:', permissions);
      }
      return hasAll;
    }

    const hasPermission = permissions.includes(permission);
    if (!hasPermission) {
      console.warn(`[Permission] User ${user?.id} denied permission: ${permission}. Available permissions:`, permissions);
    }
    return hasPermission;
  };

  const canAny = (...perms) => {
    if (!permissions) {
      console.warn('[Permission] No permissions found for user:', user?.id);
      return false;
    }
    const hasAny = perms.some(p => permissions.includes(p));
    if (!hasAny) {
      console.warn(`[Permission] User ${user?.id} denied all permissions: ${perms.join(', ')}. Available permissions:`, permissions);
    }
    return hasAny;
  };

  const isAdmin = (teamId) => {
    if (teamId) {
      const team = Array.isArray(teams) ? teams.find(t => t._id === teamId || t.id === teamId) : null;
      if (!team || !team.members) {
        return false;
      }
      const member = team.members.find(m => 
        m.userId._id === user?.id || 
        m.userId._id === user?._id ||
        m.userId === user?.id || 
        m.userId === user?._id
      );
      return member?.role === 'admin';
    }

    return role === 'admin';
  };

  const isManager = (teamId) => {
    if (teamId) {
      const team = Array.isArray(teams) ? teams.find(t => t._id === teamId || t.id === teamId) : null;
      if (!team || !team.members) {
        return false;
      }
      const member = team.members.find(m => 
        m.userId._id === user?.id || 
        m.userId._id === user?._id ||
        m.userId === user?.id || 
        m.userId === user?._id
      );
      return member?.role === 'manager' || member?.role === 'admin';
    }
    return role === 'manager' || role === 'admin';
  };

  return {
    can,
    canAny,
    isAdmin,
    isManager,
    permissions,
    user
  };
};
