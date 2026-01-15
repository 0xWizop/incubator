import { ChainId, Block, Transaction, RecentTrade } from '@/types';

const API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

// Validate API key at startup
if (!API_KEY || API_KEY === 'demo') {
    console.warn('[Alchemy] No valid API key found. Explorer data will not load. Set NEXT_PUBLIC_ALCHEMY_API_KEY in .env.local');
}

// Network RPC Endpoints
// Network RPC Endpoints - Use public RPCs if env vars are missing or blocked
const NETWORK_URLS: Record<string, string> = {
    // Use public CORS-friendly RPCs for browser requests
    // Alchemy requires domain whitelisting which may not be configured
    // Use Alchemy RPCs if key is present, otherwise fallback to public
    ethereum: API_KEY && API_KEY !== 'demo'
        ? `https://eth-mainnet.g.alchemy.com/v2/${API_KEY}`
        : (process.env.ETH_RPC_URL || 'https://eth.llamarpc.com'),

    base: API_KEY && API_KEY !== 'demo'
        ? `https://base-mainnet.g.alchemy.com/v2/${API_KEY}`
        : (process.env.BASE_RPC_URL || 'https://mainnet.base.org'),

    arbitrum: API_KEY && API_KEY !== 'demo'
        ? `https://arb-mainnet.g.alchemy.com/v2/${API_KEY}`
        : (process.env.ARB_RPC_URL || 'https://arb1.arbitrum.io/rpc'),

    solana: API_KEY && API_KEY !== 'demo'
        ? `https://solana-mainnet.g.alchemy.com/v2/${API_KEY}`
        : (process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'),
};

const PUBLIC_RPC_URLS: Record<ChainId, string> = {
    ethereum: 'https://eth.llamarpc.com',
    base: 'https://mainnet.base.org',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    solana: 'https://api.mainnet-beta.solana.com',
};

export async function rpcCall(chainId: ChainId, method: string, params: any[] = []): Promise<any> {
    // Allow Solana calls if they have a valid URL in the map
    if (!API_KEY || API_KEY === 'demo') {
        // console.warn('Alchemy API Key missing, but continuing for public RPCs');
    }

    const primaryUrl = NETWORK_URLS[chainId];
    if (!primaryUrl) return null;

    // Helper to perform the actual fetch
    const doFetch = async (url: string) => {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method,
                params,
            }),
            next: { revalidate: 10 }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.result;
    };

    try {
        return await doFetch(primaryUrl);
    } catch (error) {
        // If primary fails and it's NOT the restricted public one, try the public fallback
        // (We check strictly to avoid infinite loops if primary IS the public one)
        const publicUrl = PUBLIC_RPC_URLS[chainId];
        if (publicUrl && primaryUrl !== publicUrl) {
            console.warn(`[Alchemy] Primary RPC failed for ${chainId} (${error}), trying public fallback...`);
            try {
                return await doFetch(publicUrl);
            } catch (fallbackError) {
                console.error(`[Alchemy] Fallback RPC error [${method}]:`, fallbackError);
            }
        } else {
            console.error(`Alchemy RPC error [${method}]:`, error);
        }
        return null;
    }
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
export async function getTokenBalances(chainId: ChainId, address: string): Promise<{ contractAddress: string; tokenBalance: string }[]> {
    try {
        const result = await rpcCall(chainId, 'alchemy_getTokenBalances', [address, 'DEFAULT_TOKENS']);
        return result?.tokenBalances || [];
    } catch (error) {
        // This method fails on public RPCs or invalid keys.
        // Return empty array to trigger fallback logic in UI.
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

