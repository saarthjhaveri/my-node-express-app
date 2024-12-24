const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get agent names
const getAgentNames = async (req, res) => {
    try {
        // Get the latest user settings
        const userSettings = await prisma.userSettings.findFirst({
            where: { userId: req.user.id },
            orderBy: { updatedAt: 'desc' }
        });

        if (!userSettings) {
            return res.json({});
        }

        // Get names for these agent IDs
        const officialScripts = await prisma.officialScript.findMany({
            where: {
                userId: req.user.id,
                agentId: { in: userSettings.agentIds }
            },
            select: {
                agentId: true,
                agentName: true
            }
        });

        // Convert to the same format as Python API
        const agentNames = officialScripts.reduce((acc, script) => {
            acc[script.agentId] = script.agentName;
            return acc;
        }, {});

        return res.json(agentNames);
    } catch (error) {
        console.error('Error fetching agent names:', error);
        return res.status(500).json({ detail: 'Failed to retrieve agent names' });
    }
};

// Get daily stats for an agent
const getDailyStats = async (req, res) => {
    try {
        const { agentId } = req.params;
        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({ detail: 'start_date and end_date are required' });
        }

        const stats = await prisma.dailyStatsAgent.findMany({
            where: {
                userId: req.user.id,
                agentId: agentId,
                date: {
                    gte: new Date(start_date),
                    lte: new Date(end_date)
                }
            },
            orderBy: {
                date: 'asc'
            }
        });

        // Transform the data to match Python API format
        const formattedStats = stats.map(stat => ({
            id: stat.id,
            user_id: stat.userId,
            agent_id: stat.agentId,
            date: stat.date.toISOString().split('T')[0],
            total_calls: stat.totalCalls,
            total_duration: stat.totalDuration,
            average_duration: stat.averageDuration,
            successful_calls: stat.successfulCalls,
            failed_calls: stat.failedCalls,
            average_csat_score: stat.averageCsatScore,
            scored_calls: stat.scoredCalls,
            created_at: stat.createdAt.toISOString(),
            updated_at: stat.updatedAt.toISOString()
        }));

        return res.json(formattedStats);
    } catch (error) {
        console.error(`Error fetching daily stats for agent ${req.params.agentId}:`, error);
        return res.status(500).json({ detail: 'Failed to retrieve daily stats' });
    }
};

// Get agent calls
const getAgentCalls = async (req, res) => {
    try {
        const { agentId } = req.params;
        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({ detail: 'start_date and end_date are required' });
        }

        // Convert dates to Unix timestamps (milliseconds)
        const startTimestamp = new Date(start_date + 'T00:00:00Z').getTime();
        const endTimestamp = new Date(end_date + 'T23:59:59Z').getTime();

        const calls = await prisma.call.findMany({
            where: {
                userId: req.user.id,
                agentId: agentId,
                startTimestamp: {
                    gte: startTimestamp
                },
                endTimestamp: {
                    lte: endTimestamp
                }
            }
        });

        // Transform data and set default status if needed
        const formattedCalls = calls.map(call => {
            const callData = {
                ...call,
                status: call.status || (call.alertTriggered ? 'Unresolved' : 'Resolved')
            };
            
            // Convert any dates to ISO strings
            if (callData.createdAt) callData.createdAt = callData.createdAt.toISOString();
            if (callData.updatedAt) callData.updatedAt = callData.updatedAt.toISOString();

            console.log("call data is " , callData);
            
            return callData;
        });

        

        return res.json(formattedCalls);
    } catch (error) {
        console.error(`Error fetching calls for agent ${req.params.agentId}:`, error);
        return res.status(500).json({ detail: 'Failed to fetch agent calls' });
    }
};

module.exports = {
    getAgentNames,
    getDailyStats,
    getAgentCalls
}; 