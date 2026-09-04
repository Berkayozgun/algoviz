export interface ListNode {
    id: string;
    value: number;
    next: string | null;
    prev?: string | null;
}

export type LinkedListType = 'singly' | 'doubly' | 'circular';

export interface PointerState {
    name: string;
    nodeId: string | null;
    color: string;
}

export interface AnimationStep {
    nodes: ListNode[];
    pointers: PointerState[];
    activeNodeId?: string;
    description: string;
    cycleTargetId?: string | null;
    finished?: boolean;
}

export interface LinkedListState {
    listType: LinkedListType;
    nodes: ListNode[];
    headId: string | null;
    cycleTargetId: string | null;
}

let nodeCounter = 0;

function newId(): string {
    nodeCounter += 1;
    return `n${nodeCounter}`;
}

function cloneNodes(nodes: ListNode[]): ListNode[] {
    return nodes.map((n) => ({ ...n }));
}

function cloneState(state: LinkedListState): LinkedListState {
    return {
        listType: state.listType,
        nodes: cloneNodes(state.nodes),
        headId: state.headId,
        cycleTargetId: state.cycleTargetId,
    };
}

function getTailId(nodes: ListNode[], headId: string | null, cycleTargetId: string | null): string | null {
    if (!headId || nodes.length === 0) return null;
    const visited = new Set<string>();
    let current: string | null = headId;
    let prev: string | null = null;

    while (current) {
        if (visited.has(current)) break;
        visited.add(current);
        prev = current;
        const node = nodes.find((n) => n.id === current);
        if (!node) break;
        if (node.next === null) break;
        if (cycleTargetId && node.next === cycleTargetId && current !== headId) break;
        current = node.next;
    }
    return prev;
}

export function createInitialList(listType: LinkedListType = 'singly'): LinkedListState {
    nodeCounter = 0;
    const ids = [newId(), newId(), newId(), newId()];
    const values = [10, 20, 30, 40];
    const nodes: ListNode[] = ids.map((id, i) => ({
        id,
        value: values[i],
        next: i < ids.length - 1 ? ids[i + 1] : null,
        ...(listType === 'doubly' ? { prev: i > 0 ? ids[i - 1] : null } : {}),
    }));

    if (listType === 'circular' && nodes.length > 0) {
        nodes[nodes.length - 1].next = nodes[0].id;
    }

    return {
        listType,
        nodes,
        headId: ids[0],
        cycleTargetId: listType === 'circular' ? ids[0] : null,
    };
}

export function insertHead(state: LinkedListState, value: number): LinkedListState {
    const s = cloneState(state);
    const id = newId();
    const node: ListNode = {
        id,
        value,
        next: s.headId,
        ...(s.listType === 'doubly' ? { prev: null } : {}),
    };

    if (s.headId && s.listType === 'doubly') {
        const head = s.nodes.find((n) => n.id === s.headId);
        if (head) head.prev = id;
    }

    s.nodes.push(node);
    s.headId = id;

    if (s.listType === 'circular') {
        const tailId = getTailId(s.nodes, s.headId, null);
        const tail = tailId ? s.nodes.find((n) => n.id === tailId) : null;
        if (tail) tail.next = s.headId;
    }

    return s;
}

export function insertTail(state: LinkedListState, value: number): LinkedListState {
    const s = cloneState(state);
    const id = newId();
    const node: ListNode = {
        id,
        value,
        next: s.listType === 'circular' ? s.headId : null,
        ...(s.listType === 'doubly' ? { prev: null } : {}),
    };

    if (s.nodes.length === 0) {
        s.nodes.push(node);
        s.headId = id;
        return s;
    }

    const tailId = getTailId(s.nodes, s.headId, s.cycleTargetId);
    if (tailId) {
        const tail = s.nodes.find((n) => n.id === tailId)!;
        if (s.listType === 'doubly') node.prev = tailId;
        if (s.listType !== 'circular') {
            tail.next = id;
        } else {
            tail.next = id;
            node.next = s.headId;
        }
    }

    s.nodes.push(node);
    return s;
}

