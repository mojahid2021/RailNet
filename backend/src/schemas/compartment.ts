export const compartmentSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    class: { type: 'string' },
    type: { type: 'string' },
    price: { type: 'number' },
    totalSeats: { type: 'number' },
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
    totalSeats: { type: 'number' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

export const createCompartmentBodySchema = {
  type: 'object',
  required: ['name', 'class', 'type', 'price', 'totalSeats'],
  properties: {
    name: { type: 'string' },
    class: { type: 'string' },
    type: { type: 'string' },
    price: { type: 'number', minimum: 0 },
    totalSeats: { type: 'number', minimum: 1 },
  },
};