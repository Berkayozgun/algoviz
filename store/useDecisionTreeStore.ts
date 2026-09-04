import { create } from 'zustand';
import {
    buildTree,
    computeMetrics,
    generatePreset,
    generateRandomPoints,
    predictGrid,
    type Criterion,
    type DataPoint,
    type PresetName,
    type TreeMetrics,
    type TreeNode,
} from '@/lib/decisionTree';

interface DecisionTreeState {
    points: DataPoint[];
    selectedClass: 0 | 1;
    maxDepth: number;
    criterion: Criterion;
    tree: TreeNode | null;
    decisionGrid: number[][];
    metrics: TreeMetrics;

    addPoint: (x: number, y: number, label?: 0 | 1) => void;
    clearPoints: () => void;
    loadPreset: (presetName: PresetName) => void;
    setMaxDepth: (depth: number) => void;
    setCriterion: (criterion: Criterion) => void;
    setSelectedClass: (label: 0 | 1) => void;
    generateRandom: (count: number) => void;
    trainTree: () => void;
}

const defaultMetrics: TreeMetrics = {
    accuracy: 0,
    totalNodes: 0,
    treeDepth: 0,
};

export const useDecisionTreeStore = create<DecisionTreeState>((set, get) => ({
    points: [],
    selectedClass: 0,
    maxDepth: 3,
    criterion: 'gini',
    tree: null,
    decisionGrid: [],
    metrics: defaultMetrics,

    addPoint: (x, y, label) => {
        const pointLabel = label ?? get().selectedClass;
        set((state) => ({
            points: [...state.points, { x, y, label: pointLabel }],
        }));
        get().trainTree();
    },

    clearPoints: () => {
        set({
            points: [],
            tree: null,
            decisionGrid: [],
            metrics: defaultMetrics,
        });
    },

    loadPreset: (presetName) => {
        const points = generatePreset(presetName);
        set({ points });
        get().trainTree();
    },

    setMaxDepth: (depth) => {
        set({ maxDepth: depth });
        get().trainTree();
    },

    setCriterion: (criterion) => {
        set({ criterion });
        get().trainTree();
    },

    setSelectedClass: (label) => set({ selectedClass: label }),

    generateRandom: (count) => {
        const points = generateRandomPoints(count);
        set({ points });
        get().trainTree();
    },

    trainTree: () => {
        const { points, maxDepth, criterion } = get();
        if (points.length === 0) {
            set({ tree: null, decisionGrid: [], metrics: defaultMetrics });
            return;
        }

        const tree = buildTree(points, maxDepth, criterion);
        const decisionGrid = predictGrid(tree);
        const metrics = computeMetrics(tree, points);

        set({ tree, decisionGrid, metrics });
    },
}));
