import { create } from 'zustand';
import {
    generateArray,
    generateUniformArray,
    pickMissingTarget,
    pickTargetFromArray,
    runSearch,
    type SearchAlgorithm,
    type SearchSpeed,
    type SearchStep,
} from '@/lib/searching';

interface SearchingStoreState {
    array: number[];
    target: number;
    algorithm: SearchAlgorithm;
    steps: SearchStep[];
    currentStepIndex: number;
    isPlaying: boolean;
    isFound: boolean | null;
    speed: SearchSpeed;

    setAlgorithm: (algo: SearchAlgorithm) => void;
    setTarget: (t: number) => void;
    generateNewArray: (sorted: boolean) => void;
    generateUniformArray: () => void;
    runSearch: () => void;
    stepForward: () => void;
    stepBackward: () => void;
    play: () => void;
    pause: () => void;
    reset: () => void;
    setSpeed: (speed: SearchSpeed) => void;
}

const initialArray = generateArray(true);

export const useSearchingStore = create<SearchingStoreState>((set, get) => ({
    array: initialArray,
    target: pickTargetFromArray(initialArray),
    algorithm: 'binary',
    steps: [],
    currentStepIndex: -1,
    isPlaying: false,
    isFound: null,
    speed: 'normal',

    setAlgorithm: (algo) => {
        set({
            algorithm: algo,
            steps: [],
            currentStepIndex: -1,
            isPlaying: false,
            isFound: null,
        });
    },

    setTarget: (t) => {
        set({ target: t, steps: [], currentStepIndex: -1, isPlaying: false, isFound: null });
    },

    generateNewArray: (sorted) => {
        const arr = generateArray(sorted);
        set({
            array: arr,
            target: pickTargetFromArray(arr),
            steps: [],
            currentStepIndex: -1,
            isPlaying: false,
            isFound: null,
        });
    },

    generateUniformArray: () => {
        const arr = generateUniformArray();
        set({
            array: arr,
            target: pickTargetFromArray(arr),
            algorithm: 'interpolation',
            steps: [],
            currentStepIndex: -1,
            isPlaying: false,
            isFound: null,
        });
    },

    runSearch: () => {
        const { array, target, algorithm } = get();
        const steps = runSearch(algorithm, array, target);
        const last = steps[steps.length - 1];
        set({
            steps,
            currentStepIndex: steps.length > 0 ? 0 : -1,
            isPlaying: false,
            isFound: last?.found ?? null,
        });
    },

    stepForward: () => {
        const { currentStepIndex, steps } = get();
        if (currentStepIndex < steps.length - 1) {
            const next = currentStepIndex + 1;
            set({
                currentStepIndex: next,
                isPlaying: false,
                isFound: steps[next]?.found ?? get().isFound,
            });
        }
    },

    stepBackward: () => {
        const { currentStepIndex, steps } = get();
        if (currentStepIndex > 0) {
            const prev = currentStepIndex - 1;
            set({
                currentStepIndex: prev,
                isPlaying: false,
                isFound: steps[prev]?.found ?? null,
            });
        }
    },

    play: () => {
        const { steps, currentStepIndex } = get();
        if (steps.length === 0) {
            get().runSearch();
        }
        const updated = get();
        if (updated.steps.length === 0) return;
        if (updated.currentStepIndex < 0) {
            set({ currentStepIndex: 0, isPlaying: true });
        } else if (updated.currentStepIndex < updated.steps.length - 1) {
            set({ isPlaying: true });
        }
    },

    pause: () => set({ isPlaying: false }),

    reset: () => {
        set({
            steps: [],
            currentStepIndex: -1,
            isPlaying: false,
            isFound: null,
        });
    },

    setSpeed: (speed) => set({ speed }),
}));

export type { SearchAlgorithm, SearchSpeed };
