import { create } from 'zustand';
import { GridType, NodeType, Point } from '../types/grid';
import { ROWS, COLS, INITIAL_START_NODE, INITIAL_END_NODE } from '../constants/grid';
import { hasPath } from '../lib/algorithms';

interface GridState {
    grid: GridType;
    startNode: Point;
    endNode: Point;
    isDragging: boolean;
    isRunning: boolean;
    speed: 'fast' | 'medium' | 'slow';
    selectedAlgorithm: 'dijkstra' | 'astar';
    stats: {
        visitedCount: number;
        pathLength: number;
        timeElapsed: number;
    };
    setDragging: (isDragging: boolean) => void;
    setIsRunning: (isRunning: boolean) => void;
    setSpeed: (speed: 'fast' | 'medium' | 'slow') => void;
    setAlgorithm: (algorithm: 'dijkstra' | 'astar') => void;
    setStats: (stats: { visitedCount: number; pathLength: number; timeElapsed: number }) => void;
    toggleWall: (row: number, col: number) => void;
    setNodeStatus: (row: number, col: number, type: NodeType) => void;
    moveStart: (row: number, col: number) => void;
    moveEnd: (row: number, col: number) => void;
    resetGrid: () => void;
    clearPath: () => void;
}

const createInitialGrid = (): GridType => {
    const grid: GridType = [];
    for (let row = 0; row < ROWS; row++) {
        const currentRow = [];
        for (let col = 0; col < COLS; col++) {
            let type: NodeType = 'empty';
            if (row === INITIAL_START_NODE.row && col === INITIAL_START_NODE.col) type = 'start';
            if (row === INITIAL_END_NODE.row && col === INITIAL_END_NODE.col) type = 'end';
            currentRow.push({ row, col, type });
        }
        grid.push(currentRow);
    }
    return grid;
};

export const useGridStore = create<GridState>((set) => ({
    grid: createInitialGrid(),
    startNode: INITIAL_START_NODE,
    endNode: INITIAL_END_NODE,
    isDragging: false,
    isRunning: false,
    speed: 'fast',
    selectedAlgorithm: 'dijkstra',
    stats: {
        visitedCount: 0,
        pathLength: 0,
        timeElapsed: 0,
    },
    setDragging: (isDragging) => set({ isDragging }),
    setIsRunning: (isRunning) => set({ isRunning }),
    setSpeed: (speed) => set({ speed }),
    setAlgorithm: (selectedAlgorithm) => set({ selectedAlgorithm }),
    setStats: (stats) => set({ stats }),
    toggleWall: (row, col) =>
        set((state) => {
            if (state.isRunning) return state;

            const node = state.grid[row][col];
            if (node.type === 'start' || node.type === 'end' || node.type === 'visited' || node.type === 'path') return state;

            // If turning into a wall, check if path still exists
            if (node.type === 'empty') {
                const tempGrid = state.grid.map((r) => r.map((n) => ({ ...n })));
                tempGrid[row][col].type = 'wall';
                if (!hasPath(tempGrid, state.startNode, state.endNode)) {
                    return state; // Prevent blocking the path
                }
                return { grid: tempGrid };
            } else {
                // Turning wall into empty is always safe
                const newGrid = state.grid.map((r) => r.map((n) => ({ ...n })));
                newGrid[row][col].type = 'empty';
                return { grid: newGrid };
            }
        }),
    setNodeStatus: (row, col, type) =>
        set((state) => {
            const newGrid = [...state.grid];
            newGrid[row] = [...newGrid[row]];
            newGrid[row][col] = { ...newGrid[row][col], type };
            return { grid: newGrid };
        }),
    moveStart: (row, col) =>
        set((state) => {
            if (state.grid[row][col].type === 'wall') return state;

            const tempGrid = state.grid.map((r) =>
                r.map((node) => {
                    if (node.type === 'start') return { ...node, type: 'empty' as NodeType };
                    if (node.row === row && node.col === col) return { ...node, type: 'start' as NodeType };
                    return { ...node };
                })
            );

            if (!hasPath(tempGrid, { row, col }, state.endNode)) {
                return state;
            }

            return { grid: tempGrid, startNode: { row, col } };
        }),
    moveEnd: (row, col) =>
        set((state) => {
            if (state.grid[row][col].type === 'wall') return state;

            const tempGrid = state.grid.map((r) =>
                r.map((node) => {
                    if (node.type === 'end') return { ...node, type: 'empty' as NodeType };
                    if (node.row === row && node.col === col) return { ...node, type: 'end' as NodeType };
                    return { ...node };
                })
            );

            if (!hasPath(tempGrid, state.startNode, { row, col })) {
                return state;
            }

            return { grid: tempGrid, endNode: { row, col } };
        }),
    resetGrid: () =>
        set({
            grid: createInitialGrid(),
            startNode: INITIAL_START_NODE,
            endNode: INITIAL_END_NODE,
            isRunning: false,
            stats: { visitedCount: 0, pathLength: 0, timeElapsed: 0 },
        }),
    clearPath: () =>
        set((state) => ({
            grid: state.grid.map((r) =>
                r.map((node) => {
                    if (node.type === 'visited' || node.type === 'path') {
                        return { ...node, type: 'empty' as NodeType };
                    }
                    return node;
                })
            ),
            stats: { visitedCount: 0, pathLength: 0, timeElapsed: 0 },
        })),
}));
