const Task = require('../models/task.model');
const ActivityLog = require('../models/activityLog.model');
const { createActivityLog } = require('./activityLog.controller');

exports.createTask = async (req, res) => {
    const { title, description, teamId, assigneeId, dueDate, priority, status = 'todo' } = req.body;
    
    const task = new Task({
        title,
        description,
        teamId,
        createdBy: req.user.id,
        assigneeId,
        dueDate,
        priority,
        status
    });

    await task.save();

    await createActivityLog({
        type: 'task_created',
        taskId: task._id,
        teamId: task.teamId,
        userId: req.user.id,
        metadata: { title: task.title }
    });

    res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: { task }
    });
};

exports.getTasks = async (req, res) => {
    const { 
        assignee, 
        status, 
        team, 
        dueBefore,
        priority,
        page = 1,
        limit = 10
    } = req.query;

    const query = {};
    if (assignee) query.assigneeId = assignee;
    if (status) query.status = status;
    if (team) query.teamId = team;
    if (dueBefore) query.dueDate = { $lte: new Date(dueBefore) };
    if (priority) query.priority = priority;

    const skip = (page - 1) * limit;

    const tasks = await Task.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('assigneeId', 'name email')
        .populate('createdBy', 'name email');

    const total = await Task.countDocuments(query);

    res.json({
        success: true,
        message: 'Tasks retrieved successfully',
        data: { tasks },
        meta: {
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit)
            }
        }
    });
};

exports.getTaskById = async (req, res) => {
    const task = await Task.findById(req.params.id)
        .populate('assigneeId', 'name email')
        .populate('createdBy', 'name email');

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
    const { title, description, assigneeId, dueDate, priority, status } = req.body;
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

    const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { $set: updates },
        { new: true }
    ).populate('assigneeId', 'name email');

    await createActivityLog({
        type: 'task_updated',
        taskId: task._id,
        teamId: task.teamId,
        userId: req.user.id,
        metadata: { 
            title: task.title,
            updates: Object.keys(updates)
        }
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
        type: 'task_deleted',
        taskId: task._id,
        teamId: task.teamId,
        userId: req.user.id,
        metadata: { title: task.title }
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
        userId: req.user.id,
        createdAt: new Date()
    };

    task.comments = task.comments || [];
    task.comments.push(comment);
    await task.save();

    await createActivityLog({
        type: 'comment_added',
        taskId: task._id,
        teamId: task.teamId,
        userId: req.user.id,
        metadata: { taskTitle: task.title }
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
    res.status(501).json({
        success: false,
        message: 'File upload not implemented yet'
    });
};
