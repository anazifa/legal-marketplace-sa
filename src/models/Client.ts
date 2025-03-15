import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IClient extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  location: string;
  nationalId: string;
  preferredLanguage: 'en' | 'ar';
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const clientSchema = new Schema<IClient>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  location: { type: String, required: true },
  nationalId: { type: String, required: true, unique: true },
  preferredLanguage: { type: String, enum: ['en', 'ar'], default: 'ar' },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
clientSchema.pre('save', async function(next) {
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
clientSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const Client = mongoose.model<IClient>('Client', clientSchema); 