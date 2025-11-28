export const compartmentSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    class: { type: 'string' },
    type: { type: 'string' },
    price: { type: 'number' },
    seats: { type: 'number' },
  },
};

export const compartmentWithTimestampsSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    class: { type: 'string' },
    type: { type: 'string' },
    price: { type: 'number' },
    seats: { type: 'number' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

export const createCompartmentBodySchema = {
  type: 'object',
  required: ['name', 'class', 'type', 'price', 'seats'],
  properties: {
    name: { type: 'string' },
    class: { type: 'string' },
    type: { type: 'string' },
    price: { type: 'number', minimum: 0 },
    seats: { type: 'number', minimum: 1 },
  },
};