// Core Wallet Service
// Handles wallet creation, key derivation, and signing

import { createPublicClient, createWalletClient, http, formatEther, parseEther } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { mainnet, base, arbitrum } from 'viem/chains';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { encryptData, decryptData, setSessionKey, getSessionKey, getStoredWalletData, setStoredWalletData, type StoredWalletData } from './storage';

// Chain configurations
export const CHAINS = {
    ethereum: {
        id: 'ethereum',
        name: 'Ethereum',
        symbol: 'ETH',
        logo: 'https://i.imgur.com/NKQlhQj.png',
        rpcUrl: 'https://eth.llamarpc.com',
        chain: mainnet,
    },
    base: {
        id: 'base',
        name: 'Base',
        symbol: 'ETH',
        logo: 'https://i.imgur.com/zn5hpMs.png',
        rpcUrl: 'https://mainnet.base.org',
        chain: base,
    },
    arbitrum: {
        id: 'arbitrum',
        name: 'Arbitrum',
        symbol: 'ETH',
        logo: 'https://i.imgur.com/jmOXWlA.png',
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        chain: arbitrum,
    },
    solana: {
        id: 'solana',
        name: 'Solana',
        symbol: 'SOL',
        logo: 'https://i.imgur.com/xp7PYKk.png',
        rpcUrl: 'https://api.mainnet-beta.solana.com',
    },
} as const;

export type ChainType = keyof typeof CHAINS;

export interface WalletAccount {
    address: string;
    name: string;
    type: 'evm' | 'solana';
    chainId?: ChainType;
}

// Generate a new EVM wallet
export async function createEvmWallet(password: string, name: string = 'Wallet 1'): Promise<WalletAccount> {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);

    // Encrypt and store
    const encryptedKey = await encryptData(privateKey, password);

    const storedData = getStoredWalletData() || { wallets: [] };
    storedData.wallets.push({
        address: account.address,
        encryptedPrivateKey: encryptedKey,
        name,
        type: 'evm',
    });
    setStoredWalletData(storedData);

    // Set session key
    setSessionKey(account.address, privateKey);

    return {
        address: account.address,
        name,
        type: 'evm',
    };
}

// Generate a new Solana wallet
export async function createSolanaWallet(password: string, name: string = 'Solana Wallet 1'): Promise<WalletAccount> {
    const keypair = Keypair.generate();
    const privateKeyBase64 = Buffer.from(keypair.secretKey).toString('base64');

    // Encrypt and store
    const encryptedKey = await encryptData(privateKeyBase64, password);

    const storedData = getStoredWalletData() || { wallets: [] };
    storedData.wallets.push({
        address: keypair.publicKey.toBase58(),
        encryptedPrivateKey: encryptedKey,
        name,
        type: 'solana',
    });
    setStoredWalletData(storedData);

    return {
        address: keypair.publicKey.toBase58(),
        name,
        type: 'solana',
    };
}

// Import an EVM wallet from private key
export async function importEvmWallet(privateKey: string, password: string, name: string = 'Imported Wallet'): Promise<WalletAccount> {
    // Validate private key
    if (!privateKey.startsWith('0x')) {
        privateKey = `0x${privateKey}`;
    }

    try {
        const account = privateKeyToAccount(privateKey as `0x${string}`);

        // Encrypt and store
        const encryptedKey = await encryptData(privateKey.replace('0x', ''), password);

        const storedData = getStoredWalletData() || { wallets: [] };

        // Check if already exists
        if (storedData.wallets.some(w => w.address.toLowerCase() === account.address.toLowerCase())) {
            throw new Error('Wallet already imported');
        }

        storedData.wallets.push({
            address: account.address,
            encryptedPrivateKey: encryptedKey,
            name,
            type: 'evm',
        });
        setStoredWalletData(storedData);

        // Set session key
        setSessionKey(account.address, privateKey.replace('0x', ''));

        return {
            address: account.address,
            name,
            type: 'evm',
        };
    } catch (error) {
        throw new Error('Invalid private key');
    }
}

