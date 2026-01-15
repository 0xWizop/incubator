// Core types for 0x API
export interface ZeroExQuoteParams {
    chainId: number;
    sellToken: string;
    buyToken: string;
    sellAmount?: string;
    buyAmount?: string;
    taker?: string;
    slippagePercentage?: number;
}

export interface ZeroExPriceParams {
    chainId: number;
    sellToken: string;
    buyToken: string;
    sellAmount: string;
}

export interface ZeroExQuoteResponse {
    price: string;
    guaranteedPrice: string;
    to: string;
    data: string;
    value: string;
    gas: string;
    estimatedGas: string;
    gasPrice: string;
    buyAmount: string;
    sellAmount: string;
    buyTokenAddress: string;
    sellTokenAddress: string;
    allowanceTarget: string;
    estimatedPriceImpact: string;
}

import axios from 'axios';

// Use local API proxy to avoid CORS and secure API key
const API_BASE_URL = '/api/swap';

export async function getQuote(params: ZeroExQuoteParams): Promise<ZeroExQuoteResponse | null> {
    try {
        const response = await axios.get(`${API_BASE_URL}/quote`, {
            params: {
                ...params,
            },
        });
        return response.data;
    } catch (error) {
        console.error('0x API Error (Quote):', error);
        return null;
    }
}

export async function getPrice(params: ZeroExPriceParams) {
    try {
        const response = await axios.get(`${API_BASE_URL}/price`, {
            params: {
                ...params,
            },
        });
        return response.data;
    } catch (error) {
        console.error('0x API Error (Price):', error);
        return null;
    }
}

// Helper to get 0x Chain ID from our internal ChainId
export function getZeroExChainId(chainId: string): number | null {
    switch (chainId) {
        case 'ethereum': return 1;
        case 'base': return 8453;
        case 'arbitrum': return 42161;
        case 'optimism': return 10;
        case 'polygon': return 137;
        case 'avalanche': return 43114;
        case 'bsc': return 56;
        default: return null;
    }
}
