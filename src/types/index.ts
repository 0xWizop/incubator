// Chain types
export type ChainId = 'solana' | 'ethereum' | 'base' | 'arbitrum';

export interface Chain {
    id: ChainId;
    name: string;
    symbol: string;
    color: string;
    rpcUrl: string;
    explorerUrl: string;
    logo: string;
    evmChainId?: number;
}

// Token types
export interface Token {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    chainId: ChainId;
    logo?: string;
    price?: number;
    priceChange24h?: number;
    volume24h?: number;
    liquidity?: number;
    marketCap?: number;
}

export interface TokenPair {
    baseToken: Token;
    quoteToken: Token;
    pairAddress: string;
    dexId: string;
    chainId: ChainId;
    priceUsd: number;
    priceNative: number;
    volume24h: number;
    liquidity: number;
    fdv?: number;
    priceChange: {
        m5: number;
        h1: number;
        h6: number;
        h24: number;
    };
    txns24h: {
        buys: number;
        sells: number;
    };
    createdAt?: string;
    url?: string;
    logo?: string;
}

// Block types
export interface Block {
    number: number;
    hash: string;
    parentHash?: string;
    timestamp: number;
    chainId: ChainId;
    transactions: number;
    gasUsed?: number;
    gasLimit?: number;
    miner?: string;
    validator?: string;
    baseFeePerGas?: string;
}

// Transaction types
export interface Transaction {
    hash: string;
    chainId: ChainId;
    blockNumber: number;
    timestamp: number;
    from: string;
    to: string | null;
    value: string;
    gasPrice?: string;
    gasUsed?: string;
    nonce?: number;
    status: 'success' | 'failed' | 'pending';
    type?: string;
    asset?: string; // Symbol of the transferred asset (e.g., 'ETH', 'USDC')
    input?: string;
    logs?: TransactionLog[];
    // For swap transactions
    tokenIn?: string;
    tokenOut?: string;
    amountIn?: string;
    amountOut?: string;
    // Solana specific details
    instructions?: {
        programId: string;
        program?: string;
        data?: string;
        parsed?: any;
    }[];
    accounts?: {
        pubkey: string;
        signer: boolean;
        writable: boolean;
    }[];
}

export interface TransactionLog {
    address: string;
    topics: string[];
    data: string;
    logIndex: number;
}

// Address types
export interface Address {
    address: string;
    chainId: ChainId;
    balance: string;
    tokenBalances?: TokenBalance[];
    transactionCount?: number;
    isContract?: boolean;
    label?: string;
}

export interface TokenBalance {
    token: Token;
    balance: string;
    value?: number;
}

// User preferences
export type CurrencyDisplay = 'USD' | 'EUR' | 'GBP' | 'BTC';
export type SlippageTolerance = 0.5 | 1 | 3 | 'custom';

export interface UserPreferences {
    darkMode: boolean;
    defaultChain: ChainId;
    // Trading preferences
    defaultSlippage: number; // percentage, e.g., 0.5, 1, 3
    customSlippage?: number; // for custom slippage values
    // Display preferences  
    currencyDisplay: CurrencyDisplay;
    hideBalances: boolean;
    // Notifications
    notifications: {
        tradeAlerts: boolean;
        rewardUpdates: boolean;
        priceAlerts: boolean;
        newsAlerts: boolean;
    };
}

// Subscription & Access Control types
export type SubscriptionTier = 'free' | 'pro' | 'beta' | 'lifetime';
export type UserRole = 'user' | 'beta_tester' | 'admin';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'none';

export interface Subscription {
    tier: SubscriptionTier;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    status: SubscriptionStatus;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
}

export interface UserFlags {
    isBetaTester: boolean;        // Participated in beta (Jan 26 - Feb 16)
    hasLifetimeDiamond: boolean;  // Permanent lowest trading fees
    hasLifetimeProTools: boolean; // Permanent pro analytics access
    isWhitelisted: boolean;       // Allowed to use platform
    isBlacklisted: boolean;       // Blocked from platform
}

