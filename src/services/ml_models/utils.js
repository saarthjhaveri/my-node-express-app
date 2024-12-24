function checkNoConversation(transcriptWithTimestamp) {
    if (!transcriptWithTimestamp || transcriptWithTimestamp.length === 0) {
        return true;
    }

    // Count messages from each role
    const roleCounts = transcriptWithTimestamp.reduce((counts, entry) => {
        counts[entry.role] = (counts[entry.role] || 0) + 1;
        return counts;
    }, {});

    // Check if there's meaningful interaction
    const hasCustomerMessages = roleCounts['customer'] > 0;
    const hasAgentMessages = roleCounts['agent'] > 0;

    return !(hasCustomerMessages && hasAgentMessages);
}

function extractCustomerName(transcriptWithTimestamp) {
    if (!transcriptWithTimestamp || transcriptWithTimestamp.length === 0) {
        return null;
    }

    // Look for common name patterns in customer messages
    const namePatterns = [
        /my name is ([A-Z][a-z]+ ?[A-Z]?[a-z]*)/i,
        /this is ([A-Z][a-z]+ ?[A-Z]?[a-z]*)/i,
        /([A-Z][a-z]+ ?[A-Z]?[a-z]*) speaking/i,
        /([A-Z][a-z]+ ?[A-Z]?[a-z]*) here/i
    ];

    for (const entry of transcriptWithTimestamp) {
        if (entry.role === 'customer') {
            const content = entry.content;
            for (const pattern of namePatterns) {
                const match = content.match(pattern);
                if (match && match[1]) {
                    return match[1].trim();
                }
            }
        }
    }

    return null;
}

module.exports = {
    checkNoConversation,
    extractCustomerName
}; 