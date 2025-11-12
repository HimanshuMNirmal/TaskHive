const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Task = require('../models/task.model');
const Team = require('../models/team.model');
const Notification = require('../models/notification.model');
const ActivityLog = require('../models/activityLog.model');

exports.getCurrentUser = async (req, res) => {
    const user = await User.findById(req.user._id)
        .select('-password')
        .populate('organizationId', 'name')
        .populate('role', 'name permissions')
        .populate('teamIds', 'name');

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    res.json({
        success: true,
        message: 'User profile retrieved successfully',
        data: { user }
    });
};

exports.updateUserProfile = async (req, res) => {
    const { name, email, avatar, bio } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) {
        const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email is already in use'
            });
        }
        updates.email = email;
    }
    if (avatar !== undefined) updates.avatar = avatar;
    if (bio !== undefined) updates.bio = bio;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true }
    ).select('-password');

    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
    });
};

exports.updateUserSettings = async (req, res) => {
    const { notifications, emailPreferences } = req.body;
    const updates = { settings: {} };

    if (notifications !== undefined) {
        updates.settings.notifications = notifications;
    }
    
    if (emailPreferences) {
        const validatedEmailPrefs = {};
        if (emailPreferences.taskAssignments !== undefined) {
            validatedEmailPrefs.taskAssignments = Boolean(emailPreferences.taskAssignments);
        }
        if (emailPreferences.teamUpdates !== undefined) {
            validatedEmailPrefs.teamUpdates = Boolean(emailPreferences.teamUpdates);
        }
        if (emailPreferences.reminders !== undefined) {
            validatedEmailPrefs.reminders = Boolean(emailPreferences.reminders);
        }
        updates.settings.emailPreferences = validatedEmailPrefs;
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true }
    )
    .select('-password')
    .populate('organizationId', 'name')
    .populate('role', 'name');

    res.json({
        success: true,
        message: 'Settings updated successfully',
        data: { settings: user.settings }
    });
};

exports.updateUserPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        return res.status(400).json({
            success: false,
            message: 'Current password is incorrect'
        });
    }

    user.password = newPassword;
    await user.save();

    res.json({
        success: true,
        message: 'Password updated successfully'
    });
};

exports.getUserTeams = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const teams = await Team.find({
        'members.userId': req.user._id
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('members.userId', 'name email avatar')
        .populate('ownerId', 'name email');

    const total = await Team.countDocuments({ 'members.userId': req.user._id });

    res.json({
        success: true,
        message: 'User teams retrieved successfully',
        data: { teams },
        meta: {
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit)
            }
        }
    });
};

exports.getUserTasks = async (req, res) => {
    const { 
        page = 1, 
        limit = 10,
        status,
        priority,
        dueDate 
    } = req.query;
    
    const skip = (page - 1) * limit;
    const query = { assigneeId: req.user._id };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (dueDate) query.dueDate = { $lte: new Date(dueDate) };

    const tasks = await Task.find(query)
        .sort({ dueDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('teamId', 'name')
        .populate('ownerId', 'name email');

    const total = await Task.countDocuments(query);

    res.json({
        success: true,
        message: 'User tasks retrieved successfully',
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

exports.getUserNotifications = async (req, res) => {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    if (unreadOnly === 'true') {
        query.read = false;
    }

    const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('taskId', 'title')
        .populate('teamId', 'name');

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
        userId: req.user._id,
        read: false
    });

    res.json({
        success: true,
        message: 'User notifications retrieved successfully',
        data: { notifications, unreadCount },
        meta: {
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit)
            }
        }
    });
};

exports.updateNotificationSettings = async (req, res) => {
    const { email, push, types } = req.body;
    
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                'settings.notifications.email': email,
                'settings.notifications.push': push,
                'settings.notifications.types': types || {}
            }
        },
        { new: true }
    ).select('-password');

    res.json({
        success: true,
        message: 'Notification settings updated successfully',
        data: { settings: user.settings.notifications }
    });
};

exports.getUserActivitySummary = async (req, res) => {
    const { startDate, endDate } = req.query;
    const query = { userId: req.user._id };

    if (startDate && endDate) {
        query.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    const activities = await ActivityLog.find(query)
        .sort({ createdAt: -1 });

    const summary = {
        totalActivities: activities.length,
        byType: {},
        byEntityType: {},
        byPeriod: {
            daily: {},
            weekly: {},
            monthly: {}
        }
    };

    activities.forEach(activity => {
        summary.byType[activity.action] = (summary.byType[activity.action] || 0) + 1;
        summary.byEntityType[activity.entityType] = (summary.byEntityType[activity.entityType] || 0) + 1;

        const date = new Date(activity.createdAt);
        const dayKey = date.toISOString().split('T')[0];
        const weekKey = getWeekNumber(date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        summary.byPeriod.daily[dayKey] = (summary.byPeriod.daily[dayKey] || 0) + 1;
        summary.byPeriod.weekly[weekKey] = (summary.byPeriod.weekly[weekKey] || 0) + 1;
        summary.byPeriod.monthly[monthKey] = (summary.byPeriod.monthly[monthKey] || 0) + 1;
    });

    res.json({
        success: true,
        message: 'User activity summary retrieved successfully',
        data: { activities, summary }
    });
};

exports.deactivateAccount = async (req, res) => {
    const { password } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({
            success: false,
            message: 'Password is incorrect'
        });
    }

    user.active = false;
    user.deactivatedAt = new Date();
    await user.save();

    await ActivityLog.create({
        userId: req.user._id,
        organizationId: req.user.organizationId,
        action: 'deleted',
        entityType: 'user',
        entityId: req.user._id
    });

    res.json({
        success: true,
        message: 'Account deactivated successfully'
    });
};

exports.getOrganizationUsers = async (req, res) => {
    const { search = '' } = req.query;
    
    const query = {
        organizationId: req.user.organizationId,
        _id: { $ne: req.user._id } 
    };

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    const users = await User.find(query)
        .select('_id name email avatar')
        .sort({ name: 1 });

    res.json({
        success: true,
        message: 'Organization users retrieved successfully',
        data: { users }
    });
};
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return `${d.getUTCFullYear()}-W${Math.ceil((((d - yearStart) / 86400000) + 1) / 7)}`;
}
