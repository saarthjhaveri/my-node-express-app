const express = require('express');
const { getLatestSettings, submitSettings } = require('../controllers/settingsController');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

// All routes need authentication
router.use(authenticateJWT);

// Match FastAPI endpoints
router.get('/latest_settings', getLatestSettings);
router.post('/submit_settings', submitSettings);

module.exports = router; 