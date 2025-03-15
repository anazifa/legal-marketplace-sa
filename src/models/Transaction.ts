import mongoose from 'mongoose';

export interface ITransaction extends mongoose.Document {
  legalRequest: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  lawyer: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'held' | 'released' | 'refunded' | 'cancelled';
  paymentMethod: string;
  paymentId: string;
  escrowReleaseDate?: Date;
  currency: string;
  fees: {
    platform: number;
    payment: number;
    vat: number;
  };
}

const transactionSchema = new mongoose.Schema({
  legalRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LegalRequest',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    required: true
  },
  amount: { 
    type: Number, 
    required: true 
  },
  status: {
    type: String,
    enum: ['pending', 'held', 'released', 'refunded', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    required: true
  },
  paymentId: {
    type: String,
    required: true
  },
  escrowReleaseDate: {
    type: Date
  },
  currency: {
    type: String,
    default: 'SAR'
  },
  fees: {
    platform: { type: Number, required: true },
    payment: { type: Number, required: true },
    vat: { type: Number, required: true }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Calculate total amount including fees
transactionSchema.virtual('totalAmount').get(function() {
  return this.amount + this.fees.platform + this.fees.payment + this.fees.vat;
});

// Index for querying
transactionSchema.index({ client: 1, lawyer: 1, status: 1 });

// Middleware to validate amount
transactionSchema.pre('save', function(next) {
  if (this.amount <= 0) {
    next(new Error('Transaction amount must be greater than 0'));
  }
  next();
});

export default mongoose.model<ITransaction>('Transaction', transactionSchema); 