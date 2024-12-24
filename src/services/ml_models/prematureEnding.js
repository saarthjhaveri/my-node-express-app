function prematureEndingAnalyser(transcriptWithTimestamp, disconnectionReason) {
    if (!transcriptWithTimestamp || transcriptWithTimestamp.length === 0) {
        return null;
    }

    const lastMessage = transcriptWithTimestamp[transcriptWithTimestamp.length - 1];
    const secondLastMessage = transcriptWithTimestamp.length > 1 ? 
        transcriptWithTimestamp[transcriptWithTimestamp.length - 2] : null;

    // Check for abrupt disconnection patterns
    const abruptDisconnection = checkAbruptDisconnection(lastMessage, secondLastMessage, disconnectionReason);
    
    // Check for incomplete conversation patterns
    const incompleteConversation = checkIncompleteConversation(lastMessage, transcriptWithTimestamp);

    if (abruptDisconnection || incompleteConversation) {
        return {
            detected: true,
            reason: {
                abrupt_disconnection: abruptDisconnection,
                incomplete_conversation: incompleteConversation,
                disconnection_reason: disconnectionReason || null,
                last_message: lastMessage?.content || null,
                last_message_role: lastMessage?.role || null,
                second_last_message: secondLastMessage?.content || null,
                second_last_message_role: secondLastMessage?.role || null
            }
        };
    }

    return null;
}

function checkAbruptDisconnection(lastMessage, secondLastMessage, disconnectionReason) {
    if (!lastMessage) return false;

    // Check if the last message was from the customer
    const lastMessageFromCustomer = lastMessage.role === 'customer';
    
    // Check if there was an error or unexpected disconnection
    const hasErrorDisconnection = disconnectionReason && 
        ['error', 'unexpected', 'timeout'].some(term => 
            disconnectionReason.toLowerCase().includes(term));

    // Check if the conversation ended mid-sentence
    const midSentenceEnding = lastMessage.content.trim().match(/[,;]$|\.{3}$/);

    // Check for question in the last agent message
    const endedWithQuestion = secondLastMessage && 
        secondLastMessage.role === 'agent' && 
        secondLastMessage.content.trim().match(/\?$/);

    return hasErrorDisconnection || midSentenceEnding || (endedWithQuestion && !lastMessageFromCustomer);
}

function checkIncompleteConversation(lastMessage, transcript) {
    if (!lastMessage || transcript.length < 2) return false;

    // Check if the last message contains indicators of incompleteness
    const incompleteIndicators = [
        'let me', 'i will', 'please wait', 'one moment',
        'hold on', 'let me check', 'i\'ll check'
    ];

    const lastMessageLower = lastMessage.content.toLowerCase();
    const hasIncompleteIndicator = incompleteIndicators.some(indicator => 
        lastMessageLower.includes(indicator));

    // Check if the last message was a question from the agent
    const lastMessageWasAgentQuestion = lastMessage.role === 'agent' && 
        lastMessage.content.trim().endsWith('?');

    return hasIncompleteIndicator || lastMessageWasAgentQuestion;
}

module.exports = {
    prematureEndingAnalyser
}; 