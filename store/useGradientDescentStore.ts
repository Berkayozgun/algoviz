import { create } from 'zustand';
import {
    type SurfaceType,
    type OptimizerType,
    type Point2D,
    type HistoryPoint,
    type OptimizerState,
    DEFAULT_START_POINTS,
    SURFACE_DOMAINS,
    getLoss,
    optimizerStep,
} from '@/lib/optimization';

const MAX_ITERATIONS = 250;

interface GradientDescentState {
    surfaceType: SurfaceType;
    optimizer: OptimizerType;
    learningRate: number;
    momentum: number;
    currentPoint: Point2D;
    startPoint: Point2D;
    history: HistoryPoint[];
    isRunning: boolean;
    iteration: number;
    lastStepSize: number;
    optimizerState: OptimizerState;
    isFinished: boolean;

    setSurfaceType: (surface: SurfaceType) => void;
    setOptimizer: (optimizer: OptimizerType) => void;
    setLearningRate: (rate: number) => void;
    setMomentum: (momentum: number) => void;
    setStartingPoint: (x: number, y: number) => void;
    randomStart: () => void;
    step: () => void;
    reset: () => void;
    setIsRunning: (running: boolean) => void;
}

function clampToDomain(point: Point2D, surface: SurfaceType): Point2D {
    const domain = SURFACE_DOMAINS[surface];
    return {
        x: Math.max(domain.xMin, Math.min(domain.xMax, point.x)),
        y: Math.max(domain.yMin, Math.min(domain.yMax, point.y)),
    };
}

function createHistoryEntry(surface: SurfaceType, point: Point2D): HistoryPoint {
    return { ...point, loss: getLoss(surface, point) };
}

export const useGradientDescentStore = create<GradientDescentState>((set, get) => ({
    surfaceType: 'convex',
    optimizer: 'sgd',
    learningRate: 0.05,
    momentum: 0.9,
    currentPoint: DEFAULT_START_POINTS.convex,
    startPoint: DEFAULT_START_POINTS.convex,
    history: [createHistoryEntry('convex', DEFAULT_START_POINTS.convex)],
    isRunning: false,
    iteration: 0,
    lastStepSize: 0,
    optimizerState: {},
    isFinished: false,

    setSurfaceType: (surface) => {
        const start = DEFAULT_START_POINTS[surface];
        set({
            surfaceType: surface,
            currentPoint: start,
            startPoint: start,
            history: [createHistoryEntry(surface, start)],
            iteration: 0,
            lastStepSize: 0,
            optimizerState: {},
            isFinished: false,
            isRunning: false,
        });
    },

    setOptimizer: (optimizer) => {
        set({
            optimizer,
            optimizerState: {},
            iteration: 0,
            lastStepSize: 0,
            isFinished: false,
            isRunning: false,
            history: [createHistoryEntry(get().surfaceType, get().currentPoint)],
        });
    },

    setLearningRate: (rate) => set({ learningRate: rate }),

    setMomentum: (momentum) => set({ momentum }),

    setStartingPoint: (x, y) => {
        const { surfaceType, isRunning } = get();
        if (isRunning) return;

        const point = clampToDomain({ x, y }, surfaceType);
        set({
            currentPoint: point,
            startPoint: point,
            history: [createHistoryEntry(surfaceType, point)],
            iteration: 0,
            lastStepSize: 0,
            optimizerState: {},
            isFinished: false,
        });
    },

    randomStart: () => {
        const { surfaceType, isRunning } = get();
        if (isRunning) return;

        const domain = SURFACE_DOMAINS[surfaceType];
        const point = {
            x: domain.xMin + Math.random() * (domain.xMax - domain.xMin),
            y: domain.yMin + Math.random() * (domain.yMax - domain.yMin),
        };

        get().setStartingPoint(point.x, point.y);
    },

    step: () => {
        const state = get();
        if (state.isFinished || state.iteration >= MAX_ITERATIONS) {
            set({ isFinished: true, isRunning: false });
            return;
        }

        const result = optimizerStep(
            state.optimizer,
            state.surfaceType,
            state.currentPoint,
            state.learningRate,
            state.momentum,
            state.optimizerState
        );

        const clamped = clampToDomain(result.point, state.surfaceType);
        const newIteration = state.iteration + 1;
        const finished = newIteration >= MAX_ITERATIONS;

        set({
            currentPoint: clamped,
            history: [...state.history, createHistoryEntry(state.surfaceType, clamped)],
            iteration: newIteration,
            lastStepSize: result.stepSize,
            optimizerState: result.state,
            isFinished: finished,
            isRunning: finished ? false : state.isRunning,
        });
    },

    reset: () => {
        const { surfaceType, startPoint } = get();
        set({
            currentPoint: startPoint,
            history: [createHistoryEntry(surfaceType, startPoint)],
            iteration: 0,
            lastStepSize: 0,
            optimizerState: {},
            isFinished: false,
            isRunning: false,
        });
    },

    setIsRunning: (running) => set({ isRunning: running }),
}));
