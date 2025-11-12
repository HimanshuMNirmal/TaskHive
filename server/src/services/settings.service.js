const Setting = require('../models/setting.model');

class SettingsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; 
    this.lastCacheUpdate = null;
  }

  async refreshCache() {
    const settings = await Setting.find().lean();
    this.cache.clear();
    
    settings.forEach(setting => {
      this.cache.set(setting.key, {
        value: setting.value,
        timestamp: Date.now()
      });
    });
    
    this.lastCacheUpdate = Date.now();
  }

  async getCachedValue(key) {
    if (!this.lastCacheUpdate || Date.now() - this.lastCacheUpdate > this.cacheTimeout) {
      await this.refreshCache();
    }

    const cached = this.cache.get(key);
    return cached?.value;
  }

  async getValue(key, defaultValue = null) {
    try {
      const cachedValue = await this.getCachedValue(key);
      if (cachedValue !== undefined) {
        return cachedValue;
      }

      const setting = await Setting.findOne({ key }).lean();
      if (!setting) {
        return defaultValue;
      }

      this.cache.set(key, {
        value: setting.value,
        timestamp: Date.now()
      });

      return setting.value;
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return defaultValue;
    }
  }

  async getEmailSettings() {
    const [host, port, user, password, from] = await Promise.all([
      this.getValue('smtp_host'),
      this.getValue('smtp_port'),
      this.getValue('smtp_user'),
      this.getValue('smtp_password'),
      this.getValue('email_from')
    ]);

    return { host, port, user, password, from };
  }

  async getSecuritySettings() {
    const [
      sessionTimeout,
      maxLoginAttempts,
      lockoutDuration,
      force2fa,
      passwordPolicy
    ] = await Promise.all([
      this.getValue('session_timeout'),
      this.getValue('max_login_attempts'),
      this.getValue('lockout_duration'),
      this.getValue('force_2fa'),
      this.getValue('password_policy')
    ]);

    return {
      sessionTimeout,
      maxLoginAttempts,
      lockoutDuration,
      force2fa,
      passwordPolicy
    };
  }

  async getMaintenanceSettings() {
    const [
      maintenanceMode,
      backupSchedule,
      logRetentionDays,
      maxUploadSize
    ] = await Promise.all([
      this.getValue('maintenance_mode'),
      this.getValue('backup_schedule'),
      this.getValue('log_retention_days'),
      this.getValue('max_upload_size')
    ]);

    return {
      maintenanceMode,
      backupSchedule,
      logRetentionDays,
      maxUploadSize
    };
  }

}

const settingsService = new SettingsService();

module.exports = settingsService;