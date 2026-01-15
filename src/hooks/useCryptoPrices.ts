import { useState, useEffect } from 'react';
import { ChainId } from '@/types';

interface Prices {
    ethereum: number;
    solana: number;
}

export function useCryptoPrices() {
    const [prices, setPrices] = useState<Prices>({ ethereum: 0, solana: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                // Use CoinGecko simple price API
                const response = await fetch(
                    'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana&vs_currencies=usd'
                );

                if (!response.ok) throw new Error('Failed to fetch prices');

                const data = await response.json();

                setPrices({
                    ethereum: data.ethereum?.usd || 0,
                    solana: data.solana?.usd || 0
                });
            } catch (error) {
                console.error('Error fetching crypto prices:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 60000); // Update every minute

        return () => clearInterval(interval);
    }, []);

    const getPriceForChain = (chainId: ChainId | string): number => {
        if (chainId === 'solana') return prices.solana;
        // All EVM chains in this app (Base, Arbitrum, Ethereum) use ETH as native currency
        return prices.ethereum;
    };

    return { prices, loading, getPriceForChain };
}
