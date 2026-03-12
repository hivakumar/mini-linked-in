const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// @route   POST /api/ai/enhance-bio
// @desc    Enhance user profile bio using Groq API
// @access  Private
router.post('/enhance-bio', verifyToken, async (req, res) => {
    try {
        const { bio } = req.body;
        
        if (!bio || bio.trim().length === 0) {
            return res.status(400).json({ error: 'Bio is required for enhancement' });
        }

        const prompt = `You are a professional LinkedIn profile writer. Improve the following bio to make it sound more professional, engaging, and impactful. Keep it concise, under 3 sentences, and do not include hashtags or extra conversational text. Bio to enhance: "${bio}"`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama3-8b-8192', // or mixtral-8x7b-32768
            temperature: 0.7,
            max_tokens: 150,
            top_p: 1,
            stream: false,
            stop: null
        });

        const enhancedBio = chatCompletion.choices[0]?.message?.content || bio;
        res.status(200).json({ enhancedBio: enhancedBio.trim() });

    } catch (error) {
        console.error('Error enhancing bio:', error.message);
        res.status(500).json({ error: 'AI Enhancement Failed' });
    }
});

// @route   POST /api/ai/enhance-caption
// @desc    Enhance post caption using Groq API
// @access  Private
router.post('/enhance-caption', verifyToken, async (req, res) => {
    try {
        const { caption } = req.body;
        
        if (!caption || caption.trim().length === 0) {
            return res.status(400).json({ error: 'Caption is required for enhancement' });
        }

        const prompt = `You are an expert social media manager. Improve the following LinkedIn post caption to make it more engaging and professional. You may add relevant 1-2 hashtags, spacing, and emojis if applicable. Do not include any introductory remarks. Caption to enhance: "${caption}"`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama3-8b-8192',
            temperature: 0.7,
            max_tokens: 250,
            top_p: 1,
            stream: false,
            stop: null
        });

        const enhancedCaption = chatCompletion.choices[0]?.message?.content || caption;
        res.status(200).json({ enhancedCaption: enhancedCaption.trim() });

    } catch (error) {
        console.error('Error enhancing caption:', error.message);
        res.status(500).json({ error: 'AI Enhancement Failed' });
    }
});

module.exports = router;
