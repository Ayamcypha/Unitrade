const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const Review = require('../models/review.model');
const Transaction = require('../models/transaction.model');

// Create new review
router.post('/', auth, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.body.transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        
        if (transaction.status !== 'completed') {
            return res.status(400).json({ message: 'Can only review completed transactions' });
        }

        // Verify user is part of the transaction
        if (![transaction.buyer.toString(), transaction.seller.toString()].includes(req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized to review this transaction' });
        }

        // Determine reviewee (if reviewer is buyer, reviewee is seller and vice versa)
        const reviewee = transaction.buyer.toString() === req.user._id.toString() 
            ? transaction.seller 
            : transaction.buyer;

        // Check if review already exists
        const existingReview = await Review.findOne({
            transaction: transaction._id,
            reviewer: req.user._id
        });

        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this transaction' });
        }

        const review = new Review({
            transaction: transaction._id,
            reviewer: req.user._id,
            reviewee: reviewee,
            rating: req.body.rating,
            comment: req.body.comment
        });

        await review.save();
        res.status(201).json(review);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get reviews for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const reviews = await Review.find({ reviewee: req.params.userId })
            .populate('reviewer', 'fullName')
            .populate('transaction')
            .sort({ createdAt: -1 });

        // Calculate average rating
        const ratings = reviews.map(review => review.rating);
        const averageRating = ratings.length > 0 
            ? ratings.reduce((a, b) => a + b) / ratings.length 
            : 0;

        res.json({
            reviews,
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: reviews.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update review
router.patch('/:id', auth, async (req, res) => {
    try {
        const review = await Review.findOne({
            _id: req.params.id,
            reviewer: req.user._id
        });

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        const updates = Object.keys(req.body);
        const allowedUpdates = ['rating', 'comment'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ message: 'Invalid updates' });
        }

        updates.forEach(update => review[update] = req.body[update]);
        await review.save();
        res.json(review);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete review
router.delete('/:id', auth, async (req, res) => {
    try {
        const review = await Review.findOneAndDelete({
            _id: req.params.id,
            reviewer: req.user._id
        });

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
