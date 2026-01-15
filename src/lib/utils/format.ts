/**
 * Shared formatting utilities
 */

/**
 * Format a large number with K/M/B suffixes
 */
export function formatNumber(num: number): string {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
}

/**
 * Format a price with appropriate decimal places
 */
const SUBSCRIPT_DIGITS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

function toSubscript(num: number): string {
    return num.toString().split('').map(d => SUBSCRIPT_DIGITS[parseInt(d)]).join('');
}

export function formatPrice(num: number): string {
    if (!num) return '0';
    if (num < 0.0001) {
        const str = num.toFixed(20);
        // Find leading zeros after decimal: 0.0000123 -> matching "0000" and "123"
        const match = str.match(/^0\.(0+)(\d+)/);
        if (match) {
            const zeros = match[1].length;
            const significant = match[2].slice(0, 4); // 4 significant digits
            return `0.0${toSubscript(zeros)}${significant}`;
        }
        return num.toExponential(4);
    }
    if (num < 0.01) return num.toFixed(6);
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * Format a wallet address with truncation
 */
export function formatAddress(address: string, startChars = 6, endChars = 4): string {
    if (!address) return '';
    if (address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
    if (value === 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}
