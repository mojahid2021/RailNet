import { userSchema } from './auth.js';
import { trainScheduleSchema } from './trainSchedule.js';
import { stationSchema } from './station.js';
import { compartmentSchema } from './compartment.js';

export const ticketSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    ticketId: { type: 'string' },
    userId: { type: 'number' },
    user: userSchema,
    trainScheduleId: { type: 'number' },
    trainSchedule: trainScheduleSchema,
    fromStationId: { type: 'number' },
    fromStation: stationSchema,
    toStationId: { type: 'number' },
    toStation: stationSchema,
    seatId: { type: 'number' },
    trainCompartmentId: { type: 'number' },
    seatNumber: { type: 'string' },
    seat: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        seatNumber: { type: 'string' },
        seatType: { type: 'string' },
        row: { type: 'number' },
        column: { type: 'string' },
        trainCompartment: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            compartment: compartmentSchema,
          },
        },
      },
    },
    passengerName: { type: 'string' },
    passengerAge: { type: 'number' },
    passengerGender: { type: 'string' },
    price: { type: 'number' },
    status: { type: 'string' },
    paymentStatus: { type: 'string', enum: ['pending', 'paid', 'failed', 'cancelled', 'expired'] },
    expiresAt: { type: 'string', format: 'date-time' },
    confirmedAt: { type: 'string', format: 'date-time' },
    bookedAt: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

export const ticketWithTimestampsSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    ticketId: { type: 'string' },
    userId: { type: 'number' },
    user: userSchema,
    trainScheduleId: { type: 'number' },
    trainSchedule: trainScheduleSchema,
    fromStationId: { type: 'number' },
    fromStation: stationSchema,
    toStationId: { type: 'number' },
    toStation: stationSchema,
    seatId: { type: 'number' },
    trainCompartmentId: { type: 'number' },
    seatNumber: { type: 'string' },
    seat: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        seatNumber: { type: 'string' },
        seatType: { type: 'string' },
        row: { type: 'number' },
        column: { type: 'string' },
        trainCompartment: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            compartment: compartmentSchema,
          },
        },
      },
    },
    passengerName: { type: 'string' },
    passengerAge: { type: 'number' },
    passengerGender: { type: 'string' },
    price: { type: 'number' },
    status: { type: 'string' },
    paymentStatus: { type: 'string', enum: ['pending', 'paid', 'failed', 'cancelled', 'expired'] },
    expiresAt: { type: 'string', format: 'date-time' },
    confirmedAt: { type: 'string', format: 'date-time' },
    bookedAt: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

export const bookTicketBodySchema = {
  type: 'object',
  required: ['trainScheduleId', 'fromStationId', 'toStationId', 'compartmentId', 'seatNumber', 'passengerName', 'passengerAge', 'passengerGender'],
  properties: {
    trainScheduleId: { type: 'number' },
    fromStationId: { type: 'number' },
    toStationId: { type: 'number' },
    compartmentId: { type: 'number' },
    seatNumber: { type: 'string' },
    passengerName: { type: 'string' },
    passengerAge: { type: 'number', minimum: 1, maximum: 120 },
    passengerGender: { type: 'string', enum: ['Male', 'Female', 'Other'] },
  },
};