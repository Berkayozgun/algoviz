import { create } from 'zustand';

export interface Server {
    id: number;
    name: string;
    load: number; // 0-100
    connections: number;
    isHealthy: boolean;
    color: string;
}

export interface Request {
    id: number;
    targetServerId: number | null;
    phase: 'client' | 'lb' | 'server' | 'done';
    x: number;
    y: number;
}

interface LoadBalancerState {
    servers: Server[];
    requests: Request[];
    isRunning: boolean;
    algorithm: 'roundRobin' | 'random' | 'leastConnections';
    requestsPerSecond: number;
    roundRobinIndex: number;
    totalRequests: number;
    setServers: (servers: Server[]) => void;
    setIsRunning: (isRunning: boolean) => void;
    setAlgorithm: (algorithm: 'roundRobin' | 'random' | 'leastConnections') => void;
    setRequestsPerSecond: (rps: number) => void;
    addRequest: (request: Request) => void;
    updateRequest: (id: number, updates: Partial<Request>) => void;
    removeRequest: (id: number) => void;
    updateServerLoad: (id: number, delta: number) => void;
    toggleServerHealth: (id: number) => void;
    incrementRoundRobin: () => void;
    resetSimulation: () => void;
}

const initialServers: Server[] = [
    { id: 1, name: 'Server 1', load: 0, connections: 0, isHealthy: true, color: '#06b6d4' },
    { id: 2, name: 'Server 2', load: 0, connections: 0, isHealthy: true, color: '#8b5cf6' },
    { id: 3, name: 'Server 3', load: 0, connections: 0, isHealthy: true, color: '#f59e0b' },
    { id: 4, name: 'Server 4', load: 0, connections: 0, isHealthy: true, color: '#10b981' },
];

let requestIdCounter = 0;

export const useLoadBalancerStore = create<LoadBalancerState>((set, get) => ({
    servers: [...initialServers],
    requests: [],
    isRunning: false,
    algorithm: 'roundRobin',
    requestsPerSecond: 2,
    roundRobinIndex: 0,
    totalRequests: 0,

    setServers: (servers) => set({ servers }),
    setIsRunning: (isRunning) => set({ isRunning }),
    setAlgorithm: (algorithm) => set({ algorithm }),
    setRequestsPerSecond: (requestsPerSecond) => set({ requestsPerSecond }),

    addRequest: (request) =>
        set((state) => ({
            requests: [...state.requests, request],
            totalRequests: state.totalRequests + 1,
        })),

    updateRequest: (id, updates) =>
        set((state) => ({
            requests: state.requests.map((r) =>
                r.id === id ? { ...r, ...updates } : r
            ),
        })),

    removeRequest: (id) =>
        set((state) => ({
            requests: state.requests.filter((r) => r.id !== id),
        })),

    updateServerLoad: (id, delta) =>
        set((state) => ({
            servers: state.servers.map((s) =>
                s.id === id
                    ? {
                        ...s,
                        load: Math.max(0, Math.min(100, s.load + delta)),
                        connections: Math.max(0, s.connections + (delta > 0 ? 1 : -1)),
                    }
                    : s
            ),
        })),

    toggleServerHealth: (id) =>
        set((state) => ({
            servers: state.servers.map((s) =>
                s.id === id ? { ...s, isHealthy: !s.isHealthy, load: !s.isHealthy ? s.load : 0, connections: !s.isHealthy ? s.connections : 0 } : s
            ),
        })),

    incrementRoundRobin: () => {
        const healthyServers = get().servers.filter((s) => s.isHealthy);
        if (healthyServers.length === 0) return;

        let nextIndex = (get().roundRobinIndex + 1) % get().servers.length;
        while (!get().servers[nextIndex].isHealthy) {
            nextIndex = (nextIndex + 1) % get().servers.length;
        }
        set({ roundRobinIndex: nextIndex });
    },

    resetSimulation: () => {
        requestIdCounter = 0;
        set({
            servers: initialServers.map((s) => ({ ...s, load: 0, connections: 0, isHealthy: true })),
            requests: [],
            roundRobinIndex: 0,
            totalRequests: 0,
            isRunning: false,
        });
    },
}));

// Algorithm implementations
export const selectServer = (
    servers: Server[],
    algorithm: 'roundRobin' | 'random' | 'leastConnections',
    roundRobinIndex: number
): Server | null => {
    const healthyServers = servers.filter((s) => s.isHealthy);
    if (healthyServers.length === 0) return null;

    switch (algorithm) {
        case 'roundRobin': {
            return servers[roundRobinIndex] && servers[roundRobinIndex].isHealthy
                ? servers[roundRobinIndex]
                : healthyServers[0];
        }
        case 'random': {
            const randomIndex = Math.floor(Math.random() * healthyServers.length);
            return healthyServers[randomIndex];
        }
        case 'leastConnections': {
            return healthyServers.reduce((min, server) =>
                server.connections < min.connections ? server : min
            );
        }
        default:
            return healthyServers[0];
    }
};

export const createRequest = (): Request => {
    return {
        id: ++requestIdCounter,
        targetServerId: null,
        phase: 'client',
        x: 0,
        y: 0,
    };
};
