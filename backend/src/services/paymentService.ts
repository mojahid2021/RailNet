import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createSSLCommerzClient, PaymentRequest, ValidationResponse } from '../utils/sslcommerz';
import { addMinutes } from 'date-fns';

const prisma = new PrismaClient();
const sslcommerz = createSSLCommerzClient();

export interface PaymentData {
  ticketId: string; // Now using ticketId instead of number
  userId: number;
  currency: string;
}

export class PaymentService {
  async initiatePayment(paymentData: PaymentData): Promise<{
    paymentUrl: string;
    transactionId: string;
  }> {
    const { ticketId, userId, currency } = paymentData;

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Use user details with defaults for missing fields
    const customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    const customerEmail = user.email;
    const customerPhone = '+880000000000'; // Default phone - should be added to user profile
    const customerAddress = 'Not provided'; // Default address - should be added to user profile
    const customerCity = 'Dhaka'; // Default city
    const customerCountry = 'Bangladesh'; // Default country

    // Check if ticket exists and is in pending status
    const ticket = await prisma.ticket.findUnique({
      where: { ticketId },
      include: { user: true, trainSchedule: { include: { train: true, trainRoute: true } } }
    });

    console.log('Payment initiation - ticketId:', ticketId, 'userId:', userId);
    console.log('Found ticket:', ticket ? 'YES' : 'NO', ticket?.ticketId, ticket?.userId, ticket?.paymentStatus);

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.paymentStatus !== 'pending') {
      throw new Error('Ticket is not in pending payment status');
    }

    if (ticket.userId !== userId) {
      throw new Error('Unauthorized access to ticket');
    }

    // Use ticket price as payment amount
    const paymentAmount = ticket.price;

    // Generate transaction ID
    const transactionId = `TXN_${Date.now()}_${ticketId}`;

    // Create payment transaction record
    const paymentTransaction = await prisma.paymentTransaction.create({
      data: {
        id: transactionId,
        ticketId: ticket.id, // Use numeric database ID for foreign key
        transactionId,
        amount: paymentAmount,
        currency,
        status: 'INITIATED',
        paymentMethod: 'SSLCOMMERZ',
        metadata: {
          ticketId: ticket.ticketId, // Store human-readable ticket ID in metadata
          customerName,
          customerEmail,
          customerPhone,
          customerAddress,
          customerCity,
          customerCountry,
        },
      },
    });

    // Prepare SSLCommerz payment request
    const sslPaymentData: PaymentRequest = {
      total_amount: paymentAmount,
      currency,
      tran_id: transactionId,
      success_url: process.env.SSLCOMMERZ_SUCCESS_URL!,
      fail_url: process.env.SSLCOMMERZ_FAIL_URL!,
      cancel_url: process.env.SSLCOMMERZ_CANCEL_URL!,
      ipn_url: process.env.SSLCOMMERZ_IPN_URL!,
      cus_name: customerName,
      cus_email: customerEmail,
      cus_phone: customerPhone,
      cus_add1: customerAddress,
      cus_city: customerCity,
      cus_country: customerCountry,
      shipping_method: 'NO',
      num_of_item: 1,
      product_name: `Train Ticket - ${ticket.trainSchedule.train.name}`,
      product_category: 'Transport',
      product_profile: 'general',
      value_a: ticketId.toString(), // Store ticket ID for callback reference
    };

    try {
      const sslResponse = await sslcommerz.initiatePayment(sslPaymentData);

      if (sslResponse.status !== 'SUCCESS') {
        // Update transaction status to failed
        await prisma.paymentTransaction.update({
          where: { id: transactionId },
          data: {
            status: 'FAILED',
            errorMessage: sslResponse.failedreason || sslResponse.error,
          },
        });
        throw new Error(`Payment initiation failed: ${sslResponse.failedreason || sslResponse.error}`);
      }

      // Update transaction with session key
      await prisma.paymentTransaction.update({
        where: { id: transactionId },
        data: {
          sessionKey: sslResponse.sessionkey,
          gatewayUrl: sslResponse.GatewayPageURL,
        },
      });

      // Log payment initiation
      await prisma.paymentLog.create({
        data: {
          transactionId,
          action: 'INITIATED',
          details: {
            sessionKey: sslResponse.sessionkey,
            gatewayUrl: sslResponse.GatewayPageURL,
          },
        },
      });

      return {
        paymentUrl: sslResponse.GatewayPageURL!,
        transactionId,
      };
    } catch (error) {
      // Update transaction status to failed
      await prisma.paymentTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  async handlePaymentSuccess(transactionId: string, valId: string): Promise<void> {
    try {
      // Validate payment with SSLCommerz
      const validationResponse: ValidationResponse = await sslcommerz.validatePayment(valId);

      if (validationResponse.status !== 'VALID' && validationResponse.status !== 'VALIDATED') {
        throw new Error(`Payment validation failed: ${validationResponse.error}`);
      }

      // Get transaction
      const transaction = await prisma.paymentTransaction.findUnique({
        where: { id: transactionId },
        include: { ticket: true },
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status === 'COMPLETED') {
        return; // Already processed
      }

      // Update transaction status
      await prisma.paymentTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'COMPLETED',
          valId,
          bankTransactionId: validationResponse.bank_tran_id,
          cardType: validationResponse.card_type,
          completedAt: new Date(),
        },
      });

      // Update ticket status
      await prisma.ticket.update({
        where: { id: transaction.ticketId },
        data: {
          paymentStatus: 'PAID',
          confirmedAt: new Date(),
        },
      });

      // Log successful payment
      await prisma.paymentLog.create({
        data: {
          transactionId,
          action: 'COMPLETED',
          details: {
            valId,
            bankTranId: validationResponse.bank_tran_id,
            amount: validationResponse.amount,
            currency: validationResponse.currency,
          },
        },
      });
    } catch (error) {
      console.error('Payment success handling error:', error);
      throw error;
    }
  }

  async handlePaymentFailure(transactionId: string, errorMessage?: string): Promise<void> {
    try {
      // Update transaction status
      await prisma.paymentTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'FAILED',
          errorMessage,
          completedAt: new Date(),
        },
      });

      // Log failed payment
      await prisma.paymentLog.create({
        data: {
          transactionId,
          action: 'FAILED',
          details: {
            errorMessage,
          },
        },
      });
    } catch (error) {
      console.error('Payment failure handling error:', error);
      throw error;
    }
  }

  async handlePaymentCancel(transactionId: string): Promise<void> {
    try {
      // Update transaction status
      await prisma.paymentTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'CANCELLED',
          completedAt: new Date(),
        },
      });

      // Log cancelled payment
      await prisma.paymentLog.create({
        data: {
          transactionId,
          action: 'CANCELLED',
          details: {},
        },
      });
    } catch (error) {
      console.error('Payment cancel handling error:', error);
      throw error;
    }
  }

  async processIPN(valId: string): Promise<void> {
    try {
      // Validate payment with SSLCommerz
      const validationResponse: ValidationResponse = await sslcommerz.validatePayment(valId);

      if (validationResponse.status !== 'VALID' && validationResponse.status !== 'VALIDATED') {
        throw new Error(`IPN validation failed: ${validationResponse.error}`);
      }

      const transactionId = validationResponse.tran_id!;

      // Get transaction
      const transaction = await prisma.paymentTransaction.findUnique({
        where: { id: transactionId },
        include: { ticket: true },
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status === 'COMPLETED') {
        return; // Already processed
      }

      // Update transaction and ticket
      await this.handlePaymentSuccess(transactionId, valId);
    } catch (error) {
      console.error('IPN processing error:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();