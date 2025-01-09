const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
    const { 
        username, 
        user_password,
        user_role,
        email,
        user_avatar,
        phone_number,
        country,
        state,
        city,
        pincode,
        address 
    } = req.body;
    
    if (!username || !user_password || !email) {
        return res.status(400).json({ message: 'Username, password and email are required.' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(user_password, 10);
        
        const user = new User({
            username,
            user_password: hashedPassword,
            email,
            user_role,
            user_avatar,
            phone_number,
            country,
            state,
            city,
            pincode,
            address
        });

        const userData= await user.save();
        const token = jwt.sign(
            { 
                id: userData._id,
                email: userData.email 
            }, 
            process.env.JWT_SECRET
        );
        
        res.status(201).json({ 
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.user_role
            }})
    }
         catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Registration failed.' });
    }
});

router.post('/login', async (req, res) => {
    const { email, user_password } = req.body;

    if (!email || !user_password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'No user found with this email.' });
        }

        const isValidPassword = await bcrypt.compare(user_password, user.user_password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { 
                id: user._id,
                email: user.email 
            }, 
            process.env.JWT_SECRET
        );
        
        res.json({ 
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.user_role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed.' });
    }
});

router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, '-user_password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

router.get('/protected', authMiddleware, (req, res) => {
    res.json({ message: 'You have access.', userId: req.userId });
});

router.post('/verify-token',authMiddleware, async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!token) return res.status(401).json({ message: 'No token provided.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Invalid token.' });
        
        res.status(200).json({ 
            message: 'Token is valid.',
            token,
            user
        });
    });
});

module.exports = router;
