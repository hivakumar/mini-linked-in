const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const User = require('../models/User');

// @route   POST /api/auth/sync
// @desc    Create or update user in MongoDB after Firebase login
// @access  Private
router.post('/sync', verifyToken, async (req, res) => {
  try {
    const { uid, email, name, picture } = req.user;
    
    // Check if user exists
    let user = await User.findOne({ firebaseUid: uid });
    
    if (!user) {
      // Create new user
      user = new User({
        firebaseUid: uid,
        email: email,
        name: name || email.split('@')[0], // Fallback name
        profilePicture: picture || ''
      });
      await user.save();
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = req.dbUser;
    if (!user) {
        return res.status(404).json({ error: 'User not found in database' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile (bio, skills)
// @access  Private
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { bio, skills } = req.body;
        const user = req.dbUser;
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (bio !== undefined) user.bio = bio;
        if (skills !== undefined) {
             // ensure skills is an array
             user.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
        }

        await user.save();
        res.status(200).json(user);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/auth/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-email'); // Don't expose email publicly
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
