const express = require('express');
const passport = require('passport');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Import routes
const authRoutes = require('./routes/auth');
const interestRoutes = require('./routes/interest');
const settingsRoutes = require('./routes/settings');
const agentRoutes = require('./routes/agent');

// Passport config
require('./config/passport');

const app = express();
const prisma = new PrismaClient();
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Routes - auth routes at root level to match FastAPI
app.use('/', authRoutes);  // This puts /token at root level
app.use('/submit-interest', interestRoutes);
app.use('/', settingsRoutes);  // This puts settings endpoints at root level to match FastAPI
app.use('/', agentRoutes);     // This puts agent endpoints at root level

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = app; 