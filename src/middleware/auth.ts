import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ILawyer } from '../models/Lawyer';
import { IClient } from '../models/Client';
import { Pool } from 'pg';

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432')
});

interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

export const isAuthenticated = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
        
        const { rows } = await pool.query(
            'SELECT id, email, role FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (!rows[0]) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = rows[0];
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};

export const isAdmin = [
    isAuthenticated,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }
        next();
    }
];

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