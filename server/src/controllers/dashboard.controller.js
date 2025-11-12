const Task = require('../models/task.model');
const Team = require('../models/team.model');
const ActivityLog = require('../models/activityLog.model');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');

exports.getDashboardData = async (req, res) => {
    const userId = req.user._id;
    const organizationId = req.user.organizationId;
    const dueBefore = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [
        allTasks,
        dueSoonTasks,
        teams,
        activities,
        notifications,
        currentUser
    ] = await Promise.all([
        Task.countDocuments({
            $or: [
                { assigneeId: userId },
                { teamId: { $in: await Team.find({ 'members.userId': userId }).distinct('_id') } }
            ]
        }),

        Task.find({
            dueDate: { $lte: dueBefore },
            $or: [
                { assigneeId: userId },
                { teamId: { $in: await Team.find({ 'members.userId': userId }).distinct('_id') } }
            ]
        })
            .sort({ dueDate: 1 })
            .limit(5)
            .populate('assigneeId', 'name')
            .populate('teamId', 'name')
            .lean(),

        Team.find({
            'members.userId': userId
        })
            .select('name members settings')
            .lean(),

        ActivityLog.find({
            $or: [
                { userId },
                {
                    entityType: 'task',
                    entityId: {
                        $in: await Task.find({
                            $or: [
                                { assigneeId: userId },
                                { teamId: { $in: await Team.find({ 'members.userId': userId }).distinct('_id') } }
                            ]
                        }).distinct('_id')
                    }
                },
                {
                    entityType: 'team',
                    entityId: {
                        $in: await Team.find({ 'members.userId': userId }).distinct('_id')
                    }
                }
            ]
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('userId', 'name')
            .lean(),

        Notification.find({
            userId: userId,
            isRead: false,
            dismissedAt: null
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),

        User.findById(userId)
            .select('name email role settings organizationId')
            .lean()
    ]);

    res.json({
        success: true,
        data: {
            user: currentUser,
            tasks: {
                total: allTasks,
                dueSoon: dueSoonTasks
            },
            teams,
            activities,
            notifications
        }
    });
};