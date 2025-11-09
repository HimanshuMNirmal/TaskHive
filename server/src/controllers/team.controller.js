const Team = require('../models/team.model');
const { createActivityLog } = require('./activityLog.controller');

exports.createTeam = async (req, res) => {
    const { name, description } = req.body;

    const team = new Team({
        name,
        description,
        createdBy: req.user.id,
        members: [{
            userId: req.user.id,
            role: 'admin'
        }]
    });

    await team.save();

    await createActivityLog({
        type: 'team_created',
        teamId: team._id,
        userId: req.user.id,
        metadata: { teamName: team.name }
    });

    res.status(201).json({
        success: true,
        message: 'Team created successfully',
        data: { team }
    });
};

exports.getTeams = async (req, res) => {
    const teams = await Team.find({
        'members.userId': req.user.id
    })
    .populate('members.userId', 'name email')
    .populate('createdBy', 'name email');

    res.json({
        success: true,
        message: 'Teams retrieved successfully',
        data: { teams }
    });
};

exports.getTeamById = async (req, res) => {
    const team = await Team.findById(req.params.id)
        .populate('members.userId', 'name email')
        .populate('createdBy', 'name email');

    if (!team) {
        return res.status(404).json({
            success: false,
            message: 'Team not found'
        });
    }

    const isMember = team.members.some(member => 
        member.userId._id.toString() === req.user.id
    );

    if (!isMember) {
        return res.status(403).json({
            success: false,
            message: 'Access denied'
        });
    }

    res.json({
        success: true,
        message: 'Team retrieved successfully',
        data: { team }
    });
};

exports.updateTeam = async (req, res) => {
    const { name, description } = req.body;
    const teamId = req.params.id;

    const team = await Team.findById(teamId);
    if (!team) {
        return res.status(404).json({
            success: false,
            message: 'Team not found'
        });
    }

    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;

    const updatedTeam = await Team.findByIdAndUpdate(
        teamId,
        { $set: updates },
        { new: true }
    )
    .populate('members.userId', 'name email')
    .populate('createdBy', 'name email');

    await createActivityLog({
        type: 'team_updated',
        teamId: team._id,
        userId: req.user.id,
        metadata: { 
            teamName: team.name,
            updates: Object.keys(updates)
        }
    });

    res.json({
        success: true,
        message: 'Team updated successfully',
        data: { team: updatedTeam }
    });
};

exports.deleteTeam = async (req, res) => {
    const team = await Team.findById(req.params.id);
    if (!team) {
        return res.status(404).json({
            success: false,
            message: 'Team not found'
        });
    }

    await Team.deleteOne({ _id: req.params.id });

    await createActivityLog({
        type: 'team_deleted',
        userId: req.user.id,
        metadata: { teamName: team.name }
    });

    res.json({
        success: true,
        message: 'Team deleted successfully'
    });
};

exports.addTeamMember = async (req, res) => {
    const { userId, role } = req.body;
    const teamId = req.params.id;

    const team = await Team.findById(teamId);
    if (!team) {
        return res.status(404).json({
            success: false,
            message: 'Team not found'
        });
    }

    if (team.members.some(member => member.userId.toString() === userId)) {
        return res.status(400).json({
            success: false,
            message: 'User is already a team member'
        });
    }

    team.members.push({ userId, role });
    await team.save();

    const updatedTeam = await Team.findById(teamId)
        .populate('members.userId', 'name email')
        .populate('createdBy', 'name email');

    await createActivityLog({
        type: 'member_added',
        teamId: team._id,
        userId: req.user.id,
        metadata: { 
            teamName: team.name,
            memberRole: role
        }
    });

    res.json({
        success: true,
        message: 'Team member added successfully',
        data: { team: updatedTeam }
    });
};

exports.removeTeamMember = async (req, res) => {
    const { id: teamId, userId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) {
        return res.status(404).json({
            success: false,
            message: 'Team not found'
        });
    }

    const adminCount = team.members.filter(m => m.role === 'admin').length;
    const memberToRemove = team.members.find(m => m.userId.toString() === userId);

    if (memberToRemove?.role === 'admin' && adminCount <= 1) {
        return res.status(400).json({
            success: false,
            message: 'Cannot remove the last admin'
        });
    }

    team.members = team.members.filter(member => 
        member.userId.toString() !== userId
    );

    await team.save();

    const updatedTeam = await Team.findById(teamId)
        .populate('members.userId', 'name email')
        .populate('createdBy', 'name email');

    await createActivityLog({
        type: 'member_removed',
        teamId: team._id,
        userId: req.user.id,
        metadata: { teamName: team.name }
    });

    res.json({
        success: true,
        message: 'Team member removed successfully',
        data: { team: updatedTeam }
    });
};

exports.updateMemberRole = async (req, res) => {
    const { id: teamId, userId } = req.params;
    const { role } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
        return res.status(404).json({
            success: false,
            message: 'Team not found'
        });
    }

    const adminCount = team.members.filter(m => m.role === 'admin').length;
    const member = team.members.find(m => m.userId.toString() === userId);

    if (member?.role === 'admin' && role !== 'admin' && adminCount <= 1) {
        return res.status(400).json({
            success: false,
            message: 'Cannot change role of the last admin'
        });
    }

    team.members = team.members.map(member => 
        member.userId.toString() === userId
            ? { ...member, role }
            : member
    );

    await team.save();

    const updatedTeam = await Team.findById(teamId)
        .populate('members.userId', 'name email')
        .populate('createdBy', 'name email');

    await createActivityLog({
        type: 'member_role_updated',
        teamId: team._id,
        userId: req.user.id,
        metadata: { 
            teamName: team.name,
            newRole: role
        }
    });

    res.json({
        success: true,
        message: 'Member role updated successfully',
        data: { team: updatedTeam }
    });
};
