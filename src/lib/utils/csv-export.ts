import { Transaction, ChainId } from '@/types';

export type CSVFormat = 'generic' | 'cointracker' | 'koinly' | 'turbotax';

export interface CSVExportOptions {
    format: CSVFormat;
    startDate?: Date;
    endDate?: Date;
    chains?: ChainId[];
}

// Format transaction data for CSV export
export function formatTransactionsForCSV(
    transactions: Transaction[],
    options: CSVExportOptions = { format: 'generic' }
): string {
    const { format, startDate, endDate, chains } = options;

    // Filter transactions by date and chain
    let filtered = transactions.filter(tx => {
        const txDate = new Date(tx.timestamp);
        const afterStart = !startDate || txDate >= startDate;
        const beforeEnd = !endDate || txDate <= endDate;
        const matchesChain = !chains || chains.includes(tx.chainId);
        return afterStart && beforeEnd && matchesChain;
    });

    // Sort by timestamp descending (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    switch (format) {
        case 'cointracker':
            return formatForCoinTracker(filtered);
        case 'koinly':
            return formatForKoinly(filtered);
        case 'turbotax':
            return formatForTurboTax(filtered);
        default:
            return formatGeneric(filtered);
    }
}

// Generic CSV format
function formatGeneric(transactions: Transaction[]): string {
    const headers = [
        'Date',
        'Time',
        'Type',
        'Chain',
        'Token In',
        'Amount In',
        'Token Out',
        'Amount Out',
        'USD Value',
        'Fee (USD)',
        'Transaction Hash',
        'From',
        'To',
        'Status'
    ];

    const rows = transactions.map(tx => {
        const date = new Date(tx.timestamp);
        const type = determineTransactionType(tx);

        return [
            date.toISOString().split('T')[0], // Date
            date.toISOString().split('T')[1].split('.')[0], // Time
            type,
            tx.chainId.toUpperCase(),
            tx.tokenIn || '-',
            tx.amountIn || '-',
            tx.tokenOut || '-',
            tx.amountOut || '-',
            calculateUSDValue(tx).toFixed(2),
            calculateFeeUSD(tx).toFixed(2),
            tx.hash,
            tx.from,
            tx.to || '-',
            tx.status
        ];
    });

    return convertToCSV([headers, ...rows]);
}

// CoinTracker format
// Reference: https://www.cointracker.io/blog/how-to-import-csv
function formatForCoinTracker(transactions: Transaction[]): string {
    const headers = [
        'Date',
        'Received Quantity',
        'Received Currency',
        'Sent Quantity',
        'Sent Currency',
        'Fee Amount',
        'Fee Currency',
        'Tag',
        'Transaction Hash'
    ];

    const rows = transactions.map(tx => {
        const date = new Date(tx.timestamp).toISOString();
        const type = determineTransactionType(tx);
        const tag = mapTypeToTag(type);

        return [
            date,
            tx.amountOut || '',
            tx.tokenOut || '',
            tx.amountIn || '',
            tx.tokenIn || '',
            calculateFee(tx),
            getNativeCurrency(tx.chainId),
            tag,
            tx.hash
        ];
    });

    return convertToCSV([headers, ...rows]);
}

// Koinly format
// Reference: https://koinly.io/integrations/custom-csv/
function formatForKoinly(transactions: Transaction[]): string {
    const headers = [
        'Date',
        'Sent Amount',
        'Sent Currency',
        'Received Amount',
        'Received Currency',
        'Fee Amount',
        'Fee Currency',
        'Net Worth Amount',
        'Net Worth Currency',
        'Label',
        'Description',
        'TxHash'
    ];

    const rows = transactions.map(tx => {
        const date = new Date(tx.timestamp).toISOString();
        const type = determineTransactionType(tx);

        return [
            date,
            tx.amountIn || '',
            tx.tokenIn || '',
            tx.amountOut || '',
            tx.tokenOut || '',
            calculateFee(tx),
            getNativeCurrency(tx.chainId),
            '', // Net worth amount (optional)
            '', // Net worth currency (optional)
            mapTypeToKoinlyLabel(type),
            `${type} on ${tx.chainId}`,
            tx.hash
        ];
    });

    return convertToCSV([headers, ...rows]);
}

