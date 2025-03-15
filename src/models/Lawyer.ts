import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ILawyer extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  specialization: string;
  experience: number;
  rating?: number;
  priceRange: string;
  verified: boolean;
  licenseNumber: string;
  languages: string[];
  location: {
    city: string;
    region: string;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const lawyerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  specialization: { type: String, required: true },
  experience: { type: Number, required: true },
  rating: { type: Number, default: 0 },
  priceRange: { type: String, required: true },
  verified: { type: Boolean, default: false },
  licenseNumber: { type: String, required: true, unique: true },
  languages: [{ type: String }],
  location: {
    city: { type: String, required: true },
    region: { type: String, required: true }
  },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
lawyerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
lawyerSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<ILawyer>('Lawyer', lawyerSchema); 