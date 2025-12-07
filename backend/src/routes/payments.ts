import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma';
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

      // Construct base URL from request
      const protocol = request.protocol;
      const host = request.headers.host;
      const baseUrl = `${protocol}://${host}`;

      try {
        const result = await paymentService.initiatePayment({
          ticketId: body.ticketId,
          userId,
          currency: 'BDT',
          baseUrl,
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

      if (!query.tran_id) {
        const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Payment Error</title></head>
        <body>
          <h1>Payment Error</h1>
          <p>Invalid payment callback parameters. Transaction ID is missing.</p>
          <a href="/">Go back to home</a>
        </body>
        </html>
      `;
        return reply.code(400).type('text/html').send(errorHtml);
      }

      try {
        // If val_id is not provided, try to get it from the transaction
        let valId = query.val_id;
        if (!valId) {
          // Get val_id from transaction record if available
          const transaction = await prisma.paymentTransaction.findUnique({
            where: { id: query.tran_id },
            select: { valId: true },
          });
          valId = transaction?.valId || undefined;
        }

        if (!valId) {
          throw new Error('Validation ID not found. Payment may not be completed yet.');
        }

        await paymentService.handlePaymentSuccess(query.tran_id, valId);

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
          <p>There was an error processing your payment: ${error instanceof Error ? error.message : 'Unknown error'}. Please contact support.</p>
          <a href="/">Go back to home</a>
        </body>
        </html>
      `;
        reply.code(400).type('text/html').send(errorHtml);
      }
    },
  );

  // Payment success callback - Public endpoint (POST) - for cases where SSLCommerz sends POST
  fastify.post(
    '/payments/success',
    {
      schema: {
        description: 'SSLCommerz success callback (POST)',
        tags: ['Payments'],
        consumes: ['application/x-www-form-urlencoded'],
        body: paymentCallbackQuerySchema,
        response: {
          200: paymentSuccessResponseSchema,
          400: paymentSuccessResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const body = request.body as { tran_id?: string; val_id?: string; error?: string };

      if (!body.tran_id) {
        const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Payment Error</title></head>
        <body>
          <h1>Payment Error</h1>
          <p>Invalid payment callback parameters. Transaction ID is missing.</p>
          <a href="/">Go back to home</a>
        </body>
        </html>
      `;
        return reply.code(400).type('text/html').send(errorHtml);
      }

      try {
        // If val_id is not provided, try to get it from the transaction
        let valId = body.val_id;
        if (!valId) {
          // Get val_id from transaction record if available
          const transaction = await prisma.paymentTransaction.findUnique({
            where: { id: body.tran_id },
            select: { valId: true },
          });
          valId = transaction?.valId || undefined;
        }

        if (!valId) {
          throw new Error('Validation ID not found. Payment may not be completed yet.');
        }

        await paymentService.handlePaymentSuccess(body.tran_id, valId);

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
          <p>There was an error processing your payment: ${error instanceof Error ? error.message : 'Unknown error'}. Please contact support.</p>
          <a href="/">Go back to home</a>
        </body>
        </html>
      `;
        reply.code(400).type('text/html').send(errorHtml);
      }
    },
  );

  // Payment failure callback - Public endpoint (GET)
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

  // Payment failure callback - Public endpoint (POST)
  fastify.post(
    '/payments/fail',
    {
      schema: {
        description: 'SSLCommerz failure callback (POST)',
        tags: ['Payments'],
        consumes: ['application/x-www-form-urlencoded'],
        body: {
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
      const body = request.body as { tran_id?: string; val_id?: string; error?: string };

      if (body.tran_id) {
        try {
          await paymentService.handlePaymentFailure(body.tran_id, body.error);
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

  // Payment cancel callback - Public endpoint (GET)
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

  // Payment cancel callback - Public endpoint (POST)
  fastify.post(
    '/payments/cancel',
    {
      schema: {
        description: 'SSLCommerz cancel callback (POST)',
        tags: ['Payments'],
        consumes: ['application/x-www-form-urlencoded'],
        body: {
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
      const body = request.body as { tran_id?: string; val_id?: string; error?: string };

      if (body.tran_id) {
        try {
          await paymentService.handlePaymentCancel(body.tran_id);
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
            tran_id: { type: 'string' },
            amount: { type: 'string' },
            card_type: { type: 'string' },
            store_amount: { type: 'string' },
            bank_tran_id: { type: 'string' },
            status: { type: 'string' },
            tran_date: { type: 'string' },
            currency: { type: 'string' },
            card_issuer: { type: 'string' },
            card_brand: { type: 'string' },
            card_issuer_country: { type: 'string' },
            card_issuer_country_code: { type: 'string' },
            store_id: { type: 'string' },
            verify_sign: { type: 'string' },
            verify_key: { type: 'string' },
            risk_level: { type: 'string' },
            risk_title: { type: 'string' },
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
      const body = request.body as { val_id?: string; tran_id?: string; [key: string]: any };

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

  // Get all payment transactions - Admin only
  fastify.get(
    '/payments/transactions',
    {
      preHandler: (fastify as any).authenticate,
      schema: {
        description: 'Get all payment transactions (Admin only)',
        tags: ['Payments'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            status: {
              type: 'string',
              enum: ['INITIATED', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED']
            },
            userId: { type: 'integer' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              transactions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    ticketId: { type: 'number' },
                    transactionId: { type: 'string' },
                    amount: { type: 'number' },
                    currency: { type: 'string' },
                    status: { type: 'string' },
                    paymentMethod: { type: 'string' },
                    valId: { type: 'string' },
                    bankTransactionId: { type: 'string' },
                    cardType: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    completedAt: { type: 'string', format: 'date-time' },
                    ticket: {
                      type: 'object',
                      properties: {
                        ticketId: { type: 'string' },
                        passengerName: { type: 'string' },
                        status: { type: 'string' },
                        paymentStatus: { type: 'string' },
                        price: { type: 'number' },
                        user: {
                          type: 'object',
                          properties: {
                            id: { type: 'number' },
                            email: { type: 'string' },
                            firstName: { type: 'string' },
                            lastName: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'integer' },
                  limit: { type: 'integer' },
                  total: { type: 'integer' },
                  totalPages: { type: 'integer' },
                },
              },
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

      const query = request.query as {
        page?: number;
        limit?: number;
        status?: string;
        userId?: number;
        startDate?: string;
        endDate?: string;
      };

      const page = query.page || 1;
      const limit = query.limit || 20;
      const offset = (page - 1) * limit;

      try {
        // Build where clause
        const where: any = {};

        if (query.status) {
          where.status = query.status;
        }

        if (query.userId) {
          where.ticket = {
            userId: query.userId,
          };
        }

        if (query.startDate || query.endDate) {
          where.createdAt = {};
          if (query.startDate) {
            where.createdAt.gte = new Date(query.startDate);
          }
          if (query.endDate) {
            where.createdAt.lte = new Date(query.endDate + 'T23:59:59.999Z');
          }
        }

        // Get total count
        const total = await prisma.paymentTransaction.count({ where });

        // Get transactions with pagination
        const transactions = await prisma.paymentTransaction.findMany({
          where,
          include: {
            ticket: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        });

        const totalPages = Math.ceil(total / limit);

        reply.send({
          transactions,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        });
      } catch (error) {
        console.error('Transaction retrieval error:', error);
        reply.code(500).send({
          error: error instanceof Error ? error.message : 'Transaction retrieval failed',
        });
      }
    },
  );

  // Get specific payment transaction by ID - Admin only
  fastify.get(
    '/payments/transactions/:id',
    {
      preHandler: (fastify as any).authenticate,
      schema: {
        description: 'Get specific payment transaction by ID (Admin only)',
        tags: ['Payments'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              ticketId: { type: 'number' },
              transactionId: { type: 'string' },
              amount: { type: 'number' },
              currency: { type: 'string' },
              status: { type: 'string' },
              paymentMethod: { type: 'string' },
              valId: { type: 'string' },
              bankTransactionId: { type: 'string' },
              cardType: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              completedAt: { type: 'string', format: 'date-time' },
              errorMessage: { type: 'string' },
              metadata: { type: 'object' },
              ticket: {
                type: 'object',
                properties: {
                  ticketId: { type: 'string' },
                  passengerName: { type: 'string' },
                  passengerAge: { type: 'number' },
                  passengerGender: { type: 'string' },
                  status: { type: 'string' },
                  paymentStatus: { type: 'string' },
                  price: { type: 'number' },
                  createdAt: { type: 'string', format: 'date-time' },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      email: { type: 'string' },
                      firstName: { type: 'string' },
                      lastName: { type: 'string' },
                      phone: { type: 'string' },
                    },
                  },
                  trainSchedule: {
                    type: 'object',
                    properties: {
                      date: { type: 'string', format: 'date-time' },
                      time: { type: 'string' },
                      train: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          number: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
              logs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    action: { type: 'string' },
                    details: { type: 'object' },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          403: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          404: {
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

      const params = request.params as { id: string };

      try {
        // Get transaction with full details
        const transaction = await prisma.paymentTransaction.findUnique({
          where: { id: params.id },
          include: {
            ticket: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                  },
                },
                trainSchedule: {
                  include: {
                    train: {
                      select: {
                        name: true,
                        number: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (!transaction) {
          return reply.code(404).send({ error: 'Transaction not found' });
        }

        // Get payment logs for this transaction
        const logs = await prisma.paymentLog.findMany({
          where: { transactionId: params.id },
          orderBy: { createdAt: 'desc' },
        });

        reply.send({
          ...transaction,
          logs,
        });
      } catch (error) {
        console.error('Transaction detail retrieval error:', error);
        reply.code(500).send({
          error: error instanceof Error ? error.message : 'Transaction detail retrieval failed',
        });
      }
    },
  );
}

export default paymentRoutes;
