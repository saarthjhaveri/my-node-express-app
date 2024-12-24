const { PrismaClient } = require('@prisma/client');
const { updateOfficialScripts } = require('../services/retellService');
const { fetchAndStoreCalls } = require('../services/callService');
const prisma = new PrismaClient();

const getLatestSettings = async (req, res) => {
  try {
    console.log('Getting settings for user:', req.user.id);
    
    const settings = await prisma.userSettings.findFirst({
      where: {
        userId: req.user.id
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (!settings) {
      console.log('No settings found for user:', req.user.id);
      return res.json({
        retell_api_key: "",
        agent_ids: []
      });
    }

    console.log('Found settings for user:', req.user.id);
    return res.json({
      retell_api_key: settings.retellApiKey,
      agent_ids: settings.agentIds
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({
      detail: "Failed to retrieve settings"
    });
  }
};

const submitSettings = async (req, res) => {
  try {
    console.log('Submitting settings for user:', req.user.id);
    console.log('Request body:', req.body);
    
    const { retell_api_key, agent_ids } = req.body;

    if (!Array.isArray(agent_ids)) {
      return res.status(400).json({
        detail: "agent_ids must be an array"
      });
    }

    // Delete any existing settings for this user
    console.log('Deleting existing settings for user:', req.user.id);
    await prisma.userSettings.deleteMany({
      where: {
        userId: req.user.id
      }
    });

    // Create new settings
    console.log('Creating new settings for user:', req.user.id);
    const settings = await prisma.userSettings.create({
      data: {
        userId: req.user.id,
        retellApiKey: retell_api_key,
        agentIds: agent_ids
      }
    });

    // Update official scripts for each agent ID
    console.log('Updating official scripts for agents:', agent_ids);
    const updatePromises = agent_ids.map(agentId => 
      updateOfficialScripts(retell_api_key, agentId, req.user.id)
        .catch(error => {
          console.error(`Failed to update script for agent ${agentId}:`, error);
          return false;
        })
    );

    // Wait for all updates to complete
    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(result => result === true).length;

    console.log('Successfully created settings:', settings);
    console.log(`Updated ${successfulUpdates} out of ${agent_ids.length} agent scripts`);

    // After settings and scripts are updated, fetch and store calls in the background
    fetchAndStoreCalls(req.user.id).catch(error => {
      console.error('Error fetching calls after settings update:', error);
    });

    return res.json({
      status: "success",
      scripts_updated: successfulUpdates,
      total_agents: agent_ids.length
    });

  } catch (error) {
    console.error('Error submitting settings:', error);
    console.error('Error details:', error.message);
    if (error.code) {
      console.error('Prisma error code:', error.code);
    }
    return res.status(500).json({
      detail: "Failed to save settings",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getLatestSettings,
  submitSettings
}; 