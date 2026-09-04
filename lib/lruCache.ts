export interface CacheNode {
    key: string;
    value: string;
    prev: string | null;
    next: string | null;
}

export type ActionType = 'HIT' | 'MISS' | 'EVICT' | 'INSERT' | 'UPDATE' | 'RESET';

export interface CacheAction {
    type: ActionType;
    key?: string;
    evictedKey?: string;
    message: string;
}

export interface LRUCacheState {
    capacity: number;
    nodes: Record<string, CacheNode>;
    cacheMap: Record<string, string>;
    head: string | null;
    tail: string | null;
    hits: number;
    misses: number;
}

export interface LRUSnapshot extends LRUCacheState {
    orderedKeys: string[];
    hitRatio: number;
    totalOps: number;
}

export type SequenceName = 'classic' | 'repeated' | 'thrashing';

export interface CacheOperation {
    op: 'get' | 'put';
    key: string;
    value?: string;
}

const DEFAULT_CAPACITY = 4;
const MIN_CAPACITY = 3;
const MAX_CAPACITY = 7;

function createNode(key: string, value: string): CacheNode {
    return { key, value, prev: null, next: null };
}

export function nodePointer(key: string): string {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }
    return `0x${(hash % 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;
}

export function createLRUCache(capacity = DEFAULT_CAPACITY): LRUCacheState {
    return {
        capacity: clampCapacity(capacity),
        nodes: {},
        cacheMap: {},
        head: null,
        tail: null,
        hits: 0,
        misses: 0,
    };
}

function clampCapacity(capacity: number): number {
    return Math.max(MIN_CAPACITY, Math.min(MAX_CAPACITY, capacity));
}

export function getOrderedKeys(state: LRUCacheState): string[] {
    const keys: string[] = [];
    let current = state.head;
    while (current) {
        keys.push(current);
        current = state.nodes[current]?.next ?? null;
    }
    return keys;
}

export function getSnapshot(state: LRUCacheState): LRUSnapshot {
    const totalOps = state.hits + state.misses;
    return {
        ...state,
        orderedKeys: getOrderedKeys(state),
        hitRatio: totalOps > 0 ? state.hits / totalOps : 0,
        totalOps,
    };
}

function detachNode(state: LRUCacheState, key: string): LRUCacheState {
    const node = state.nodes[key];
    if (!node) return state;

    const nodes = { ...state.nodes };
    let head = state.head;
    let tail = state.tail;

    if (node.prev) {
        nodes[node.prev] = { ...nodes[node.prev], next: node.next };
    } else {
        head = node.next;
    }

    if (node.next) {
        nodes[node.next] = { ...nodes[node.next], prev: node.prev };
    } else {
        tail = node.prev;
    }

    nodes[key] = { ...node, prev: null, next: null };
    return { ...state, nodes, head, tail };
}

function insertAtHead(state: LRUCacheState, key: string): LRUCacheState {
    const node = state.nodes[key];
    if (!node) return state;

    const nodes = { ...state.nodes };
    let head = state.head;
    let tail = state.tail;

    nodes[key] = { ...node, prev: null, next: head };

    if (head) {
        nodes[head] = { ...nodes[head], prev: key };
    } else {
        tail = key;
    }

    head = key;
    return { ...state, nodes, head, tail };
}

function removeKey(state: LRUCacheState, key: string): LRUCacheState {
    const updated = detachNode(state, key);
    const nodes = { ...updated.nodes };
    const cacheMap = { ...updated.cacheMap };
    delete nodes[key];
    delete cacheMap[key];
    return { ...updated, nodes, cacheMap };
}

function evictTail(state: LRUCacheState): { state: LRUCacheState; evictedKey: string | null } {
    if (!state.tail) return { state, evictedKey: null };
    const evictedKey = state.tail;
    return { state: removeKey(state, evictedKey), evictedKey };
}

export function lruGet(state: LRUCacheState, key: string): { state: LRUCacheState; action: CacheAction } {
    if (!(key in state.cacheMap)) {
        return {
            state: { ...state, misses: state.misses + 1 },
            action: {
                type: 'MISS',
                key,
                message: `'${key}' anahtarı bulunamadı: Cache MISS. Veri kaynağından okunması gerekir.`,
            },
        };
    }

    const detached = detachNode(state, key);
    const promoted = insertAtHead(detached, key);

    return {
        state: { ...promoted, hits: state.hits + 1 },
        action: {
            type: 'HIT',
            key,
            message: `'${key}' anahtarına erişildi: O(1) hızında bulundu ve önceliği yenilenerek listenin başına (MRU) taşındı.`,
        },
    };
}

export function lruPut(
    state: LRUCacheState,
    key: string,
    value: string
): { state: LRUCacheState; action: CacheAction } {
    if (key in state.cacheMap) {
        let updated = detachNode(state, key);
        const nodes = {
            ...updated.nodes,
            [key]: { ...updated.nodes[key], value },
        };
        updated = { ...updated, nodes, cacheMap: { ...updated.cacheMap, [key]: value } };
        updated = insertAtHead(updated, key);

        return {
            state: updated,
            action: {
                type: 'UPDATE',
                key,
                message: `'${key}' zaten önbellekte: değer güncellendi ve MRU konumuna taşındı.`,
            },
        };
    }

    let evictedKey: string | null = null;
    let working = state;

    if (Object.keys(state.cacheMap).length >= state.capacity) {
        const evictResult = evictTail(working);
        working = evictResult.state;
        evictedKey = evictResult.evictedKey;
    }

    const nodes = {
        ...working.nodes,
        [key]: createNode(key, value),
    };
    const cacheMap = { ...working.cacheMap, [key]: value };
    working = { ...working, nodes, cacheMap };
    working = insertAtHead(working, key);

    const message = evictedKey
        ? `'${key}' eklendi: Kapasite dolu olduğu için LRU düğümü '${evictedKey}' tahliye edildi (EVICT), yeni düğüm Head'e yerleştirildi.`
        : `'${key}' eklendi: Hash map'e O(1) yazıldı ve doubly linked list'in başına (MRU) eklendi.`;

    return {
        state: working,
        action: {
            type: evictedKey ? 'EVICT' : 'INSERT',
            key,
            evictedKey: evictedKey ?? undefined,
            message,
        },
    };
}

