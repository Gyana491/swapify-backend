const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    user_password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    user_role: { type: String },
    user_avatar: { type: String },
    phone_number: { type: String },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    pincode: { type: String },
    address: { type: String },
    created_at: { type: Date, default: Date.now },
    last_token: {
        type: String,
        default: null
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;