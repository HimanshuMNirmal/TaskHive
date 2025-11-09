const nodemailer = require('nodemailer');

const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
} = process.env;

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: Number(SMTP_PORT) === 465,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS
            }
        });
    }

    async sendMail({ to, subject, text, html }) {
        if (!this.transporter) {
            throw new Error("Email transporter not configured");
        }

        const info = await this.transporter.sendMail({
            from: `"TaskHive" <${SMTP_USER}>`,
            to,
            subject,
            text,
            html
        });

        return info;
    }

    async sendPasswordResetEmail({ to, name, resetUrl, expiresIn }) {
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

    async sendTaskAssignmentEmail({ to, name, taskTitle, taskUrl }) {
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

    async sendTeamInviteEmail({ to, name, teamName, inviteUrl }) {
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

    async sendTaskDueReminderEmail({ to, name, taskTitle, taskUrl, dueDate }) {
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