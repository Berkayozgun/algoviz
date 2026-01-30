import { Bar, BarState } from '@/store/useSortingStore';

export interface SortingStep {
    type: 'compare' | 'swap' | 'sorted' | 'reset';
    indices: number[];
}

// Helper to create delay
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Bubble Sort
export async function* bubbleSort(
    bars: Bar[],
    updateBar: (index: number, updates: Partial<Bar>) => void,
    swapBars: (i: number, j: number) => void,
    delayMs: number
): AsyncGenerator<void> {
    const arr = [...bars];
    const n = arr.length;

    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            // Compare
            updateBar(j, { state: 'comparing' });
            updateBar(j + 1, { state: 'comparing' });
            await delay(delayMs);
            yield;

            if (arr[j].value > arr[j + 1].value) {
                // Swap
                updateBar(j, { state: 'swapping' });
                updateBar(j + 1, { state: 'swapping' });
                await delay(delayMs);

                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                swapBars(j, j + 1);
                await delay(delayMs);
                yield;
            }

            // Reset to default
            updateBar(j, { state: 'default' });
            updateBar(j + 1, { state: 'default' });
        }
        // Mark as sorted
        updateBar(n - i - 1, { state: 'sorted' });
    }
    updateBar(0, { state: 'sorted' });
}

// Quick Sort
export async function* quickSort(
    bars: Bar[],
    updateBar: (index: number, updates: Partial<Bar>) => void,
    swapBars: (i: number, j: number) => void,
    delayMs: number,
    low: number = 0,
    high: number = bars.length - 1
): AsyncGenerator<void> {
    if (low < high) {
        const pivotIndex = await partition(bars, updateBar, swapBars, delayMs, low, high);
        yield* quickSort(bars, updateBar, swapBars, delayMs, low, pivotIndex - 1);
        yield* quickSort(bars, updateBar, swapBars, delayMs, pivotIndex + 1, high);
    } else if (low >= 0 && low < bars.length) {
        updateBar(low, { state: 'sorted' });
    }
}

async function partition(
    bars: Bar[],
    updateBar: (index: number, updates: Partial<Bar>) => void,
    swapBars: (i: number, j: number) => void,
    delayMs: number,
    low: number,
    high: number
): Promise<number> {
    const pivot = bars[high].value;
    let i = low - 1;

    for (let j = low; j < high; j++) {
        updateBar(j, { state: 'comparing' });
        updateBar(high, { state: 'comparing' });
        await delay(delayMs);

        if (bars[j].value < pivot) {
            i++;
            if (i !== j) {
                updateBar(i, { state: 'swapping' });
                updateBar(j, { state: 'swapping' });
                await delay(delayMs);

                [bars[i], bars[j]] = [bars[j], bars[i]];
                swapBars(i, j);
                await delay(delayMs);
            }
        }

        updateBar(j, { state: 'default' });
        if (i >= low) updateBar(i, { state: 'default' });
    }
    updateBar(high, { state: 'default' });

    if (i + 1 !== high) {
        updateBar(i + 1, { state: 'swapping' });
        updateBar(high, { state: 'swapping' });
        await delay(delayMs);

        [bars[i + 1], bars[high]] = [bars[high], bars[i + 1]];
        swapBars(i + 1, high);
        await delay(delayMs);
    }

    updateBar(i + 1, { state: 'sorted' });
    return i + 1;
}

// Merge Sort
export async function* mergeSort(
    bars: Bar[],
    updateBar: (index: number, updates: Partial<Bar>) => void,
    setBars: (bars: Bar[]) => void,
    delayMs: number,
    left: number = 0,
    right: number = bars.length - 1
): AsyncGenerator<void> {
    if (left < right) {
        const mid = Math.floor((left + right) / 2);
        yield* mergeSort(bars, updateBar, setBars, delayMs, left, mid);
        yield* mergeSort(bars, updateBar, setBars, delayMs, mid + 1, right);
        yield* merge(bars, updateBar, setBars, delayMs, left, mid, right);
    } else if (left === right) {
        updateBar(left, { state: 'sorted' });
    }
}

async function* merge(
    bars: Bar[],
    updateBar: (index: number, updates: Partial<Bar>) => void,
    setBars: (bars: Bar[]) => void,
    delayMs: number,
    left: number,
    mid: number,
    right: number
): AsyncGenerator<void> {
    const leftArr = bars.slice(left, mid + 1);
    const rightArr = bars.slice(mid + 1, right + 1);

    let i = 0, j = 0, k = left;

    while (i < leftArr.length && j < rightArr.length) {
        updateBar(left + i, { state: 'comparing' });
        updateBar(mid + 1 + j, { state: 'comparing' });
        await delay(delayMs);
        yield;

        if (leftArr[i].value <= rightArr[j].value) {
            bars[k] = { ...leftArr[i], state: 'swapping' };
            updateBar(k, { state: 'swapping', value: leftArr[i].value });
            i++;
        } else {
            bars[k] = { ...rightArr[j], state: 'swapping' };
            updateBar(k, { state: 'swapping', value: rightArr[j].value });
            j++;
        }
        await delay(delayMs);
        updateBar(k, { state: 'sorted' });
        k++;
        yield;
    }

    while (i < leftArr.length) {
        bars[k] = { ...leftArr[i], state: 'sorted' };
        updateBar(k, { state: 'sorted', value: leftArr[i].value });
        await delay(delayMs);
        i++;
        k++;
        yield;
    }

    while (j < rightArr.length) {
        bars[k] = { ...rightArr[j], state: 'sorted' };
        updateBar(k, { state: 'sorted', value: rightArr[j].value });
        await delay(delayMs);
        j++;
        k++;
        yield;
    }
}
