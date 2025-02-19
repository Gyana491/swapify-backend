const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    title: { type: String, required: true },
    seller_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller_no: { type: String, required: true },
    category_id: { type: String },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    cover_image: { type: String, required: true },
    additional_images: [{ type: String }],
    category: { type: String, required: true },
    subcategory: { type: String, required: true },
    location_display_name: { type: String, required: true },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    pincode: { type: String },
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