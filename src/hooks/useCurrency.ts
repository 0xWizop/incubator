import { usePreferences } from './usePreferences';

const EXCHANGE_RATES = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    BTC: 0.000015, // Approximate, would ideally be fetched
};

const CURRENCY_SYMBOLS = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    BTC: '₿',
};

export function useCurrency() {
    const { currencyDisplay } = usePreferences();

    const formatCurrency = (amountInUsd: number) => {
        const rate = EXCHANGE_RATES[currencyDisplay] || 1;
        const convertedAmount = amountInUsd * rate;
        const symbol = CURRENCY_SYMBOLS[currencyDisplay] || '$';

        return {
            amount: convertedAmount,
            symbol,
            formatted: `${symbol}${convertedAmount.toLocaleString('en-US', {
                minimumFractionDigits: currencyDisplay === 'BTC' ? 6 : 2,
                maximumFractionDigits: currencyDisplay === 'BTC' ? 8 : 2,
            })}`,
        };
    };

    return {
        currency: currencyDisplay,
        formatCurrency,
    };
}
