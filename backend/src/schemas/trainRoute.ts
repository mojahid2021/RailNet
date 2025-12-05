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

export const createTrainRouteBodySchema = {
  type: 'object',
  required: ['name', 'stations'],
  properties: {
    name: {
      type: 'string',
      description: 'Name of the train route',
    },
    stations: {
      type: 'array',
      minItems: 2,
      description: 'List of stations in the route with distances',
      items: {
        type: 'object',
        required: ['stationId', 'distance'],
        properties: {
          stationId: {
            type: 'number',
            description: 'ID of the station',
          },
          distance: {
            type: 'number',
            minimum: 0,
            description: 'Distance from start in kilometers',
          },
        },
      },
    },
  },
};
