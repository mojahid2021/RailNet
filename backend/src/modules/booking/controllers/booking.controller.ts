/**
 * Booking Controller
 * 
 * Handles ticket booking endpoints
 */

import { FastifyInstance } from 'fastify';
import { bookingService } from '../services/booking.service';
import { BookTicketSchema } from '../dtos';
import { ResponseHandler, ErrorHandlerUtil } from '../../../shared/utils';
import { authenticateUser } from '../../../shared/middleware/auth.middleware';

export async function bookingRoutes(app: FastifyInstance) {
  // Book Ticket
  app.post('/book-ticket', {
    preHandler: authenticateUser,
    schema: {
      description: 'Book a train ticket',
      tags: ['booking'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['scheduleId', 'compartmentId', 'seatNumber', 'fromStationId', 'toStationId'],
        properties: {
          scheduleId: { type: 'string', format: 'uuid' },
          compartmentId: { type: 'string', format: 'uuid' },
          seatNumber: { type: 'string' },
          fromStationId: { type: 'string', format: 'uuid' },
          toStationId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                scheduleId: { type: 'string' },
                compartmentId: { type: 'string' },
                seatNumber: { type: 'string' },
                fromStationId: { type: 'string' },
                toStationId: { type: 'string' },
                price: { type: 'number' },
                status: { type: 'string' },
                bookingDate: { type: 'string' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const data = BookTicketSchema.parse(request.body);
      const userId = (request as { user: { id: string } }).user.id;
      const booking = await bookingService.bookTicket(userId, data);
      return ResponseHandler.created(reply, booking, 'Ticket booked successfully');
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error);
    }
  });
}
