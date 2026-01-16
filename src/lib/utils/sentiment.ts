import { SentimentType } from '@/types';

// Bullish keywords and phrases
const BULLISH_KEYWORDS = [
    'surge', 'soar', 'rally', 'bullish', 'breakout', 'all-time high', 'ath',
    'moon', 'pump', 'gain', 'rise', 'jump', 'spike', 'boom', 'explode',
    'adoption', 'approval', 'partnership', 'launch', 'milestone', 'record',
    'institutional', 'accumulation', 'buy signal', 'upgrade', 'outperform',
    'growth', 'profit', 'recovery', 'breakthrough', 'success', 'winning',
    'optimistic', 'positive', 'strong', 'momentum', 'uptrend', 'support',
];

// Bearish keywords and phrases
const BEARISH_KEYWORDS = [
    'crash', 'plunge', 'dump', 'bearish', 'collapse', 'fall', 'drop',
    'decline', 'slump', 'tank', 'sink', 'tumble', 'plummet', 'sell-off',
    'selloff', 'fear', 'panic', 'warning', 'risk', 'concern', 'trouble',
    'ban', 'hack', 'exploit', 'scam', 'fraud', 'investigation', 'lawsuit',
    'regulation', 'crackdown', 'restriction', 'loss', 'liquidation',
    'bankruptcy', 'insolvency', 'downgrade', 'underperform', 'weak',
    'pessimistic', 'negative', 'downtrend', 'resistance', 'failed',
];

export interface SentimentResult {
    sentiment: SentimentType;
    confidence: number; // 0-1
    bullishScore: number;
    bearishScore: number;
}

/**
 * Analyze the sentiment of text based on keyword matching
 * @param text - The text to analyze (title + description)
 * @returns Sentiment result with confidence score
 */
export function analyzeSentiment(text: string): SentimentResult {
    const lowerText = text.toLowerCase();

    let bullishScore = 0;
    let bearishScore = 0;

    // Count bullish keyword matches
    for (const keyword of BULLISH_KEYWORDS) {
        if (lowerText.includes(keyword)) {
            bullishScore++;
        }
    }

    // Count bearish keyword matches
    for (const keyword of BEARISH_KEYWORDS) {
        if (lowerText.includes(keyword)) {
            bearishScore++;
        }
    }

    const totalMatches = bullishScore + bearishScore;

    // Determine sentiment
    let sentiment: SentimentType = 'neutral';
    let confidence = 0;

    if (totalMatches > 0) {
        if (bullishScore > bearishScore) {
            sentiment = 'bullish';
            confidence = bullishScore / totalMatches;
        } else if (bearishScore > bullishScore) {
            sentiment = 'bearish';
            confidence = bearishScore / totalMatches;
        } else {
            sentiment = 'neutral';
            confidence = 0.5;
        }

        // Boost confidence if there are multiple matches
        confidence = Math.min(1, confidence * (1 + totalMatches * 0.1));
    }

    return {
        sentiment,
        confidence,
        bullishScore,
        bearishScore,
    };
}

/**
 * Get a simple sentiment classification
 */
export function getSentiment(title: string, description?: string): SentimentType {
    const text = `${title} ${description || ''}`;
    return analyzeSentiment(text).sentiment;
}