// TurboTax format (basic)
function formatForTurboTax(transactions: Transaction[]): string {
    const headers = [
        'Date Acquired',
        'Date Sold',
        'Description',
        'Proceeds',
        'Cost Basis',
        'Gain/Loss'
    ];

    const rows = transactions.map(tx => {
        const date = new Date(tx.timestamp).toISOString().split('T')[0];
        const type = determineTransactionType(tx);
        const usdValue = calculateUSDValue(tx);

        // TurboTax format is primarily for capital gains, so we'll simplify
        return [
            type === 'buy' ? date : '',
            type === 'sell' ? date : '',
            `${tx.tokenIn || tx.tokenOut} - ${tx.chainId}`,
            type === 'sell' ? usdValue.toFixed(2) : '',
            type === 'buy' ? usdValue.toFixed(2) : '',
            '' // Will be calculated by TurboTax
        ];
    });

    return convertToCSV([headers, ...rows]);
}

// Helper: Determine transaction type
function determineTransactionType(tx: Transaction): string {
    if (tx.type) return tx.type;

    // Heuristics based on transaction data
    if (tx.tokenIn && tx.tokenOut) return 'swap';
    if (tx.tokenOut && !tx.tokenIn) return 'buy';
    if (tx.tokenIn && !tx.tokenOut) return 'sell';
    if (tx.value !== '0') return 'transfer';

    return 'unknown';
}

// Helper: Map type to CoinTracker tag
function mapTypeToTag(type: string): string {
    const tagMap: Record<string, string> = {
        'buy': 'purchase',
        'sell': 'sale',
        'swap': 'trade',
        'transfer': 'transfer',
        'deposit': 'deposit',
        'withdrawal': 'withdrawal'
    };
    return tagMap[type] || 'other';
}

// Helper: Map type to Koinly label
function mapTypeToKoinlyLabel(type: string): string {
    const labelMap: Record<string, string> = {
        'buy': 'buy',
        'sell': 'sell',
        'swap': 'swap',
        'transfer': 'transfer',
        'deposit': 'deposit',
        'withdrawal': 'withdrawal'
    };
    return labelMap[type] || 'other';
}

// Helper: Get native currency symbol for chain
function getNativeCurrency(chainId: ChainId): string {
    const currencyMap: Record<ChainId, string> = {
        'solana': 'SOL',
        'ethereum': 'ETH',
        'base': 'ETH',
        'arbitrum': 'ETH'
    };
    return currencyMap[chainId] || 'ETH';
}

// Helper: Calculate USD value (mock for now - would need price oracle)
function calculateUSDValue(tx: Transaction): number {
    // In production, this would fetch historical prices
    // For now, return 0 if we don't have the data
    return 0;
}

// Helper: Calculate fee in USD
function calculateFeeUSD(tx: Transaction): number {
    if (!tx.gasPrice || !tx.gasUsed) return 0;

    const gasPrice = parseFloat(tx.gasPrice);
    const gasUsed = parseFloat(tx.gasUsed);

    // Convert from wei/lamports to native token
    const fee = (gasPrice * gasUsed) / 1e18;

    // In production, multiply by native token price in USD
    return fee;
}

// Helper: Calculate fee in native currency
function calculateFee(tx: Transaction): string {
    if (!tx.gasPrice || !tx.gasUsed) return '';

    const gasPrice = parseFloat(tx.gasPrice);
    const gasUsed = parseFloat(tx.gasUsed);

    // Convert from wei/lamports to native token
    const fee = (gasPrice * gasUsed) / 1e18;

    return fee.toFixed(6);
}

// Helper: Convert 2D array to CSV string
function convertToCSV(data: string[][]): string {
    return data
        .map(row =>
            row
                .map(cell => {
                    // Escape quotes and wrap in quotes if needed
                    const cellStr = String(cell);
                    if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                        return `"${cellStr.replace(/"/g, '""')}"`;
                    }
                    return cellStr;
                })
                .join(',')
        )
        .join('\n');
}

// Download CSV file
export function downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Generate filename with timestamp
export function generateCSVFilename(format: CSVFormat, taxYear?: number): string {
    const year = taxYear || new Date().getFullYear();
    const timestamp = new Date().toISOString().split('T')[0];
    return `incubator-tax-report-${year}-${format}-${timestamp}.csv`;
}
