const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { checkNoConversation, extractCustomerName } = require('./ml_models/utils');
const { detectLoops } = require('./ml_models/loopDetection');
const { prematureEndingAnalyser } = require('./ml_models/prematureEnding');
const { detectPauses, detectInterruptions } = require('./ml_models/pausesInterruption');
const { analyzeSentiment } = require('./ml_models/sentimentAnalysis');
const { calculateCsatScore } = require('./ml_models/csatPredictor');

const prisma = new PrismaClient();
const CSAT_THRESHOLD = 80;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

async function listCalls(retellApiKey, agentIds, afterStartTimestamp, sortOrder = "descending", limit = 100) {
    const url = "https://api.retellai.com/v2/list-calls";
    
    try {
        const response = await axios.post(url, {
            filter_criteria: {
                agent_id: agentIds,
                after_start_timestamp: afterStartTimestamp,
            },
            sort_order: sortOrder,
            limit: limit,
        }, {
            headers: {
                "Authorization": `Bearer ${retellApiKey}`,
                "Content-Type": "application/json",
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching calls:', error);
        throw error;
    }
}

function processTranscriptObject(transcriptObject) {
    if (!transcriptObject) return [];

    const transcriptWithTimestamp = [];
    let previousEndTime = 0;

    for (const entry of transcriptObject) {
        const words = entry.words || [];
        if (!words.length) continue;

        words.sort((a, b) => parseFloat(a.start) - parseFloat(b.start));

        let startTimestamp = parseFloat(words[0].start);
        if (startTimestamp < previousEndTime) {
            startTimestamp = previousEndTime;
        }

        const endTimestamp = parseFloat(words[words.length - 1].end);
        const finalEndTimestamp = endTimestamp <= startTimestamp ? startTimestamp + 0.1 : endTimestamp;

        previousEndTime = finalEndTimestamp;

        transcriptWithTimestamp.push({
            role: entry.role || '',
            content: entry.content || '',
            start_timestamp: Math.round(startTimestamp * 1000) / 1000,
            end_timestamp: Math.round(finalEndTimestamp * 1000) / 1000
        });
    }

    return transcriptWithTimestamp;
}

async function updateDailyStats(userId, agentId, call, csatScore) {
    try {
        const CSAT_THRESHOLD = 80;
        const callDate = new Date(call.start_timestamp).toISOString().split('T')[0];
        const callDuration = (call.end_timestamp - call.start_timestamp) / 1000;

        // Check for existing record
        const existingRecord = await prisma.dailyStatsAgent.findFirst({
            where: {
                userId,
                agentId,
                date: new Date(callDate)
            }
        });

        if (existingRecord) {
            // Update existing record
            const newTotalCalls = existingRecord.totalCalls + 1;
            const newTotalDuration = existingRecord.totalDuration + Math.round(callDuration);
            const newAverageDuration = newTotalDuration / newTotalCalls;

            let newScoredCalls = existingRecord.scoredCalls;
            let newAverageCsatScore = existingRecord.averageCsatScore;
            let newSuccessfulCalls = existingRecord.successfulCalls;
            let newFailedCalls = existingRecord.failedCalls;

            if (csatScore !== null) {
                newScoredCalls += 1;
                const currentTotalCsat = existingRecord.averageCsatScore !== null 
                    ? existingRecord.averageCsatScore * existingRecord.scoredCalls 
                    : 0;
                const newTotalCsat = currentTotalCsat + csatScore;
                newAverageCsatScore = newTotalCsat / newScoredCalls;
                
                if (csatScore >= CSAT_THRESHOLD) {
                    newSuccessfulCalls += 1;
                } else {
                    newFailedCalls += 1;
                }
            }

            await prisma.dailyStatsAgent.update({
                where: {
                    id: existingRecord.id
                },
                data: {
                    totalCalls: newTotalCalls,
                    totalDuration: newTotalDuration,
                    averageDuration: Math.round(newAverageDuration * 100) / 100,
                    successfulCalls: newSuccessfulCalls,
                    failedCalls: newFailedCalls,
                    scoredCalls: newScoredCalls,
                    averageCsatScore: newAverageCsatScore !== null 
                        ? Math.round(newAverageCsatScore * 100) / 100 
                        : null
                }
            });

            console.log(`Updated daily stats for date ${callDate}`);
        } else {
            // Insert new record
            const newRecord = {
                userId,
                agentId,
                date: new Date(callDate),
                totalCalls: 1,
                totalDuration: Math.round(callDuration),
                averageDuration: Math.round(callDuration * 100) / 100,
                successfulCalls: 0,
                failedCalls: 0,
                scoredCalls: 0,
                averageCsatScore: null
            };

            if (csatScore !== null) {
                newRecord.scoredCalls = 1;
                newRecord.successfulCalls = csatScore >= CSAT_THRESHOLD ? 1 : 0;
                newRecord.failedCalls = csatScore < CSAT_THRESHOLD ? 1 : 0;
                newRecord.averageCsatScore = csatScore;
            } else {
                newRecord.failedCalls = 1; // Count as failed if no CSAT score
            }

            await prisma.dailyStatsAgent.create({
                data: newRecord
            });

            console.log(`Inserted new daily stats for date ${callDate}`);
        }
    } catch (error) {
        console.error('Error updating daily stats:', error);
        throw error;
    }
}

async function fetchAndStoreCalls(userId) {
    try {

        console.log(`Fetching calls for user ${userId}`);
        
        const userSettings = await prisma.userSettings.findFirst({
            where: { userId },
            orderBy: { updatedAt: 'desc' }
        });

        if (!userSettings) {
            console.warn(`No settings found for user ${userId}`);
            return;
        }

        const { retellApiKey, agentIds } = userSettings;

        for (const agentId of agentIds) {
            const latestCall = await prisma.call.findFirst({
                where: {
                    userId,
                    agentId,
                    callStatus: 'ended',
                    NOT: { endTimestamp: null }
                },
                orderBy: { endTimestamp: 'desc' }
            });

            const afterStartTimestamp = latestCall
                ? latestCall.startTimestamp + 1
                : Date.now() - THIRTY_DAYS_MS;

            console.log(`Fetching calls after timestamp: ${afterStartTimestamp}`);

            const calls = await listCalls(
                retellApiKey,
                [agentId],
                afterStartTimestamp,
                "ascending",
                100
            );

            if (!calls || !calls.length) {
                console.log(`No more calls to fetch for agent ${agentId}`);
                continue;
            }

            const newEndedCalls = calls.filter(call => 
                call.call_status === "ended" &&
                call.end_timestamp != null
            );

            console.log(`Found ${newEndedCalls.length} new ended calls to process`);

            for (const call of newEndedCalls) {
                try {
                    const transcriptWithTimestamp = processTranscriptObject(call.transcript_object);
                    const timestamp = call.start_timestamp 
                        ? new Date(call.start_timestamp).toISOString()
                        : null;

                    // Perform all analyses
                    const noConversation = checkNoConversation(transcriptWithTimestamp);
                    const customerName = extractCustomerName(transcriptWithTimestamp);
                    
                    let loopsDetection = null;
                    let prematureEnding = null;
                    let longPauses = null;
                    let overlappingInterruptions = null;
                    let sentimentAnalysisRes = null;

                    if (!noConversation) {
                        loopsDetection = detectLoops(transcriptWithTimestamp);
                        prematureEnding = prematureEndingAnalyser(transcriptWithTimestamp, call.disconnection_reason);
                        longPauses = detectPauses(transcriptWithTimestamp);
                        overlappingInterruptions = detectInterruptions(transcriptWithTimestamp);
                        sentimentAnalysisRes = analyzeSentiment(transcriptWithTimestamp);
                    }

                    // Calculate CSAT score
                    const csatCallData = {
                        call_id: call.call_id,
                        agent_id: call.agent_id,
                        start_timestamp: call.start_timestamp,
                        end_timestamp: call.end_timestamp,
                        loops_detection: loopsDetection,
                        premature_ending: prematureEnding,
                        long_pauses: longPauses,
                        overlaping_interruptions: overlappingInterruptions,
                        sentiment_analysis_res: sentimentAnalysisRes,
                        no_conversation: noConversation
                    };

                    const [csatScore, csatReasons] = calculateCsatScore(csatCallData);
                    const alertTriggered = csatScore !== null && csatScore < CSAT_THRESHOLD;
                    const status = alertTriggered ? 'Unresolved' : 'Resolved';

                    await prisma.call.create({
                        data: {
                            userId,
                            callId: call.call_id,
                            agentId: call.agent_id,
                            callType: call.call_type,
                            accessToken: call.access_token,
                            fromNumber: call.from_number,
                            toNumber: call.to_number,
                            direction: call.direction,
                            callStatus: call.call_status,
                            metadata: call.metadata,
                            retellLlmDynamicVariables: call.retell_llm_dynamic_variables,
                            optOutSensitiveDataStorage: call.opt_out_sensitive_data_storage,
                            startTimestamp: call.start_timestamp,
                            endTimestamp: call.end_timestamp,
                            transcript: call.transcript,
                            transcriptObject: call.transcript_object,
                            transcriptWithToolCalls: call.transcript_with_tool_calls,
                            recordingUrl: call.recording_url,
                            publicLogUrl: call.public_log_url,
                            disconnectionReason: call.disconnection_reason,
                            callSummary: call.call_analysis?.call_summary,
                            inVoicemail: call.call_analysis?.in_voicemail,
                            userSentiment: call.call_analysis?.user_sentiment,
                            callSuccessful: call.call_analysis?.call_successful,
                            customAnalysisData: call.call_analysis?.custom_analysis_data,
                            transcriptWithTimestamp,
                            noConversation,
                            loopsDetection,
                            prematureEnding,
                            longPauses,
                            overlappingInterruptions: overlappingInterruptions,
                            sentimentAnalysisRes,
                            csatScore,
                            csatReasons,
                            customerName,
                            status,
                            timestamp
                        }
                    });

                    await updateDailyStats(userId, call.agent_id, call, csatScore);

                    console.log(`Stored call ${call.call_id} and updated daily stats`);
                } catch (error) {
                    console.error(`Error storing call ${call.call_id}:`, error);
                }
            }
        }
    } catch (error) {
        console.error('Error in fetchAndStoreCalls:', error);
        throw error;
    }
}

module.exports = {
    fetchAndStoreCalls,
    listCalls,
    processTranscriptObject,
    updateDailyStats
}; 