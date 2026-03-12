const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');

const seedDatabase = async () => {
    try {
        console.log('Seeding database with HR, Companies, and Job Posts...');
        
        // Check if already seeded
        const hrCount = await User.countDocuments({ role: 'hr' });
        if (hrCount > 0) {
            console.log('Database already seeded. Skipping.');
            return;
        }

        // --- 1. Create Companies ---
        const companiesData = [
            {
                firebaseUid: 'seed_company_1',
                name: 'TechNova Solutions',
                email: 'contact@technova.com',
                bio: 'Leading the future of AI and cloud infrastructure. We are always looking for top talent to join our team.',
                skills: ['Cloud Computing', 'AI', 'SaaS', 'Engineering'],
                role: 'company',
                companyName: 'TechNova Solutions',
                profilePicture: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&h=150&fit=crop'
            },
            {
                firebaseUid: 'seed_company_2',
                name: 'FinTech Dynamics',
                email: 'careers@fintechdynamics.com',
                bio: 'Revolutionizing global payments and decentralized finance. Join our remote-first team.',
                skills: ['Finance', 'Blockchain', 'JavaScript', 'Security'],
                role: 'company',
                companyName: 'FinTech Dynamics',
                profilePicture: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop'
            }
        ];
        const companies = await User.insertMany(companiesData);

        // --- 2. Create HR Professionals ---
        const hrData = [
            {
                firebaseUid: 'seed_hr_1',
                name: 'Sarah Jenkins',
                email: 'sarah.j@technova.com',
                bio: 'Senior Technical Recruiter @ TechNova. Passionate about connecting brilliant minds with opportunities.',
                skills: ['Technical Recruiting', 'Sourcing', 'Interviewing'],
                role: 'hr',
                companyName: 'TechNova Solutions',
                profilePicture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop'
            },
            {
                firebaseUid: 'seed_hr_2',
                name: 'Michael Chang',
                email: 'm.chang@fintechdynamics.com',
                bio: 'Talent Acquisition Manager at FinTech Dynamics. Hiring engineers globally.',
                skills: ['Talent Acquisition', 'Onboarding', 'HR Strategy'],
                role: 'hr',
                companyName: 'FinTech Dynamics',
                profilePicture: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop'
            }
        ];
        const hrProfs = await User.insertMany(hrData);

        // --- 3. Create Dummy Users (Job Seekers) ---
        const seekerData = [
            {
                 firebaseUid: 'seed_user_1',
                 name: 'Alex Rivera',
                 email: 'alex.dev@example.com',
                 bio: 'Fullstack Software Engineer specializing in React and Node.js. Currently seeking new opportunities!',
                 skills: ['React', 'Node.js', 'MongoDB', 'JavaScript'],
                 role: 'user',
                 resumeUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // Dummy PDF URL
                 profilePicture: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop'
            }
        ];
        const seekers = await User.insertMany(seekerData);

        // --- 4. Create Posts ---
        const postsData = [
            {
                userId: companies[0]._id, // TechNova
                content: "🚀 We are thrilled to announce that TechNova Solutions is expanding our AI division! We are hiring multiple Senior Machine Learning Engineers. Check out our careers page or DM us for more info. #Hiring #AI #TechJobs",
                skillsMentioned: ['AI', 'Machine Learning', 'Python'],
                imageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80',
                likes: [hrProfs[0]._id, hrProfs[1]._id]
            },
            {
                userId: hrProfs[0]._id, // Sarah Jenkins
                content: "I'm actively looking for a Lead Frontend Developer to join us at TechNova. Must have strong experience with React and modern CSS frameworks. If you or someone you know is interested, let's connect! 🤝",
                skillsMentioned: ['React', 'CSS', 'Frontend'],
                likes: [companies[0]._id],
                comments: [
                    { userId: seekers[0]._id, content: "Sending you a connection request! I would love to learn more." }
                ]
            },
            {
                 userId: seekers[0]._id, // Alex Rivera
                 content: "After 3 great years at my previous company, I am open to work! I'm looking for a Fullstack Engineering role where I can build impactful products.\n\nI've attached my resume below. Let's connect! 👇",
                 skillsMentioned: ['Fullstack', 'JavaScript', 'Node.js'],
                 resumeUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                 likes: [hrProfs[1]._id] // Michael likes it
            },
            {
                userId: companies[1]._id, // FinTech Dynamics
                content: "FinTech Dynamics is proud to release our Q3 technical report on blockchain scalability! 📈 It's been a massive team effort.",
                skillsMentioned: ['Blockchain', 'FinTech'],
                imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
                likes: [hrProfs[1]._id, seekers[0]._id]
            }
        ];
        
        await Post.insertMany(postsData);

        console.log('✅ Dummy Database Seeded Successfully!');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    }
};

module.exports = seedDatabase;
