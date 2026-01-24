export const KNOWN_ADDRESSES: Record<string, string> = {
    // Solana Programs
    '11111111111111111111111111111111': 'System Program',
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'Token Program',
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL': 'Associated Token Account Program',
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s': 'Metaplex Token Metadata',
    'Memo1UhkJRfx71h1HmEnjJeHAp2ywtQkKV98yCqq1Os': 'Memo Program',
    'ComputeBudget111111111111111111111111111111': 'Compute Budget Program',
    'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'Jupiter V6 Swap',
    'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': 'Orca Whirlpools',
    'RVKd61ztZW9GUwhRbbLoCfVg7WDPU6Z4h54onZyGz5': 'Raydium Liquidity Pool V4',
    '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': 'Raydium Liquidity Pool V4 (Legacy)',
    // Add more as needed
};

export function getAddressLabel(address: string): string | undefined {
    return KNOWN_ADDRESSES[address];
}
