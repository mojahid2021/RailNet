import { FastifyInstance } from 'fastify';
import { paymentService } from '../services/paymentService';
import { bookingCleanupService } from '../services/cleanupService';
import {
  errorResponseSchema,
  initiatePaymentBodySchema,
  paymentInitiationResponseSchema,
  paymentCallbackQuerySchema,
  paymentSuccessResponseSchema,
} from '../schemas/index.js';

async function paymentRoutes(fastify: FastifyInstance) {
  // Initiate payment - Authenticated users
  fastify.post(
    '/payments/initiate',
    {
      preHandler: (fastify as any).authenticate,
      schema: {
        description: 'Initiate SSLCommerz payment for a ticket',
        tags: ['Payments'],
        security: [{ bearerAuth: [] }],
        body: initiatePaymentBodySchema,
        response: {
          200: paymentInitiationResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = (request.user as { id: number }).id;
      const body = request.body as { ticketId: string };

      try {
        const result = await paymentService.initiatePayment({
          ticketId: body.ticketId,
          userId,
          currency: 'BDT',
        });

        reply.send(result);
      } catch (error) {
        console.error('Payment initiation error:', error);
        reply.code(400).send({
          error: error instanceof Error ? error.message : 'Payment initiation failed',
        });
      }
    },
  );

  // Payment success callback - Public endpoint
  fastify.get(
    '/payments/success',
    {
      schema: {
        description: 'SSLCommerz success callback',
        tags: ['Payments'],
        querystring: paymentCallbackQuerySchema,
        response: {
          200: paymentSuccessResponseSchema,
          400: paymentSuccessResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const query = request.query as { tran_id?: string; val_id?: string; error?: string };

      if (!query.tran_id || !query.val_id) {
        const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Payment Error</title></head>
        <body>
          <h1>Payment Error</h1>
          <p>Invalid payment callback parameters.</p>
          <a href="/">Go back to home</a>
        </body>
        </html>
      `;
        return reply.code(400).type('text/html').send(errorHtml);
      }

      try {
        await paymentService.handlePaymentSuccess(query.tran_id, query.val_id);

        const successHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Payment Successful</title></head>
        <body>
          <h1>Payment Successful!</h1>
          <p>Your ticket has been confirmed. You will receive a confirmation email shortly.</p>
          <a href="/">Go back to home</a>
        </body>
        </html>
      `;
        reply.type('text/html').send(successHtml);
      } catch (error) {
        console.error('Payment success handling error:', error);

        const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Payment Processing Error</title></head>
        <body>
          <h1>Payment Processing Error</h1>
          <p>There was an error processing your payment. Please contact support.</p>
          <a href="/">Go back to home</a>
        </body>
        </html>
      `;
        reply.code(400).type('text/html').send(errorHtml);
      }
    },
  );

  // Payment failure callback - Public endpoint
  fastify.get(
    '/payments/fail',
    {
      schema: {
        description: 'SSLCommerz failure callback',
        tags: ['Payments'],
        querystring: {
          type: 'object',
          properties: {
            tran_id: { type: 'string' },
            error: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'string',
            description: 'HTML failure page',
          },
        },
      },
    },
    async (request, reply) => {
      const query = request.query as { tran_id?: string; val_id?: string; error?: string };

      if (query.tran_id) {
        try {
          await paymentService.handlePaymentFailure(query.tran_id, query.error);
        } catch (error) {
          console.error('Payment failure handling error:', error);
        }
      }

      const failureHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>Payment Failed</title></head>
      <body>
        <h1>Payment Failed</h1>
        <p>Your payment was not successful. Please try again.</p>
        <a href="/">Go back to home</a>
      </body>
      </html>
    `;
      reply.type('text/html').send(failureHtml);
    },
  );

  // Payment cancel callback - Public endpoint
  fastify.get(
    '/payments/cancel',
    {
      schema: {
        description: 'SSLCommerz cancel callback',
        tags: ['Payments'],
        querystring: {
          type: 'object',
          properties: {
            tran_id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'string',
            description: 'HTML cancel page',
          },
        },
      },
    },
    async (request, reply) => {
      const query = request.query as { tran_id?: string; val_id?: string; error?: string };

      if (query.tran_id) {
        try {
          await paymentService.handlePaymentCancel(query.tran_id);
        } catch (error) {
          console.error('Payment cancel handling error:', error);
        }
      }

      const cancelHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>Payment Cancelled</title></head>
      <body>
        <h1>Payment Cancelled</h1>
        <p>You have cancelled the payment process.</p>
        <a href="/">Go back to home</a>
      </body>
      </html>
    `;
      reply.type('text/html').send(cancelHtml);
    },
  );

  // IPN (Instant Payment Notification) - Public endpoint
  fastify.post(
    '/payments/ipn',
    {
      schema: {
        description: 'SSLCommerz IPN callback',
        tags: ['Payments'],
        body: {
          type: 'object',
          properties: {
            val_id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as { val_id?: string };

      if (!body.val_id) {
        return reply.code(400).send({ status: 'FAILED', message: 'Missing val_id' });
      }

      try {
        await paymentService.processIPN(body.val_id);
        reply.send({ status: 'SUCCESS' });
      } catch (error) {
        console.error('IPN processing error:', error);
        reply.code(400).send({ status: 'FAILED', message: 'IPN processing failed' });
      }
    },
  );

  // Manual cleanup endpoint - Admin only (for testing)
  fastify.post(
    '/payments/cleanup',
    {
      preHandler: (fastify as any).authenticate,
      schema: {
        description: 'Manually run cleanup of expired bookings (Admin only)',
        tags: ['Payments'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              expiredTickets: { type: 'number' },
              cancelledTransactions: { type: 'number' },
              errors: { type: 'array', items: { type: 'string' } },
            },
          },
          403: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const user = request.user as { role: string };

      if (user.role !== 'admin') {
        return reply.code(403).send({ error: 'Admin access required' });
      }

      try {
        const result = await bookingCleanupService.cleanupExpiredBookings(
          parseInt(process.env.BOOKING_EXPIRY_MINUTES || '10'),
        );
        reply.send(result);
      } catch (error) {
        console.error('Manual cleanup error:', error);
        reply.code(500).send({
          error: error instanceof Error ? error.message : 'Cleanup failed',
        });
      }
    },
  );

  // Get cleanup stats - Admin only
  fastify.get(
    '/payments/cleanup/stats',
    {
      preHandler: (fastify as any).authenticate,
      schema: {
        description: 'Get pending booking statistics (Admin only)',
        tags: ['Payments'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              totalPending: { type: 'number' },
              expiringSoon: { type: 'number' },
              expired: { type: 'number' },
            },
          },
          403: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const user = request.user as { role: string };

      if (user.role !== 'admin') {
        return reply.code(403).send({ error: 'Admin access required' });
      }

      try {
        const stats = await bookingCleanupService.getPendingBookingsStats();
        reply.send(stats);
      } catch (error) {
        console.error('Stats retrieval error:', error);
        reply.code(500).send({
          error: error instanceof Error ? error.message : 'Stats retrieval failed',
        });
      }
    },
  );
}

export default paymentRoutes;
