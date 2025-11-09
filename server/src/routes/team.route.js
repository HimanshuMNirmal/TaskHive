const express = require('express');
const { body, validationResult } = require('express-validator');
const { checkPermission, checkOwnership } = require('../middleware/rbac.middleware');
const Team = require('../models/team.model');

const router = express.Router();

const { 
    createTeam,
    getTeams,
    getTeamById,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
    updateMemberRole
} = require('../controllers/team.controller');

function handleValidation(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
}

router.post('/',
    checkPermission('team:create'),
    [
        body('name').trim().notEmpty().withMessage('Team name is required'),
        body('description').trim().optional()
    ],
    handleValidation,
    createTeam
);

router.get('/', 
    checkPermission('team:read'),
    getTeams
);

router.get('/:id', 
    checkPermission('team:read'),
    getTeamById
);

router.put('/:id',
    checkPermission('team:update'),
    checkOwnership(
        async (req) => {
            const team = await Team.findById(req.params.id);
            return team ? team.createdBy : null;
        },
        'team:manage'
    ),
    [
        body('name').optional().trim().notEmpty().withMessage('Team name cannot be empty'),
        body('description').optional().trim()
    ],
    handleValidation,
    updateTeam
);

router.delete('/:id', 
    checkPermission(['team:delete', 'team:manage']),
    deleteTeam
);

router.post('/:id/members',
    [
        body('userId').notEmpty().withMessage('User ID is required'),
        body('role').isIn(['admin', 'manager', 'member']).withMessage('Invalid role')
    ],
    handleValidation,
    addTeamMember
);

router.delete('/:id/members/:userId',
    removeTeamMember
);

router.put('/:id/members/:userId',
    [
        body('role').isIn(['admin', 'manager', 'member']).withMessage('Invalid role')
    ],
    handleValidation,
    updateMemberRole
);

module.exports = router;
