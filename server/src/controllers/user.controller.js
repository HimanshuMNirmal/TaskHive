const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Task = require('../models/task.model');
const Team = require('../models/team.model');
const Notification = require('../models/notification.model');
const ActivityLog = require('../models/activityLog.model');

exports.getCurrentUser = async (req, res) => {
    const user = await User.findById(req.user.id)
        .select('-password');

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
        const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
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
        req.user.id,
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
    const { notifications, emailPreferences, theme, language } = req.body;
    const updates = { settings: {} };

    if (notifications !== undefined) updates.settings.notifications = notifications;
    if (emailPreferences) updates.settings.emailPreferences = emailPreferences;
    if (theme) updates.settings.theme = theme;
    if (language) updates.settings.language = language;

    const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updates },
        { new: true }
    ).select('-password');

    res.json({
        success: true,
        message: 'Settings updated successfully',
        data: { settings: user.settings }
    });
};

exports.updateUserPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
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
        'members.userId': req.user.id
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('members.userId', 'name email avatar')
        .populate('createdBy', 'name email');

    const total = await Team.countDocuments({ 'members.userId': req.user.id });

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
    const query = { assigneeId: req.user.id };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (dueDate) query.dueDate = { $lte: new Date(dueDate) };

    const tasks = await Task.find(query)
        .sort({ dueDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('teamId', 'name')
        .populate('createdBy', 'name email');

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

    const query = { userId: req.user.id };
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
        userId: req.user.id,
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
        req.user.id,
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
    const query = { userId: req.user.id };

    if (startDate && endDate) {
        query.timestamp = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    const activities = await ActivityLog.find(query)
        .sort({ timestamp: -1 })
        .populate('taskId', 'title')
        .populate('teamId', 'name');

    const summary = {
        totalActivities: activities.length,
        byType: {},
        byTeam: {},
        byPeriod: {
            daily: {},
            weekly: {},
            monthly: {}
        }
    };

    activities.forEach(activity => {
        summary.byType[activity.type] = (summary.byType[activity.type] || 0) + 1;

        if (activity.teamId) {
            const teamName = activity.teamId.name;
            summary.byTeam[teamName] = (summary.byTeam[teamName] || 0) + 1;
        }

        const date = new Date(activity.timestamp);
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

    const user = await User.findById(req.user.id);
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
        type: 'account_deactivated',
        userId: req.user.id,
        timestamp: new Date()
    });

    res.json({
        success: true,
        message: 'Account deactivated successfully'
    });
};
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return `${d.getUTCFullYear()}-W${Math.ceil((((d - yearStart) / 86400000) + 1) / 7)}`;
}