// Import a Solana wallet from private key (base58)
export async function importSolanaWallet(privateKeyBase58: string, password: string, name: string = 'Imported Solana'): Promise<WalletAccount> {
    try {
        const { Keypair } = await import('@solana/web3.js');
        const secretKey = Buffer.from(privateKeyBase58, 'base64'); // Note: Usually base58, but inputs might vary. Let's assume standard bs58 encoding if using a library, but here we might need bs58 decode.

        // Wait, solana web3.js Keypair.fromSecretKey expects Uint8Array.
        // User input is likely base58 string.
        const bs58 = (await import('bs58')).default;
        const decoded = bs58.decode(privateKeyBase58);
        const keypair = Keypair.fromSecretKey(decoded);

        // Encrypt and store (store as base64 for consistency with createSolanaWallet)
        const privateKeyBase64 = Buffer.from(keypair.secretKey).toString('base64');
        const encryptedKey = await encryptData(privateKeyBase64, password);

        const storedData = getStoredWalletData() || { wallets: [] };

        // Check if already exists
        if (storedData.wallets.some(w => w.address === keypair.publicKey.toBase58())) {
            throw new Error('Wallet already imported');
        }

        storedData.wallets.push({
            address: keypair.publicKey.toBase58(),
            encryptedPrivateKey: encryptedKey,
            name,
            type: 'solana',
        });
        setStoredWalletData(storedData);

        // Set session key
        setSessionKey(keypair.publicKey.toBase58(), privateKeyBase64);

        return {
            address: keypair.publicKey.toBase58(),
            name,
            type: 'solana',
        };
    } catch (error) {
        console.error(error);
        throw new Error('Invalid private key');
    }
}

// Import wallets from a JSON backup file
export async function importFromBackup(
    backupData: StoredWalletData,
    password: string
): Promise<WalletAccount[]> {
    // Validate backup structure
    if (!backupData || !Array.isArray(backupData.wallets) || backupData.wallets.length === 0) {
        throw new Error('Invalid backup file: no wallets found');
    }

    const importedWallets: WalletAccount[] = [];
    const existingData = getStoredWalletData() || { wallets: [] };
    const existingAddresses = new Set(existingData.wallets.map(w => w.address.toLowerCase()));

    for (const walletData of backupData.wallets) {
        // Skip if wallet already exists
        if (existingAddresses.has(walletData.address.toLowerCase())) {
            console.log(`Skipping wallet ${walletData.address} - already exists`);
            continue;
        }

        // Validate wallet data structure
        if (!walletData.address || !walletData.encryptedPrivateKey || !walletData.type) {
            console.warn('Skipping invalid wallet entry in backup');
            continue;
        }

        try {
            // Attempt to decrypt the private key with the provided password
            const decryptedKey = await decryptData(walletData.encryptedPrivateKey, password);
            if (!decryptedKey) {
                throw new Error('Failed to decrypt - incorrect password');
            }

            // Re-encrypt with the same password and add to storage
            // The key is already encrypted in the backup, so we just add it directly
            existingData.wallets.push({
                address: walletData.address,
                encryptedPrivateKey: walletData.encryptedPrivateKey,
                name: walletData.name || `Imported ${walletData.type === 'solana' ? 'Solana' : 'Wallet'}`,
                type: walletData.type,
                derivationPath: walletData.derivationPath,
            });

            // Set session key for immediate use
            setSessionKey(walletData.address, decryptedKey);

            importedWallets.push({
                address: walletData.address,
                name: walletData.name || `Imported ${walletData.type === 'solana' ? 'Solana' : 'Wallet'}`,
                type: walletData.type,
            });
        } catch (error) {
            console.error(`Failed to import wallet ${walletData.address}:`, error);
            throw new Error('Incorrect password or corrupted backup');
        }
    }

    if (importedWallets.length === 0) {
        throw new Error('No new wallets to import (all may already exist)');
    }

    // Save the updated wallet data
    setStoredWalletData(existingData);

    return importedWallets;
}

// Unlock a wallet with password
export async function unlockWallet(address: string, password: string): Promise<boolean> {
    const storedData = getStoredWalletData();
    if (!storedData) return false;

    const wallet = storedData.wallets.find(w => w.address.toLowerCase() === address.toLowerCase());
    if (!wallet) return false;

    const decryptedKey = await decryptData(wallet.encryptedPrivateKey, password);
    if (!decryptedKey) return false;

    setSessionKey(address, decryptedKey);
    return true;
}

