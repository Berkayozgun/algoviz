import { create } from 'zustand';

export type BarState = 'default' | 'comparing' | 'swapping' | 'sorted';

export interface Bar {
    id: number;
    value: number;
    state: BarState;
}

interface SortingState {
    bars: Bar[];
    barCount: number;
    speed: 'fast' | 'medium' | 'slow';
    selectedAlgorithm: 'bubble' | 'quick' | 'merge';
    isRunning: boolean;
    isSorted: boolean;
    setBars: (bars: Bar[]) => void;
    setBarCount: (count: number) => void;
    setSpeed: (speed: 'fast' | 'medium' | 'slow') => void;
    setAlgorithm: (algorithm: 'bubble' | 'quick' | 'merge') => void;
    setIsRunning: (isRunning: boolean) => void;
    setIsSorted: (isSorted: boolean) => void;
    updateBar: (index: number, updates: Partial<Bar>) => void;
    swapBars: (i: number, j: number) => void;
    generateRandomBars: () => void;
    resetBarStates: () => void;
}

const generateBars = (count: number): Bar[] => {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        value: Math.floor(Math.random() * 400) + 20,
        state: 'default' as BarState,
    }));
};

export const useSortingStore = create<SortingState>((set, get) => ({
    bars: generateBars(50),
    barCount: 50,
    speed: 'medium',
    selectedAlgorithm: 'bubble',
    isRunning: false,
    isSorted: false,

    setBars: (bars) => set({ bars }),
    setBarCount: (barCount) => set({ barCount }),
    setSpeed: (speed) => set({ speed }),
    setAlgorithm: (selectedAlgorithm) => set({ selectedAlgorithm }),
    setIsRunning: (isRunning) => set({ isRunning }),
    setIsSorted: (isSorted) => set({ isSorted }),

    updateBar: (index, updates) =>
        set((state) => {
            const newBars = [...state.bars];
            newBars[index] = { ...newBars[index], ...updates };
            return { bars: newBars };
        }),

    swapBars: (i, j) =>
        set((state) => {
            const newBars = [...state.bars];
            [newBars[i], newBars[j]] = [newBars[j], newBars[i]];
            return { bars: newBars };
        }),

    generateRandomBars: () => {
        const count = get().barCount;
        set({ bars: generateBars(count), isSorted: false });
    },

    resetBarStates: () =>
        set((state) => ({
            bars: state.bars.map((bar) => ({ ...bar, state: 'default' as BarState })),
        })),
}));
