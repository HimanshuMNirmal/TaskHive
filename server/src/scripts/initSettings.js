const Setting = require('../models/setting.model');

const defaultSettings = [
  {
    key: 'client_url',
    value: process.env.CLIENT_URL || 'http://localhost:5173',
    description: 'Client application URL',
    category: 'general',
    isSecret: false
  },

  {
    key: 'smtp_host',
    value: process.env.SMTP_HOST || '',
    description: 'SMTP server host',
    category: 'email',
    isSecret: false
  },
  {
    key: 'smtp_port',
    value: process.env.SMTP_PORT || 587,
    description: 'SMTP server port',
    category: 'email',
    isSecret: false
  },
  {
    key: 'smtp_user',
    value: process.env.SMTP_USER || '',
    description: 'SMTP username',
    category: 'email',
    isSecret: false
  },
  {
    key: 'smtp_password',
    value: process.env.SMTP_PASSWORD || '',
    description: 'SMTP password',
    category: 'email',
    isSecret: true
  },
  {
    key: 'email_from',
    value: process.env.EMAIL_FROM || 'noreply@taskhive.com',
    description: 'Default from email address',
    category: 'email',
    isSecret: false
  },

  {
    key: 'jwt_secret',
    value: process.env.JWT_SECRET || '',
    description: 'Secret key for JWT token generation',
    category: 'security',
    isSecret: true
  },
  {
    key: 'jwt_expires_in',
    value: process.env.JWT_EXPIRES_IN || '7d',
    description: 'JWT token expiration time',
    category: 'security',
    isSecret: false
  },
  {
    key: 'rate_limit_window',
    value: process.env.RATE_LIMIT_WINDOW_MS || 900000,
    description: 'Rate limiting window in milliseconds',
    category: 'security',
    isSecret: false
  },
  {
    key: 'rate_limit_max_requests',
    value: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
    description: 'Maximum requests allowed in rate limit window',
    category: 'security',
    isSecret: false
  },
  {
    key: 'session_timeout',
    value: process.env.SESSION_TIMEOUT || 3600,
    description: 'Session timeout in seconds',
    category: 'security',
    isSecret: false
  },
  {
    key: 'max_login_attempts',
    value: process.env.MAX_LOGIN_ATTEMPTS || 5,
    description: 'Maximum number of login attempts before lockout',
    category: 'security',
    isSecret: false
  },
  {
    key: 'lockout_duration',
    value: process.env.LOCKOUT_DURATION || 900,
    description: 'Account lockout duration in seconds',
    category: 'security',
    isSecret: false
  },
  {
    key: 'force_2fa',
    value: process.env.FORCE_2FA === 'true',
    description: 'Require 2FA for all users',
    category: 'security',
    isSecret: false
  },
  {
    key: 'password_policy',
    value: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90 
    },
    description: 'Password policy configuration',
    category: 'security',
    isSecret: false
  },

  {
    key: 'maintenance_mode',
    value: false,
    description: 'Enable maintenance mode',
    category: 'maintenance',
    isSecret: false
  },
  {
    key: 'backup_schedule',
    value: '0 0 * * *',
    description: 'Backup schedule in cron format',
    category: 'maintenance',
    isSecret: false
  },
  {
    key: 'log_retention_days',
    value: 30,
    description: 'Number of days to retain logs',
    category: 'maintenance',
    isSecret: false
  },
  {
    key: 'max_upload_size',
    value: 10485760,
    description: 'Maximum file upload size in bytes',
    category: 'maintenance',
    isSecret: false
  }
];

async function initializeSettings() {
  try {
    console.log('Initializing system settings...');
    for (const setting of defaultSettings) {
      await Setting.setSetting(
        setting.key,
        setting.value,
        {
          description: setting.description,
          category: setting.category,
          isSecret: setting.isSecret
        }
      );
    }

    console.log('✅ System settings initialized successfully');
  } catch (error) {
    console.error('Error initializing settings:', error);
    throw error;
  }
}

module.exports = {
  initializeSettings,
  defaultSettings
};