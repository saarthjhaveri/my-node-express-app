function analyzeSentiment(transcriptWithTimestamp) {
    if (!transcriptWithTimestamp || transcriptWithTimestamp.length === 0) {
        return null;
    }

    const customerMessages = transcriptWithTimestamp.filter(msg => msg.role === 'customer');
    if (customerMessages.length === 0) {
        return null;
    }

    // Return list of sentiment analysis results for each customer message
    return customerMessages.map(msg => ({
        timestamp: msg.start_timestamp,
        message: msg.content,
        sentiment: categorizeScore(calculateSentimentScore(msg.content)),
        score: calculateSentimentScore(msg.content)
    }));
}

function calculateSentimentScore(text) {
    // Simple rule-based sentiment scoring
    const positiveWords = new Set([
        'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
        'helpful', 'perfect', 'thank', 'thanks', 'appreciate', 'happy',
        'pleased', 'satisfied', 'love', 'awesome', 'brilliant', 'yes'
    ]);

    const negativeWords = new Set([
        'bad', 'poor', 'terrible', 'horrible', 'awful', 'disappointed',
        'frustrating', 'useless', 'unhelpful', 'waste', 'annoying',
        'angry', 'upset', 'hate', 'wrong', 'no', 'not', 'never'
    ]);

    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    let wordCount = 0;

    for (const word of words) {
        if (positiveWords.has(word)) {
            score += 1;
            wordCount++;
        } else if (negativeWords.has(word)) {
            score -= 1;
            wordCount++;
        }
    }

    // Normalize score to range [-1, 1]
    return wordCount > 0 ? score / wordCount : 0;
}

function categorizeScore(score) {
    if (score > 0.3) return 'positive';
    if (score < -0.3) return 'negative';
    return 'neutral';
}

module.exports = {
    analyzeSentiment
}; 