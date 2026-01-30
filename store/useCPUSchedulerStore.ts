import { create } from 'zustand';

export interface Process {
    id: string;
    arrivalTime: number;
    burstTime: number;
    remainingTime: number;
    startTime: number | null;
    finishTime: number | null;
    waitingTime: number;
    turnaroundTime: number;
    state: 'waiting' | 'running' | 'completed';
    color: string;
}

export interface GanttBlock {
    processId: string;
    startTime: number;
    endTime: number;
    color: string;
}

interface CPUSchedulerState {
    processes: Process[];
    ganttChart: GanttBlock[];
    currentTime: number;
    isRunning: boolean;
    isComplete: boolean;
    algorithm: 'fcfs' | 'sjf' | 'roundRobin';
    timeQuantum: number;
    avgWaitingTime: number;
    avgTurnaroundTime: number;
    addProcess: (arrivalTime: number, burstTime: number) => void;
    removeProcess: (id: string) => void;
    setAlgorithm: (algorithm: 'fcfs' | 'sjf' | 'roundRobin') => void;
    setTimeQuantum: (quantum: number) => void;
    setIsRunning: (isRunning: boolean) => void;
    setIsComplete: (isComplete: boolean) => void;
    setCurrentTime: (time: number) => void;
    updateProcess: (id: string, updates: Partial<Process>) => void;
    addGanttBlock: (block: GanttBlock) => void;
    calculateStats: () => void;
    resetSimulation: () => void;
    clearAll: () => void;
}

const colors = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#3b82f6', '#ef4444', '#84cc16'];
let processCounter = 0;

export const useCPUSchedulerStore = create<CPUSchedulerState>((set, get) => ({
    processes: [],
    ganttChart: [],
    currentTime: 0,
    isRunning: false,
    isComplete: false,
    algorithm: 'fcfs',
    timeQuantum: 2,
    avgWaitingTime: 0,
    avgTurnaroundTime: 0,

    addProcess: (arrivalTime, burstTime) => {
        const id = `P${++processCounter}`;
        const color = colors[(processCounter - 1) % colors.length];
        const newProcess: Process = {
            id,
            arrivalTime,
            burstTime,
            remainingTime: burstTime,
            startTime: null,
            finishTime: null,
            waitingTime: 0,
            turnaroundTime: 0,
            state: 'waiting',
            color,
        };
        set((state) => ({ processes: [...state.processes, newProcess] }));
    },

    removeProcess: (id) => {
        set((state) => ({
            processes: state.processes.filter((p) => p.id !== id),
        }));
    },

    setAlgorithm: (algorithm) => set({ algorithm }),
    setTimeQuantum: (timeQuantum) => set({ timeQuantum }),
    setIsRunning: (isRunning) => set({ isRunning }),
    setIsComplete: (isComplete) => set({ isComplete }),
    setCurrentTime: (currentTime) => set({ currentTime }),

    updateProcess: (id, updates) => {
        set((state) => ({
            processes: state.processes.map((p) =>
                p.id === id ? { ...p, ...updates } : p
            ),
        }));
    },

    addGanttBlock: (block) => {
        set((state) => ({ ganttChart: [...state.ganttChart, block] }));
    },

    calculateStats: () => {
        const { processes } = get();
        const completed = processes.filter((p) => p.state === 'completed');
        if (completed.length === 0) return;

        const totalWaiting = completed.reduce((sum, p) => sum + p.waitingTime, 0);
        const totalTurnaround = completed.reduce((sum, p) => sum + p.turnaroundTime, 0);

        set({
            avgWaitingTime: totalWaiting / completed.length,
            avgTurnaroundTime: totalTurnaround / completed.length,
        });
    },

    resetSimulation: () => {
        set((state) => ({
            processes: state.processes.map((p) => ({
                ...p,
                remainingTime: p.burstTime,
                startTime: null,
                finishTime: null,
                waitingTime: 0,
                turnaroundTime: 0,
                state: 'waiting',
            })),
            ganttChart: [],
            currentTime: 0,
            isRunning: false,
            isComplete: false,
            avgWaitingTime: 0,
            avgTurnaroundTime: 0,
        }));
    },

    clearAll: () => {
        processCounter = 0;
        set({
            processes: [],
            ganttChart: [],
            currentTime: 0,
            isRunning: false,
            isComplete: false,
            avgWaitingTime: 0,
            avgTurnaroundTime: 0,
        });
    },
}));
