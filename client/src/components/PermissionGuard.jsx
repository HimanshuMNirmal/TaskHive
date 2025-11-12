import React from 'react';
import { usePermission } from '../hooks/usePermission';

const PermissionGuard = ({ 
  require: permissions, 
  children, 
  fallback = null,
  mode = 'all'
}) => {
  const { can, canAny } = usePermission();

  let hasPermission = false;

  if (mode === 'any') {
    if (Array.isArray(permissions)) {
      hasPermission = canAny(...permissions);
    } else {
      hasPermission = can(permissions);
    }
  } else {
    hasPermission = can(permissions);
  }

  if (!hasPermission) {
    return fallback;
  }

  return children;
};

export default PermissionGuard;
