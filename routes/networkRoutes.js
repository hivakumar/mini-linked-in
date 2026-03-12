const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const optionalAuth = require('../middlewares/optionalAuthMiddleware');
const User = require('../models/User');

// @route   GET /api/network/suggestions
// @desc    Get a list of HR professionals and Companies to connect with
// @access  Public (Optional Auth)
router.get('/suggestions', optionalAuth, async (req, res) => {
  try {
    const user = req.dbUser;
    
    let query = { role: { $in: ['hr', 'company'] } };

    if (user) {
        // Find users who are HR or Companies, and NOT already in the user's connections
        // and obviously not themselves
        query = {
            ...query,
            _id: { $ne: user._id, $nin: user.connections }
        };
    }

    const suggestions = await User.find(query)
        .select('-email') // don't expose emails
        .limit(user ? 10 : 5); // Just limit some for public view
        
    res.status(200).json(suggestions);
  } catch (error) {
    console.error('Error fetching network suggestions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/network/connect/:id
// @desc    Connect with another user (add to connections array)
// @access  Private
router.post('/connect/:id', verifyToken, async (req, res) => {
    try {
        const user = req.dbUser;
        const targetUserId = req.params.id;

        if (user._id.toString() === targetUserId) {
             return res.status(400).json({ error: 'Cannot connect with yourself' });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
             return res.status(404).json({ error: 'User not found' });
        }

        // Add to both users' connections if not already there
        if (!user.connections.includes(targetUserId)) {
             user.connections.push(targetUserId);
             await user.save();
        }

        if (!targetUser.connections.includes(user._id)) {
            targetUser.connections.push(user._id);
            await targetUser.save();
        }

        res.status(200).json({ message: 'Successfully connected', connections: user.connections });
    } catch (error) {
        console.error('Error connecting:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
