import { BSTNode, NodeState } from '@/store/useBSTStore';

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Animated Insert - shows path taken to insert
export async function* animatedInsert(
    root: BSTNode | null,
    value: number,
    updateNodeState: (id: number, state: NodeState) => void,
    delayMs: number
): AsyncGenerator<BSTNode | null> {
    let current = root;

    while (current) {
        updateNodeState(current.id, 'visiting');
        await delay(delayMs);
        yield current;

        if (value < current.value) {
            updateNodeState(current.id, 'path');
            if (!current.left) break;
            current = current.left;
        } else if (value > current.value) {
            updateNodeState(current.id, 'path');
            if (!current.right) break;
            current = current.right;
        } else {
            // Value already exists
            updateNodeState(current.id, 'found');
            return;
        }
    }
}

// Find a value in BST
export async function* findValue(
    root: BSTNode | null,
    value: number,
    updateNodeState: (id: number, state: NodeState) => void,
    delayMs: number
): AsyncGenerator<{ found: boolean; node: BSTNode | null }> {
    let current = root;

    while (current) {
        updateNodeState(current.id, 'visiting');
        await delay(delayMs);
        yield { found: false, node: current };

        if (value === current.value) {
            updateNodeState(current.id, 'found');
            yield { found: true, node: current };
            return;
        }

        updateNodeState(current.id, 'path');

        if (value < current.value) {
            current = current.left;
        } else {
            current = current.right;
        }
    }

    yield { found: false, node: null };
}

// In-Order Traversal (Left, Root, Right)
export async function* inOrderTraversal(
    node: BSTNode | null,
    updateNodeState: (id: number, state: NodeState) => void,
    delayMs: number,
    result: number[] = []
): AsyncGenerator<number[]> {
    if (!node) return;

    yield* inOrderTraversal(node.left, updateNodeState, delayMs, result);

    updateNodeState(node.id, 'visiting');
    await delay(delayMs);
    result.push(node.value);
    yield [...result];
    updateNodeState(node.id, 'found');

    yield* inOrderTraversal(node.right, updateNodeState, delayMs, result);
}

// Pre-Order Traversal (Root, Left, Right)
export async function* preOrderTraversal(
    node: BSTNode | null,
    updateNodeState: (id: number, state: NodeState) => void,
    delayMs: number,
    result: number[] = []
): AsyncGenerator<number[]> {
    if (!node) return;

    updateNodeState(node.id, 'visiting');
    await delay(delayMs);
    result.push(node.value);
    yield [...result];
    updateNodeState(node.id, 'found');

    yield* preOrderTraversal(node.left, updateNodeState, delayMs, result);
    yield* preOrderTraversal(node.right, updateNodeState, delayMs, result);
}

// Post-Order Traversal (Left, Right, Root)
export async function* postOrderTraversal(
    node: BSTNode | null,
    updateNodeState: (id: number, state: NodeState) => void,
    delayMs: number,
    result: number[] = []
): AsyncGenerator<number[]> {
    if (!node) return;

    yield* postOrderTraversal(node.left, updateNodeState, delayMs, result);
    yield* postOrderTraversal(node.right, updateNodeState, delayMs, result);

    updateNodeState(node.id, 'visiting');
    await delay(delayMs);
    result.push(node.value);
    yield [...result];
    updateNodeState(node.id, 'found');
}
