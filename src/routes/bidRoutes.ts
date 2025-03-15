import express from 'express';
import { auth, isLawyer } from '../middleware/auth';
import {
  placeBid,
  updateBid,
  acceptBid,
  getBids,
} from '../controllers/bidController';

const router = express.Router();

// Get all bids for a legal request
router.get('/legal-request/:legalRequestId/bids', auth, getBids);

// Place a new bid
router.post('/legal-request/:legalRequestId/bid', auth, isLawyer, placeBid);

// Update an existing bid
router.put('/legal-request/:legalRequestId/bid/:bidId', auth, isLawyer, updateBid);

// Accept a bid
router.post('/legal-request/:legalRequestId/bid/:bidId/accept', auth, acceptBid);

export default router; 