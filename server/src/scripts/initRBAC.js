const RBACService = require('../services/rbac.service');
require('../models/permission.model');
require('../models/role.model');

async function initializeRBAC() {
  try {
    console.log('Initializing RBAC system...');
    await RBACService.initializeRBAC();
    console.log('RBAC system initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing RBAC system:', error);
    throw error;
  }
}

module.exports = initializeRBAC;