import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IClient extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  location: {
    city: string;
    region: string;
  };
  nationalId?: string;
  preferredLanguage: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  location: {
    city: { type: String, required: true },
    region: { type: String, required: true }
  },
  nationalId: { type: String },
  preferredLanguage: { 
    type: String, 
    enum: ['ar', 'en'], 
    default: 'ar' 
  },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
clientSchema.pre('save', async function(next) {
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
clientSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IClient>('Client', clientSchema); 