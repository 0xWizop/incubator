import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    WalletAccount,
    createEvmWallet,
    createSolanaWallet,
    unlockAllWallets,
    getStoredWallets,
    hasWallets,
    getBalance,
    renameWallet,
    ChainType,
} from '@/lib/wallet';
import { clearSession, hasActiveSession } from '@/lib/wallet/storage';

interface WalletState {
    // Wallet accounts
    wallets: WalletAccount[];
    activeWallet: WalletAccount | null;

    // State
    isUnlocked: boolean;
    isLoading: boolean;
    error: string | null;

    // Active chain for EVM wallets
    activeChain: ChainType;

    // Balances cache
    balances: Record<string, string>;

    // Modal state
    isModalOpen: boolean;
    modalView: 'main' | 'create' | 'import' | 'unlock';

    // Actions
    initialize: () => void;
    createWallet: (password: string, type: 'evm' | 'solana', name?: string) => Promise<boolean>;
    importWallet: (password: string, privateKey: string, type: 'evm' | 'solana', name?: string) => Promise<boolean>;
    renameWallet: (address: string, newName: string) => void;
    unlock: (password: string) => Promise<boolean>;
    lock: () => void;
    setActiveWallet: (address: string) => void;
    setActiveChain: (chain: ChainType) => void;
    refreshBalances: () => Promise<void>;
    openModal: (view?: 'main' | 'create' | 'import' | 'unlock') => void;
    closeModal: () => void;
    setError: (error: string | null) => void;
}

export const useWalletStore = create<WalletState>()((set, get) => ({
    // Initial state
    wallets: [],
    activeWallet: null,
    isUnlocked: false,
    isLoading: false,
    error: null,
    activeChain: 'ethereum',
    balances: {},
    isModalOpen: false,
    modalView: 'main',

    // Initialize wallet state from storage
    initialize: () => {
        const storedWallets = getStoredWallets();
        const hasSession = hasActiveSession();

        set({
            wallets: storedWallets,
            activeWallet: storedWallets.length > 0 ? storedWallets[0] : null,
            isUnlocked: hasSession,
        });

        // If we have an active session, refresh balances
        if (hasSession && storedWallets.length > 0) {
            get().refreshBalances();
        }
    },

    // Create a new wallet
    createWallet: async (password, type, name) => {
        set({ isLoading: true, error: null });

        try {
            let wallet: WalletAccount;

            if (type === 'evm') {
                const walletCount = get().wallets.filter(w => w.type === 'evm').length;
                wallet = await createEvmWallet(password, name || `Wallet ${walletCount + 1}`);
            } else {
                const walletCount = get().wallets.filter(w => w.type === 'solana').length;
                wallet = await createSolanaWallet(password, name || `Solana ${walletCount + 1}`);
            }

            const updatedWallets = [...get().wallets, wallet];

            set({
                wallets: updatedWallets,
                activeWallet: wallet,
                isUnlocked: true,
                isLoading: false,
                isModalOpen: false,
            });

            // Fetch balance for new wallet
            get().refreshBalances();

            return true;
        } catch (error) {
            console.error('Failed to create wallet:', error);
            set({
                isLoading: false,
                error: 'Failed to create wallet. Please try again.',
            });
            return false;
        }
    },

    // Import a wallet
    importWallet: async (password, privateKey, type, name) => {
        set({ isLoading: true, error: null });

        try {
            // Dynamic import to avoid SSR issues
            const { importEvmWallet, importSolanaWallet } = await import('@/lib/wallet');

            let wallet: WalletAccount;

            if (type === 'evm') {
                const walletCount = get().wallets.filter(w => w.type === 'evm').length;
                wallet = await importEvmWallet(privateKey, password, name || `Imported Wallet ${walletCount + 1}`);
            } else {
                const walletCount = get().wallets.filter(w => w.type === 'solana').length;
                wallet = await importSolanaWallet(privateKey, password, name || `Imported Solana ${walletCount + 1}`);
            }

            const updatedWallets = [...get().wallets, wallet];

            set({
                wallets: updatedWallets,
                activeWallet: wallet,
                isUnlocked: true,
                isLoading: false,
                isModalOpen: false,
            });

            get().refreshBalances();
            return true;
        } catch (error: any) {
            console.error('Failed to import wallet:', error);
            set({
                isLoading: false,
                error: error.message || 'Failed to import wallet. Check your private key.',
            });
            return false;
        }
    },

    // Rename wallet
    renameWallet: (address, newName) => {
        renameWallet(address, newName);

        const updatedWallets = get().wallets.map(w =>
            w.address.toLowerCase() === address.toLowerCase()
                ? { ...w, name: newName }
                : w
        );

        set({ wallets: updatedWallets });

        if (get().activeWallet?.address.toLowerCase() === address.toLowerCase()) {
            set({ activeWallet: { ...get().activeWallet!, name: newName } });
        }
    },

    // Unlock wallet with password
    unlock: async (password) => {
        set({ isLoading: true, error: null });

        try {
            const success = await unlockAllWallets(password);

            if (success) {
                set({
                    isUnlocked: true,
                    isLoading: false,
                    isModalOpen: false,
                });
                get().refreshBalances();
                return true;
            } else {
                set({
                    isLoading: false,
                    error: 'Incorrect password. Please try again.',
                });
                return false;
            }
        } catch (error) {
            set({
                isLoading: false,
                error: 'Failed to unlock wallet.',
            });
            return false;
        }
    },

    // Lock wallet
    lock: () => {
        clearSession();
        set({
            isUnlocked: false,
            balances: {},
        });
    },

    // Set active wallet
    setActiveWallet: (address) => {
        const wallet = get().wallets.find(
            w => w.address.toLowerCase() === address.toLowerCase()
        );
        if (wallet) {
            set({ activeWallet: wallet });
            get().refreshBalances();
        }
    },

    // Set active chain
    setActiveChain: (chain) => {
        set({ activeChain: chain });
        get().refreshBalances();
    },

    // Refresh balances
    refreshBalances: async () => {
        const { activeWallet, activeChain, isUnlocked } = get();
        if (!activeWallet || !isUnlocked) return;

        try {
            const balance = await getBalance(
                activeWallet.address,
                activeWallet.type,
                activeWallet.type === 'evm' ? activeChain : undefined
            );

            set({
                balances: {
                    ...get().balances,
                    [`${activeWallet.address}-${activeChain}`]: balance,
                },
            });
        } catch (error) {
            console.error('Failed to refresh balance:', error);
        }
    },

    // Modal controls
    openModal: (view = 'main') => {
        const wallets = get().wallets;
        const isUnlocked = get().isUnlocked;

        // If we have wallets but not unlocked, show unlock view
        if (wallets.length > 0 && !isUnlocked) {
            set({ isModalOpen: true, modalView: 'unlock' });
        } else {
            set({ isModalOpen: true, modalView: view });
        }
    },

    closeModal: () => {
        set({ isModalOpen: false, error: null });
    },

    setError: (error) => {
        set({ error });
    },
}));
