const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();

const { createActivityLog } = require('../controllers/activityLog.controller');
const setTaskOwnership = require('../middleware/ownershipFor.middleware'); 
const { authorize } = require('../middleware/auth.middleware'); 

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

function conditionalTaskOwnership(req, res, next) {
  try {
    const et = req.body && req.body.entityType;
    if (String(et).toLowerCase() === 'task') {
      return setTaskOwnership(req, res, next);
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

// router.post(
//   '/',
//   [
//     body('entityType').isIn(['task', 'team', 'user']),
//     body('entityId').isMongoId(),
//     body('action').isIn(['created', 'updated', 'deleted', 'status_changed', 'assigned', 'commented']),
//     body('userId').isMongoId(),
//     body('details').optional().isObject()
//   ],
//   handleValidation,
//   conditionalTaskOwnership,        
//   authorize(),                     
//   req.asyncHandler(createActivityLog)  
// );

module.exports = router;
