function detectLoops(transcriptWithTimestamp) {
    if (!transcriptWithTimestamp || transcriptWithTimestamp.length < 4) {
        return null;
    }

    const agentMessages = transcriptWithTimestamp
        .filter(entry => entry.role === 'agent');

    if (agentMessages.length < 2) {
        return null;
    }

    const loops = [];
    const similarityThreshold = 0.8;

    for (let i = 0; i < agentMessages.length - 1; i++) {
        for (let j = i + 1; j < agentMessages.length; j++) {
            const similarity = calculateSimilarity(
                agentMessages[i].content.toLowerCase(), 
                agentMessages[j].content.toLowerCase()
            );
            if (similarity >= similarityThreshold) {
                // Store as [start_time_first_utterance, start_time_second_utterance, similarity_score]
                loops.push([
                    agentMessages[i].start_timestamp,
                    agentMessages[j].start_timestamp,
                    similarity
                ]);
            }
        }
    }

    return loops.length > 0 ? loops : null;
}

function calculateSimilarity(str1, str2) {
    // Convert strings to sets of words
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));

    // Calculate intersection and union
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    // Calculate Jaccard similarity
    return intersection.size / union.size;
}

module.exports = {
    detectLoops
}; 