export type SearchAlgorithm = 'linear' | 'binary' | 'interpolation';

export interface SearchStep {
    activeIndices: number[];
    eliminatedIndices: number[];
    targetIndex: number | null;
    low?: number;
    mid?: number;
    high?: number;
    comparisons: number;
    description: string;
    found?: boolean;
}

export type SearchSpeed = 'slow' | 'normal' | 'fast';

const ARRAY_MIN = 15;
const ARRAY_MAX = 25;

export function generateArray(sorted: boolean): number[] {
    const length = ARRAY_MIN + Math.floor(Math.random() * (ARRAY_MAX - ARRAY_MIN + 1));
    const arr: number[] = [];

    if (sorted) {
        let current = 10 + Math.floor(Math.random() * 20);
        for (let i = 0; i < length; i++) {
            current += 3 + Math.floor(Math.random() * 12);
            arr.push(current);
        }
    } else {
        const used = new Set<number>();
        while (arr.length < length) {
            const val = 10 + Math.floor(Math.random() * 180);
            if (!used.has(val)) {
                used.add(val);
                arr.push(val);
            }
        }
    }

    return arr;
}

export function generateUniformArray(): number[] {
    const length = 20;
    const start = 10;
    const step = 8;
    return Array.from({ length }, (_, i) => start + i * step);
}

function makeStep(
    partial: Omit<SearchStep, 'activeIndices' | 'eliminatedIndices'> & {
        activeIndices?: number[];
        eliminatedIndices?: number[];
    }
): SearchStep {
    return {
        activeIndices: partial.activeIndices ?? [],
        eliminatedIndices: partial.eliminatedIndices ?? [],
        ...partial,
    };
}

export function runLinearSearch(array: number[], target: number): SearchStep[] {
    const steps: SearchStep[] = [];
    const eliminated: number[] = [];
    let comparisons = 0;

    steps.push(
        makeStep({
            comparisons: 0,
            targetIndex: null,
            description: `Linear Search başladı: Dizi baştan sona tek tek taranacak. Hedef: ${target}.`,
        })
    );

    for (let i = 0; i < array.length; i++) {
        comparisons += 1;
        const found = array[i] === target;

        steps.push(
            makeStep({
                activeIndices: [i],
                eliminatedIndices: [...eliminated],
                comparisons,
                targetIndex: found ? i : null,
                description: found
                    ? `İndeks ${i}: arr[${i}]=${array[i]} == ${target}. Hedef bulundu! Toplam ${comparisons} karşılaştırma.`
                    : `İndeks ${i}: arr[${i}]=${array[i]} ≠ ${target}. Sonraki elemana geçiliyor.`,
                found,
            })
        );

        if (found) return steps;
        eliminated.push(i);
    }

    steps.push(
        makeStep({
            eliminatedIndices: array.map((_, i) => i),
            comparisons,
            targetIndex: null,
            description: `Hedef ${target} bulunamadı. Tüm dizi tarandı (${comparisons} karşılaştırma).`,
            found: false,
        })
    );

    return steps;
}

