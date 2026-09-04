import { create } from 'zustand';

export interface BTreeNode {
    id: string;
    keys: number[];
    children: BTreeNode[];
    isLeaf: boolean;
}

export type BTreeSpeed = 'slow' | 'normal' | 'fast';

interface BTreeState {
    root: BTreeNode | null;
    order: number;
    highlightedNodeId: string | null;
    highlightedKey: number | null;
    isAnimating: boolean;
    speed: BTreeSpeed;
    setSpeed: (speed: BTreeSpeed) => void;
    insertKey: (key: number) => Promise<void>;
    searchKey: (key: number) => Promise<boolean>;
    reset: () => void;
}

let nodeId = 0;
const newNode = (isLeaf = true): BTreeNode => ({
    id: `n${++nodeId}`,
    keys: [],
    children: [],
    isLeaf,
});

const getDelayMs = (speed: BTreeSpeed) => {
    switch (speed) {
        case 'slow': return 500;
        case 'fast': return 100;
        default: return 300;
    }
};

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const useBTreeStore = create<BTreeState>((set, get) => ({
    root: null,
    order: 2,
    highlightedNodeId: null,
    highlightedKey: null,
    isAnimating: false,
    speed: 'normal',

    setSpeed: (speed) => set({ speed }),

    insertKey: async (key: number) => {
        const state = get();
        if (state.isAnimating) return;

        set({ isAnimating: true, highlightedKey: null });
        const t = state.order;
        const delayMs = getDelayMs(state.speed);

        const clone = (n: BTreeNode | null): BTreeNode | null => {
            if (!n) return null;
            return { ...n, keys: [...n.keys], children: n.children.map(c => clone(c)!) };
        };

        let root = clone(state.root);

        if (!root) {
            root = newNode(true);
            root.keys.push(key);
            await delay(delayMs);
            set({ root, isAnimating: false });
            return;
        }

        if (root.keys.length === 2 * t - 1) {
            const s = newNode(false);
            s.children.push(root);
            splitChild(s, 0, t);
            root = s;
        }

        await insertNonFull(root, key, t, set, get, delayMs);

        set({ root, isAnimating: false, highlightedNodeId: null, highlightedKey: null });
    },

    searchKey: async (key: number) => {
        const state = get();
        if (state.isAnimating || !state.root) return false;

        set({ isAnimating: true, highlightedNodeId: null, highlightedKey: null });
        const delayMs = getDelayMs(state.speed);

        const found = await searchInTree(state.root, key, set, delayMs);

        if (found) {
            set({ highlightedNodeId: found.nodeId, highlightedKey: key, isAnimating: false });
            return true;
        }

        set({ highlightedNodeId: null, highlightedKey: null, isAnimating: false });
        return false;
    },

    reset: () => {
        nodeId = 0;
        set({ root: null, highlightedNodeId: null, highlightedKey: null, isAnimating: false });
    },
}));

function splitChild(parent: BTreeNode, i: number, t: number) {
    const y = parent.children[i];
    const z = newNode(y.isLeaf);

    z.keys = y.keys.splice(t);
    const midKey = y.keys.pop()!;

    if (!y.isLeaf) {
        z.children = y.children.splice(t);
    }

    parent.keys.splice(i, 0, midKey);
    parent.children.splice(i + 1, 0, z);
}

async function insertNonFull(
    node: BTreeNode,
    key: number,
    t: number,
    set: (s: Partial<BTreeState>) => void,
    get: () => BTreeState,
    delayMs: number
) {
    set({ highlightedNodeId: node.id });
    await delay(delayMs);

    if (node.isLeaf) {
        let i = node.keys.length - 1;
        while (i >= 0 && key < node.keys[i]) i--;
        node.keys.splice(i + 1, 0, key);
    } else {
        let i = node.keys.length - 1;
        while (i >= 0 && key < node.keys[i]) i--;
        i++;

        if (node.children[i].keys.length === 2 * t - 1) {
            splitChild(node, i, t);
            if (key > node.keys[i]) i++;
        }

        await insertNonFull(node.children[i], key, t, set, get, delayMs);
    }
}

async function searchInTree(
    node: BTreeNode,
    key: number,
    set: (s: Partial<BTreeState>) => void,
    delayMs: number
): Promise<{ nodeId: string } | null> {
    set({ highlightedNodeId: node.id });
    await delay(delayMs);

    let i = 0;
    while (i < node.keys.length && key > node.keys[i]) {
        i++;
    }

    if (i < node.keys.length && node.keys[i] === key) {
        return { nodeId: node.id };
    }

    if (node.isLeaf) {
        return null;
    }

    return searchInTree(node.children[i], key, set, delayMs);
}
