import * as cron from 'node-cron';
import { bookingCleanupService } from './cleanupService';

class CleanupJobs {
  private cleanupTask: cron.ScheduledTask | null = null;
  private statsTask: cron.ScheduledTask | null = null;

  /**
   * Start the cleanup jobs
   */
  start(): void {
    // Run cleanup every 5 minutes
    this.cleanupTask = cron.schedule('*/5 * * * *', async () => {
      console.log('[Cleanup Job] Starting scheduled cleanup of expired bookings...');

      try {
        const result = await bookingCleanupService.cleanupExpiredBookings(
          parseInt(process.env.BOOKING_EXPIRY_MINUTES || '10'),
        );

        console.log(
          `[Cleanup Job] Completed: ${result.expiredTickets} tickets expired, ${result.cancelledTransactions} transactions cancelled`,
        );

        if (result.errors.length > 0) {
          console.error('[Cleanup Job] Errors encountered:', result.errors);
        }
      } catch (error) {
        console.error('[Cleanup Job] Failed:', error);
      }
    });

    // Log stats every 10 minutes
    this.statsTask = cron.schedule('*/10 * * * *', async () => {
      try {
        const stats = await bookingCleanupService.getPendingBookingsStats();
        console.log(
          `[Stats] Pending bookings: ${stats.totalPending}, Expiring soon: ${stats.expiringSoon}, Expired: ${stats.expired}`,
        );
      } catch (error) {
        console.error('[Stats Job] Failed to get stats:', error);
      }
    });

    console.log('[Cleanup Jobs] Started - Cleanup every 5 minutes, Stats every 10 minutes');
  }

  /**
   * Stop the cleanup jobs
   */
  stop(): void {
    if (this.cleanupTask) {
      this.cleanupTask.stop();
      this.cleanupTask = null;
    }

    if (this.statsTask) {
      this.statsTask.stop();
      this.statsTask = null;
    }

    console.log('[Cleanup Jobs] Stopped');
  }

  /**
   * Run cleanup manually (for testing or immediate cleanup)
   */
  async runCleanupNow(): Promise<void> {
    console.log('[Manual Cleanup] Starting immediate cleanup...');

    try {
      const result = await bookingCleanupService.cleanupExpiredBookings(
        parseInt(process.env.BOOKING_EXPIRY_MINUTES || '10'),
      );

      console.log(
        `[Manual Cleanup] Completed: ${result.expiredTickets} tickets expired, ${result.cancelledTransactions} transactions cancelled`,
      );

      if (result.errors.length > 0) {
        console.error('[Manual Cleanup] Errors encountered:', result.errors);
      }
    } catch (error) {
      console.error('[Manual Cleanup] Failed:', error);
      throw error;
    }
  }

  /**
   * Get current status of cleanup jobs
   */
  getStatus(): {
    cleanupJobRunning: boolean;
    statsJobRunning: boolean;
  } {
    return {
      cleanupJobRunning: this.cleanupTask !== null,
      statsJobRunning: this.statsTask !== null,
    };
  }
}

// Export singleton instance
export const cleanupJobs = new CleanupJobs();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[Cleanup Jobs] Received SIGINT, stopping jobs...');
  cleanupJobs.stop();
});

process.on('SIGTERM', () => {
  console.log('[Cleanup Jobs] Received SIGTERM, stopping jobs...');
  cleanupJobs.stop();
});
