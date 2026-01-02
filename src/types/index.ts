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
    input?: string;
    logs?: TransactionLog[];
    // For swap transactions
    tokenIn?: string;
    tokenOut?: string;
    amountIn?: string;
    amountOut?: string;
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

// User types
export interface User {
    address: string;
    chains: ChainId[];
    createdAt: Date;
    referralCode: string;
    referredBy?: string;
    totalVolume: number;
    lastActive: Date;
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
