import { create } from 'zustand';
import {
    PRESETS,
    runTraversal,
    type GraphAlgorithm,
    type GraphEdge,
    type GraphNode,
    type GraphPreset,
    type GraphSpeed,
    type TraversalStep,
} from '@/lib/graph';

interface GraphStoreState {
    nodes: GraphNode[];
    edges: GraphEdge[];
    selectedAlgorithm: GraphAlgorithm;
    startNode: string;
    targetNode: string | null;
    currentStepIndex: number;
    steps: TraversalStep[];
    isPlaying: boolean;
    speed: GraphSpeed;
    selectionMode: 'start' | 'target';

    setAlgorithm: (algo: GraphAlgorithm) => void;
    setStartNode: (id: string) => void;
    setTargetNode: (id: string | null) => void;
    setSelectionMode: (mode: 'start' | 'target') => void;
    loadPreset: (name: GraphPreset) => void;
    runTraversal: () => void;
    stepForward: () => void;
    stepBackward: () => void;
    play: () => void;
    pause: () => void;
    reset: () => void;
    setSpeed: (speed: GraphSpeed) => void;
}

export const useGraphStore = create<GraphStoreState>((set, get) => ({
    nodes: PRESETS.tree.nodes,
    edges: PRESETS.tree.edges,
    selectedAlgorithm: 'bfs',
    startNode: 'A',
    targetNode: 'F',
    currentStepIndex: -1,
    steps: [],
    isPlaying: false,
    speed: 'normal',
    selectionMode: 'start',

    setAlgorithm: (algo) => {
        set({
            selectedAlgorithm: algo,
            steps: [],
            currentStepIndex: -1,
            isPlaying: false,
        });
    },

    setStartNode: (id) => {
        set({ startNode: id, steps: [], currentStepIndex: -1, isPlaying: false });
    },

    setTargetNode: (id) => {
        set({ targetNode: id, steps: [], currentStepIndex: -1, isPlaying: false });
    },

    setSelectionMode: (mode) => set({ selectionMode: mode }),

    loadPreset: (name) => {
        const preset = PRESETS[name];
        set({
            nodes: preset.nodes.map((n) => ({ ...n })),
            edges: preset.edges.map((e) => ({ ...e })),
            startNode: preset.defaultStart,
            targetNode: preset.defaultTarget,
            steps: [],
            currentStepIndex: -1,
            isPlaying: false,
        });
    },

    runTraversal: () => {
        const { nodes, edges, selectedAlgorithm, startNode, targetNode } = get();
        const steps = runTraversal(selectedAlgorithm, nodes, edges, startNode, targetNode);
        set({
            steps,
            currentStepIndex: steps.length > 0 ? 0 : -1,
            isPlaying: false,
        });
    },

    stepForward: () => {
        const { currentStepIndex, steps } = get();
        if (currentStepIndex < steps.length - 1) {
            set({ currentStepIndex: currentStepIndex + 1, isPlaying: false });
        }
    },

    stepBackward: () => {
        const { currentStepIndex } = get();
        if (currentStepIndex > 0) {
            set({ currentStepIndex: currentStepIndex - 1, isPlaying: false });
        }
    },

    play: () => {
        const { steps, currentStepIndex } = get();
        if (steps.length === 0) {
            get().runTraversal();
        }
        if (get().steps.length > 0 && currentStepIndex < get().steps.length - 1) {
            set({ isPlaying: true });
        } else if (get().steps.length > 0 && currentStepIndex === -1) {
            set({ currentStepIndex: 0, isPlaying: true });
        }
    },

    pause: () => set({ isPlaying: false }),

    reset: () => {
        set({
            steps: [],
            currentStepIndex: -1,
            isPlaying: false,
        });
    },

    setSpeed: (speed) => set({ speed }),
}));

export type { GraphAlgorithm, GraphPreset, GraphSpeed };
