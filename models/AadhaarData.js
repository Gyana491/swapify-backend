const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    country: { type: String },
    district: { type: String },
    house: { type: String },
    landmark: { type: String },
    pincode: { type: Number },
    post_office: { type: String },
    state: { type: String },
    street: { type: String },
    subdistrict: { type: String },
    vtc: { type: String }
});

const aadhaarSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    aadhaar_number: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    reference_id: { type: Number, required: true },
    transaction_id: { type: String, required: true },
    status: { type: String },
    care_of: { type: String },
    full_address: { type: String },
    date_of_birth: { type: String },
    email_hash: { type: String },
    gender: { type: String },
    name: { type: String },
    address: { type: addressSchema },
    year_of_birth: { type: Number },
    mobile_hash: { type: String },
    photo: { type: String },
    share_code: { type: String },
    created_at: { type: Date, default: Date.now }
});

// Add compound index for better querying
aadhaarSchema.index({ user: 1, aadhaar_number: 1 }, { unique: true });

const AadhaarData = mongoose.model('AadhaarData', aadhaarSchema);

module.exports = AadhaarData; 