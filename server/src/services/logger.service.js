class AccessLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
  }

  log(user, action, ip, status) {
    const logEntry = {
      timestamp: new Date(),
      user: user?.name || 'Anonymous',
      action,
      ip,
      status
    };

    this.logs.unshift(logEntry);

    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    return logEntry;
  }

  getLogs(limit = 100) {
    return this.logs.slice(0, limit);
  }

  clear() {
    this.logs = [];
  }
}

const accessLogger = new AccessLogger();

module.exports = {
  accessLogger
};