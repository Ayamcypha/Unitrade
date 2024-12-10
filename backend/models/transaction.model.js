const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled', 'disputed'],
        default: 'pending'
    },
    price: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'transfer', 'other'],
        required: true
    },
    meetupLocation: {
        type: String,
        required: true
    },
    meetupTime: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
