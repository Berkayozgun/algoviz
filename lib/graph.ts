export interface GraphNode {
    id: string;
    label: string;
    x: number;
    y: number;
}

export interface GraphEdge {
    from: string;
    to: string;
    weight: number;
}

export interface TraversalStep {
    activeNode: string;
    visitedNodes: string[];
    activeEdge?: { from: string; to: string };
    dataStructureState: string[];
    description: string;
    distances?: Record<string, number>;
    pathNodes?: string[];
    finished?: boolean;
}

export type GraphAlgorithm = 'bfs' | 'dfs' | 'dijkstra';
export type GraphPreset = 'tree' | 'cyclic' | 'weighted';
export type GraphSpeed = 'slow' | 'normal' | 'fast';

export interface GraphPresetData {
    label: string;
    nodes: GraphNode[];
    edges: GraphEdge[];
    defaultStart: string;
    defaultTarget: string | null;
}

function edge(from: string, to: string, weight = 1): GraphEdge {
    return { from, to, weight };
}

export const PRESETS: Record<GraphPreset, GraphPresetData> = {
    tree: {
        label: 'Simple Tree / Hierarchy',
        defaultStart: 'A',
        defaultTarget: 'F',
        nodes: [
            { id: 'A', label: 'A', x: 300, y: 60 },
            { id: 'B', label: 'B', x: 150, y: 160 },
            { id: 'C', label: 'C', x: 450, y: 160 },
            { id: 'D', label: 'D', x: 80, y: 280 },
            { id: 'E', label: 'E', x: 220, y: 280 },
            { id: 'F', label: 'F', x: 450, y: 280 },
        ],
        edges: [
            edge('A', 'B'), edge('A', 'C'),
            edge('B', 'D'), edge('B', 'E'), edge('C', 'F'),
        ],
    },
    cyclic: {
        label: 'Cyclic / Complex Network',
        defaultStart: 'A',
        defaultTarget: 'D',
        nodes: [
            { id: 'A', label: 'A', x: 120, y: 200 },
            { id: 'B', label: 'B', x: 300, y: 80 },
            { id: 'C', label: 'C', x: 480, y: 200 },
            { id: 'D', label: 'D', x: 300, y: 320 },
            { id: 'E', label: 'E', x: 300, y: 200 },
        ],
        edges: [
            edge('A', 'B'), edge('B', 'C'), edge('C', 'D'),
            edge('D', 'A'), edge('A', 'C'), edge('B', 'D'),
            edge('B', 'E'), edge('E', 'C'),
        ],
    },
    weighted: {
        label: 'Weighted Grid / Road Map',
        defaultStart: 'S',
        defaultTarget: 'G',
        nodes: [
            { id: 'S', label: 'S', x: 80, y: 200 },
            { id: 'A', label: 'A', x: 200, y: 100 },
            { id: 'B', label: 'B', x: 200, y: 300 },
            { id: 'C', label: 'C', x: 340, y: 100 },
            { id: 'D', label: 'D', x: 340, y: 300 },
            { id: 'G', label: 'G', x: 480, y: 200 },
        ],
        edges: [
            edge('S', 'A', 4), edge('S', 'B', 2),
            edge('A', 'C', 3), edge('B', 'D', 5),
            edge('A', 'B', 1), edge('C', 'D', 1),
            edge('C', 'G', 2), edge('D', 'G', 3),
        ],
    },
};

type Adjacency = Record<string, { id: string; weight: number }[]>;

function buildAdjacency(edges: GraphEdge[], undirected = true): Adjacency {
    const adj: Adjacency = {};
    const add = (from: string, to: string, weight: number) => {
        if (!adj[from]) adj[from] = [];
        adj[from].push({ id: to, weight });
    };
    for (const e of edges) {
        add(e.from, e.to, e.weight);
        if (undirected) add(e.to, e.from, e.weight);
    }
    for (const key of Object.keys(adj)) {
        adj[key].sort((a, b) => a.id.localeCompare(b.id));
    }
    return adj;
}

function makeStep(
    partial: Omit<TraversalStep, 'visitedNodes'> & { visitedNodes: Set<string> }
): TraversalStep {
    return {
        ...partial,
        visitedNodes: [...partial.visitedNodes],
    };
}

