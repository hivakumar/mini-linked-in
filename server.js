require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
const connectDB = async () => {
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    console.log('Starting In-Memory MongoDB Server...');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    await mongoose.connect(uri);
    console.log(`Connected to In-Memory MongoDB at ${uri}`);
    
    // Seed Database
    const seedDatabase = require('./utils/seedDatabase');
    await seedDatabase();
    
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
};
connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/network', require('./routes/networkRoutes'));

// Fallback to index.html for SPA-like behavior (optional, if we use routing strictly)

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