// Unlock all wallets with password
export async function unlockAllWallets(password: string): Promise<boolean> {
    const storedData = getStoredWalletData();
    if (!storedData || storedData.wallets.length === 0) return false;

    let allUnlocked = true;
    for (const wallet of storedData.wallets) {
        const success = await unlockWallet(wallet.address, password);
        if (!success) allUnlocked = false;
    }

    return allUnlocked;
}

// Get EVM balance
export async function getEvmBalance(address: string, chainId: ChainType = 'ethereum'): Promise<string> {
    if (chainId === 'solana') return '0';

    const chainConfig = CHAINS[chainId];
    if (!('chain' in chainConfig)) return '0';

    try {
        const client = createPublicClient({
            chain: chainConfig.chain,
            transport: http(chainConfig.rpcUrl),
        });

        const balance = await client.getBalance({ address: address as `0x${string}` });
        return formatEther(balance);
    } catch (error) {
        console.error('Failed to fetch EVM balance:', error);
        return '0';
    }
}

// Get Solana balance
export async function getSolanaBalance(address: string): Promise<string> {
    try {
        const connection = new Connection(CHAINS.solana.rpcUrl, 'confirmed');
        const pubKey = new PublicKey(address);
        const balance = await connection.getBalance(pubKey);
        return (balance / LAMPORTS_PER_SOL).toFixed(4);
    } catch (error) {
        console.error('Failed to fetch Solana balance:', error);
        return '0';
    }
}

// Minimal ERC20 ABI for balance checking
const ERC20_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }],
    },
] as const;

// Get EVM Token Balance
export async function getErc20Balance(address: string, tokenAddress: string, chainId: ChainType = 'ethereum'): Promise<string> {
    const chainConfig = CHAINS[chainId];
    if (!('chain' in chainConfig)) return '0';

    try {
        const client = createPublicClient({
            chain: chainConfig.chain,
            transport: http(chainConfig.rpcUrl),
        });

        const [balance, decimals] = await Promise.all([
            client.readContract({
                address: tokenAddress as `0x${string}`,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [address as `0x${string}`],
            }),
            client.readContract({
                address: tokenAddress as `0x${string}`,
                abi: ERC20_ABI,
                functionName: 'decimals',
            }).catch(() => 18), // Default to 18 if fails
        ]);

        // Simple formatting without large libraries
        const balanceStr = balance.toString();
        const whole = balanceStr.substring(0, balanceStr.length - decimals) || '0';
        const fraction = balanceStr.substring(balanceStr.length - decimals);
        // Pad fraction if needed? No, formatEther handles simple cases, but for custom decimals manual generic format:
        // Actually, just use basic math for MVP display
        return (Number(balance) / Math.pow(10, decimals)).toFixed(4);
    } catch (error) {
        console.error('Failed to fetch ERC20 balance:', error);
        return '0';
    }
}

// Get Solana Token Balance
export async function getSolanaTokenBalance(address: string, mintAddress: string): Promise<string> {
    try {
        const connection = new Connection(CHAINS.solana.rpcUrl, 'confirmed');
        const pubKey = new PublicKey(address);

        // This finds all token accounts for the wallet for this specific mint
        // Standard Token Program ID: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
        const response = await connection.getParsedTokenAccountsByOwner(pubKey, {
            mint: new PublicKey(mintAddress),
        });

        let totalBalance = 0;
        for (const account of response.value) {
            const tokenAmount = account.account.data.parsed.info.tokenAmount;
            totalBalance += tokenAmount.uiAmount || 0;
        }

        return totalBalance.toFixed(4);
    } catch (error) {
        console.error('Failed to fetch SPL token balance:', error);
        return '0';
    }
}