export function runBFS(
    nodes: GraphNode[],
    edges: GraphEdge[],
    startId: string
): TraversalStep[] {
    const adj = buildAdjacency(edges);
    const visited = new Set<string>();
    const queue: string[] = [];
    const steps: TraversalStep[] = [];

    if (!nodes.find((n) => n.id === startId)) return steps;

    queue.push(startId);
    visited.add(startId);

    steps.push(
        makeStep({
            activeNode: startId,
            visitedNodes: visited,
            dataStructureState: [...queue],
            description: `BFS başladı: ${startId} kuyruğa eklendi. Kuyruk (FIFO) katman katman genişler.`,
        })
    );

    while (queue.length > 0) {
        const current = queue.shift()!;

        steps.push(
            makeStep({
                activeNode: current,
                visitedNodes: visited,
                dataStructureState: [...queue],
                description: `${current} kuyruktan çıkarıldı (dequeue). Ziyaret edilen: ${[...visited].join(', ')}.`,
            })
        );

        for (const neighbor of adj[current] ?? []) {
            if (!visited.has(neighbor.id)) {
                visited.add(neighbor.id);
                queue.push(neighbor.id);
                steps.push(
                    makeStep({
                        activeNode: neighbor.id,
                        visitedNodes: visited,
                        activeEdge: { from: current, to: neighbor.id },
                        dataStructureState: [...queue],
                        description: `Komşu ${neighbor.id} keşfedildi → kuyruğa eklendi (enqueue).`,
                    })
                );
            }
        }
    }

    steps.push(
        makeStep({
            activeNode: startId,
            visitedNodes: visited,
            dataStructureState: [],
            description: `BFS tamamlandı. ${visited.size} düğüm ziyaret edildi. Zaman karmaşıklığı: O(V + E).`,
            finished: true,
        })
    );

    return steps;
}

export function runDFS(
    nodes: GraphNode[],
    edges: GraphEdge[],
    startId: string
): TraversalStep[] {
    const adj = buildAdjacency(edges);
    const visited = new Set<string>();
    const stack: string[] = [];
    const steps: TraversalStep[] = [];

    if (!nodes.find((n) => n.id === startId)) return steps;

    stack.push(startId);

    steps.push(
        makeStep({
            activeNode: startId,
            visitedNodes: visited,
            dataStructureState: [...stack],
            description: `DFS başladı: ${startId} yığına itildi. Stack (LIFO) derinlemesine keşif yapar.`,
        })
    );

    while (stack.length > 0) {
        const current = stack.pop()!;

        if (visited.has(current)) {
            steps.push(
                makeStep({
                    activeNode: current,
                    visitedNodes: visited,
                    dataStructureState: [...stack],
                    description: `${current} zaten ziyaret edilmiş — atlanıyor.`,
                })
            );
            continue;
        }

        visited.add(current);
        steps.push(
            makeStep({
                activeNode: current,
                visitedNodes: visited,
                dataStructureState: [...stack],
                description: `${current} yığından çıkarıldı (pop) ve ziyaret edildi.`,
            })
        );

        const neighbors = [...(adj[current] ?? [])].reverse();
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor.id)) {
                stack.push(neighbor.id);
                steps.push(
                    makeStep({
                        activeNode: neighbor.id,
                        visitedNodes: visited,
                        activeEdge: { from: current, to: neighbor.id },
                        dataStructureState: [...stack],
                        description: `Komşu ${neighbor.id} yığına itildi (push) — derinlemesine devam.`,
                    })
                );
            }
        }
    }

    steps.push(
        makeStep({
            activeNode: startId,
            visitedNodes: visited,
            dataStructureState: [],
            description: `DFS tamamlandı. ${visited.size} düğüm ziyaret edildi. Zaman karmaşıklığı: O(V + E).`,
            finished: true,
        })
    );

    return steps;
}

