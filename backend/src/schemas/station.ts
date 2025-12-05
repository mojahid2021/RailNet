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

export const createStationBodySchema = {
  type: 'object',
  required: ['name', 'city', 'latitude', 'longitude'],
  properties: {
    name: {
      type: 'string',
      description: 'Station name',
    },
    city: {
      type: 'string',
      description: 'City where the station is located',
    },
    latitude: {
      type: 'number',
      description: 'Latitude coordinate',
      minimum: -90,
      maximum: 90,
    },
    longitude: {
      type: 'number',
      description: 'Longitude coordinate',
      minimum: -180,
      maximum: 180,
    },
  },
};

export const stationsListResponseSchema = {
  type: 'array',
  items: stationWithTimestampsSchema,
};