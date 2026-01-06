// Wallet Storage Service
// Secure encrypted storage for wallet data

const WALLET_STORAGE_KEY = 'cypherx_wallet_data';

// Simple encryption using Web Crypto API
async function deriveKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256',
        } as Pbkdf2Params,
        keyMaterial,
        { name: 'AES-GCM', length: 256 } as AesKeyGenParams,
        false,
        ['encrypt', 'decrypt']
    );
}

export async function encryptData(data: string, password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt.buffer as ArrayBuffer);

    const enc = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv } as AesGcmParams,
        key,
        enc.encode(data)
    );

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    return btoa(String.fromCharCode(...combined));
}

export async function decryptData(encryptedData: string, password: string): Promise<string | null> {
    try {
        const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const data = combined.slice(28);

        const key = await deriveKey(password, salt.buffer as ArrayBuffer);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv } as AesGcmParams,
            key,
            data
        );

        const dec = new TextDecoder();
        return dec.decode(decrypted);
    } catch {
        return null;
    }
}

export interface StoredWalletData {
    wallets: Array<{
        address: string;
        encryptedPrivateKey: string;
        name: string;
        type: 'evm' | 'solana';
        derivationPath?: string;
    }>;
    encryptedMnemonic?: string;
}

export function getStoredWalletData(): StoredWalletData | null {
    if (typeof window === 'undefined') return null;
    try {
        const data = localStorage.getItem(WALLET_STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

export function setStoredWalletData(data: StoredWalletData): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(data));
}

export function clearStoredWalletData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(WALLET_STORAGE_KEY);
}

// Session management - store decrypted key in memory only
const sessionPrivateKeys: Map<string, string> = new Map();
const SESSION_FLAG_KEY = 'cypherx_session_active';

export function setSessionKey(address: string, privateKey: string): void {
    sessionPrivateKeys.set(address.toLowerCase(), privateKey);
    // Also set a flag in sessionStorage so we know there's an active session after refresh
    if (typeof window !== 'undefined') {
        sessionStorage.setItem(SESSION_FLAG_KEY, 'true');
    }
}

export function getSessionKey(address: string): string | null {
    return sessionPrivateKeys.get(address.toLowerCase()) || null;
}

export function clearSession(): void {
    sessionPrivateKeys.clear();
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem(SESSION_FLAG_KEY);
    }
}

export function hasActiveSession(): boolean {
    // Check both in-memory keys AND sessionStorage flag
    // If sessionStorage says we had a session, we need to prompt re-unlock once
    // but the stored wallets will auto-load
    if (sessionPrivateKeys.size > 0) {
        return true;
    }
    // If we have the session flag but no keys in memory, session expired (page refresh)
    // For a smoother UX, we'll keep them "unlocked" as long as the tab is open
    if (typeof window !== 'undefined' && sessionStorage.getItem(SESSION_FLAG_KEY) === 'true') {
        return true;
    }
    return false;
}
