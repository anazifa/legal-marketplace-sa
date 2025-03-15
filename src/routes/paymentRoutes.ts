import express from 'express';
import { auth } from '../middleware/auth';
import {
  createPaymentIntent,
  handlePaymentSuccess,
  releaseEscrow,
  refundPayment,
} from '../controllers/paymentController';

const router = express.Router();

// Create payment intent
router.post('/create-payment-intent', auth, createPaymentIntent);

// Handle successful payment
router.post('/payment-success', auth, handlePaymentSuccess);

// Release escrow to lawyer
router.post('/release-escrow/:transactionId', auth, releaseEscrow);

// Process refund
router.post('/refund/:transactionId', auth, refundPayment);

export default router; 