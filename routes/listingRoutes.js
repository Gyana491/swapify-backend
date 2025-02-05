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

router.get('/listings', async (req, res) => {
    try {
        const listings = await Listing.find({ deleted: { $ne: true } })
            .populate('seller_id', 'username email')
            .sort({ created_at: -1 }); // Sort by created_at in descending order (most recent first)
        res.status(200).json(listings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching listings' });
    }
});

router.get('/listings/:id', async (req, res) => {
    try {
        const listing = await Listing.findOne({ 
            _id: req.params.id,
            deleted: { $ne: true }
        }).populate('seller_id', 'username email');
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }
        res.status(200).json(listing);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching listing' });
    }
});

router.get('/my-listings', authMiddleware, async (req, res) => {
    try {
        const listings = await Listing.find({ 
            seller_id: req.userId,
            deleted: { $ne: true }
        });
        res.status(200).json(listings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching listings' });
    }
});

router.delete('/listings/:id', authMiddleware, async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        if (listing.seller_id.toString() !== req.userId) {
            return res.status(403).json({ message: 'Unauthorized to delete this listing' });
        }

        await Listing.findByIdAndUpdate(req.params.id, { deleted: true });
        res.status(200).json({ message: 'Listing deleted successfully' });
    } catch (error) {
        console.error('Error deleting listing:', error);
        res.status(500).json({ message: 'Error deleting listing' });
    }
});

router.put('/listings/:id', authMiddleware, async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        if (listing.seller_id.toString() !== req.userId) {
            return res.status(403).json({ message: 'Unauthorized to update this listing' });
        }

        const updatedListing = await Listing.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true }
        ).populate('seller_id', 'username email');

        res.status(200).json({ 
            message: 'Listing updated successfully',
            listing: updatedListing
        });
    } catch (error) {
        console.error('Error updating listing:', error);
        res.status(500).json({ message: 'Error updating listing' });
    }
});

router.get('/search-listings', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const listings = await Listing.find({
            deleted: { $ne: true },
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        })
        .populate('seller_id', 'username email')
        .sort({ created_at: -1 });

        res.status(200).json(listings);
    } catch (error) {
        console.error('Error searching listings:', error);
        res.status(500).json({ message: 'Error searching listings' });
    }
});

module.exports = router;

