export const GRID_SIZE = 10;
export const KERNEL_SIZE = 3;
export const POOL_SIZE = 2;
export const POOL_STRIDE = 2;

export type KernelType = 'sobel_h' | 'sobel_v' | 'sharpen' | 'blur' | 'custom';
export type PresetName = 'vertical' | 'horizontal' | 'diagonal' | 'plus' | 'box' | 'clear';
export type Speed = 'slow' | 'normal' | 'fast';

export const FEATURE_MAP_SIZE = GRID_SIZE - KERNEL_SIZE + 1;
export const POOLED_MAP_SIZE = Math.floor(FEATURE_MAP_SIZE / POOL_STRIDE);

export const SPEED_MS: Record<Speed, number> = {
    slow: 800,
    normal: 400,
    fast: 150,
};

export const KERNELS: Record<Exclude<KernelType, 'custom'>, number[][]> = {
    sobel_h: [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1],
    ],
    sobel_v: [
        [-1, -2, -1],
        [0, 0, 0],
        [1, 2, 1],
    ],
    sharpen: [
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0],
    ],
    blur: [
        [1 / 16, 2 / 16, 1 / 16],
        [2 / 16, 4 / 16, 2 / 16],
        [1 / 16, 2 / 16, 1 / 16],
    ],
};

export const KERNEL_LABELS: Record<KernelType, string> = {
    sobel_h: 'Sobel X (Yatay Kenar)',
    sobel_v: 'Sobel Y (Dikey Kenar)',
    sharpen: 'Sharpen (Keskinleştirme)',
    blur: 'Gaussian Blur',
    custom: 'Custom Kernel',
};

export const PRESET_LABELS: Record<PresetName, string> = {
    vertical: 'Dikey Çizgi',
    horizontal: 'Yatay Çizgi',
    diagonal: 'Çapraz Çizgi',
    plus: 'Artı İşareti',
    box: 'Kutu',
    clear: 'Temizle',
};

export const DEFAULT_CUSTOM_KERNEL: number[][] = [
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
];

export function createEmptyGrid(size: number = GRID_SIZE): number[][] {
    return Array.from({ length: size }, () => new Array(size).fill(0));
}

export function createNullGrid(size: number): (number | null)[][] {
    return Array.from({ length: size }, () => new Array(size).fill(null));
}

export function getKernel(
    type: KernelType,
    customKernel: number[][]
): number[][] {
    if (type === 'custom') return customKernel;
    return KERNELS[type];
}

export function extractPatch(
    input: number[][],
    row: number,
    col: number
): number[][] {
    const patch: number[][] = [];
    for (let kr = 0; kr < KERNEL_SIZE; kr++) {
        patch[kr] = [];
        for (let kc = 0; kc < KERNEL_SIZE; kc++) {
            patch[kr][kc] = input[row + kr][col + kc];
        }
    }
    return patch;
}

export function convolveAt(
    input: number[][],
    kernel: number[][],
    row: number,
    col: number,
    applyReLU: boolean
): number {
    let sum = 0;
    for (let kr = 0; kr < KERNEL_SIZE; kr++) {
        for (let kc = 0; kc < KERNEL_SIZE; kc++) {
            sum += input[row + kr][col + kc] * kernel[kr][kc];
        }
    }
    return applyReLU ? Math.max(0, sum) : sum;
}

export function computeConvolutionFull(
    input: number[][],
    kernel: number[][],
    applyReLU: boolean
): number[][] {
    const size = FEATURE_MAP_SIZE;
    const result: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            result[i][j] = convolveAt(input, kernel, i, j, applyReLU);
        }
    }
    return result;
}

export function maxPoolAt(
    featureMap: number[][],
    row: number,
    col: number
): number {
    let max = -Infinity;
    for (let pr = 0; pr < POOL_SIZE; pr++) {
        for (let pc = 0; pc < POOL_SIZE; pc++) {
            const val = featureMap[row * POOL_STRIDE + pr][col * POOL_STRIDE + pc];
            max = Math.max(max, val);
        }
    }
    return max;
}

export function computeMaxPoolFull(featureMap: number[][]): number[][] {
    const size = POOLED_MAP_SIZE;
    const result: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            result[i][j] = maxPoolAt(featureMap, i, j);
        }
    }
    return result;
}

export function convStepToPosition(stepIndex: number): { row: number; col: number } {
    const size = FEATURE_MAP_SIZE;
    return {
        row: Math.floor(stepIndex / size),
        col: stepIndex % size,
    };
}

