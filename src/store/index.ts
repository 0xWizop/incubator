import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChainId, Token, TokenPair } from '@/types';

// App state
interface AppState {
    // Chain selection
    selectedChains: ChainId[];
    toggleChain: (chainId: ChainId) => void;
    setSelectedChains: (chains: ChainId[]) => void;

    // Current token/pair for trading
    currentPair: TokenPair | null;
    setCurrentPair: (pair: TokenPair | null) => void;

    // Search
    searchQuery: string;
    setSearchQuery: (query: string) => void;

    // Sidebar
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;

    // Theme (for future use)
    theme: 'dark' | 'light';
    setTheme: (theme: 'dark' | 'light') => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            // Chain selection - default to all chains
            selectedChains: ['ethereum', 'base', 'arbitrum', 'solana'],
            toggleChain: (chainId) =>
                set((state) => ({
                    selectedChains: state.selectedChains.includes(chainId)
                        ? state.selectedChains.filter((c) => c !== chainId)
                        : [...state.selectedChains, chainId],
                })),
            setSelectedChains: (chains) => set({ selectedChains: chains }),

            // Current pair
            currentPair: null,
            setCurrentPair: (pair) => set({ currentPair: pair }),

            // Search
            searchQuery: '',
            setSearchQuery: (query) => set({ searchQuery: query }),

            // Sidebar
            sidebarOpen: true,
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
            setSidebarOpen: (open) => set({ sidebarOpen: open }),

            // Theme
            theme: 'dark',
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'cypherx-app-storage',
            partialize: (state) => ({
                selectedChains: state.selectedChains,
                theme: state.theme,
            }),
        }
    )
);

// Re-export wallet store from dedicated module
export { useWalletStore } from './walletStore';

// Re-export watchlist store
export { useWatchlistStore } from './watchlistStore';
export { usePortfolioStore } from './portfolioStore';

// Trading state
interface TradingState {
    // Swap form
    tokenIn: Token | null;
    tokenOut: Token | null;
    amountIn: string;
    amountOut: string;
    slippage: number;

    // Actions
    setTokenIn: (token: Token | null) => void;
    setTokenOut: (token: Token | null) => void;
    setAmountIn: (amount: string) => void;
    setAmountOut: (amount: string) => void;
    setSlippage: (slippage: number) => void;
    swapTokens: () => void;
    resetSwap: () => void;
}

export const useTradingStore = create<TradingState>()((set, get) => ({
    tokenIn: null,
    tokenOut: null,
    amountIn: '',
    amountOut: '',
    slippage: 0.5,

    setTokenIn: (token) => set({ tokenIn: token }),
    setTokenOut: (token) => set({ tokenOut: token }),
    setAmountIn: (amount) => set({ amountIn: amount }),
    setAmountOut: (amount) => set({ amountOut: amount }),
    setSlippage: (slippage) => set({ slippage }),
    swapTokens: () => {
        const { tokenIn, tokenOut, amountIn, amountOut } = get();
        set({
            tokenIn: tokenOut,
            tokenOut: tokenIn,
            amountIn: amountOut,
            amountOut: amountIn,
        });
    },
    resetSwap: () =>
        set({
            tokenIn: null,
            tokenOut: null,
            amountIn: '',
            amountOut: '',
        }),
}));
