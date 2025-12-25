const cron = require('node-cron');
const DailyDigestService = require('./dailyDigestService');

class DigestScheduler {
  static start() {
    // Run daily at 11 PM (23:00) - configurable via env
    const scheduleTime = process.env.DIGEST_SCHEDULE || '0 23 * * *'; // Default: 11 PM daily
    
    cron.schedule(scheduleTime, async () => {
      try {
        await DailyDigestService.sendDailyDigestsToAllUsers();
      } catch (error) {
        console.error('❌ Error running daily digest job:', error);
      }
    });

    // For development/testing: also run on startup if env var is set
    if (process.env.RUN_DIGEST_ON_STARTUP === 'true') {
      setTimeout(async () => {
        try {
          await DailyDigestService.sendDailyDigestsToAllUsers();
        } catch (error) {
          console.error('❌ Error running startup digest:', error);
        }
      }, 5000); // Wait 5 seconds after startup
    }
  }

  static stop() {
    // Cron jobs don't have a direct stop method
    // This is a placeholder for future implementation
  }
}

module.exports = DigestScheduler;

