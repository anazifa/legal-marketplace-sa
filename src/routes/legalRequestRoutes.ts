import express from 'express';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Legal request routes are working!' });
});

export default router; 