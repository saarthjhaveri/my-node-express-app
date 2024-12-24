function calculateCsatScore(callData) {
    if (!callData) {
        return [null, null];
    }

    let score = 100;
    const reasons = [];

    // Check for no conversation
    if (callData.no_conversation) {
        score -= 30;
        reasons.push("No meaningful conversation detected");
    }

    // Check for loops
    if (callData.loops_detection?.detected) {
        const loopPenalty = Math.min(callData.loops_detection.total_loops * 10, 30);
        score -= loopPenalty;
        reasons.push(`Detected ${callData.loops_detection.total_loops} conversation loops`);
    }

    // Check for premature ending
    if (callData.premature_ending?.detected) {
        score -= 20;
        if (callData.premature_ending.reason.abrupt_disconnection) {
            reasons.push("Call ended abruptly");
        }
        if (callData.premature_ending.reason.incomplete_conversation) {
            reasons.push("Conversation ended prematurely");
        }
    }

    // Check for long pauses
    if (callData.long_pauses?.detected) {
        const pausePenalty = Math.min(callData.long_pauses.total_pauses * 5, 20);
        score -= pausePenalty;
        reasons.push(`Detected ${callData.long_pauses.total_pauses} long pauses`);
    }

    // Check for interruptions
    if (callData.overlaping_interruptions?.detected) {
        const interruptionPenalty = Math.min(callData.overlaping_interruptions.total_interruptions * 5, 20);
        score -= interruptionPenalty;
        reasons.push(`Detected ${callData.overlaping_interruptions.total_interruptions} interruptions`);
    }

    // Check sentiment
    if (callData.sentiment_analysis_res) {
        switch (callData.sentiment_analysis_res.overall_sentiment) {
            case 'negative':
                score -= 20;
                reasons.push("Overall negative customer sentiment");
                break;
            case 'neutral':
                score -= 10;
                reasons.push("Neutral customer sentiment");
                break;
            // No penalty for positive sentiment
        }
    }

    // Ensure score stays within bounds
    score = Math.max(0, Math.min(100, score));

    return [score, reasons];
}

module.exports = {
    calculateCsatScore
}; 