// Get balance for any chain (Native or Token)
export async function getBalance(
    address: string,
    walletType: 'evm' | 'solana',
    chainId?: ChainType,
    tokenAddress?: string
): Promise<string> {
    if (tokenAddress) {
        if (walletType === 'solana') {
            return getSolanaTokenBalance(address, tokenAddress);
        }
        return getErc20Balance(address, tokenAddress, chainId || 'ethereum');
    }

    // Native balance
    if (walletType === 'solana') {
        return getSolanaBalance(address);
    }
    return getEvmBalance(address, chainId || 'ethereum');
}

// Get all stored wallets (without private keys)
export function getStoredWallets(): WalletAccount[] {
    const storedData = getStoredWalletData();
    if (!storedData) return [];

    return storedData.wallets.map(w => ({
        address: w.address,
        name: w.name,
        type: w.type,
    }));
}

// Check if wallets exist
export function hasWallets(): boolean {
    const storedData = getStoredWalletData();
    return storedData !== null && storedData.wallets.length > 0;
}

// Delete a wallet
export function deleteWallet(address: string): void {
    const storedData = getStoredWalletData();
    if (!storedData) return;

    storedData.wallets = storedData.wallets.filter(
        w => w.address.toLowerCase() !== address.toLowerCase()
    );
    setStoredWalletData(storedData);
}

// Rename a wallet
export function renameWallet(address: string, newName: string): void {
    const storedData = getStoredWalletData();
    if (!storedData) return;

    const wallet = storedData.wallets.find(
        w => w.address.toLowerCase() === address.toLowerCase()
    );
    if (wallet) {
        wallet.name = newName;
        setStoredWalletData(storedData);
    }
}

// Export private key (requires correct session)
export function exportPrivateKey(address: string): string | null {
    return getSessionKey(address);
}

// Sign message with EVM wallet
export async function signEvmMessage(address: string, message: string): Promise<string | null> {
    const privateKey = getSessionKey(address);
    if (!privateKey) return null;

    try {
        const account = privateKeyToAccount(privateKey as `0x${string}`);
        const signature = await account.signMessage({ message });
        return signature;
    } catch (error) {
        console.error('Failed to sign message:', error);
        return null;
    }
}

// Send EVM transaction
export async function sendEvmTransaction(
    fromAddress: string,
    toAddress: string,
    amount: string,
    chainId: ChainType = 'ethereum'
): Promise<{ success: boolean; hash?: string; error?: string }> {
    if (chainId === 'solana') {
        return { success: false, error: 'Use sendSolanaTransaction for Solana' };
    }

    const privateKey = getSessionKey(fromAddress);
    if (!privateKey) {
        return { success: false, error: 'Wallet not unlocked' };
    }

    const chainConfig = CHAINS[chainId];
    if (!('chain' in chainConfig)) {
        return { success: false, error: 'Invalid chain' };
    }

    try {
        const account = privateKeyToAccount(privateKey as `0x${string}`);

        const walletClient = createWalletClient({
            account,
            chain: chainConfig.chain,
            transport: http(chainConfig.rpcUrl),
        });

        const hash = await walletClient.sendTransaction({
            to: toAddress as `0x${string}`,
            value: parseEther(amount),
        });

        return { success: true, hash };
    } catch (error: any) {
        console.error('Failed to send EVM transaction:', error);
        return { success: false, error: error.message || 'Transaction failed' };
    }
}

// Send Solana transaction
export async function sendSolanaTransaction(
    fromAddress: string,
    toAddress: string,
    amount: string
): Promise<{ success: boolean; hash?: string; error?: string }> {
    const privateKeyBase64 = getSessionKey(fromAddress);
    if (!privateKeyBase64) {
        return { success: false, error: 'Wallet not unlocked' };
    }

    try {
        // Dynamic import to avoid SSR issues
        const { Transaction, SystemProgram, sendAndConfirmTransaction } = await import('@solana/web3.js');

        const connection = new Connection(CHAINS.solana.rpcUrl, 'confirmed');
        const secretKey = Buffer.from(privateKeyBase64, 'base64');
        const keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
        const toPubkey = new PublicKey(toAddress);

        const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: keypair.publicKey,
                toPubkey,
                lamports,
            })
        );

        const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);

        return { success: true, hash: signature };
    } catch (error: any) {
        console.error('Failed to send Solana transaction:', error);
        return { success: false, error: error.message || 'Transaction failed' };
    }
}
