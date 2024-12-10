const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const Transaction = require('../models/transaction.model');
const Listing = require('../models/listing.model');

// Create new transaction
router.post('/', auth, async (req, res) => {
    try {
        const listing = await Listing.findById(req.body.listingId);
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }
        if (listing.status !== 'active') {
            return res.status(400).json({ message: 'Listing is no longer available' });
        }
        if (listing.seller.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot buy your own listing' });
        }

        const transaction = new Transaction({
            listing: listing._id,
            buyer: req.user._id,
            seller: listing.seller,
            price: listing.price,
            paymentMethod: req.body.paymentMethod,
            meetupLocation: req.body.meetupLocation,
            meetupTime: req.body.meetupTime,
            notes: req.body.notes
        });

        // Update listing status to reserved
        listing.status = 'reserved';
        await listing.save();
        await transaction.save();

        res.status(201).json(transaction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get user's transactions (as buyer or seller)
router.get('/my-transactions', auth, async (req, res) => {
    try {
        const transactions = await Transaction.find({
            $or: [
                { buyer: req.user._id },
                { seller: req.user._id }
            ]
        })
        .populate('listing')
        .populate('buyer', 'fullName email')
        .populate('seller', 'fullName email')
        .sort({ createdAt: -1 });

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single transaction
router.get('/:id', auth, async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            $or: [
                { buyer: req.user._id },
                { seller: req.user._id }
            ]
        })
        .populate('listing')
        .populate('buyer', 'fullName email')
        .populate('seller', 'fullName email');

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update transaction status
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            $or: [
                { buyer: req.user._id },
                { seller: req.user._id }
            ]
        });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        const { status } = req.body;
        const allowedStatuses = ['completed', 'cancelled', 'disputed'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        transaction.status = status;
        if (status === 'completed') {
            transaction.completedAt = Date.now();
            // Update listing status to sold
            await Listing.findByIdAndUpdate(transaction.listing, { status: 'sold' });
        } else if (status === 'cancelled') {
            // Revert listing status to active
            await Listing.findByIdAndUpdate(transaction.listing, { status: 'active' });
        }

        await transaction.save();
        res.json(transaction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
