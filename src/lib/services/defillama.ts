export class DefiLlamaService {
    private static BASE_URL = 'https://api.llama.fi';

    /**
     * Fetch current TVL for all chains
     */
    static async getChainTvls() {
        try {
            const response = await fetch(`${this.BASE_URL}/v2/chains`);
            if (!response.ok) throw new Error('Failed to fetch chain TVLs');

            const data = await response.json();

            // Map to our app's chain IDs where possible and sort by TVL
            return data
                .sort((a: any, b: any) => b.tvl - a.tvl)
                .slice(0, 20) // Top 20 chains
                .map((chain: any) => ({
                    name: chain.name,
                    tvl: chain.tvl,
                    tokenSymbol: chain.tokenSymbol,
                    chainId: chain.chainId,
                    raw: chain
                }));
        } catch (error) {
            console.error('DefiLlama TVL error:', error);
            return [];
        }
    }

    /**
     * Fetch DEX volume overview
     */
    static async getChainVolumes() {
        try {
            // This endpoint returns daily volume breakdown by chain
            const response = await fetch(`${this.BASE_URL}/overview/dexs?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyVolume`);
            if (!response.ok) throw new Error('Failed to fetch DEX volumes');

            const data = await response.json();

            // The API structure is complex, let's extract the total24h which is usually a breakdown
            if (data.total24h) {
                // Returns object { [chainName]: volume }
                return Object.entries(data.total24h)
                    .map(([chain, volume]) => ({
                        name: chain,
                        volume: Number(volume)
                    }))
                    .sort((a, b) => b.volume - a.volume)
                    .slice(0, 20);
            }

            return [];
        } catch (error) {
            console.error('DefiLlama Volume error:', error);
            return [];
        }
    }
}
