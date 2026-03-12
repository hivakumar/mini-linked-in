const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const optionalAuth = require('../middlewares/optionalAuthMiddleware');
const { upload } = require('../middlewares/upload');
const Post = require('../models/Post');
const User = require('../models/User');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Helper function to extract skills using Groq API
const extractSkills = async (content) => {
    try {
      const prompt = `You are a skill extraction engine. Analyze the following social media post and return a comma-separated list of ONLY the professional skills mentioned (e.g., JavaScript, React, Leadership, Python, Graphic Design). If no skills are detected, return nothing. Do not return any other text or conversational remarks. Post content: "${content}"`;
      
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
        temperature: 0.3, // Lower temperature for more deterministic skill extraction
        max_tokens: 50,
      });

      const response = chatCompletion.choices[0]?.message?.content || '';
      if (!response.trim()) return [];
      
      return response.split(',').map(skill => skill.trim()).filter(s => s.length > 0);
    } catch (error) {
      console.error('Skill extraction error:', error.message);
      return [];
    }
};

// @route   GET /api/posts
// @desc    Get all posts (Timeline)
// @access  Public (Optional Auth)
router.get('/', optionalAuth, async (req, res) => {
    try {
        // Fetch posts, populate user info, sort by newest
        const posts = await Post.find()
            .populate('userId', 'name profilePicture')
            .populate('comments.userId', 'name profilePicture')
            .sort({ createdAt: -1 });
            
        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { content } = req.body;
        const imageUrl = req.file ? req.file.path : '';
        const user = req.dbUser;

        if (!user) return res.status(404).json({ error: 'User not found in DB' });

        if (!content && !imageUrl) {
            return res.status(400).json({ error: 'Post must contain text or an image' });
        }

        // 1. Extract skills from content using Groq
        const extractedSkills = await extractSkills(content);

        // 2. Create the post
        const newPost = new Post({
            userId: user._id,
            content: content || '',
            imageUrl: imageUrl,
            skillsMentioned: extractedSkills
        });

        await newPost.save();

        // 3. Find matching users for Notification
        let matchNotification = null;
        if (extractedSkills.length > 0) {
            // Find users who have ANY of these skills in their profile (excluding the current user)
            const matchingUsers = await User.find({
                _id: { $ne: user._id },
                skills: { $in: extractedSkills }
            }).limit(3);

            if (matchingUsers.length > 0) {
                const matchNames = matchingUsers.map(u => u.name).join(' and ');
                const matchedSkill = extractedSkills[0]; // grab the first extracted one to keep it simple
                matchNotification = `You and ${matchNames} both mentioned or have ${matchedSkill}. Consider connecting since you share similar skills.`;
            }
        }

        await newPost.populate('userId', 'name profilePicture');
        res.status(201).json({ post: newPost, matchNotification });

    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Server error creating post' });
    }
});

// @route   PUT /api/posts/:id/like
// @desc    Like / Unlike a post
// @access  Private
router.put('/:id/like', verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const user = req.dbUser;

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const isLiked = post.likes.includes(user._id);

        if (isLiked) {
            // Unlike
             post.likes = post.likes.filter(id => id.toString() !== user._id.toString());
        } else {
            // Like
            post.likes.push(user._id);
        }

        await post.save();
        res.status(200).json({ likes: post.likes });

    } catch (error) {
        console.error('Error handling like:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/posts/:id/comment
// @desc    Add a comment to a post
// @access  Private
router.post('/:id/comment', verifyToken, async (req, res) => {
    try {
        const { content } = req.body;
        const post = await Post.findById(req.params.id);
        const user = req.dbUser;

        if (!post) return res.status(404).json({ error: 'Post not found' });
        if (!content) return res.status(400).json({ error: 'Comment content is required' });

        const newComment = {
            userId: user._id,
            content: content
        };

        post.comments.push(newComment);
        await post.save();

        // Populate to return the new comment with user info
        await post.populate('comments.userId', 'name profilePicture');

        res.status(201).json({ comments: post.comments });
    } catch (error) {
        console.error('Error handling comment:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