export function poolStepToPosition(stepIndex: number): { row: number; col: number } {
    const size = POOLED_MAP_SIZE;
    return {
        row: Math.floor(stepIndex / size),
        col: stepIndex % size,
    };
}

export const TOTAL_CONV_STEPS = FEATURE_MAP_SIZE * FEATURE_MAP_SIZE;
export const TOTAL_POOL_STEPS = POOLED_MAP_SIZE * POOLED_MAP_SIZE;
export const TOTAL_STEPS = TOTAL_CONV_STEPS + TOTAL_POOL_STEPS;

export function generatePreset(name: PresetName): number[][] {
    const grid = createEmptyGrid();
    const mid = Math.floor(GRID_SIZE / 2);

    switch (name) {
        case 'vertical':
            for (let r = 0; r < GRID_SIZE; r++) {
                grid[r][mid] = 255;
                grid[r][mid - 1] = 255;
            }
            break;
        case 'horizontal':
            for (let c = 0; c < GRID_SIZE; c++) {
                grid[mid][c] = 255;
                grid[mid - 1][c] = 255;
            }
            break;
        case 'diagonal':
            for (let i = 0; i < GRID_SIZE; i++) {
                grid[i][i] = 255;
                if (i + 1 < GRID_SIZE) grid[i][i + 1] = 255;
            }
            break;
        case 'plus':
            for (let i = 0; i < GRID_SIZE; i++) {
                grid[mid][i] = 255;
                grid[i][mid] = 255;
            }
            break;
        case 'box':
            for (let i = 2; i < GRID_SIZE - 2; i++) {
                grid[2][i] = 255;
                grid[GRID_SIZE - 3][i] = 255;
                grid[i][2] = 255;
                grid[i][GRID_SIZE - 3] = 255;
            }
            break;
        case 'clear':
            break;
    }

    return grid;
}

export function formatConvolutionFormula(
    patch: number[][],
    kernel: number[][]
): { terms: string[]; rawSum: number } {
    const terms: string[] = [];
    let sum = 0;

    for (let kr = 0; kr < KERNEL_SIZE; kr++) {
        for (let kc = 0; kc < KERNEL_SIZE; kc++) {
            const p = patch[kr][kc];
            const k = kernel[kr][kc];
            const product = p * k;
            sum += product;
            terms.push(`(${p}×${k.toFixed(1)})`);
        }
    }

    return { terms, rawSum: sum };
}

export function pixelToColor(value: number | null, maxVal = 255): string {
    if (value === null) return '#1e293b';
    const t = Math.max(0, Math.min(1, value / maxVal));
    const g = Math.round(30 + t * 200);
    return `rgb(${g}, ${g}, ${g})`;
}

export function featureToColor(value: number | null, maxVal = 1020): string {
    if (value === null) return '#0f172a';
    const t = Math.max(0, Math.min(1, value / maxVal));
    const r = Math.round(30 + t * 60);
    const g = Math.round(60 + t * 180);
    const b = Math.round(120 + t * 80);
    return `rgb(${r}, ${g}, ${b})`;
}

export function getEducationalNote(kernel: KernelType): string {
    const notes: Record<KernelType, string> = {
        sobel_h:
            'Sobel X (yatay kenar filtresi) dikey yöndeki parlaklık değişimlerini tespit eder. Yatay çizgiler ve satır sınırları yüksek yanıt verir.',
        sobel_v:
            'Sobel Y (dikey kenar filtresi) yatay yöndeki parlaklık değişimlerini tespit eder. Dikey çizgiler ve sütun sınırları öne çıkar.',
        sharpen:
            'Sharpen filtresi merkez pikseli güçlendirerek kenarları keskinleştirir. Görüntü detaylarını artırır, blur\'un tersidir.',
        blur:
            'Gaussian blur filtresi komşu piksellerin ağırlıklı ortalamasını alarak görüntüyü yumuşatır. Gürültü azaltma ve ön işlemede kullanılır.',
        custom:
            'Özel çekirdek ile kendi filtrenizi tasarlayabilirsiniz. Pozitif değerler vurgular, negatif değerler bastırır.',
    };
    return notes[kernel];
}

export function getReLUNote(applyReLU: boolean): string {
    return applyReLU
        ? 'ReLU aktif: Negatif aktivasyonlar sıfırlanır — CNN\'lerde doğrusal olmayanlık ve seyreklik sağlar.'
        : 'ReLU kapalı: Ham konvolüsyon çıktısı gösterilir (negatif değerler dahil).';
}
