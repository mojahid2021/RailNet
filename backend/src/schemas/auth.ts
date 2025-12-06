export const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    email: { type: 'string' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    phone: { type: 'string' },
    address: { type: 'string' },
    role: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const authResponseSchema = {
  type: 'object',
  properties: {
    user: userSchema,
    token: { type: 'string' },
  },
};

export const registerBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6 },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    phone: { type: 'string' },
    address: { type: 'string' },
    role: { type: 'string', enum: ['user', 'admin'] },
  },
};

export const loginBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string' },
  },
};