export function runDijkstra(
    nodes: GraphNode[],
    edges: GraphEdge[],
    startId: string,
    targetId: string | null
): TraversalStep[] {
    const adj = buildAdjacency(edges);
    const steps: TraversalStep[] = [];
    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const visited = new Set<string>();

    for (const node of nodes) {
        distances[node.id] = Infinity;
        previous[node.id] = null;
    }
    distances[startId] = 0;

    if (!nodes.find((n) => n.id === startId)) return steps;

    const pq: { id: string; dist: number }[] = [{ id: startId, dist: 0 }];

    steps.push(
        makeStep({
            activeNode: startId,
            visitedNodes: visited,
            dataStructureState: pq.map((p) => `${p.id}(${p.dist === Infinity ? '∞' : p.dist})`),
            description: `Dijkstra başladı: ${startId} mesafe 0. Min-Priority Queue kullanılıyor.`,
            distances: { ...distances },
        })
    );

    while (pq.length > 0) {
        pq.sort((a, b) => a.dist - b.dist || a.id.localeCompare(b.id));
        const current = pq.shift()!;

        if (visited.has(current.id)) continue;
        if (current.dist > distances[current.id]) continue;

        visited.add(current.id);

        steps.push(
            makeStep({
                activeNode: current.id,
                visitedNodes: visited,
                dataStructureState: pq.map((p) => `${p.id}(${p.dist === Infinity ? '∞' : p.dist})`),
                description: `${current.id} seçildi (min mesafe: ${distances[current.id]}). Kesin en kısa yol bulundu.`,
                distances: { ...distances },
            })
        );

        if (targetId && current.id === targetId) {
            const path = reconstructPath(previous, startId, targetId);
            steps.push(
                makeStep({
                    activeNode: targetId,
                    visitedNodes: visited,
                    dataStructureState: pq.map((p) => `${p.id}(${p.dist === Infinity ? '∞' : p.dist})`),
                    description: `Hedef ${targetId} bulundu! En kısa mesafe: ${distances[targetId]}.`,
                    distances: { ...distances },
                    pathNodes: path,
                    finished: true,
                })
            );
            return steps;
        }

        for (const neighbor of adj[current.id] ?? []) {
            const alt = distances[current.id] + neighbor.weight;
            if (alt < distances[neighbor.id]) {
                distances[neighbor.id] = alt;
                previous[neighbor.id] = current.id;
                pq.push({ id: neighbor.id, dist: alt });
                steps.push(
                    makeStep({
                        activeNode: neighbor.id,
                        visitedNodes: visited,
                        activeEdge: { from: current.id, to: neighbor.id },
                        dataStructureState: pq.map((p) => `${p.id}(${p.dist === Infinity ? '∞' : p.dist})`),
                        description: `${current.id} → ${neighbor.id}: mesafe güncellendi ${alt} (kenar ağırlığı ${neighbor.weight}).`,
                        distances: { ...distances },
                    })
                );
            }
        }
    }

    steps.push(
        makeStep({
            activeNode: startId,
            visitedNodes: visited,
            dataStructureState: [],
            description: `Dijkstra tamamlandı. Zaman karmaşıklığı: O(E log V) (priority queue ile).`,
            distances: { ...distances },
            finished: true,
        })
    );

    return steps;
}

function reconstructPath(
    previous: Record<string, string | null>,
    start: string,
    target: string
): string[] {
    const path: string[] = [];
    let current: string | null = target;
    while (current !== null) {
        path.unshift(current);
        current = previous[current];
    }
    return path[0] === start ? path : [];
}

export function runTraversal(
    algorithm: GraphAlgorithm,
    nodes: GraphNode[],
    edges: GraphEdge[],
    startId: string,
    targetId: string | null
): TraversalStep[] {
    switch (algorithm) {
        case 'bfs':
            return runBFS(nodes, edges, startId);
        case 'dfs':
            return runDFS(nodes, edges, startId);
        case 'dijkstra':
            return runDijkstra(nodes, edges, startId, targetId);
    }
}

export function getAlgorithmInfo(algorithm: GraphAlgorithm): {
    title: string;
    complexity: string;
    structure: string;
    summary: string;
} {
    switch (algorithm) {
        case 'bfs':
            return {
                title: 'Breadth-First Search (BFS)',
                complexity: 'O(V + E) zaman, O(V) alan',
                structure: 'Queue (FIFO)',
                summary: 'Başlangıçtan itibaren en yakın komşuları katman katman keşfeder. En kısa yol (ağırlıksız) için idealdir.',
            };
        case 'dfs':
            return {
                title: 'Depth-First Search (DFS)',
                complexity: 'O(V + E) zaman, O(V) alan',
                structure: 'Stack (LIFO) / Recursion',
                summary: 'Bir dal boyunca derinlemesine ilerler, geri dönüş yaparak tüm düğümleri keşfeder.',
            };
        case 'dijkstra':
            return {
                title: "Dijkstra's Algorithm",
                complexity: 'O(E log V) zaman (min-heap ile)',
                structure: 'Min-Priority Queue',
                summary: 'Negatif ağırlık olmayan grafiklerde tek kaynaktan en kısa yolları bulur.',
            };
    }
}

export function getSpeedMs(speed: GraphSpeed): number {
    switch (speed) {
        case 'slow':
            return 900;
        case 'fast':
            return 250;
        default:
            return 500;
    }
}

export function getEdgeKey(from: string, to: string): string {
    return [from, to].sort().join('-');
}
