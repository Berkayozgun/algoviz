import { create } from 'zustand';
import {
    computePCA,
    generatePreset,
    generateRandomPoints,
    type PCAResult,
    type Point2D,
    type PresetName,
} from '@/lib/pca';

interface PCAState {
    points: Point2D[];
    pcaResult: PCAResult | null;
    projectionProgress: number;
    showEigenvectors: boolean;
    showProjectionLines: boolean;

    addPoint: (x: number, y: number) => void;
    clearPoints: () => void;
    loadPreset: (presetName: PresetName) => void;
    setProjectionProgress: (val: number) => void;
    toggleEigenvectors: () => void;
    toggleProjectionLines: () => void;
    generateRandom: (count: number) => void;
    computePCA: () => void;
}

export const usePCAStore = create<PCAState>((set, get) => ({
    points: [],
    pcaResult: null,
    projectionProgress: 0,
    showEigenvectors: true,
    showProjectionLines: true,

    addPoint: (x, y) => {
        set((state) => ({
            points: [...state.points, { x, y }],
        }));
        get().computePCA();
    },

    clearPoints: () => {
        set({
            points: [],
            pcaResult: null,
            projectionProgress: 0,
        });
    },

    loadPreset: (presetName) => {
        const points = generatePreset(presetName);
        set({ points, projectionProgress: 0 });
        get().computePCA();
    },

    setProjectionProgress: (val) => set({ projectionProgress: val }),

    toggleEigenvectors: () =>
        set((state) => ({ showEigenvectors: !state.showEigenvectors })),

    toggleProjectionLines: () =>
        set((state) => ({ showProjectionLines: !state.showProjectionLines })),

    generateRandom: (count) => {
        const points = generateRandomPoints(count);
        set({ points, projectionProgress: 0 });
        get().computePCA();
    },

    computePCA: () => {
        const { points } = get();
        if (points.length < 2) {
            set({ pcaResult: null });
            return;
        }
        set({ pcaResult: computePCA(points) });
    },
}));
