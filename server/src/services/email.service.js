const nodemailer = require('nodemailer');
const settingsService = require('./settings.service');

class EmailService {
    constructor() {
        this.transporter = null;
        this.defaultFrom = null;
        this.initializeTransporter();
    }

    async initializeTransporter() {
        try {
            const emailSettings = await settingsService.getEmailSettings();
            const { host, port, user, password, from } = emailSettings;

            if (!host || !port || !user || !password) {
                console.warn('Email settings not fully configured');
                return;
            }

            this.transporter = nodemailer.createTransport({
                host,
                port: Number(port),
                secure: Number(port) === 465,
                auth: {
                    user,
                    pass: password
                }
            });

            this.defaultFrom = from || user;

            await this.transporter.verify();
            console.log('✅ Email service initialized');
        } catch (error) {
            console.error('Failed to initialize email transporter:', error);
            this.transporter = null;
        }
    }

    async ensureTransporter() {
        if (!this.transporter) {
            await this.initializeTransporter();
        }
        if (!this.transporter) {
            throw new Error('Email service not configured');
        }
    }

    async sendMail(options) {
        await this.ensureTransporter();

        const info = await this.transporter.sendMail({
            from: `"TaskHive" <${this.defaultFrom}>`,
            ...options
        });

        return info;
    }

    async sendPasswordResetEmail(params) {
        const { to, name, resetUrl, expiresIn } = params;
        const subject = 'TaskHive — Password reset';
        const html = `
            <p>Hi ${name || ''},</p>
            <p>You requested a password reset. Click the link below to set a new password. This link expires in ${expiresIn || '15 minutes'}.</p>
            <p><a href="${resetUrl}">Reset password</a></p>
            <p>If you did not request this, ignore this email.</p>
            <p>— TaskHive</p>
        `;
        const text = `Reset your password: ${resetUrl}`;

        return this.sendMail({ to, subject, html, text });
    }

    async sendTaskAssignmentEmail(params) {
        const { to, name, taskTitle, taskUrl } = params;
        const subject = 'TaskHive — New Task Assignment';
        const html = `
            <p>Hi ${name || ''},</p>
            <p>You have been assigned a new task: <strong>${taskTitle}</strong></p>
            <p><a href="${taskUrl}">View task details</a></p>
            <p>— TaskHive</p>
        `;
        const text = `You have been assigned a new task: ${taskTitle}\nView task: ${taskUrl}`;

        return this.sendMail({ to, subject, html, text });
    }

    async sendTeamInviteEmail(params) {
        const { to, name, teamName, inviteUrl } = params;
        const subject = 'TaskHive — Team Invitation';
        const html = `
            <p>Hi ${name || ''},</p>
            <p>You have been invited to join the team: <strong>${teamName}</strong></p>
            <p><a href="${inviteUrl}">Accept invitation</a></p>
            <p>— TaskHive</p>
        `;
        const text = `You have been invited to join the team: ${teamName}\nAccept invitation: ${inviteUrl}`;

        return this.sendMail({ to, subject, html, text });
    }

    async sendTaskDueReminderEmail(params) {
        const { to, name, taskTitle, taskUrl, dueDate } = params;
        const subject = 'TaskHive — Task Due Soon';
        const html = `
            <p>Hi ${name || ''},</p>
            <p>This is a reminder that your task <strong>${taskTitle}</strong> is due on ${dueDate}.</p>
            <p><a href="${taskUrl}">View task details</a></p>
            <p>— TaskHive</p>
        `;
        const text = `Reminder: Your task "${taskTitle}" is due on ${dueDate}\nView task: ${taskUrl}`;

        return this.sendMail({ to, subject, html, text });
    }


}

module.exports = new EmailService();