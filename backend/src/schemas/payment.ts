// Payment related schemas
export const initiatePaymentBodySchema = {
  type: 'object',
  required: ['ticketId'],
  properties: {
    ticketId: {
      type: 'string',
      description: 'The ticket ID to initiate payment for',
    },
  },
};

export const paymentInitiationResponseSchema = {
  type: 'object',
  properties: {
    paymentUrl: {
      type: 'string',
      description: 'SSLCommerz payment URL to redirect user to',
    },
    transactionId: {
      type: 'string',
      description: 'Unique transaction ID for this payment',
    },
  },
  required: ['paymentUrl', 'transactionId'],
};

export const paymentCallbackQuerySchema = {
  type: 'object',
  properties: {
    tran_id: { type: 'string' },
    val_id: { type: 'string' },
    error: { type: 'string' },
  },
};

export const paymentSuccessResponseSchema = {
  type: 'string',
  description: 'HTML success page content',
};

export const paymentTransactionSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    ticketId: { type: 'number' },
    transactionId: { type: 'string' },
    amount: { type: 'number' },
    currency: { type: 'string' },
    status: {
      type: 'string',
      enum: ['INITIATED', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'],
    },
    paymentMethod: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: [
    'id',
    'ticketId',
    'transactionId',
    'amount',
    'currency',
    'status',
    'paymentMethod',
    'createdAt',
    'updatedAt',
  ],
};
