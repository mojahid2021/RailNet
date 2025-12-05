import prisma from '../lib/prisma';

export interface CleanupResult {
  expiredTickets: number;
  cancelledTransactions: number;
  errors: string[];
}

export class BookingCleanupService {
  /**
   * Clean up expired pending bookings
   * @param expiryMinutes - Number of minutes after which bookings expire (default: 10)
   */
  async cleanupExpiredBookings(expiryMinutes: number = 10): Promise<CleanupResult> {
    const result: CleanupResult = {
      expiredTickets: 0,
      cancelledTransactions: 0,
      errors: [],
    };

    try {
      // Calculate the cutoff time
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - expiryMinutes);

      // Find tickets that are pending and expired
      const expiredTickets = await prisma.ticket.findMany({
        where: {
          status: 'pending',
          paymentStatus: 'pending',
          createdAt: {
            lt: cutoffTime,
          },
          expiresAt: {
            lt: new Date(),
          },
        },
        include: {
          paymentTransactions: true,
          seat: true,
        },
      });

      for (const ticket of expiredTickets) {
        try {
          // Update ticket status to expired
          await prisma.ticket.update({
            where: { id: ticket.id },
            data: {
              status: 'expired',
              paymentStatus: 'expired',
            },
          });

          // Cancel all associated payment transactions
          for (const transaction of ticket.paymentTransactions) {
            if (transaction.status === 'INITIATED' || transaction.status === 'PENDING') {
              await prisma.paymentTransaction.update({
                where: { id: transaction.id },
                data: {
                  status: 'CANCELLED',
                  errorMessage: 'Booking expired due to payment timeout',
                  completedAt: new Date(),
                },
              });

              // Log the cancellation
              await prisma.paymentLog.create({
                data: {
                  transactionId: transaction.id,
                  action: 'EXPIRED',
                  details: {
                    reason: 'Booking expired due to payment timeout',
                    expiryMinutes,
                    expiredAt: new Date().toISOString(),
                  },
                },
              });

              result.cancelledTransactions++;
            }
          }

          // Mark the seat as available again
          if (ticket.seat) {
            await prisma.seat.update({
              where: { id: ticket.seat.id },
              data: {
                isAvailable: true,
              },
            });
          }

          result.expiredTickets++;
        } catch (error) {
          const errorMessage = `Failed to cleanup ticket ${ticket.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMessage);
          console.error(errorMessage);
        }
      }
    } catch (error) {
      const errorMessage = `Cleanup process failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMessage);
      console.error(errorMessage);
    }

    return result;
  }

  /**
   * Get statistics about pending bookings
   */
  async getPendingBookingsStats(): Promise<{
    totalPending: number;
    expiringSoon: number; // Within next 5 minutes
    expired: number;
  }> {
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    const [totalPending, expiringSoon, expired] = await Promise.all([
      prisma.ticket.count({
        where: {
          status: 'pending',
          paymentStatus: 'pending',
        },
      }),
      prisma.ticket.count({
        where: {
          status: 'pending',
          paymentStatus: 'pending',
          expiresAt: {
            lte: fiveMinutesFromNow,
            gt: now,
          },
        },
      }),
      prisma.ticket.count({
        where: {
          status: 'pending',
          paymentStatus: 'pending',
          expiresAt: {
            lt: now,
          },
        },
      }),
    ]);

    return {
      totalPending,
      expiringSoon,
      expired,
    };
  }

  /**
   * Manually expire a specific booking
   */
  async expireBooking(ticketId: number): Promise<boolean> {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          paymentTransactions: true,
          seat: true,
        },
      });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      if (ticket.status !== 'pending' || ticket.paymentStatus !== 'pending') {
        throw new Error('Ticket is not in pending status');
      }

      // Update ticket status
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'expired',
          paymentStatus: 'expired',
        },
      });

      // Cancel payment transactions
      for (const transaction of ticket.paymentTransactions) {
        if (transaction.status === 'INITIATED' || transaction.status === 'PENDING') {
          await prisma.paymentTransaction.update({
            where: { id: transaction.id },
            data: {
              status: 'CANCELLED',
              errorMessage: 'Booking manually expired',
              completedAt: new Date(),
            },
          });

          await prisma.paymentLog.create({
            data: {
              transactionId: transaction.id,
              action: 'EXPIRED',
              details: {
                reason: 'Booking manually expired',
                expiredAt: new Date().toISOString(),
              },
            },
          });
        }
      }

      // Make seat available
      if (ticket.seat) {
        await prisma.seat.update({
          where: { id: ticket.seat.id },
          data: {
            isAvailable: true,
          },
        });
      }

      return true;
    } catch (error) {
      console.error(`Failed to expire booking ${ticketId}:`, error);
      return false;
    }
  }
}

export const bookingCleanupService = new BookingCleanupService();
