const cron = require('node-cron');
const ZReportService = require('./zReportService');

class ZReportScheduler {
  static start() {
    // Run daily at 11:30 PM (23:30) - after business hours but before midnight
    // This ensures all receipts from the day are included
    // Configurable via env: Z_REPORT_SCHEDULE (cron format)
    const scheduleTime = process.env.Z_REPORT_SCHEDULE || '30 23 * * *'; // Default: 11:30 PM daily
    
    console.log(`📅 Z-Report Scheduler: Will run daily at ${scheduleTime} (cron format)`);
    
    cron.schedule(scheduleTime, async () => {
      try {
        console.log('📊 Starting daily Z-Report submission for all tenants...');
        const result = await ZReportService.submitZReportsForAllTenants();
        
        const successful = result.results.filter(r => r.success).length;
        const failed = result.results.filter(r => !r.success && !r.skipped).length;
        const skipped = result.results.filter(r => r.skipped).length;
        
        console.log(`✅ Z-Report submission completed:`);
        console.log(`   - Total tenants: ${result.totalTenants}`);
        console.log(`   - Successful: ${successful}`);
        console.log(`   - Failed: ${failed}`);
        console.log(`   - Skipped: ${skipped}`);
        
        if (failed > 0) {
          console.error('❌ Some Z-Reports failed:');
          result.results
            .filter(r => !r.success && !r.skipped)
            .forEach(r => {
              console.error(`   - Tenant ${r.tenantName} (${r.tenantId}): ${r.error}`);
            });
        }
      } catch (error) {
        console.error('❌ Error running Z-Report job:', error);
      }
    });

    // For development/testing: also run on startup if env var is set
    if (process.env.RUN_Z_REPORT_ON_STARTUP === 'true') {
      setTimeout(async () => {
        try {
          console.log('🧪 Running Z-Report on startup (testing mode)...');
          await ZReportService.submitZReportsForAllTenants();
        } catch (error) {
          console.error('❌ Error running startup Z-Report:', error);
        }
      }, 10000); // Wait 10 seconds after startup
    }
  }

  static stop() {
    // Cron jobs don't have a direct stop method
    // This is a placeholder for future implementation
  }
}

module.exports = ZReportScheduler;

