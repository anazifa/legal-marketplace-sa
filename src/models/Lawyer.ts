import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ILawyer extends Document {
  name: string;
  email: string;
  password: string;
  specialization: string[];
  experience: number;
  rating: number;
  priceRange: {
    min: number;
    max: number;
  };
  verified: boolean;
  licenseNumber: string;
  languages: string[];
  location: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const lawyerSchema = new Schema<ILawyer>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  specialization: [{ type: String, required: true }],
  experience: { type: Number, required: true },
  rating: { type: Number, default: 0 },
  priceRange: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  verified: { type: Boolean, default: false },
  licenseNumber: { type: String, required: true, unique: true },
  languages: [{ type: String, required: true }],
  location: { type: String, required: true }
});

// Hash password before saving
lawyerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
lawyerSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const Lawyer = mongoose.model<ILawyer>('Lawyer', lawyerSchema); 