import { create } from 'zustand';

export interface Point {
    id: number;
    x: number;
    y: number;
    clusterId: number | null; // null = unassigned (gray)
}

export interface Centroid {
    id: number;
    x: number;
    y: number;
    color: string;
}

interface KMeansState {
    points: Point[];
    centroids: Centroid[];
    k: number;
    iteration: number;
    isRunning: boolean;
    isConverged: boolean;

    // Actions
    generateData: (count: number) => void;
    setK: (k: number) => void;
    initCentroids: () => void;
    assignPoints: () => boolean; // returns true if any point changed
    updateCentroids: () => boolean; // returns true if any centroid moved
    step: () => void;
    reset: () => void;
    setIsRunning: (running: boolean) => void;
}

const COLORS = [
    '#ef4444', // red
    '#3b82f6', // blue
    '#22c55e', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
];

const CANVAS_SIZE = 400;

function distance(p1: { x: number; y: number }, p2: { x: number; y: number }) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

let pointId = 0;

export const useKMeansStore = create<KMeansState>((set, get) => ({
    points: [],
    centroids: [],
    k: 3,
    iteration: 0,
    isRunning: false,
    isConverged: false,

    generateData: (count: number) => {
        pointId = 0;
        const points: Point[] = [];

        // Generate clustered data for more interesting visualization
        const numClusters = 3 + Math.floor(Math.random() * 3); // 3-5 natural clusters
        const clusterCenters = Array.from({ length: numClusters }, () => ({
            x: 50 + Math.random() * (CANVAS_SIZE - 100),
            y: 50 + Math.random() * (CANVAS_SIZE - 100),
        }));

        for (let i = 0; i < count; i++) {
            const cluster = clusterCenters[Math.floor(Math.random() * numClusters)];
            const spread = 40 + Math.random() * 30;
            points.push({
                id: ++pointId,
                x: Math.max(10, Math.min(CANVAS_SIZE - 10, cluster.x + (Math.random() - 0.5) * spread)),
                y: Math.max(10, Math.min(CANVAS_SIZE - 10, cluster.y + (Math.random() - 0.5) * spread)),
                clusterId: null,
            });
        }

        set({ points, centroids: [], iteration: 0, isConverged: false });
    },

    setK: (k: number) => set({ k }),

    initCentroids: () => {
        const { k, points } = get();
        if (points.length === 0) return;

        // Random initialization from data points
        const shuffled = [...points].sort(() => Math.random() - 0.5);
        const centroids: Centroid[] = [];

        for (let i = 0; i < k; i++) {
            const point = shuffled[i] || shuffled[0];
            centroids.push({
                id: i,
                x: point.x + (Math.random() - 0.5) * 20,
                y: point.y + (Math.random() - 0.5) * 20,
                color: COLORS[i % COLORS.length],
            });
        }

        set({ centroids, iteration: 0, isConverged: false });
    },

    assignPoints: () => {
        const { points, centroids } = get();
        if (centroids.length === 0) return false;

        let changed = false;
        const newPoints = points.map((point) => {
            let minDist = Infinity;
            let closestId = 0;

            centroids.forEach((centroid) => {
                const dist = distance(point, centroid);
                if (dist < minDist) {
                    minDist = dist;
                    closestId = centroid.id;
                }
            });

            if (point.clusterId !== closestId) {
                changed = true;
                return { ...point, clusterId: closestId };
            }
            return point;
        });

        set({ points: newPoints });
        return changed;
    },

    updateCentroids: () => {
        const { points, centroids } = get();
        let moved = false;
        const threshold = 0.5;

        const newCentroids = centroids.map((centroid) => {
            const clusterPoints = points.filter((p) => p.clusterId === centroid.id);

            if (clusterPoints.length === 0) {
                return centroid;
            }

            const avgX = clusterPoints.reduce((sum, p) => sum + p.x, 0) / clusterPoints.length;
            const avgY = clusterPoints.reduce((sum, p) => sum + p.y, 0) / clusterPoints.length;

            if (Math.abs(centroid.x - avgX) > threshold || Math.abs(centroid.y - avgY) > threshold) {
                moved = true;
                return { ...centroid, x: avgX, y: avgY };
            }

            return centroid;
        });

        set({ centroids: newCentroids });
        return moved;
    },

    step: () => {
        const state = get();
        if (state.isConverged) return;

        if (state.centroids.length === 0) {
            get().initCentroids();
            return;
        }

        // Assignment step
        const pointsChanged = get().assignPoints();

        // Update step
        const centroidsMoved = get().updateCentroids();

        set((s) => ({
            iteration: s.iteration + 1,
            isConverged: !pointsChanged && !centroidsMoved,
        }));
    },

    reset: () => {
        set({
            points: [],
            centroids: [],
            iteration: 0,
            isRunning: false,
            isConverged: false,
        });
    },

    setIsRunning: (isRunning) => set({ isRunning }),
}));
