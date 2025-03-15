import { Request, Response } from 'express';
import Stripe from 'stripe';
import Transaction from '../models/Transaction';
import LegalRequest from '../models/LegalRequest';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { amount, legalRequestId } = req.body;

    const legalRequest = await LegalRequest.findById(legalRequestId);
    if (!legalRequest) {
      return res.status(404).json({ error: 'Legal request not found' });
    }

    // Calculate fees
    const platformFee = Math.round(amount * 0.05); // 5% platform fee
    const vatFee = Math.round((amount + platformFee) * 0.15); // 15% VAT
    const paymentFee = Math.round(amount * 0.025); // 2.5% payment processing fee
    const totalAmount = amount + platformFee + vatFee + paymentFee;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'sar',
      payment_method_types: ['card', 'mada'],
      metadata: {
        legalRequestId,
        platformFee,
        vatFee,
        paymentFee,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      totalAmount,
      breakdown: {
        baseAmount: amount,
        platformFee,
        vatFee,
        paymentFee,
      },
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ error: 'Error creating payment intent' });
  }
};

export const handlePaymentSuccess = async (req: Request, res: Response) => {
  try {
    const { paymentIntentId, legalRequestId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    const legalRequest = await LegalRequest.findById(legalRequestId);
    if (!legalRequest) {
      return res.status(404).json({ error: 'Legal request not found' });
    }

    // Create transaction record
    const transaction = new Transaction({
      legalRequest: legalRequestId,
      client: legalRequest.client,
      lawyer: legalRequest.selectedBid,
      amount: paymentIntent.amount,
      status: 'held',
      paymentMethod: paymentIntent.payment_method_types[0],
      paymentId: paymentIntentId,
      fees: {
        platform: paymentIntent.metadata.platformFee,
        payment: paymentIntent.metadata.paymentFee,
        vat: paymentIntent.metadata.vatFee,
      },
    });

    await transaction.save();

    // Update legal request status
    legalRequest.status = 'in-progress';
    await legalRequest.save();

    res.status(200).json({ message: 'Payment processed successfully' });
  } catch (error) {
    console.error('Payment success handling error:', error);
    res.status(500).json({ error: 'Error processing payment' });
  }
};

export const releaseEscrow = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId)
      .populate('lawyer')
      .populate('legalRequest');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.status !== 'held') {
      return res.status(400).json({ error: 'Invalid transaction status' });
    }

    // Transfer funds to lawyer's account
    const transfer = await stripe.transfers.create({
      amount: Math.round(transaction.amount * 0.95), // Excluding platform fee
      currency: 'sar',
      destination: (transaction.lawyer as any).stripeAccountId,
      transfer_group: transaction.legalRequest.toString(),
    });

    // Update transaction status
    transaction.status = 'released';
    transaction.escrowReleaseDate = new Date();
    await transaction.save();

    // Update legal request status
    const legalRequest = await LegalRequest.findById(transaction.legalRequest);
    if (legalRequest) {
      legalRequest.status = 'completed';
      await legalRequest.save();
    }

    res.status(200).json({ message: 'Funds released successfully' });
  } catch (error) {
    console.error('Escrow release error:', error);
    res.status(500).json({ error: 'Error releasing escrow' });
  }
};

export const refundPayment = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.status !== 'held') {
      return res.status(400).json({ error: 'Invalid transaction status' });
    }

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: transaction.paymentId,
      reason: reason || 'requested_by_customer',
    });

    // Update transaction status
    transaction.status = 'refunded';
    await transaction.save();

    // Update legal request status
    const legalRequest = await LegalRequest.findById(transaction.legalRequest);
    if (legalRequest) {
      legalRequest.status = 'cancelled';
      await legalRequest.save();
    }

    res.status(200).json({ message: 'Payment refunded successfully' });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: 'Error processing refund' });
  }
}; 