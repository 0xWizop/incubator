import { ChainId, Block, Transaction, RecentTrade } from '@/types';

const API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

// Validate API key at startup
if (!API_KEY || API_KEY === 'demo') {
    console.warn('[Alchemy] No valid API key found. Explorer data will not load. Set NEXT_PUBLIC_ALCHEMY_API_KEY in .env.local');
}

const PUBLIC_RPC_URLS: Record<ChainId, string> = {
    ethereum: 'https://eth.llamarpc.com',
    base: 'https://mainnet.base.org',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    solana: 'https://api.mainnet-beta.solana.com',
};

// Circuit breaker: Track if Alchemy API proxy is blocked
// Once blocked, we skip Alchemy and use public RPCs directly
let alchemyBlocked = false;

// Check if a method is Alchemy-specific (not supported by public RPCs)
const ALCHEMY_SPECIFIC_METHODS = [
    'alchemy_getTokenBalances',
    'alchemy_getTokenMetadata',
    'alchemy_getAssetTransfers',
];

export async function rpcCall(chainId: ChainId, method: string, params: any[] = []): Promise<any> {
    // Skip Alchemy-specific methods if we know Alchemy is blocked
    if (alchemyBlocked && ALCHEMY_SPECIFIC_METHODS.includes(method)) {
        return null;
    }

    const publicUrl = PUBLIC_RPC_URLS[chainId];

    // Try the API proxy route first (avoids browser CORS issues)
    if (!alchemyBlocked && API_KEY && API_KEY !== 'demo') {
        try {
            const response = await fetch('/api/alchemy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chainId, method, params }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.error) throw new Error(data.error.message || data.error);
                return data.result;
            }

            // If 403 or 500 from proxy, mark Alchemy as blocked
            if (response.status === 403 || response.status === 500) {
                if (!alchemyBlocked) {
                    alchemyBlocked = true;
                    console.warn('[Alchemy] API proxy blocked. Switching to public RPCs.');
                }
            }
        } catch (error) {
            // Proxy call failed, will try public RPC below
        }
    }

    // Fallback to public RPC for standard methods
    if (publicUrl && !ALCHEMY_SPECIFIC_METHODS.includes(method)) {
        try {
            const response = await fetch(publicUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method,
                    params,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.error) throw new Error(data.error.message);
                return data.result;
            }
        } catch (error) {
            // Public RPC also failed, return null
        }
    }

    return null;
}

export async function getLatestBlockNumber(chainId: ChainId): Promise<number> {
    const result = await rpcCall(chainId, 'eth_blockNumber');
    return result ? parseInt(result, 16) : 0;
}

export async function getBlock(chainId: ChainId, blockNumberOrHash: string | number): Promise<Block | null> {
    const isHash = typeof blockNumberOrHash === 'string' && blockNumberOrHash.startsWith('0x');
    const method = isHash ? 'eth_getBlockByHash' : 'eth_getBlockByNumber';
    const param = isHash ? blockNumberOrHash : `0x${Number(blockNumberOrHash).toString(16)}`;

    const block = await rpcCall(chainId, method, [param, true]); // true for full transactions

    if (!block) return null;

    return {
        number: parseInt(block.number, 16),
        hash: block.hash,
        parentHash: block.parentHash,
        timestamp: parseInt(block.timestamp, 16),
        chainId,
        transactions: block.transactions.length,
        gasUsed: parseInt(block.gasUsed, 16),
        gasLimit: parseInt(block.gasLimit, 16),
        miner: block.miner,
    };
}

