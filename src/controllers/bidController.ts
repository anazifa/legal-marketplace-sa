import { Request, Response } from 'express';
import LegalRequest from '../models/LegalRequest';
import { io } from '../config/socket';

export const placeBid = async (req: Request, res: Response) => {
  try {
    const { legalRequestId } = req.params;
    const { amount, proposedDeadline, description } = req.body;
    const lawyerId = (req as any).user._id;

    const legalRequest = await LegalRequest.findById(legalRequestId);
    if (!legalRequest) {
      return res.status(404).json({ error: 'Legal request not found' });
    }

    if (legalRequest.status !== 'open') {
      return res.status(400).json({ error: 'Legal request is not open for bidding' });
    }

    if (amount > legalRequest.budget) {
      return res.status(400).json({ error: 'Bid amount exceeds budget' });
    }

    // Add new bid
    const newBid = {
      lawyer: lawyerId,
      amount,
      proposedDeadline,
      description,
      createdAt: new Date(),
    };

    legalRequest.bids.push(newBid);
    await legalRequest.save();

    // Emit real-time update
    io.to(`request-${legalRequestId}`).emit('newBid', {
      requestId: legalRequestId,
      bid: newBid,
    });

    res.status(201).json({ message: 'Bid placed successfully', bid: newBid });
  } catch (error) {
    console.error('Bid placement error:', error);
    res.status(500).json({ error: 'Error placing bid' });
  }
};

export const updateBid = async (req: Request, res: Response) => {
  try {
    const { legalRequestId, bidId } = req.params;
    const { amount, proposedDeadline, description } = req.body;
    const lawyerId = (req as any).user._id;

    const legalRequest = await LegalRequest.findById(legalRequestId);
    if (!legalRequest) {
      return res.status(404).json({ error: 'Legal request not found' });
    }

    const bid = legalRequest.bids.id(bidId);
    if (!bid) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    if (bid.lawyer.toString() !== lawyerId.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this bid' });
    }

    if (amount > legalRequest.budget) {
      return res.status(400).json({ error: 'Bid amount exceeds budget' });
    }

    // Update bid
    bid.amount = amount;
    bid.proposedDeadline = proposedDeadline;
    bid.description = description;
    bid.updatedAt = new Date();

    await legalRequest.save();

    // Emit real-time update
    io.to(`request-${legalRequestId}`).emit('bidUpdated', {
      requestId: legalRequestId,
      bid: bid,
    });

    res.status(200).json({ message: 'Bid updated successfully', bid });
  } catch (error) {
    console.error('Bid update error:', error);
    res.status(500).json({ error: 'Error updating bid' });
  }
};

export const acceptBid = async (req: Request, res: Response) => {
  try {
    const { legalRequestId, bidId } = req.params;
    const clientId = (req as any).user._id;

    const legalRequest = await LegalRequest.findById(legalRequestId);
    if (!legalRequest) {
      return res.status(404).json({ error: 'Legal request not found' });
    }

    if (legalRequest.client.toString() !== clientId.toString()) {
      return res.status(403).json({ error: 'Not authorized to accept bids for this request' });
    }

    const bid = legalRequest.bids.id(bidId);
    if (!bid) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    // Update request status and selected bid
    legalRequest.status = 'pending_payment';
    legalRequest.selectedBid = bid.lawyer;
    legalRequest.finalAmount = bid.amount;
    legalRequest.deadline = bid.proposedDeadline;
    await legalRequest.save();

    // Emit real-time update
    io.to(`request-${legalRequestId}`).emit('bidAccepted', {
      requestId: legalRequestId,
      bid: bid,
    });

    res.status(200).json({ message: 'Bid accepted successfully', bid });
  } catch (error) {
    console.error('Bid acceptance error:', error);
    res.status(500).json({ error: 'Error accepting bid' });
  }
};

export const getBids = async (req: Request, res: Response) => {
  try {
    const { legalRequestId } = req.params;

    const legalRequest = await LegalRequest.findById(legalRequestId)
      .populate('bids.lawyer', 'name rating specialization');

    if (!legalRequest) {
      return res.status(404).json({ error: 'Legal request not found' });
    }

    res.status(200).json({ bids: legalRequest.bids });
  } catch (error) {
    console.error('Get bids error:', error);
    res.status(500).json({ error: 'Error retrieving bids' });
  }
}; 