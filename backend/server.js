// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

// Load environment variables from config.env file
dotenv.config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.ATLAS_URI;

if (!MONGO_URI) {
  console.error("❌ MongoDB URI is missing from .env file.");
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true // Allow cookies to be sent
}));
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB without deprecated options
mongoose.connect(MONGO_URI)
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// Routes
const authRoutes = require('./routes/auth.routes'); // Add this line

// Test route
app.get('/', (req, res) => {
  res.send('🎉 MERN backend is running!');
});

// Use auth routes
app.use('/api/auth', authRoutes); // Add this line

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
