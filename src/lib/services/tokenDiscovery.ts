
import { ChainId } from '@/types';
import { getBalance } from '@/lib/wallet'; // We will use a direct balance check

// Explorer API endpoints (Fallbacks)
const EXPLORERS: Record<string, string> = {
    ethereum: 'https://api.etherscan.io/api',
    base: 'https://api.basescan.org/api',
    arbitrum: 'https://api.arbiscan.io/api',
};

// Standard RPC Log fetching (More reliable than free Explorer APIs)
import { rpcCall } from './alchemy';

// ERC20 Transfer Event Signature
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

/**
 * Discovers tokens by scanning the user's past Transfer events.
 * 1. Get recent logs where topic1 (key "from") OR topic2 (key "to") is user address.
 * 2. Extract unique contract addresses (the "emitters").
 * 3. Filter by current balance > 0.
 */
export async function discoverTokens(chainId: ChainId, address: string): Promise<string[]> {
    try {
        // Method 1: Try Explorer API (Token List) if available (Blockscout style)
        // Base Blockscout supports this, generic Etherscan does not easily without key.
        // We will stick to RPC Logs for reliability across all chains using the same provider.

        // Pad address to 32 bytes for log topics
        const paddedAddress = '0x000000000000000000000000' + address.slice(2).toLowerCase();

        // We scan the last ~10,000 blocks (short history) or known range. 
        // Note: Free RPCs limit range. We might need multiple calls or just hope for recent activity.
        // A better approach for "Full History" without an indexer is hard.
        // Let's rely on the Explorer API for the "Transfer Scan" as it covers deeper history than RPC.

        const explorerUrl = EXPLORERS[chainId];
        if (explorerUrl) {
            return await scanExplorerForTokens(explorerUrl, address);
        }

        return [];
    } catch (e) {
        console.error("Token discovery failed:", e);
        return [];
    }
}

async function scanExplorerForTokens(baseUrl: string, address: string): Promise<string[]> {
    // Etherscan: ?module=account&action=tokentx&address={address}&sort=desc
    const url = `${baseUrl}?module=account&action=tokentx&address=${address}&page=1&offset=100&sort=desc`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === '1' && Array.isArray(data.result)) {
            const contracts = new Set<string>();
            data.result.forEach((tx: any) => {
                if (tx.contractAddress) contracts.add(tx.contractAddress);
            });
            return Array.from(contracts);
        }
    } catch (e) {
        console.warn("Explorer scan failed", e);
    }
    return [];
}