// User types
export interface User {
    address: string;
    chains: ChainId[];
    createdAt: Date;
    referralCode: string;
    referredBy?: string;
    totalVolume: number;
    lastActive: Date;
    email?: string;
    displayName?: string;
    photoURL?: string;
    preferences?: UserPreferences;
    // Subscription & Access Control
    subscription?: Subscription;
    flags?: UserFlags;
    role?: UserRole;
}

// Trade types
export interface Trade {
    id: string;
    userId: string;
    chainId: ChainId;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    amountOut: string;
    amountInUsd: number;
    txHash: string;
    timestamp: Date;
    priceImpact?: number;
    route?: string[];
}

// Rewards types
export interface Rewards {
    userId: string;
    tradingRewards: number;
    referralRewards: number;
    claimedRewards: number;
    lastUpdated: Date;
}

export interface Referral {
    ownerId: string;
    code: string;
    referredUsers: string[];
    totalReferralVolume: number;
    earnedRewards: number;
}

// Chart types
export interface CandlestickData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

export interface ChartTimeframe {
    label: string;
    value: string;
    seconds: number;
}

// Recent trade type (for trade feed)
export interface RecentTrade {
    txHash: string;
    type: 'buy' | 'sell';
    price: number;
    amount: number;
    totalUsd: number;
    timestamp: number;
    maker: string;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

// Watchlist types
export interface WatchlistToken {
    address: string;
    pairAddress: string;
    chainId: ChainId;
    symbol: string;
    name: string;
    logo?: string;
    addedAt: Date;
}

export interface Watchlist {
    id: string;
    name: string;
    tokens: WatchlistToken[];
    createdAt: Date;
    updatedAt: Date;
}

// Price alert types
export interface PriceAlert {
    id: string;
    userId: string;
    tokenAddress: string;
    pairAddress: string;
    chainId: ChainId;
    symbol: string;
    name: string;
    logo?: string;
    condition: 'above' | 'below';
    targetPrice: number;
    priceAtCreation: number;
    triggered: boolean;
    createdAt: Date;
}

// Tracked wallet types
export interface TrackedWallet {
    id: string;
    userId: string;
    address: string;
    name: string;
    chainId: ChainId;
    isActive: boolean;
    notifyOnActivity: boolean;
    lastActivityAt?: Date;
    createdAt: Date;
}

export interface WalletActivity {
    id: string;
    walletId: string;
    hash: string;
    type: 'swap' | 'transfer' | 'buy' | 'sell';
    tokenIn?: {
        symbol: string;
        amount: string;
        usd: number;
    };
    tokenOut?: {
        symbol: string;
        amount: string;
        usd: number;
    };
    totalUsd: number;
    chainId: ChainId;
    timestamp: Date;
    notified: boolean;
}

// Copy Trading types
export interface TraderStats {
    followers: number;
    totalVolume: number;
    winRate: number;
    roi7d: number;
    roi30d: number;
    roi90d: number;
    roiAllTime: number;
    totalTrades: number;
    profitableTrades: number;
    avgTradeSize: number;
    activeChains: ChainId[];
}

export interface Trader {
    id: string;
    walletAddress: string;
    displayName: string;
    avatar?: string;
    bio?: string;
    isVerified: boolean;
    isPro: boolean;
    stats: TraderStats;
    settings: {
        allowCopying: boolean;
        commissionRate: number;
        minCopyAmount?: number;
        maxCopiers?: number;
    };
    createdAt: Date;
    lastTradeAt?: Date;
}

export interface CopySettings {
    isActive: boolean;
    maxAmountPerTrade: number;
    copyRatio: number;
    onlyChains?: ChainId[];
    onlyTokens?: string[];
    excludeTokens?: string[];
    minTradeSize?: number;
    maxTradeSize?: number;
    stopLossPercent?: number;
    takeProfitPercent?: number;
    maxDailyLoss?: number;
}

export interface CopyPerformance {
    totalCopiedTrades: number;
    totalVolume: number;
    totalProfit: number;
    totalLoss: number;
    currentRoi: number;
    lastCopyAt?: Date;
}

export interface CopyRelationship {
    id: string;
    copierId: string;
    traderId: string;
    settings: CopySettings;
    performance: CopyPerformance;
    totalCommissionPaid: number;
    createdAt: Date;
    startedAt: Date;
    pausedAt?: Date;
    stoppedAt?: Date;
}

export interface CopiedTrade {
    id: string;
    copyRelationshipId: string;
    originalTrade: {
        traderId: string;
        txHash: string;
        chainId: ChainId;
        tokenIn: string;
        tokenOut: string;
        amountIn: string;
        amountOut: string;
        amountInUsd: number;
        timestamp: Date;
    };
    copiedTrade: {
        copierId: string;
        txHash?: string;
        amountIn: string;
        amountOut?: string;
        executedAt?: Date;
        status: 'pending' | 'executed' | 'failed' | 'skipped';
        failureReason?: string;
    };
    copyRatio: number;
    profitLoss?: number;
    commission?: number;
    createdAt: Date;
}

export interface TraderApplication {
    id: string;
    userId: string;
    walletAddress: string;
    bio: string;
    experience: string;
    strategy: string;
    expectedRoi: string;
    verificationTxHash?: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewedAt?: Date;
    reviewedBy?: string;
    rejectionReason?: string;
    createdAt: Date;
}

// === PORTFOLIO SNAPSHOT TYPES ===

export interface PortfolioSnapshot {
    id: string;
    userId: string;
    walletAddress: string;
    chainId: ChainId;
    timestamp: Date;
    holdings: SnapshotHolding[];
    totalValueUsd: number;
}

export interface SnapshotHolding {
    tokenAddress: string;
    symbol: string;
    name: string;
    balance: string;
    priceUsd: number;
    valueUsd: number;
    logo?: string;
}

// === SHARED WATCHLIST TYPES ===

export type WatchlistVisibility = 'private' | 'public' | 'shared';

export interface SharedWatchlist extends Watchlist {
    ownerId: string;
    ownerName?: string;
    visibility: WatchlistVisibility;
    followers: number;
    sharedWith?: string[]; // User IDs with access
    description?: string;
    tags?: string[];
}

export interface WatchlistFollower {
    id: string;
    userId: string;
    watchlistId: string;
    ownerId: string;
    followedAt: Date;
}

// === ENHANCED PRICE ALERT TYPES ===

export type AlertConditionType =
    | 'price_above'
    | 'price_below'
    | 'volume_above'
    | 'volume_below'
    | 'liquidity_change'
    | 'percent_change';

export type AlertTimeframe = '1h' | '24h' | '7d';

export interface EnhancedPriceAlert {
    id: string;
    userId: string;
    tokenAddress: string;
    pairAddress: string;
    chainId: ChainId;
    symbol: string;
    name: string;
    logo?: string;
    conditionType: AlertConditionType;
    targetValue: number;
    currentValue: number; // Value at creation
    timeframe?: AlertTimeframe; // For percent change
    triggered: boolean;
    triggeredAt?: Date;
    triggeredValue?: number; // Value when triggered
    createdAt: Date;
}

// === ADDRESS BOOK TYPES ===

export interface AddressBookEntry {
    id: string;
    userId: string;
    address: string;
    name: string;
    chain: ChainId | 'all'; // 'all' for EVM addresses that work on all chains
    createdAt: Date;
    lastUsed?: Date;
    isFavorite?: boolean;
}

// === SAVED NEWS ARTICLE TYPES ===

export type SentimentType = 'bullish' | 'bearish' | 'neutral';

export interface SavedArticle {
    id: string;
    articleId: string;
    userId: string;
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
    publishedAt: string;
    sourceName: string;
    sentiment?: SentimentType;
    savedAt: Date;
}
