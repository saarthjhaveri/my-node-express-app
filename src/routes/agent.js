const express = require('express');
const { 
    getAgentNames, 
    getDailyStats,
    getAgentCalls 
} = require('../controllers/agentController');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

// All routes need authentication
router.use(authenticateJWT);

// Match FastAPI endpoints
router.get('/agent_names', getAgentNames);
router.get('/daily_stats/:agentId', getDailyStats);
router.get('/agent_calls/:agentId', getAgentCalls);

module.exports = router; 