function detectPauses(transcriptWithTimestamp) {
    if (!transcriptWithTimestamp || transcriptWithTimestamp.length < 2) {
        return null;
    }

    const LONG_PAUSE_THRESHOLD = 5; // 5 seconds
    const longPauses = [];

    for (let i = 1; i < transcriptWithTimestamp.length; i++) {
        const currentMessage = transcriptWithTimestamp[i];
        const previousMessage = transcriptWithTimestamp[i - 1];

        const timeDiff = currentMessage.start_timestamp - previousMessage.end_timestamp;
        
        if (timeDiff >= LONG_PAUSE_THRESHOLD) {
            // Store as [start_time, end_time, duration]
            longPauses.push([
                previousMessage.end_timestamp,
                currentMessage.start_timestamp,
                timeDiff
            ]);
        }
    }

    return longPauses.length > 0 ? longPauses : null;
}

function detectInterruptions(transcriptWithTimestamp) {
    if (!transcriptWithTimestamp || transcriptWithTimestamp.length < 2) {
        return null;
    }

    const OVERLAP_THRESHOLD = 0.5; // 0.5 seconds
    const interruptions = [];

    for (let i = 1; i < transcriptWithTimestamp.length; i++) {
        const currentMessage = transcriptWithTimestamp[i];
        const previousMessage = transcriptWithTimestamp[i - 1];

        // Check for overlap between messages
        if (currentMessage.start_timestamp < previousMessage.end_timestamp) {
            const overlapDuration = previousMessage.end_timestamp - currentMessage.start_timestamp;
            
            if (overlapDuration >= OVERLAP_THRESHOLD) {
                // Store as [start_time, end_time]
                interruptions.push([
                    currentMessage.start_timestamp,
                    previousMessage.end_timestamp
                ]);
            }
        }
    }

    return interruptions.length > 0 ? interruptions : null;
}

module.exports = {
    detectPauses,
    detectInterruptions
}; 