export function deleteNode(state: LinkedListState, nodeId: string): LinkedListState {
    const s = cloneState(state);
    const target = s.nodes.find((n) => n.id === nodeId);
    if (!target) return s;

    for (const node of s.nodes) {
        if (node.next === nodeId) node.next = target.next;
        if (s.listType === 'doubly' && node.prev === nodeId) node.prev = target.prev ?? null;
    }

    if (s.headId === nodeId) s.headId = target.next;
    if (s.cycleTargetId === nodeId) s.cycleTargetId = null;

    s.nodes = s.nodes.filter((n) => n.id !== nodeId);

    if (s.listType === 'circular' && s.nodes.length > 0) {
        const tailId = getTailId(s.nodes, s.headId, null);
        const tail = tailId ? s.nodes.find((n) => n.id === tailId) : null;
        if (tail) tail.next = s.headId;
    }

    return s;
}

export function toggleCycle(state: LinkedListState): LinkedListState {
    const s = cloneState(state);
    if (s.listType === 'circular') return s;

    if (s.cycleTargetId) {
        const tailId = getTailId(s.nodes, s.headId, s.cycleTargetId);
        const tail = tailId ? s.nodes.find((n) => n.id === tailId) : null;
        if (tail) tail.next = null;
        s.cycleTargetId = null;
        return s;
    }

    if (s.nodes.length < 3) return s;

    const thirdNode = s.nodes[2];
    const tailId = getTailId(s.nodes, s.headId, null);
    const tail = tailId ? s.nodes.find((n) => n.id === tailId) : null;
    if (tail && thirdNode) {
        tail.next = thirdNode.id;
        s.cycleTargetId = thirdNode.id;
    }

    return s;
}

export function generateReverseSteps(state: LinkedListState): AnimationStep[] {
    const steps: AnimationStep[] = [];
    if (!state.headId) return steps;

    let nodes = cloneNodes(state.nodes);
    let prev: string | null = null;
    let curr: string | null = state.headId;

    steps.push({
        nodes: cloneNodes(nodes),
        pointers: [
            { name: 'PREV', nodeId: prev, color: '#94a3b8' },
            { name: 'CURR', nodeId: curr, color: '#fbbf24' },
        ],
        activeNodeId: curr ?? undefined,
        cycleTargetId: state.cycleTargetId,
        description: 'Reverse başladı: prev=null, curr=head. Oklar tek tek tersine çevrilecek.',
    });

    while (curr) {
        const currNode = nodes.find((n) => n.id === curr)!;
        const next = currNode.next;

        steps.push({
            nodes: cloneNodes(nodes),
            pointers: [
                { name: 'PREV', nodeId: prev, color: '#94a3b8' },
                { name: 'CURR', nodeId: curr, color: '#fbbf24' },
                { name: 'NEXT', nodeId: next, color: '#22d3ee' },
            ],
            activeNodeId: curr,
            cycleTargetId: null,
            description: `curr=${currNode.value}: next kaydedildi, curr.next → prev yönüne çevriliyor.`,
        });

        currNode.next = prev;
        if (state.listType === 'doubly') {
            currNode.prev = next;
        }
        prev = curr;
        curr = next;

        steps.push({
            nodes: cloneNodes(nodes),
            pointers: [
                { name: 'PREV', nodeId: prev, color: '#94a3b8' },
                { name: 'CURR', nodeId: curr, color: '#fbbf24' },
            ],
            activeNodeId: prev,
            cycleTargetId: null,
            description: `Pointer'lar ilerletildi: prev=${nodes.find((n) => n.id === prev)?.value}, curr=${curr ? nodes.find((n) => n.id === curr)?.value : 'null'}.`,
        });
    }

    steps.push({
        nodes: cloneNodes(nodes),
        pointers: [{ name: 'HEAD', nodeId: prev, color: '#3b82f6' }],
        activeNodeId: prev ?? undefined,
        cycleTargetId: null,
        description: `Liste tersine çevrildi! Yeni head: ${nodes.find((n) => n.id === prev)?.value}. Zaman: O(n), Alan: O(1).`,
        finished: true,
    });

    return steps;
}

export function applyReverseFinal(state: LinkedListState): LinkedListState {
    const steps = generateReverseSteps(state);
    const last = steps[steps.length - 1];
    if (!last) return state;
    return {
        listType: state.listType,
        nodes: cloneNodes(last.nodes),
        headId: last.pointers.find((p) => p.name === 'HEAD')?.nodeId ?? last.pointers.find((p) => p.name === 'PREV')?.nodeId ?? state.headId,
        cycleTargetId: null,
    };
}

