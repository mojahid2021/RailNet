import { stationSchema } from './station.js';

export const routeStationSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    previousStationId: { type: 'number', nullable: true },
    currentStationId: { type: 'number' },
    nextStationId: { type: 'number', nullable: true },
    distance: { type: 'number', nullable: true },
    distanceFromStart: { type: 'number' },
  },
};

export const routeStationWithDetailsSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    previousStationId: { type: 'number', nullable: true },
    currentStationId: { type: 'number' },
    nextStationId: { type: 'number', nullable: true },
    distance: { type: 'number', nullable: true },
    distanceFromStart: { type: 'number' },
    currentStation: stationSchema,
  },
};