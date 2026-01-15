/**
 * Drawing Tools for Lightweight Charts v4
 * Implements custom primitives for horizontal lines
 * 
 * Note: Simplified implementation that uses priceLine API for horizontal lines
 * This avoids complex primitive API compatibility issues
 */

export interface HorizontalLineOptions {
    price: number;
    color: string;
    lineWidth: number;
    lineStyle: 0 | 1 | 2; // 0 = solid, 1 = dashed, 2 = dotted
    title?: string;
    axisLabelVisible?: boolean;
}

// Type for the price line object returned by addPriceLine
export type HorizontalLineHandle = ReturnType<any> & { __price: number };

/**
 * Add a horizontal line to a series using the built-in priceLine API
 * This is the recommended approach for lightweight-charts v4
 */
export function addHorizontalLine(
    series: any,
    options: Partial<HorizontalLineOptions> & { price: number }
): HorizontalLineHandle {
    const lineOptions = {
        price: options.price,
        color: options.color || '#b8e600',
        lineWidth: options.lineWidth || 1,
        lineStyle: options.lineStyle || 0,
        title: options.title || '',
        axisLabelVisible: options.axisLabelVisible ?? true,
    };

    const priceLine = series.createPriceLine(lineOptions);
    // Store original price for reference
    (priceLine as any).__price = options.price;

    return priceLine as HorizontalLineHandle;
}

/**
 * Remove a horizontal line from a series
 */
export function removeHorizontalLine(series: any, priceLine: HorizontalLineHandle): void {
    series.removePriceLine(priceLine);
}

/**
 * Update horizontal line price
 */
export function updateHorizontalLinePrice(
    series: any,
    priceLine: HorizontalLineHandle,
    newPrice: number
): HorizontalLineHandle {
    series.removePriceLine(priceLine);
    return addHorizontalLine(series, { price: newPrice, color: '#b8e600' });
}

// Simple state manager for horizontal lines
export class HorizontalLineManager {
    private _series: any = null;
    private _lines: Map<string, HorizontalLineHandle> = new Map();
    private _idCounter = 0;

    attach(series: any) {
        this._series = series;
    }

    detach() {
        this.clearAll();
        this._series = null;
    }

    addLine(price: number, options?: Partial<Omit<HorizontalLineOptions, 'price'>>): string {
        if (!this._series) return '';

        const id = `hline_${++this._idCounter}`;
        const priceLine = addHorizontalLine(this._series, { price, ...options });
        this._lines.set(id, priceLine);
        return id;
    }

    removeLine(id: string): void {
        if (!this._series) return;

        const priceLine = this._lines.get(id);
        if (priceLine) {
            removeHorizontalLine(this._series, priceLine);
            this._lines.delete(id);
        }
    }

    clearAll(): void {
        if (!this._series) return;

        this._lines.forEach(priceLine => {
            removeHorizontalLine(this._series, priceLine);
        });
        this._lines.clear();
    }

    getLineCount(): number {
        return this._lines.size;
    }

    getAllLines(): { id: string; price: number }[] {
        return Array.from(this._lines.entries()).map(([id, line]) => ({
            id,
            price: (line as any).__price || 0,
        }));
    }
}

// Export a singleton for use in the trade page
export const horizontalLineManager = new HorizontalLineManager();
