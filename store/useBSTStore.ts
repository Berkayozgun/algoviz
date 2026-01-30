import { create } from 'zustand';

export type NodeState = 'default' | 'visiting' | 'found' | 'path' | 'inserted';

export interface BSTNode {
    id: number;
    value: number;
    left: BSTNode | null;
    right: BSTNode | null;
    x: number;
    y: number;
    state: NodeState;
}

interface BSTState {
    root: BSTNode | null;
    nodeCount: number;
    isRunning: boolean;
    speed: 'fast' | 'medium' | 'slow';
    highlightedNodes: number[];
    traversalResult: number[];
    setRoot: (root: BSTNode | null) => void;
    setIsRunning: (isRunning: boolean) => void;
    setSpeed: (speed: 'fast' | 'medium' | 'slow') => void;
    setHighlightedNodes: (ids: number[]) => void;
    setTraversalResult: (result: number[]) => void;
    updateNodeState: (id: number, state: NodeState) => void;
    insertValue: (value: number) => void;
    clearTree: () => void;
    resetNodeStates: () => void;
}

let nodeIdCounter = 0;

const calculatePositions = (
    node: BSTNode | null,
    x: number,
    y: number,
    horizontalSpacing: number,
    level: number
): void => {
    if (!node) return;

    node.x = x;
    node.y = y;

    const nextSpacing = horizontalSpacing / 1.8;
    const verticalGap = 80;

    if (node.left) {
        calculatePositions(node.left, x - horizontalSpacing, y + verticalGap, nextSpacing, level + 1);
    }
    if (node.right) {
        calculatePositions(node.right, x + horizontalSpacing, y + verticalGap, nextSpacing, level + 1);
    }
};

const insertNode = (root: BSTNode | null, value: number): BSTNode => {
    if (!root) {
        return {
            id: ++nodeIdCounter,
            value,
            left: null,
            right: null,
            x: 0,
            y: 0,
            state: 'inserted',
        };
    }

    if (value < root.value) {
        root.left = insertNode(root.left, value);
    } else if (value > root.value) {
        root.right = insertNode(root.right, value);
    }

    return root;
};

const resetStates = (node: BSTNode | null): void => {
    if (!node) return;
    node.state = 'default';
    resetStates(node.left);
    resetStates(node.right);
};

const updateState = (node: BSTNode | null, id: number, state: NodeState): boolean => {
    if (!node) return false;
    if (node.id === id) {
        node.state = state;
        return true;
    }
    return updateState(node.left, id, state) || updateState(node.right, id, state);
};

const cloneTree = (node: BSTNode | null): BSTNode | null => {
    if (!node) return null;
    return {
        ...node,
        left: cloneTree(node.left),
        right: cloneTree(node.right),
    };
};

export const useBSTStore = create<BSTState>((set, get) => ({
    root: null,
    nodeCount: 0,
    isRunning: false,
    speed: 'medium',
    highlightedNodes: [],
    traversalResult: [],

    setRoot: (root) => set({ root }),
    setIsRunning: (isRunning) => set({ isRunning }),
    setSpeed: (speed) => set({ speed }),
    setHighlightedNodes: (highlightedNodes) => set({ highlightedNodes }),
    setTraversalResult: (traversalResult) => set({ traversalResult }),

    updateNodeState: (id, state) => {
        const root = cloneTree(get().root);
        if (root) {
            updateState(root, id, state);
            set({ root });
        }
    },

    insertValue: (value) => {
        let root = cloneTree(get().root);
        root = insertNode(root, value);
        calculatePositions(root, 400, 50, 150, 0);
        set({ root, nodeCount: get().nodeCount + 1 });
    },

    clearTree: () => {
        nodeIdCounter = 0;
        set({ root: null, nodeCount: 0, highlightedNodes: [], traversalResult: [] });
    },

    resetNodeStates: () => {
        const root = cloneTree(get().root);
        resetStates(root);
        set({ root, highlightedNodes: [], traversalResult: [] });
    },
}));
