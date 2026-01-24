import { Connection, PublicKey, LAMPORTS_PER_SOL, ParsedTransactionWithMeta } from '@solana/web3.js';
import { Block, Transaction, Address } from '@/types';

// Solana RPC connection
// Using Helius RPC for reliable access (public Solana RPC is heavily rate-limited)
const SOLANA_RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=27276b9e-3b2a-4476-8c33-3bc90f8d76a8';

// Track if RPC is available (avoids spamming failed requests)
let rpcAvailable = true;
let lastRpcCheck = 0;
const RPC_CHECK_INTERVAL = 60000; // 1 minute

function getConnection(): Connection | null {
    // If RPC was unavailable, wait before retrying
    if (!rpcAvailable && Date.now() - lastRpcCheck < RPC_CHECK_INTERVAL) {
        return null;
    }
    return new Connection(SOLANA_RPC_URL, 'confirmed');
}

// Get latest slot (Solana's equivalent of block number)
export async function getLatestSlot(): Promise<number> {
    const connection = getConnection();
    if (!connection) return 0;

    try {
        const slot = await connection.getSlot();
        rpcAvailable = true;
        return slot;
    } catch (error: any) {
        const errorMessage = error?.message || String(error);
        if (errorMessage.includes('403') || errorMessage.includes('429')) {
            if (rpcAvailable) {
                console.warn('[Solana] Public RPC blocked. Disabling Solana updates temporarily.');
            }
            rpcAvailable = false;
            lastRpcCheck = Date.now();
        }
        return 0;
    }
}

// Get block by slot
export async function getBlock(slot: number): Promise<Block | null> {
    try {
        const connection = getConnection();
        if (!connection) return null;
        const block = await connection.getBlock(slot, {
            maxSupportedTransactionVersion: 0,
        });

        if (!block) return null;

        return {
            number: slot,
            hash: block.blockhash,
            timestamp: block.blockTime || Math.floor(Date.now() / 1000),
            chainId: 'solana',
            transactions: block.transactions?.length || 0,
            validator: block.rewards?.[0]?.pubkey,
        };
    } catch (error) {
        console.error(`Error fetching Solana block ${slot}:`, error);
        return null;
    }
}

// Get transactions for a specific block
export async function getBlockTransactions(slot: number): Promise<Transaction[]> {
    try {
        const connection = getConnection();
        if (!connection) return [];

        // Use getParsedBlock to get human-readable instruction data
        const block = await connection.getParsedBlock(slot, {
            maxSupportedTransactionVersion: 0,
        });

        if (!block || !block.transactions) return [];

        const transactions: Transaction[] = [];

        for (const tx of block.transactions) {
            // Safety check for parsed transaction type
            if (!('transaction' in tx) || !('message' in tx.transaction)) continue;

            const parsedTx = tx as unknown as ParsedTransactionWithMeta;
            const signature = parsedTx.transaction.signatures[0];

            // Extract signer (fee payer is usually the first account)
            // For parsed transactions, accountKeys are objects { pubkey, signer, ... }
            const accountKeys = parsedTx.transaction.message.accountKeys;
            const from = accountKeys[0]?.pubkey.toString() || 'Unknown';

            let to: string | null = null;
            let value = '0';

            // Try to find a top-level SOL transfer
            const instructions = parsedTx.transaction.message.instructions;
            for (const ix of instructions) {
                if ('parsed' in ix && ix.parsed?.type === 'transfer') {
                    to = ix.parsed.info?.destination;
                    value = (ix.parsed.info?.lamports / LAMPORTS_PER_SOL).toString();
                    break;
                }
            }

            // If no clear transfer, use the second account as 'to' or keep null
            if (!to && accountKeys.length > 1) {
                // Often the 2nd account is the program or recipient
                to = accountKeys[1]?.pubkey.toString();
            }

            transactions.push({
                hash: signature,
                chainId: 'solana',
                blockNumber: slot,
                timestamp: block.blockTime || Math.floor(Date.now() / 1000),
                from,
                to,
                value,
                status: parsedTx.meta?.err ? 'failed' : 'success',
            });
        }

        return transactions;
    } catch (error) {
        console.error(`Error fetching Solana block transactions ${slot}:`, error);
        return [];
    }
}

// Get latest blocks
export async function getLatestBlocks(count = 10): Promise<Block[]> {
    try {
        const latestSlot = await getLatestSlot();
        const blocks: Block[] = [];

        for (let i = 0; i < count; i++) {
            const slot = latestSlot - i;
            const block = await getBlock(slot);
            if (block) blocks.push(block);
        }

        return blocks;
    } catch (error) {
        console.error('Error fetching latest Solana blocks:', error);
        return [];
    }
}

