import { trainRouteSchema } from './trainRoute.js';
import { compartmentSchema } from './compartment.js';

export const trainCompartmentSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    trainId: { type: 'number' },
    compartmentId: { type: 'number' },
    quantity: { type: 'number' },
    compartment: compartmentSchema,
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

export const trainSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    number: { type: 'string' },
    trainRouteId: { type: 'number' },
    trainRoute: trainRouteSchema,
    compartments: {
      type: 'array',
      items: trainCompartmentSchema,
    },
  },
};

export const trainWithTimestampsSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    number: { type: 'string' },
    trainRouteId: { type: 'number' },
    trainRoute: trainRouteSchema,
    compartments: {
      type: 'array',
      items: trainCompartmentSchema,
    },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

export const createTrainBodySchema = {
  type: 'object',
  required: ['name', 'number', 'trainRouteId', 'compartments'],
  properties: {
    name: { type: 'string' },
    number: { type: 'string' },
    trainRouteId: { type: 'number' },
    compartments: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['compartmentId'],
        properties: {
          compartmentId: { type: 'number' },
          quantity: { type: 'number', minimum: 1, default: 1 },
        },
      },
    },
  },
};