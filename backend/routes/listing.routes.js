const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const Listing = require('../models/listing.model');
const multer = require('multer');
const path = require('path');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/listings/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
});

// Create new listing
router.post('/', auth, upload.array('images', 5), async (req, res) => {
    try {
        const images = req.files.map(file => `/uploads/listings/${file.filename}`);
        const listing = new Listing({
            ...req.body,
            images,
            seller: req.user._id
        });
        await listing.save();
        res.status(201).json(listing);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get all listings with filters
router.get('/', async (req, res) => {
    try {
        const { category, condition, minPrice, maxPrice, search } = req.query;
        const filter = { status: 'active' };

        if (category) filter.category = category;
        if (condition) filter.condition = condition;
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const listings = await Listing.find(filter)
            .populate('seller', 'fullName email')
            .sort({ createdAt: -1 });
        res.json(listings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single listing
router.get('/:id', async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id)
            .populate('seller', 'fullName email');
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }
        res.json(listing);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update listing
router.patch('/:id', auth, async (req, res) => {
    try {
        const listing = await Listing.findOne({ _id: req.params.id, seller: req.user._id });
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found or unauthorized' });
        }

        const updates = Object.keys(req.body);
        const allowedUpdates = ['title', 'description', 'price', 'category', 'condition', 'location', 'status'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ message: 'Invalid updates' });
        }

        updates.forEach(update => listing[update] = req.body[update]);
        await listing.save();
        res.json(listing);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete listing
router.delete('/:id', auth, async (req, res) => {
    try {
        const listing = await Listing.findOneAndDelete({ 
            _id: req.params.id, 
            seller: req.user._id 
        });
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found or unauthorized' });
        }
        res.json({ message: 'Listing deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