// Get transaction by signature
export async function getTransaction(signature: string): Promise<Transaction | null> {
    try {
        const connection = getConnection();
        if (!connection) return null;
        const tx = await connection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0,
        });

        if (!tx) return null;

        // Extract basic transaction info
        const accountKeys = tx.transaction.message.accountKeys;
        const fromAccount = accountKeys[0]?.pubkey.toString();

        // Try to find the main recipient
        let toAccount: string | null = null;
        let value = '0';

        // Look for SOL transfer in instructions
        const instructions = tx.transaction.message.instructions;
        for (const ix of instructions) {
            if ('parsed' in ix && ix.parsed?.type === 'transfer') {
                toAccount = ix.parsed.info?.destination;
                value = (ix.parsed.info?.lamports / LAMPORTS_PER_SOL).toString();
                break;
            }
        }

        return {
            hash: signature,
            chainId: 'solana',
            blockNumber: tx.slot,
            timestamp: tx.blockTime || Math.floor(Date.now() / 1000),
            from: fromAccount,
            to: toAccount,
            value,
            status: tx.meta?.err ? 'failed' : 'success',
            accounts: accountKeys.map(acc => ({
                pubkey: acc.pubkey.toString(),
                signer: acc.signer,
                writable: acc.writable,
            })),
            instructions: instructions.map(ix => {
                if ('parsed' in ix) {
                    return {
                        programId: ix.programId.toString(),
                        program: ix.program,
                        parsed: ix.parsed,
                    };
                } else {
                    return {
                        programId: ix.programId.toString(),
                        data: ix.data,
                    };
                }
            }),
        };
    } catch (error) {
        console.error(`Error fetching Solana transaction ${signature}:`, error);
        return null;
    }
}

// Get address balance
export async function getAddressBalance(address: string): Promise<Address | null> {
    try {
        const connection = getConnection();
        if (!connection) return null;
        const pubkey = new PublicKey(address);

        const balance = await connection.getBalance(pubkey);
        const accountInfo = await connection.getAccountInfo(pubkey);

        return {
            address,
            chainId: 'solana',
            balance: (balance / LAMPORTS_PER_SOL).toString(),
            isContract: accountInfo?.executable || false,
        };
    } catch (error) {
        console.error(`Error fetching Solana address ${address}:`, error);
        return null;
    }
}

// Get recent transactions for an address
export async function getAddressTransactions(
    address: string,
    limit = 20
): Promise<Transaction[]> {
    try {
        const connection = getConnection();
        if (!connection) return [];
        const pubkey = new PublicKey(address);

        const signatures = await connection.getSignaturesForAddress(pubkey, { limit });
        const transactions: Transaction[] = [];

        for (const sig of signatures) {
            const tx = await getTransaction(sig.signature);
            if (tx) transactions.push(tx);
        }

        return transactions;
    } catch (error) {
        console.error(`Error fetching transactions for address ${address}:`, error);
        return [];
    }
}

// Get latest transactions (simplified)
export async function getLatestTransactions(count = 20): Promise<Transaction[]> {
    try {
        const connection = getConnection();
        if (!connection) return [];
        const latestSlot = await getLatestSlot();
        if (latestSlot === 0) return []; // RPC unavailable
        const transactions: Transaction[] = [];
        let slot = latestSlot;

        while (transactions.length < count && slot > latestSlot - 10) {
            try {
                const block = await connection.getBlock(slot, {
                    maxSupportedTransactionVersion: 0,
                });

                if (block?.transactions) {
                    for (const tx of block.transactions.slice(0, count - transactions.length)) {
                        const signature = tx.transaction.signatures[0];
                        if (signature) {
                            const transaction = await getTransaction(signature);
                            if (transaction) transactions.push(transaction);
                        }
                    }
                }
            } catch (e) {
                // Block might not be available, continue to next
            }
            slot--;
        }

        return transactions.slice(0, count);
    } catch (error) {
        console.error('Error fetching latest Solana transactions:', error);
        return [];
    }
}

// Validate Solana address
export function isValidSolanaAddress(address: string): boolean {
    try {
        new PublicKey(address);
        return true;
    } catch {
        return false;
    }
}
// Get all SPL tokens for an address
export async function getAllSplTokens(address: string): Promise<{ mint: string; amount: number; decimals: number }[]> {
    try {
        const connection = getConnection();
        if (!connection) return [];
        const pubkey = new PublicKey(address);

        const response = await connection.getParsedTokenAccountsByOwner(pubkey, {
            programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // SPL Token Program
        });

        return response.value.map((item) => {
            const info = item.account.data.parsed.info;
            return {
                mint: info.mint,
                amount: info.tokenAmount.uiAmount,
                decimals: info.tokenAmount.decimals,
            };
        }).filter(t => t.amount > 0);
    } catch (error) {
        console.error('Error fetching SPL tokens:', error);
        return [];
    }
}
