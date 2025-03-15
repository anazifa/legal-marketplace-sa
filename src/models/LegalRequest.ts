import mongoose from 'mongoose';

export interface ILegalRequest extends mongoose.Document {
  client: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  budget: {
    min: number;
    max: number;
  };
  deadline: Date;
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  language: string;
  attachments: string[];
  bids: Array<{
    lawyer: mongoose.Types.ObjectId;
    amount: number;
    proposal: string;
    timeframe: number;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
  }>;
  selectedBid?: mongoose.Types.ObjectId;
  urgency: 'low' | 'medium' | 'high';
}

const legalRequestSchema = new mongoose.Schema({
  client: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client', 
    required: true 
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  budget: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  deadline: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['open', 'in-progress', 'completed', 'cancelled'],
    default: 'open'
  },
  language: { 
    type: String, 
    enum: ['ar', 'en', 'both'],
    default: 'ar'
  },
  attachments: [{ type: String }],
  bids: [{
    lawyer: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Lawyer', 
      required: true 
    },
    amount: { type: Number, required: true },
    proposal: { type: String, required: true },
    timeframe: { type: Number, required: true }, // in days
    status: { 
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: { type: Date, default: Date.now }
  }],
  selectedBid: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lawyer' 
  },
  urgency: { 
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  createdAt: { type: Date, default: Date.now }
});

// Index for searching
legalRequestSchema.index({ title: 'text', description: 'text' });

// Middleware to validate budget
legalRequestSchema.pre('save', function(next) {
  if (this.budget.min > this.budget.max) {
    next(new Error('Minimum budget cannot be greater than maximum budget'));
  }
  next();
});

export default mongoose.model<ILegalRequest>('LegalRequest', legalRequestSchema); 