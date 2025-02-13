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
                email: user.email,
                iat: Math.floor(Date.now() / 1000)
            }, 
            process.env.JWT_SECRET
        );

        await User.findByIdAndUpdate(user._id, { last_token: token });
        
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

router.get('/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id, '-user_password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        res.status(500).json({ message: 'Error fetching user details' });
    }
});

router.post('/verify-token', authMiddleware, async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided.' });
        }

        const userId = req.userId;
        const user = await User.findById(userId);

        if (user.last_token !== token) {
            return res.status(403).json({ 
                message: 'Token has been invalidated.',
                isLoggedIn: false
            });
        }
        
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ 
                    message: 'Invalid token.',
                    isLoggedIn: false
                });
            }
            
            res.status(200).json({ 
                isLoggedIn: true,
                message: 'Token is valid.',
                token,
                user
            });
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({
            message: 'Token verification failed.',
            isLoggedIn: false
        });
    }
});

router.post('/logout', authMiddleware, async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        await User.findByIdAndUpdate(req.userId, { last_token: null });

        res.status(200).json({ 
            message: 'Logged out successfully',
            isLoggedIn: false 
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            message: 'Logout failed',
            error: error.message 
        });
    }
});

router.put('/profile-setup', authMiddleware, async (req, res) => {
    try {
        const {
            username,
            phone_number,
            country,
            state,
            city,
            pincode,
            address,
            user_avatar
        } = req.body;

        const userId = req.userId;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    username: username,
                    phone_number: phone_number,
                    country: country,
                    state: state,
                    city: city,
                    pincode: pincode,
                    address: address,
                    user_avatar: user_avatar
                }
            },
            { new: true, select: '-user_password' }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Profile setup error:', error);
        res.status(500).json({ message: 'Profile setup failed.' });
    }
});

module.exports = router;
