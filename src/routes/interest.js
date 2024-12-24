const express = require('express');
const { submitInterestForm, getAllSubmissions } = require('../controllers/interestController');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

// Public route for submitting interest form
router.post('/', submitInterestForm);

// Protected route for admin to view all submissions
router.get('/submissions', authenticateJWT, getAllSubmissions);

module.exports = router; 