export function runBinarySearch(array: number[], target: number): SearchStep[] {
    const steps: SearchStep[] = [];
    let low = 0;
    let high = array.length - 1;
    let comparisons = 0;

    steps.push(
        makeStep({
            low,
            mid: undefined,
            high,
            comparisons: 0,
            targetIndex: null,
            description: `Binary Search başladı: Sıralı dizide low=0, high=${high}. Her adımda arama uzayı yarıya bölünür.`,
        })
    );

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        comparisons += 1;

        const eliminated = [
            ...Array.from({ length: low }, (_, i) => i),
            ...Array.from({ length: array.length - high - 1 }, (_, i) => high + 1 + i),
        ];

        const found = array[mid] === target;

        steps.push(
            makeStep({
                activeIndices: [mid],
                eliminatedIndices: eliminated,
                low,
                mid,
                high,
                comparisons,
                targetIndex: found ? mid : null,
                description: found
                    ? `mid=${mid}: arr[${mid}]=${array[mid]} == ${target}. Bulundu! ${comparisons} karşılaştırma.`
                    : array[mid] < target
                        ? `mid=${mid}: arr[${mid}]=${array[mid]} < ${target}. Sol yarı elendi → low=${mid + 1}.`
                        : `mid=${mid}: arr[${mid}]=${array[mid]} > ${target}. Sağ yarı elendi → high=${mid - 1}.`,
                found,
            })
        );

        if (found) return steps;

        if (array[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    steps.push(
        makeStep({
            eliminatedIndices: array.map((_, i) => i),
            comparisons,
            targetIndex: null,
            description: `Hedef ${target} bulunamadı. Arama uzayı tükendi (${comparisons} karşılaştırma).`,
            found: false,
        })
    );

    return steps;
}

export function runInterpolationSearch(array: number[], target: number): SearchStep[] {
    const steps: SearchStep[] = [];
    let low = 0;
    let high = array.length - 1;
    let comparisons = 0;

    if (array[low] === array[high] && array[low] !== target) {
        return [
            makeStep({
                comparisons: 0,
                targetIndex: null,
                description: 'Dizi düzgün dağılmamış veya tüm elemanlar eşit — Interpolation Search uygun değil.',
                found: false,
            }),
        ];
    }

    steps.push(
        makeStep({
            low,
            high,
            comparisons: 0,
            targetIndex: null,
            description: `Interpolation Search başladı: Uniform dağılımda formülle tahmini konuma zıplanır.`,
        })
    );

    while (low <= high && target >= array[low] && target <= array[high]) {
        const range = array[high] - array[low];
        const pos =
            range === 0
                ? low
                : low + Math.floor(((target - array[low]) / range) * (high - low));

        const mid = Math.min(Math.max(pos, low), high);
        comparisons += 1;

        const eliminated = [
            ...Array.from({ length: low }, (_, i) => i),
            ...Array.from({ length: array.length - high - 1 }, (_, i) => high + 1 + i),
        ];

        const found = array[mid] === target;

        steps.push(
            makeStep({
                activeIndices: [mid],
                eliminatedIndices: eliminated,
                low,
                mid,
                high,
                comparisons,
                targetIndex: found ? mid : null,
                description: found
                    ? `pos=${mid}: arr[${mid}]=${array[mid]} == ${target}. Formül isabet etti! ${comparisons} karşılaştırma.`
                    : array[mid] < target
                        ? `pos=${mid}: arr[${mid}]=${array[mid]} < ${target}. low=${mid + 1} olarak güncellendi.`
                        : `pos=${mid}: arr[${mid}]=${array[mid]} > ${target}. high=${mid - 1} olarak güncellendi.`,
                found,
            })
        );

        if (found) return steps;

        if (array[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    steps.push(
        makeStep({
            eliminatedIndices: array.map((_, i) => i),
            comparisons,
            targetIndex: null,
            description: `Hedef ${target} bulunamadı veya aralık dışında (${comparisons} karşılaştırma).`,
            found: false,
        })
    );

    return steps;
}

export function runSearch(
    algorithm: SearchAlgorithm,
    array: number[],
    target: number
): SearchStep[] {
    switch (algorithm) {
        case 'linear':
            return runLinearSearch(array, target);
        case 'binary':
            return runBinarySearch(array, target);
        case 'interpolation':
            return runInterpolationSearch(array, target);
    }
}

export function getAlgorithmInfo(algorithm: SearchAlgorithm): {
    title: string;
    complexity: string;
    requirement: string;
    summary: string;
} {
    switch (algorithm) {
        case 'linear':
            return {
                title: 'Linear Search',
                complexity: 'O(N)',
                requirement: 'Sıralı olması gerekmez',
                summary: 'Diziyi baştan sona tek tek tarar. Basit ama büyük dizilerde yavaştır.',
            };
        case 'binary':
            return {
                title: 'Binary Search',
                complexity: 'O(log N)',
                requirement: 'Sıralı dizi gerekli',
                summary: 'Her adımda arama uzayını yarıya böler. low, mid, high pointer\'ları kullanır.',
            };
        case 'interpolation':
            return {
                title: 'Interpolation Search',
                complexity: 'O(log log N) ortalama',
                requirement: 'Uniform dağılımlı sıralı dizi',
                summary: 'Hedef değere göre tahmini konuma formülle zıplar. Phone book araması gibi.',
            };
    }
}

export function getSpeedMs(speed: SearchSpeed): number {
    switch (speed) {
        case 'slow':
            return 900;
        case 'fast':
            return 250;
        default:
            return 550;
    }
}

export function pickTargetFromArray(array: number[]): number {
    if (array.length === 0) return 0;
    const idx = Math.floor(Math.random() * array.length);
    return array[idx];
}

export function pickMissingTarget(array: number[]): number {
    const max = Math.max(...array);
    return max + 7;
}
