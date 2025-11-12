const express = require('express');
const { body, validationResult } = require('express-validator');
const { checkPermission, checkOwnership } = require('../middleware/rbac.middleware');
const Task = require('../models/task.model');

const router = express.Router();

const { 
    createTask, 
    getTasks, 
    getTaskById, 
    updateTask, 
    deleteTask,
    addTaskComment,
    getTaskComments,
    addTaskAttachment
} = require('../controllers/task.controller');

function handleValidation(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
}

router.post('/',
    checkPermission('task:create'),
    [
        body('title').trim().notEmpty().withMessage('Title is required'),
        body('description').trim().optional(),
        body('teamId').notEmpty().withMessage('Team ID is required'),
        body('assigneeId').optional(),
        body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
        body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
        body('status').optional().isIn(['todo', 'inprogress', 'review', 'done']).withMessage('Invalid status')
    ],
    handleValidation,
    createTask
);

router.post('/list', 
    checkPermission('task:read'),
    [
        body('page').optional().isInt({ min: 1 }),
        body('limit').optional().isInt({ min: 1, max: 100 }),
        body('assignee').optional().custom(val => !val || /^[0-9a-fA-F]{24}$/.test(val)).withMessage('Invalid assignee ID'),
        body('status').optional().custom(val => !val || ['todo', 'inprogress', 'review', 'done'].includes(val)).withMessage('Invalid status'),
        body('team').optional().custom(val => !val || /^[0-9a-fA-F]{24}$/.test(val)).withMessage('Invalid team ID'),
        body('dueBefore').optional().isISO8601(),
        body('priority').optional().custom(val => !val || ['low', 'medium', 'high', 'critical'].includes(val)).withMessage('Invalid priority')
    ],
    handleValidation,
    getTasks
);

router.get('/:id', 
    checkPermission('task:read'),
    getTaskById
);

router.put('/:id',
    checkPermission('task:update'),
    checkOwnership(
        async (req) => {
            const task = await Task.findById(req.params.id);
            return task ? task.ownerId : null;
        },
        'task:manage'
    ),
    [
        body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
        body('description').optional().trim(),
        body('assigneeId').optional(),
        body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
        body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
        body('status').optional().isIn(['todo', 'inprogress', 'review', 'done']).withMessage('Invalid status')
    ],
    handleValidation,
    updateTask
);

router.delete('/:id', 
    checkPermission(['task:delete']),
    checkOwnership(
        async (req) => {
            const task = await Task.findById(req.params.id);
            return task ? task.ownerId : null;
        },
        'task:manage'
    ),
    deleteTask
);

router.post('/:id/comments',
    [
        body('text').trim().notEmpty().withMessage('Comment text is required')
    ],
    handleValidation,
    addTaskComment
);

router.get('/:id/comments', getTaskComments);

router.post('/:id/attachments', addTaskAttachment);

module.exports = router;
