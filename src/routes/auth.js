const express = require('express');
const { register, login, getProfile, verifyToken } = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/token', login);

// Protected routes
router.get('/users/me', authenticateJWT, getProfile);
router.get('/user_info', authenticateJWT, getProfile);
router.get('/verify_token', authenticateJWT, verifyToken);

module.exports = router; 