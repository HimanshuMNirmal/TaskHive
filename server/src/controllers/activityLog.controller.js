const ActivityLog = require('../models/activityLog.model');
const Task = require('../models/task.model');
const Team = require('../models/team.model');
const emailService = require('../services/email.service');

exports.createActivityLog = async (reqOrPayload, res) => {
  const isExpress = reqOrPayload && reqOrPayload.body && res;

  let type, entityId, entityType, metadata, userId, organizationId;

  if (isExpress) {
    const req = reqOrPayload;
    ({ type, entityId, entityType, metadata } = req.body || {});
    userId = req.user?._id;
    organizationId = req.user?.organizationId;
  } else {
    const payload = reqOrPayload || {};
    ({ type, entityId, entityType, metadata } = payload);
    userId = payload.userId || payload.user?._id || null;
    organizationId = payload.organizationId || null;
  }

  const log = new ActivityLog({
    entityType,
    entityId,
    userId,
    action: type,
    details: metadata,
    organizationId
  });

  await log.save();

  if (type === 'assigned' && entityType === 'task' && metadata?.assigneeId) {
    const task = await Task.findById(entityId);
    const assignee = await User.findById(metadata.assigneeId);

    if (task && assignee && assignee.email) {
      await emailService.sendTaskAssignmentEmail({
        to: assignee.email,
        name: assignee.name,
        taskTitle: task.title,
        taskUrl: `${process.env.CLIENT_URL}/tasks/${task._id}`
      });
    }
  }

  if (isExpress) {
    return res.status(201).json({
      success: true,
      message: 'Activity log created successfully',
      data: { log }
    });
  }

  return log;
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
    const query = { entityId: teamId, entityType: 'team' };

    if (startDate && endDate) {
        query.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    const logs = await ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'name email');

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

    const logs = await ActivityLog.find({ entityId: taskId, entityType: 'task' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'name email');

    const total = await ActivityLog.countDocuments({ entityId: taskId, entityType: 'task' });

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

    const logs = await ActivityLog.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'name email');

    const total = await ActivityLog.countDocuments({ userId: req.user._id });

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
        createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };

    if (type !== 'all') {
        query.entityType = type;
    }

    const logs = await ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'name email');

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
