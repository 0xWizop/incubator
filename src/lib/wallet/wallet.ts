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
        rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
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

    // Set session key
    setSessionKey(keypair.publicKey.toBase58(), privateKeyBase64);

    return {
        address: keypair.publicKey.toBase58(),
        name,
        type: 'solana',
    };
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

// Get balance for any chain
export async function getBalance(address: string, walletType: 'evm' | 'solana', chainId?: ChainType): Promise<string> {
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
