import { Chain, ChainId } from '@/types';

// Supported chains configuration
export const CHAINS: Record<ChainId, Chain> = {
    solana: {
        id: 'solana',
        name: 'Solana',
        symbol: 'SOL',
        color: '#9945ff',
        rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=27276b9e-3b2a-4476-8c33-3bc90f8d76a8',
        explorerUrl: 'https://solscan.io',
        logo: 'https://i.imgur.com/xp7PYKk.png',
    },
    ethereum: {
        id: 'ethereum',
        name: 'Ethereum',
        symbol: 'ETH',
        color: '#627eea',
        rpcUrl: process.env.ETH_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/',
        explorerUrl: 'https://etherscan.io',
        logo: 'https://i.imgur.com/NKQlhQj.png',
        evmChainId: 1,
    },
    base: {
        id: 'base',
        name: 'Base',
        symbol: 'ETH',
        color: '#0052ff',
        rpcUrl: process.env.BASE_RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/',
        explorerUrl: 'https://basescan.org',
        logo: 'https://i.imgur.com/zn5hpMs.png',
        evmChainId: 8453,
    },
    arbitrum: {
        id: 'arbitrum',
        name: 'Arbitrum',
        symbol: 'ETH',
        color: '#28a0f0',
        rpcUrl: process.env.ARB_RPC_URL || 'https://arb-mainnet.g.alchemy.com/v2/',
        explorerUrl: 'https://arbiscan.io',
        logo: 'https://i.imgur.com/jmOXWlA.png',
        evmChainId: 42161,
    },
};

// Chain order for display
export const CHAIN_ORDER: ChainId[] = ['solana', 'ethereum', 'base', 'arbitrum'];

// Get chain by ID
export function getChain(chainId: ChainId): Chain {
    return CHAINS[chainId];
}

// Get all chains
export function getAllChains(): Chain[] {
    return CHAIN_ORDER.map((id) => CHAINS[id]);
}

// Get EVM chains only
export function getEvmChains(): Chain[] {
    return getAllChains().filter((chain) => chain.evmChainId !== undefined);
}

// Check if chain is EVM
export function isEvmChain(chainId: ChainId): boolean {
    return CHAINS[chainId].evmChainId !== undefined;
}

// Format chain for display
export function formatChainName(chainId: ChainId): string {
    return CHAINS[chainId]?.name || chainId;
}
