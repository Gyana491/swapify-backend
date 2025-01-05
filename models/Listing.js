const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    seller_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller_no: { type: String },
    category_id: { type: String },
    price: { type: Number, required: true },
    description: { type: String },
    cover_image: { type: String },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    pincode: { type: String },
    created_at: { type: Date, default: Date.now }
});

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;