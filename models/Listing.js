const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    title: { type: String, required: true },
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
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    created_at: { type: Date, default: Date.now },
    deleted: { type: Boolean, default: false },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    }
});

listingSchema.index({ location: "2dsphere" });

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;