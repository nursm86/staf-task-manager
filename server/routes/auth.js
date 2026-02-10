const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        // Find user by matching password against all users
        const users = await User.find({});
        let matchedUser = null;

        for (const user of users) {
            const isMatch = await user.matchPassword(password);
            if (isMatch) {
                matchedUser = user;
                break;
            }
        }

        if (!matchedUser) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        res.json({
            _id: matchedUser._id,
            name: matchedUser.name,
            role: matchedUser.role,
            token: generateToken(matchedUser._id),
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), async (req, res) => {
    try {
        res.json({
            _id: req.user._id,
            name: req.user.name,
            role: req.user.role,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