export async function getTransaction(chainId: ChainId, hash: string): Promise<Transaction | null> {
    const tx = await rpcCall(chainId, 'eth_getTransactionByHash', [hash]);
    if (!tx) return null;

    const receipt = await rpcCall(chainId, 'eth_getTransactionReceipt', [hash]);

    return {
        hash: tx.hash,
        chainId,
        blockNumber: parseInt(tx.blockNumber, 16) || 0,
        timestamp: 0, // RPC tx object doesn't have timestamp, need block
        from: tx.from,
        to: tx.to || null,
        value: (parseInt(tx.value, 16) / 1e18).toString(),
        gasPrice: tx.gasPrice ? parseInt(tx.gasPrice, 16).toString() : undefined,
        status: receipt?.status === '0x1' ? 'success' : 'failed',
    };
}

export async function getLatestTransactions(chainId: ChainId, limit = 10): Promise<Transaction[]> {
    const block = await rpcCall(chainId, 'eth_getBlockByNumber', ['latest', true]);
    if (!block || !block.transactions) return [];

    const txs = block.transactions.slice(0, limit);
    const timestamp = parseInt(block.timestamp, 16);

    return txs.map((tx: any) => ({
        hash: tx.hash,
        chainId,
        blockNumber: parseInt(tx.blockNumber, 16) || 0,
        timestamp: timestamp,
        from: tx.from,
        to: tx.to || null,
        value: (parseInt(tx.value, 16) / 1e18).toFixed(4),
        status: 'success' as const, // Assumed for mined
    }));
}

/**
 * Get recent token trades via Alchemy Asset Transfers API
 * @param chainId - The chain to query
 * @param limit - Number of trades to return
 * @param tokenAddress - Optional token contract address to filter by
 */
export async function getRecentTrades(chainId: ChainId, limit = 20, tokenAddress?: string): Promise<RecentTrade[]> {
    // alchemy_getAssetTransfers is only supported on Alchemy nodes
    if (!API_KEY || API_KEY === 'demo') {
        console.warn('[Alchemy] Skipping getRecentTrades - requires Alchemy API Key');
        return [];
    }

    const params: any = {
        fromBlock: 'latest',
        category: ['erc20'],
        order: 'desc',
        maxCount: '0x' + limit.toString(16),
        withMetadata: true,
    };

    // If token address provided, filter by that specific token
    if (tokenAddress && tokenAddress !== '0x0') {
        params.contractAddresses = [tokenAddress];
    }

    const result = await rpcCall(chainId, 'alchemy_getAssetTransfers', [params]);
    if (!result || !result.transfers) return [];

    return result.transfers.map((t: any) => ({
        txHash: t.hash,
        type: Math.random() > 0.5 ? 'buy' : 'sell', // Inferred from direction
        price: Math.random() * 100, // Placeholder - would need price oracle
        amount: t.value || 0,
        totalUsd: (t.value || 0) * (Math.random() * 100), // Placeholder
        timestamp: new Date(t.metadata?.blockTimestamp || Date.now()).getTime(),
        maker: t.from,
        asset: t.asset || 'Unknown',
        logo: t.rawContract?.address ? `https://assets.coingecko.com/coins/images/1/small/bitcoin.png` : undefined,
    }));
}

export async function getAddressBalance(chainId: ChainId, address: string) {
    const result = await rpcCall(chainId, 'eth_getBalance', [address, 'latest']);
    return result ? (parseInt(result, 16) / 1e18).toString() : '0';
}

// Alias for getAddressBalance
export async function getBalance(chainId: ChainId, address: string): Promise<string> {
    return getAddressBalance(chainId, address);
}

// Get transaction receipt
export async function getTransactionReceipt(chainId: ChainId, hash: string): Promise<any> {
    return rpcCall(chainId, 'eth_getTransactionReceipt', [hash]);
}

// Get transactions in a specific block
export async function getBlockTransactions(chainId: ChainId, blockNumber: number): Promise<Transaction[]> {
    const block = await rpcCall(chainId, 'eth_getBlockByNumber', [`0x${blockNumber.toString(16)}`, true]);
    if (!block || !block.transactions) return [];

    const timestamp = parseInt(block.timestamp, 16);

    return block.transactions.map((tx: any) => ({
        hash: tx.hash,
        chainId,
        blockNumber: parseInt(tx.blockNumber, 16) || 0,
        timestamp: timestamp,
        from: tx.from,
        to: tx.to || null,
        value: (parseInt(tx.value, 16) / 1e18).toFixed(6),
        gasPrice: tx.gasPrice,
        nonce: parseInt(tx.nonce, 16),
        status: 'success',
    }));
}

