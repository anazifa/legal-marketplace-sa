import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ILawyer } from '../models/Lawyer';
import { IClient } from '../models/Client';

interface AuthRequest extends Request {
  user?: any;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

export const isLawyer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'lawyer') {
    return res.status(403).json({ error: 'Access denied. Lawyers only.' });
  }
  next();
};

export const isClient = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && (req.user as any).role === 'client') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Client only.' });
  }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && (req.user as any).role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin only.' });
  }
}; 