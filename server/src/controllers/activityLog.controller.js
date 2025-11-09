const ActivityLog = require('../models/activityLog.model');
const Task = require('../models/task.model');
const Team = require('../models/team.model');
const emailService = require('../services/email.service');

exports.createActivityLog = async (req, res) => {
    const { type, taskId, teamId, metadata } = req.body;

    const log = new ActivityLog({
        type,
        taskId,
        teamId,
        userId: req.user.id,
        metadata,
        timestamp: new Date()
    });

    await log.save();

    if (type === 'task_assigned' && metadata.assigneeId) {
        const task = await Task.findById(taskId);
        const assignee = await User.findById(metadata.assigneeId);
        
        if (task && assignee) {
            await emailService.sendTaskAssignmentEmail({
                to: assignee.email,
                name: assignee.name,
                taskTitle: task.title,
                taskUrl: `${process.env.CLIENT_URL}/tasks/${task._id}`
            });
        }
    }

    res.status(201).json({
        success: true,
        message: 'Activity log created successfully',
        data: { log }
    });
};

exports.getTeamActivityLogs = async (req, res) => {
    const { teamId } = req.params;
    const { 
        page = 1, 
        limit = 20,
        startDate,
        endDate 
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { teamId };

    if (startDate && endDate) {
        query.timestamp = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    const logs = await ActivityLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'name email')
        .populate('taskId', 'title');

    const total = await ActivityLog.countDocuments(query);

    res.json({
        success: true,
        message: 'Team activity logs retrieved successfully',
        data: { logs },
        meta: {
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit)
            }
        }
    });
};

exports.getTaskActivityLogs = async (req, res) => {
    const { taskId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const task = await Task.findById(taskId);
    if (!task) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }

    const skip = (page - 1) * limit;

    const logs = await ActivityLog.find({ taskId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'name email');

    const total = await ActivityLog.countDocuments({ taskId });

    res.json({
        success: true,
        message: 'Task activity logs retrieved successfully',
        data: { logs },
        meta: {
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit)
            }
        }
    });
};

exports.getUserActivityLogs = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const logs = await ActivityLog.find({ userId: req.user.id })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('taskId', 'title')
        .populate('teamId', 'name');

    const total = await ActivityLog.countDocuments({ userId: req.user.id });

    res.json({
        success: true,
        message: 'User activity logs retrieved successfully',
        data: { logs },
        meta: {
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit)
            }
        }
    });
};

exports.getActivityLogsByDateRange = async (req, res) => {
    const { startDate, endDate, type = 'all' } = req.query;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {
        timestamp: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };

    if (type !== 'all') {
        if (type === 'task') {
            query.taskId = { $exists: true };
        } else if (type === 'team') {
            query.teamId = { $exists: true };
        }
    }

    const logs = await ActivityLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'name email')
        .populate('taskId', 'title')
        .populate('teamId', 'name');

    const total = await ActivityLog.countDocuments(query);

    res.json({
        success: true,
        message: 'Activity logs retrieved successfully',
        data: { logs },
        meta: {
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit)
            }
        }
    });
};
