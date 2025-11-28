import { stationSchema } from './station.js';
import { routeStationSchema, routeStationWithDetailsSchema } from './routeStation.js';

export const trainRouteSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    startStationId: { type: 'number' },
    endStationId: { type: 'number' },
    startStation: stationSchema,
    endStation: stationSchema,
    routeStations: {
      type: 'array',
      items: routeStationSchema,
    },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

export const trainRouteWithDetailsSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    startStationId: { type: 'number' },
    endStationId: { type: 'number' },
    startStation: stationSchema,
    endStation: stationSchema,
    routeStations: {
      type: 'array',
      items: routeStationWithDetailsSchema,
    },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};