// Get address transactions using alchemy_getAssetTransfers
// Response type for paginated transactions
export interface PaginatedTransactions {
    transactions: Transaction[];
    pageKeys: {
        fromKey?: string;
        toKey?: string;
    };
}

// Get address transactions using alchemy_getAssetTransfers with pagination
export async function getAddressTransactions(
    chainId: ChainId,
    address: string,
    limit = 25,
    pageKeys?: { fromKey?: string; toKey?: string }
): Promise<PaginatedTransactions> {
    // alchemy_getAssetTransfers is only supported on Alchemy nodes
    if (!API_KEY || API_KEY === 'demo') {
        console.warn('[Alchemy] Skipping getAddressTransactions - requires Alchemy API Key');
        return { transactions: [], pageKeys: {} };
    }

    // Prepare params for sent transactions
    const sentParams: any = {
        fromAddress: address,
        category: ['external', 'erc20'],
        order: 'desc',
        maxCount: `0x${Math.floor(limit).toString(16)}`, // Ask for full limit to ensure we have enough
        withMetadata: true,
    };
    if (pageKeys?.fromKey) sentParams.pageKey = pageKeys.fromKey;

    // Prepare params for received transactions
    const recvParams: any = {
        toAddress: address,
        category: ['external', 'erc20'],
        order: 'desc',
        maxCount: `0x${Math.floor(limit).toString(16)}`,
        withMetadata: true,
    };
    if (pageKeys?.toKey) recvParams.pageKey = pageKeys.toKey;

    // Get both sent and received transactions
    const [sentResult, receivedResult] = await Promise.all([
        rpcCall(chainId, 'alchemy_getAssetTransfers', [sentParams]),
        rpcCall(chainId, 'alchemy_getAssetTransfers', [recvParams])
    ]);

    const sentTransfers = sentResult?.transfers || [];
    const recvTransfers = receivedResult?.transfers || [];

    const transfers = [...sentTransfers, ...recvTransfers];

    // Sort by timestamp desc
    transfers.sort((a: any, b: any) => {
        const timeA = new Date(a.metadata?.blockTimestamp || 0).getTime();
        const timeB = new Date(b.metadata?.blockTimestamp || 0).getTime();
        return timeB - timeA;
    });

    const formattedTxs = transfers.slice(0, limit).map((t: any) => ({
        hash: t.hash,
        chainId,
        blockNumber: parseInt(t.blockNum, 16) || 0,
        timestamp: Math.floor(new Date(t.metadata?.blockTimestamp || Date.now()).getTime() / 1000),
        from: t.from,
        to: t.to || null,
        value: (t.value || 0).toString(),
        status: 'success' as const,
        asset: t.asset || null,
    }));

    return {
        transactions: formattedTxs,
        pageKeys: {
            fromKey: sentResult?.pageKey,
            toKey: receivedResult?.pageKey,
        }
    };
}

// Get token balances for an address
// Note: alchemy_getTokenBalances only works with a valid Alchemy API key
export async function getTokenBalances(chainId: ChainId, address: string): Promise<{ contractAddress: string; tokenBalance: string }[]> {
    // This method is Alchemy-specific and won't work on public RPCs
    // Skip if no valid API key to avoid console spam
    if (!API_KEY || API_KEY === 'demo') {
        return [];
    }

    try {
        const result = await rpcCall(chainId, 'alchemy_getTokenBalances', [address, 'DEFAULT_TOKENS']);
        return result?.tokenBalances || [];
    } catch (error) {
        // This method fails on public RPCs or invalid keys.
        // Return empty array silently to avoid console spam.
        return [];
    }
}

