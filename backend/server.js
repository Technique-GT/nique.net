// server.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');  // Import dotenv to load environment variables
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.routes');
const staffRoutes = require('./routes/staff.routes');
const categoryRoutes = require('./routes/category.routes');
const tagRoutes = require('./routes/tag.routes');
const articleRoutes = require('./routes/article.routes');

// Load environment variables from config.env
dotenv.config({ path: './config.env' });  // Specify the correct path to your config.env file

// Initialize express
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(cookieParser());

// Connect to MongoDB
mongoose.connect(process.env.ATLAS_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.log('Error connecting to MongoDB:', err));

// Use authentication routes
app.use('/api/auth', authRoutes);  // Prefix routes with /api/auth

// Use staff routes
app.use('/api/staff', staffRoutes);  // Prefix routes with /api/staff

// Use  category routes
app.use('/api/categories', categoryRoutes); 

// User tags route
app.use('/api/tags', tagRoutes);

//article route
app.use('/api/articles', articleRoutes);

// Example protected route
app.get('/api', (req, res) => {
  res.send('Hello, this is your API!');
});

// Start the server
const port = process.env.PORT || 5050;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});