export function generateFloydSteps(state: LinkedListState): AnimationStep[] {
    const steps: AnimationStep[] = [];
    if (!state.headId) return steps;

    const hasCycle = state.cycleTargetId !== null || state.listType === 'circular';
    if (!hasCycle) {
        return [{
            nodes: cloneNodes(state.nodes),
            pointers: [],
            description: 'Döngü yok! Önce "Create Cycle" ile döngü oluşturun veya Circular mod seçin.',
            finished: true,
        }];
    }

    let slow: string | null = state.headId;
    let fast: string | null = state.headId;
    let stepNum = 0;

    const advance = (id: string | null, count: number): string | null => {
        let current = id;
        for (let i = 0; i < count; i++) {
            if (!current) return null;
            const node = state.nodes.find((n) => n.id === current);
            if (!node?.next) return null;
            current = node.next;
        }
        return current;
    };

    steps.push({
        nodes: cloneNodes(state.nodes),
        pointers: [
            { name: '🐢 SLOW', nodeId: slow, color: '#34d399' },
            { name: '🐇 FAST', nodeId: fast, color: '#fb923c' },
        ],
        activeNodeId: slow ?? undefined,
        cycleTargetId: state.cycleTargetId ?? state.headId,
        description: "Floyd başladı: Slow ve Fast head'den yola çıktı.",
    });

    while (fast) {
        const fastNode = state.nodes.find((n) => n.id === fast);
        if (!fastNode?.next) break;

        slow = advance(slow, 1);
        fast = advance(fast, 2);
        stepNum += 1;

        const slowVal = slow ? state.nodes.find((n) => n.id === slow)?.value : '?';
        const fastVal = fast ? state.nodes.find((n) => n.id === fast)?.value : '?';

        if (slow && fast && slow === fast) {
            steps.push({
                nodes: cloneNodes(state.nodes),
                pointers: [
                    { name: '🐢 SLOW', nodeId: slow, color: '#34d399' },
                    { name: '🐇 FAST', nodeId: fast, color: '#fb923c' },
                ],
                activeNodeId: slow,
                cycleTargetId: state.cycleTargetId ?? state.headId,
                description: `Cycle Detected! Slow ve Fast düğüm ${slowVal}'de çakıştı. Döngü var — O(n) zaman, O(1) alan.`,
                finished: true,
            });
            return steps;
        }

        steps.push({
            nodes: cloneNodes(state.nodes),
            pointers: [
                { name: '🐢 SLOW', nodeId: slow, color: '#34d399' },
                { name: '🐇 FAST', nodeId: fast, color: '#fb923c' },
            ],
            activeNodeId: fast ?? slow ?? undefined,
            cycleTargetId: state.cycleTargetId ?? state.headId,
            description: `Adım ${stepNum}: Slow → ${slowVal} (1 adım), Fast → ${fastVal} (2 adım). Aralarındaki mesafe döngü içinde kapanıyor.`,
        });

        if (stepNum > 20) break;
    }

    steps.push({
        nodes: cloneNodes(state.nodes),
        pointers: [],
        description: 'Fast pointer sona ulaştı — döngü yok.',
        finished: true,
    });

    return steps;
}

export function getOrderedNodes(state: LinkedListState): ListNode[] {
    if (!state.headId) return [];
    const ordered: ListNode[] = [];
    const visited = new Set<string>();
    let current: string | null = state.headId;

    while (current && !visited.has(current)) {
        visited.add(current);
        const node = state.nodes.find((n) => n.id === current);
        if (!node) break;
        ordered.push(node);
        current = node.next;
        if (current === state.headId && state.listType === 'circular') break;
        if (current === state.cycleTargetId && ordered.length > 1) break;
    }

    return ordered;
}

export function getSpeedMs(speed: 'slow' | 'normal' | 'fast'): number {
    switch (speed) {
        case 'slow': return 900;
        case 'fast': return 250;
        default: return 550;
    }
}

export const DEFAULT_POINTERS: PointerState[] = [
    { name: 'HEAD', nodeId: null, color: '#3b82f6' },
    { name: 'TAIL', nodeId: null, color: '#eab308' },
];
