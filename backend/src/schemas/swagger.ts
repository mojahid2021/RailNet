export const swaggerSchemas: Record<string, any> = {
  Error: {
    type: 'object',
    properties: {
      error: {
        type: 'string',
        description: 'Error message',
      },
    },
    required: ['error'],
  },
  User: {
    type: 'object',
    properties: {
      id: { type: 'number' },
      email: { type: 'string', format: 'email' },
      name: { type: 'string' },
      role: { type: 'string', enum: ['user', 'admin'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  Station: {
    type: 'object',
    properties: {
      id: { type: 'number' },
      name: { type: 'string' },
      code: { type: 'string' },
      city: { type: 'string' },
      state: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  Compartment: {
    type: 'object',
    properties: {
      id: { type: 'number' },
      class: { type: 'string', enum: ['Economy', 'Business', 'First'] },
      type: { type: 'string' },
      capacity: { type: 'number' },
      price: { type: 'number' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  PaymentTransaction: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      ticketId: { type: 'number' },
      transactionId: { type: 'string' },
      amount: { type: 'number' },
      currency: { type: 'string' },
      status: { type: 'string', enum: ['INITIATED', 'COMPLETED', 'FAILED', 'CANCELLED'] },
      paymentMethod: { type: 'string' },
      bankTransactionId: { type: 'string' },
      valId: { type: 'string' },
      cardType: { type: 'string' },
      completedAt: { type: 'string', format: 'date-time' },
      gatewayUrl: { type: 'string' },
      errorMessage: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  PaymentLog: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      transactionId: { type: 'string' },
      action: {
        type: 'string',
        enum: ['INITIATED', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED'],
      },
      details: { type: 'object' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
};
