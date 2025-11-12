const Task = require('../models/task.model');
const ActivityLog = require('../models/activityLog.model');
const { createActivityLog } = require('./activityLog.controller');
const settingsService = require('../services/settings.service');
const emailService = require('../services/email.service');

exports.createTask = async (req, res) => {
    const { title, description, teamId, assigneeId, dueDate, priority, status = 'todo' } = req.body;

    const task = new Task({
        title,
        description,
        teamId,
        ownerId: req.user._id,
        organizationId: req.user.organizationId,
        assigneeId,
        dueDate,
        priority,
        status
    });

    await task.save();

    await createActivityLog({
        type: 'created',
        entityType: 'task',
        entityId: task._id,
        userId: req.user._id,
        metadata: { title: task.title },
        organizationId: req.user.organizationId._id
    });

    if (assigneeId) {
        try {
            const User = require('../models/user.model');
            const assignee = await User.findById(assigneeId).select('name email');
            if (assignee) {
                emailService.sendTaskAssignmentEmail({
                    to: assignee.email,
                    name: assignee.name,
                    taskTitle: title,
                    taskUrl: `${process.env.CLIENT_URL}/tasks/${task._id}`
                });
            }
        } catch (emailError) {
            console.error('Failed to send assignment email:', emailError.message);
            // Continue without interrupting the flow
        }
    }

    res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: { task }
    });
};


exports.getTasks = async (req, res) => {
    const {
        status,
        team,
        dueBefore,
        priority,
        sort = 'createdAt'
    } = req.body;
    const query = { organizationId: req.user.organizationId };
    let tasks = await Task.find(query)
        .populate('teamId', 'members')
        .populate('assigneeId', 'name email')
        .populate('ownerId', 'name email');
    tasks = tasks.filter(task => {
        if (!task.teamId) {
            return task.assigneeId?._id?.toString() === req.user._id.toString();
        }
        const teamMember = task.teamId.members?.find(m =>
            m.userId.toString() === req.user._id.toString()
        );
        if (!teamMember) {
            return false;
        }
        const userTeamRole = teamMember.role;
        const isAdminOrManager = userTeamRole === 'admin' || userTeamRole === 'manager';
        if (isAdminOrManager) {
            return true;
        } else {
            return task.assigneeId?._id?.toString() === req.user._id.toString();
        }
    });
    if (status) tasks = tasks.filter(t => t.status === status);
    if (team) tasks = tasks.filter(t => t.teamId?._id?.toString() === team);
    if (dueBefore) tasks = tasks.filter(t => t.dueDate && t.dueDate <= new Date(dueBefore));
    if (priority) tasks = tasks.filter(t => t.priority === priority);
    const sortOptions = sort === 'dueDate' ? 'dueDate' : sort === 'priority' ? 'priority' : '-createdAt';
    if (sortOptions === 'dueDate') {
        tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    } else if (sortOptions === 'priority') {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        tasks.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));
    } else {
        tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    res.json({
        success: true,
        message: 'Tasks retrieved successfully',
        data: { tasks: tasks }
    });
};


exports.getTaskById = async (req, res) => {
    const task = await Task.findById(req.params.id)
        .populate('assigneeId', 'name email')
        .populate('ownerId', 'name email');

    if (!task) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }

    res.json({
        success: true,
        message: 'Task retrieved successfully',
        data: { task }
    });
};

exports.updateTask = async (req, res) => {
    const { title, description, assigneeId, dueDate, priority, status, startDate } = req.body;
    const taskId = req.params.id;

    const task = await Task.findById(taskId);
    if (!task) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }

    const updates = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (assigneeId) updates.assigneeId = assigneeId;
    if (dueDate) updates.dueDate = dueDate;
    if (priority) updates.priority = priority;
    if (status) updates.status = status;
    if (startDate) updates.startDate = startDate;

    const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { $set: updates },
        { new: true }
    ).populate('assigneeId', 'name email');

    await createActivityLog({
        type: 'updated',
        entityType: 'task',
        entityId: task._id,
        userId: req.user._id,
        metadata: {
            title: task.title,
            updates: Object.keys(updates)
        },
        organizationId: req.user.organizationId._id
    });

    res.json({
        success: true,
        message: 'Task updated successfully',
        data: { task: updatedTask }
    });
};

exports.deleteTask = async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }

    await Task.deleteOne({ _id: req.params.id });

    await createActivityLog({
        type: 'deleted',
        entityType: 'task',
        entityId: task._id,
        userId: req.user._id,
        metadata: { title: task.title },
        organizationId: req.user.organizationId._id
    });

    res.json({
        success: true,
        message: 'Task deleted successfully'
    });
};

exports.addTaskComment = async (req, res) => {
    const { text } = req.body;
    const taskId = req.params.id;

    const task = await Task.findById(taskId);
    if (!task) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }

    const comment = {
        text,
        userId: req.user._id,
        createdAt: new Date()
    };

    task.comments = task.comments || [];
    task.comments.push(comment);
    await task.save();

    await createActivityLog({
        type: 'commented',
        entityType: 'task',
        entityId: task._id,
        userId: req.user._id,
        metadata: { taskTitle: task.title },
        organizationId: req.user.organizationId._id
    });

    res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: { comment }
    });
};

exports.getTaskComments = async (req, res) => {
    const task = await Task.findById(req.params.id)
        .populate('comments.userId', 'name email');

    if (!task) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }

    res.json({
        success: true,
        message: 'Comments retrieved successfully',
        data: { comments: task.comments || [] }
    });
};

exports.addTaskAttachment = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
    }

    const { maxUploadSize } = await settingsService.getMaintenanceSettings();

    if (req.file.size > maxUploadSize) {
        return res.status(400).json({
            success: false,
            message: `File size exceeds the maximum limit of ${Math.round(maxUploadSize / 1024 / 1024)}MB`
        });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
        return res.status(404).json({
            success: false,
            message: 'Task not found'
        });
    }

    const attachment = {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        path: req.file.path,
        uploadedBy: req.user._id,
        uploadedAt: new Date()
    };

    task.attachments = task.attachments || [];
    task.attachments.push(attachment);
    await task.save();

    await createActivityLog({
        type: 'attachment_added',
        entityType: 'task',
        entityId: task._id,
        userId: req.user._id,
        metadata: {
            taskTitle: task.title,
            fileName: attachment.fileName
        },
        organizationId: req.user.organizationId._id
    });

    res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: { attachment }
    });
};