export function setCapacity(state: LRUCacheState, capacity: number): LRUCacheState {
    const newCapacity = clampCapacity(capacity);
    let working: LRUCacheState = { ...state, capacity: newCapacity };

    while (Object.keys(working.cacheMap).length > newCapacity && working.tail) {
        working = removeKey(working, working.tail);
    }

    return working;
}

export function resetCache(capacity?: number): { state: LRUCacheState; action: CacheAction } {
    return {
        state: createLRUCache(capacity ?? DEFAULT_CAPACITY),
        action: {
            type: 'RESET',
            message: 'Önbellek sıfırlandı. Hash map ve doubly linked list temizlendi.',
        },
    };
}

export function applyOperation(
    state: LRUCacheState,
    operation: CacheOperation
): { state: LRUCacheState; action: CacheAction } {
    if (operation.op === 'get') {
        return lruGet(state, operation.key);
    }
    return lruPut(state, operation.key, operation.value ?? '—');
}

export const SEQUENCES: Record<SequenceName, { label: string; ops: CacheOperation[] }> = {
    classic: {
        label: 'Classic Eviction Flow',
        ops: [
            { op: 'put', key: 'A', value: '1' },
            { op: 'put', key: 'B', value: '2' },
            { op: 'put', key: 'C', value: '3' },
            { op: 'put', key: 'D', value: '4' },
            { op: 'get', key: 'B' },
            { op: 'put', key: 'E', value: '5' },
            { op: 'get', key: 'A' },
        ],
    },
    repeated: {
        label: 'Repeated Access Pattern',
        ops: [
            { op: 'put', key: 'A', value: '1' },
            { op: 'put', key: 'B', value: '2' },
            { op: 'put', key: 'C', value: '3' },
            { op: 'put', key: 'D', value: '4' },
            { op: 'get', key: 'A' },
            { op: 'get', key: 'A' },
            { op: 'get', key: 'A' },
            { op: 'put', key: 'E', value: '5' },
        ],
    },
    thrashing: {
        label: 'Thrashing / Alternating',
        ops: [
            { op: 'put', key: 'A', value: '1' },
            { op: 'put', key: 'B', value: '2' },
            { op: 'put', key: 'C', value: '3' },
            { op: 'put', key: 'D', value: '4' },
            { op: 'get', key: 'E' },
            { op: 'get', key: 'F' },
            { op: 'get', key: 'G' },
            { op: 'put', key: 'H', value: '8' },
            { op: 'get', key: 'I' },
            { op: 'put', key: 'J', value: '10' },
        ],
    },
};

export { DEFAULT_CAPACITY, MIN_CAPACITY, MAX_CAPACITY };
