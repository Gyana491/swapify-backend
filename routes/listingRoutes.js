const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/create-listing', authMiddleware, async (req, res) => {
    try {
        const listing = new Listing({
            ...req.body,
            seller_id: req.userId
        });

        const savedListing = await listing.save();
        const populatedListing = await Listing.findById(savedListing._id).populate('seller_id', 'username email');
        
        res.status(200).json({ 
            message: 'Listing created successfully', 
            listing: populatedListing 
        });
    } catch (error) {
        console.error('Error creating listing:', error);
        res.status(500).json({ message: 'Error creating listing' });
    }
});

router.get('/listings', authMiddleware, async (req, res) => {
    try {
        const listings = await Listing.find().populate('seller_id', 'username email');
        res.status(200).json(listings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching listings' });
    }
});

router.get('/listings/:slug', async (req, res) => {
    try {
        const listing = await Listing.findOne({ slug: req.params.slug });
        res.status(200).json(listing);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching listing' });
    }
});

router.get('/my-listings', authMiddleware, async (req, res) => {
    try {
        const listings = await Listing.find({ seller_id: req.userId });
        res.status(200).json(listings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching listings' });
    }
});


module.exports = router;

