const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updateOfficialScripts = async (retellApiKey, agentId, userId) => {
    try {
        // Get agent details
        const agentResponse = await axios.get(
            `https://api.retellai.com/get-agent/${agentId}`,
            {
                headers: { 
                    "Authorization": `Bearer ${retellApiKey}`
                }
            }
        );

        const agentData = agentResponse.data;
        const agentName = agentData.agent_name;
        const llmWebsocketUrl = agentData.llm_websocket_url;

        if (llmWebsocketUrl) {
            // Extract LLM_ID from the websocket URL
            const llmId = llmWebsocketUrl.split('/').pop();

            // Get LLM details
            const llmResponse = await axios.get(
                `https://api.retellai.com/get-retell-llm/${llmId}`,
                {
                    headers: {
                        "Authorization": `Bearer ${retellApiKey}`
                    }
                }
            );

            const llmData = llmResponse.data;
            const generalPrompt = llmData.general_prompt || "";

            // Update or insert the official script using Prisma
            await prisma.officialScript.upsert({
                where: {
                    userId_agentId: {
                        userId: userId,
                        agentId: agentId
                    }
                },
                update: {
                    agentName: agentName,
                    scriptContent: generalPrompt,
                    updatedAt: new Date()
                },
                create: {
                    userId: userId,
                    agentId: agentId,
                    agentName: agentName,
                    scriptContent: generalPrompt,
                    tags: [],
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });

            console.log(`Updated official script for agent ${agentId}`);
            return true;
        } else {
            console.warn(`No LLM websocket URL found for agent ${agentId}`);
            return false;
        }

    } catch (error) {
        console.error('Error updating official scripts:', error);
        throw error;
    }
};

module.exports = {
    updateOfficialScripts
}; 