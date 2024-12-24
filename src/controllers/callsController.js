const { PrismaClient } = require('@prisma/client');
const { fetchAndStoreCalls } = require('../services/callService');
const prisma = new PrismaClient();

async function getCalls(req, res) {
    try {
        const { userId } = req.user;
        const { agentId, startDate, endDate } = req.query;

        if (!agentId || !startDate || !endDate) {
            return res.status(400).json({
                error: 'Missing required parameters: agentId, startDate, and endDate are required'
            });
        }

        const calls = await prisma.call.findMany({
            where: {
                userId,
                agentId,
                startTimestamp: {
                    gte: new Date(startDate).getTime(),
                    lte: new Date(endDate).getTime()
                }
            },
            orderBy: {
                startTimestamp: 'desc'
            }
        });

        return res.json(calls);
    } catch (error) {
        console.error('Error fetching calls:', error);
        return res.status(500).json({ error: 'Failed to fetch calls' });
    }
}

async function syncCalls(req, res) {
    try {
        const { userId } = req.user;
        
        // Start the sync process
        await fetchAndStoreCalls(userId);
        
        return res.json({ message: 'Call sync initiated successfully' });
    } catch (error) {
        console.error('Error syncing calls:', error);
        return res.status(500).json({ error: 'Failed to sync calls' });
    }
}

async function getCallById(req, res) {
    try {
        const { userId } = req.user;
        const { callId } = req.params;

        const call = await prisma.call.findFirst({
            where: {
                userId,
                callId
            }
        });

        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }

        return res.json(call);
    } catch (error) {
        console.error('Error fetching call:', error);
        return res.status(500).json({ error: 'Failed to fetch call' });
    }
}

module.exports = {
    getCalls,
    syncCalls,
    getCallById
}; 