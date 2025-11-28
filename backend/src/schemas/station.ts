export const stationSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    city: { type: 'string' },
    latitude: { type: 'number' },
    longitude: { type: 'number' },
  },
};

export const stationWithTimestampsSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    city: { type: 'string' },
    latitude: { type: 'number' },
    longitude: { type: 'number' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};