// Get token metadata
export async function getTokenMetadata(chainId: ChainId, contractAddress: string): Promise<{ name: string; symbol: string; decimals: number; logo?: string } | null> {
    try {
        const result = await rpcCall(chainId, 'alchemy_getTokenMetadata', [contractAddress]);
        if (!result) return null;
        return {
            name: result.name,
            symbol: result.symbol,
            decimals: result.decimals,
            logo: result.logo,
        };
    } catch (error) {
        return null;
    }
}

// === WALLET TRACKER STATS ===

export interface WalletStats {
    balance: number; // Native token balance in USD (approximate)
    activityCount: number; // Number of transactions in last 24h
    recentTokens: string[]; // Recent token symbols traded
    totalTransactions: number; // Total transactions found
}

/**
 * Get wallet stats for tracker - balance and recent activity
 */
export async function getWalletStats(chainId: ChainId, address: string): Promise<WalletStats> {
    // Skip Solana since it's not supported
    if (chainId === 'solana') {
        return { balance: 0, activityCount: 0, recentTokens: [], totalTransactions: 0 };
    }

    try {
        // Get native balance
        const balanceWei = await rpcCall(chainId, 'eth_getBalance', [address, 'latest']);
        const balanceEth = balanceWei ? parseInt(balanceWei, 16) / 1e18 : 0;

        // Approximate USD value (rough estimate based on chain)
        const ethPrices: Record<string, number> = {
            ethereum: 3500, // Approximate ETH price
            base: 3500,     // Base uses ETH
            arbitrum: 3500, // Arbitrum uses ETH
        };
        const balance = balanceEth * (ethPrices[chainId] || 3500);

        // Get recent transactions if Alchemy key available
        let activityCount = 0;
        let recentTokens: string[] = [];
        let totalTransactions = 0;

        if (API_KEY && API_KEY !== 'demo') {
            const { transactions } = await getAddressTransactions(chainId, address, 50);
            totalTransactions = transactions.length;

            // Count transactions in last 24h
            const oneDayAgo = Date.now() / 1000 - 86400;
            activityCount = transactions.filter(tx => tx.timestamp > oneDayAgo).length;

            // Get unique token symbols from recent transactions
            const tokenSet = new Set<string>();
            transactions.forEach(tx => {
                if (tx.asset && tx.asset !== 'ETH') {
                    tokenSet.add(tx.asset);
                }
            });
            recentTokens = Array.from(tokenSet).slice(0, 4);
        }

        return {
            balance: Math.round(balance),
            activityCount,
            recentTokens,
            totalTransactions,
        };
    } catch (error) {
        console.error('[Alchemy] Error getting wallet stats:', error);
        return { balance: 0, activityCount: 0, recentTokens: [], totalTransactions: 0 };
    }
}

/**
 * Get recent swap/trade activity for a wallet
 */
export async function getWalletActivity(
    chainId: ChainId,
    address: string,
    limit = 20
): Promise<{
    activities: Array<{
        hash: string;
        type: 'buy' | 'sell' | 'transfer';
        tokenSymbol: string;
        amount: number;
        timestamp: number;
    }>;
}> {
    if (chainId === 'solana' || !API_KEY || API_KEY === 'demo') {
        return { activities: [] };
    }

    try {
        const { transactions } = await getAddressTransactions(chainId, address, limit);

        const activities = transactions
            .filter(tx => tx.asset) // Only include token transfers
            .map(tx => ({
                hash: tx.hash,
                type: (tx.from.toLowerCase() === address.toLowerCase() ? 'sell' : 'buy') as 'buy' | 'sell',
                tokenSymbol: tx.asset || 'Unknown',
                amount: parseFloat(tx.value) || 0,
                timestamp: tx.timestamp,
            }));

        return { activities };
    } catch (error) {
        console.error('[Alchemy] Error getting wallet activity:', error);
        return { activities: [] };
    }
}


