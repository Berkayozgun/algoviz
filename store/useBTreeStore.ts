import { create } from 'zustand';

export interface BTreeNode {
    id: string;
    keys: number[];
    children: BTreeNode[];
    isLeaf: boolean;
}

interface BTreeState {
    root: BTreeNode | null;
    order: number;
    highlightedNodeId: string | null;
    isAnimating: boolean;
    insertKey: (key: number) => Promise<void>;
    reset: () => void;
}

let nodeId = 0;
const newNode = (isLeaf = true): BTreeNode => ({
    id: `n${++nodeId}`,
    keys: [],
    children: [],
    isLeaf,
});

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// B-Tree of order t means:
// - Each node has at most 2t-1 keys
// - Each node has at most 2t children
// - For order 2 (t=2): max 3 keys, max 4 children
// Let's use order 2 for more visible splits

export const useBTreeStore = create<BTreeState>((set, get) => ({
    root: null,
    order: 2, // t=2: max 3 keys per node, split when 4
    highlightedNodeId: null,
    isAnimating: false,

    insertKey: async (key: number) => {
        const state = get();
        if (state.isAnimating) return;

        set({ isAnimating: true });
        const t = state.order;

        // Clone tree
        const clone = (n: BTreeNode | null): BTreeNode | null => {
            if (!n) return null;
            return { ...n, keys: [...n.keys], children: n.children.map(c => clone(c)!) };
        };

        let root = clone(state.root);

        if (!root) {
            root = newNode(true);
            root.keys.push(key);
            await delay(200);
            set({ root, isAnimating: false });
            return;
        }

        // If root is full, split it
        if (root.keys.length === 2 * t - 1) {
            const s = newNode(false);
            s.children.push(root);
            splitChild(s, 0, t);
            root = s;
        }

        // Highlight and insert
        await insertNonFull(root, key, t, set, get);

        set({ root, isAnimating: false, highlightedNodeId: null });
    },

    reset: () => {
        nodeId = 0;
        set({ root: null, highlightedNodeId: null, isAnimating: false });
    },
}));

function splitChild(parent: BTreeNode, i: number, t: number) {
    const y = parent.children[i];
    const z = newNode(y.isLeaf);

    // z gets the last t-1 keys of y
    z.keys = y.keys.splice(t);
    const midKey = y.keys.pop()!;

    // If not leaf, z also gets the last t children
    if (!y.isLeaf) {
        z.children = y.children.splice(t);
    }

    // Insert midKey into parent and z as new child
    parent.keys.splice(i, 0, midKey);
    parent.children.splice(i + 1, 0, z);
}

async function insertNonFull(
    node: BTreeNode,
    key: number,
    t: number,
    set: (s: Partial<BTreeState>) => void,
    get: () => BTreeState
) {
    set({ highlightedNodeId: node.id });
    await delay(300);

    if (node.isLeaf) {
        // Insert in sorted order
        let i = node.keys.length - 1;
        while (i >= 0 && key < node.keys[i]) i--;
        node.keys.splice(i + 1, 0, key);
    } else {
        // Find child
        let i = node.keys.length - 1;
        while (i >= 0 && key < node.keys[i]) i--;
        i++;

        // If child is full, split
        if (node.children[i].keys.length === 2 * t - 1) {
            splitChild(node, i, t);
            if (key > node.keys[i]) i++;
        }

        await insertNonFull(node.children[i], key, t, set, get);
    }
}
