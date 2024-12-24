const express = require('express');
const router = express.Router();
const passport = require('passport');
const { getCalls, syncCalls, getCallById } = require('../controllers/callsController');

// Protect all routes with JWT authentication
router.use(passport.authenticate('jwt', { session: false }));

// Get calls for a specific agent and date range
router.get('/', getCalls);

// Sync calls from Retell API
// router.post('/sync', syncCalls);

// Add the new route for fetching call details
router.get('/call_details/:callId', getCallById);  // New route for call details


module.exports = router; 