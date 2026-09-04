import { create } from 'zustand';
import {
    type KernelType,
    type PresetName,
    type Speed,
    GRID_SIZE,
    FEATURE_MAP_SIZE,
    POOLED_MAP_SIZE,
    DEFAULT_CUSTOM_KERNEL,
    createEmptyGrid,
    createNullGrid,
    getKernel,
    convolveAt,
    maxPoolAt,
    generatePreset,
    TOTAL_CONV_STEPS,
    TOTAL_POOL_STEPS,
    TOTAL_STEPS,
    convStepToPosition,
    poolStepToPosition,
} from '@/lib/convolution';

export type Phase = 'idle' | 'conv' | 'pool' | 'done';

interface ConvolutionState {
    inputGrid: number[][];
    selectedKernel: KernelType;
    customKernelMatrix: number[][];
    applyReLU: boolean;
    activeKernelPos: { row: number; col: number } | null;
    activePoolPos: { row: number; col: number } | null;
    featureMap: (number | null)[][];
    pooledMap: (number | null)[][];
    isPlaying: boolean;
    speed: Speed;
    phase: Phase;
    stepIndex: number;
    lastRawSum: number | null;
    isDrawing: boolean;

    setPixel: (row: number, col: number, value: number) => void;
    clearGrid: () => void;
    loadPreset: (presetName: PresetName) => void;
    setKernel: (type: KernelType) => void;
    setCustomKernelValue: (r: number, c: number, val: number) => void;
    setApplyReLU: (apply: boolean) => void;
    setSpeed: (speed: Speed) => void;
    setIsDrawing: (drawing: boolean) => void;
    step: () => void;
    play: () => void;
    pause: () => void;
    reset: () => void;
}

function freshComputationState() {
    return {
        activeKernelPos: null as { row: number; col: number } | null,
        activePoolPos: null as { row: number; col: number } | null,
        featureMap: createNullGrid(FEATURE_MAP_SIZE),
        pooledMap: createNullGrid(POOLED_MAP_SIZE),
        phase: 'idle' as Phase,
        stepIndex: 0,
        lastRawSum: null as number | null,
        isPlaying: false,
    };
}

export const useConvolutionStore = create<ConvolutionState>((set, get) => ({
    inputGrid: generatePreset('vertical'),
    selectedKernel: 'sobel_h',
    customKernelMatrix: DEFAULT_CUSTOM_KERNEL.map((row) => [...row]),
    applyReLU: true,
    ...freshComputationState(),
    isDrawing: false,
    speed: 'normal',

    setPixel: (row, col, value) => {
        const { inputGrid, isPlaying } = get();
        if (isPlaying) return;
        const newGrid = inputGrid.map((r) => [...r]);
        newGrid[row][col] = value;
        set({ inputGrid: newGrid, ...freshComputationState() });
    },

    clearGrid: () => {
        set({
            inputGrid: createEmptyGrid(),
            ...freshComputationState(),
        });
    },

    loadPreset: (presetName) => {
        if (presetName === 'clear') {
            get().clearGrid();
            return;
        }
        set({
            inputGrid: generatePreset(presetName),
            ...freshComputationState(),
        });
    },

    setKernel: (type) => {
        set({ selectedKernel: type, ...freshComputationState() });
    },

    setCustomKernelValue: (r, c, val) => {
        const { customKernelMatrix } = get();
        const newMatrix = customKernelMatrix.map((row) => [...row]);
        newMatrix[r][c] = val;
        set({ customKernelMatrix: newMatrix, ...freshComputationState() });
    },

    setApplyReLU: (apply) => {
        set({ applyReLU: apply, ...freshComputationState() });
    },

    setSpeed: (speed) => set({ speed }),

    setIsDrawing: (drawing) => set({ isDrawing: drawing }),

    step: () => {
        const state = get();
        if (state.phase === 'done') return;

        const kernel = getKernel(state.selectedKernel, state.customKernelMatrix);

        if (state.stepIndex >= TOTAL_STEPS) {
            set({ phase: 'done', isPlaying: false, activeKernelPos: null, activePoolPos: null });
            return;
        }

        if (state.stepIndex < TOTAL_CONV_STEPS) {
            const pos = convStepToPosition(state.stepIndex);
            const raw = convolveAt(
                state.inputGrid,
                kernel,
                pos.row,
                pos.col,
                false
            );
            const value = state.applyReLU ? Math.max(0, raw) : raw;

            const newFeatureMap = state.featureMap.map((row) => [...row]);
            newFeatureMap[pos.row][pos.col] = value;

            set({
                phase: 'conv',
                activeKernelPos: pos,
                activePoolPos: null,
                featureMap: newFeatureMap,
                lastRawSum: raw,
                stepIndex: state.stepIndex + 1,
            });
        } else {
            const poolIdx = state.stepIndex - TOTAL_CONV_STEPS;
            const pos = poolStepToPosition(poolIdx);

            const filledFeature = state.featureMap.map((row) =>
                row.map((v) => v ?? 0)
            );
            const value = maxPoolAt(filledFeature, pos.row, pos.col);

            const newPooledMap = state.pooledMap.map((row) => [...row]);
            newPooledMap[pos.row][pos.col] = value;

            const nextIndex = state.stepIndex + 1;
            set({
                phase: nextIndex >= TOTAL_STEPS ? 'done' : 'pool',
                activeKernelPos: null,
                activePoolPos: pos,
                pooledMap: newPooledMap,
                lastRawSum: value,
                stepIndex: nextIndex,
                isPlaying: nextIndex >= TOTAL_STEPS ? false : state.isPlaying,
            });
        }
    },

    play: () => {
        const { phase } = get();
        if (phase === 'done') {
            get().reset();
        }
        set({ isPlaying: true });
    },

    pause: () => set({ isPlaying: false }),

    reset: () => {
        set(freshComputationState());
    },
}));
