import { trainSchema } from './train.js';
import { trainRouteSchema } from './trainRoute.js';
import { stationSchema } from './station.js';

export const scheduleStationSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    trainScheduleId: { type: 'number' },
    stationId: { type: 'number' },
    station: stationSchema,
    arrivalTime: { type: 'string', nullable: true },
    departureTime: { type: 'string', nullable: true },
    sequence: { type: 'number' },
  },
};

export const trainScheduleSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    trainId: { type: 'number' },
    trainRouteId: { type: 'number' },
    train: trainSchema,
    trainRoute: trainRouteSchema,
    date: { type: 'string', format: 'date-time' },
    time: { type: 'string' },
    stationTimes: {
      type: 'array',
      items: scheduleStationSchema,
    },
  },
};

export const trainScheduleWithTimestampsSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    trainId: { type: 'number' },
    trainRouteId: { type: 'number' },
    train: trainSchema,
    trainRoute: trainRouteSchema,
    date: { type: 'string', format: 'date-time' },
    time: { type: 'string' },
    stationTimes: {
      type: 'array',
      items: scheduleStationSchema,
    },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

export const createTrainScheduleBodySchema = {
  type: 'object',
  required: ['trainId', 'date', 'time', 'stationTimes'],
  properties: {
    trainId: { type: 'number' },
    date: { type: 'string', format: 'date' },
    time: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
    stationTimes: {
      type: 'array',
      minItems: 2,
      items: {
        type: 'object',
        required: ['stationId', 'arrivalTime', 'departureTime'],
        properties: {
          stationId: { type: 'number' },
          arrivalTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
          departureTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
        },
      },
    },
  },
};