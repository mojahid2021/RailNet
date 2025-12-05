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

// Professional booking response schema - clean and organized
export const ticketBookingResponseSchema = {
  type: 'object',
  properties: {
    ticket: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        ticketId: { type: 'string' },
        status: { type: 'string' },
        paymentStatus: { type: 'string', enum: ['pending', 'paid', 'failed', 'cancelled', 'expired'] },
        expiresAt: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
      },
      required: ['id', 'ticketId', 'status', 'paymentStatus', 'expiresAt', 'createdAt'],
    },
    passenger: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
        gender: { type: 'string' },
      },
      required: ['name', 'age', 'gender'],
    },
    journey: {
      type: 'object',
      properties: {
        train: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            number: { type: 'string' },
          },
          required: ['name', 'number'],
        },
        route: {
          type: 'object',
          properties: {
            from: { type: 'string' },
            to: { type: 'string' },
          },
          required: ['from', 'to'],
        },
        schedule: {
          type: 'object',
          properties: {
            date: { type: 'string', format: 'date' },
            departureTime: { type: 'string' },
          },
          required: ['date', 'departureTime'],
        },
      },
      required: ['train', 'route', 'schedule'],
    },
    seat: {
      type: 'object',
      properties: {
        number: { type: 'string' },
        compartment: { type: 'string' },
        class: { type: 'string' },
      },
      required: ['number', 'compartment', 'class'],
    },
    pricing: {
      type: 'object',
      properties: {
        amount: { type: 'number' },
        currency: { type: 'string', default: 'BDT' },
      },
      required: ['amount', 'currency'],
    },
  },
  required: ['ticket', 'passenger', 'journey', 'seat', 'pricing'],
};

// Simplified ticket list item schema for listings
export const ticketListItemSchema = {
  type: 'object',
  properties: {
    ticket: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        ticketId: { type: 'string' },
        status: { type: 'string' },
        paymentStatus: { type: 'string', enum: ['pending', 'paid', 'failed', 'cancelled', 'expired'] },
        createdAt: { type: 'string', format: 'date-time' },
      },
      required: ['id', 'ticketId', 'status', 'paymentStatus', 'createdAt'],
    },
    journey: {
      type: 'object',
      properties: {
        train: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            number: { type: 'string' },
          },
          required: ['name', 'number'],
        },
        route: {
          type: 'object',
          properties: {
            from: { type: 'string' },
            to: { type: 'string' },
          },
          required: ['from', 'to'],
        },
        schedule: {
          type: 'object',
          properties: {
            date: { type: 'string', format: 'date' },
            departureTime: { type: 'string' },
          },
          required: ['date', 'departureTime'],
        },
      },
      required: ['train', 'route', 'schedule'],
    },
    seat: {
      type: 'object',
      properties: {
        number: { type: 'string' },
        compartment: { type: 'string' },
      },
      required: ['number', 'compartment'],
    },
    pricing: {
      type: 'object',
      properties: {
        amount: { type: 'number' },
        currency: { type: 'string', default: 'BDT' },
      },
      required: ['amount', 'currency'],
    },
  },
  required: ['ticket', 'journey', 'seat', 'pricing'],
};

export const ticketsListResponseSchema = {
  type: 'array',
  items: ticketListItemSchema,
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