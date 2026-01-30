'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCPUSchedulerStore, Process, GanttBlock } from '@/store/useCPUSchedulerStore';
import { cn } from '@/lib/utils';

const ProcessRow = ({ process, onRemove, disabled }: { process: Process; onRemove: () => void; disabled: boolean }) => (
    <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700"
    >
        <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: process.color }}
        >
            {process.id}
        </div>
        <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
            <div>
                <span className="text-slate-500">Arrival:</span>
                <span className="ml-1 text-white font-mono">{process.arrivalTime}</span>
            </div>
            <div>
                <span className="text-slate-500">Burst:</span>
                <span className="ml-1 text-white font-mono">{process.burstTime}</span>
            </div>
            <div>
                <span className="text-slate-500">Remaining:</span>
                <span className="ml-1 text-amber-400 font-mono">{process.remainingTime}</span>
            </div>
        </div>
        <div className={cn(
            "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
            process.state === 'running' && "bg-emerald-500/20 text-emerald-400",
            process.state === 'waiting' && "bg-amber-500/20 text-amber-400",
            process.state === 'completed' && "bg-cyan-500/20 text-cyan-400"
        )}>
            {process.state}
        </div>
        <button
            onClick={onRemove}
            disabled={disabled}
            className="text-slate-500 hover:text-rose-400 disabled:opacity-30 transition-colors"
        >
            ✕
        </button>
    </motion.div>
);

const GanttChart = ({ blocks, maxTime }: { blocks: GanttBlock[]; maxTime: number }) => {
    if (blocks.length === 0) {
        return (
            <div className="h-20 flex items-center justify-center text-slate-500 text-sm">
                Run simulation to see Gantt Chart
            </div>
        );
    }

    const totalWidth = Math.max(maxTime, 10);

    return (
        <div className="space-y-2">
            <div className="flex h-12 bg-slate-900 rounded-lg overflow-hidden">
                {blocks.map((block, i) => (
                    <motion.div
                        key={i}
                        initial={{ width: 0 }}
                        animate={{ width: `${((block.endTime - block.startTime) / totalWidth) * 100}%` }}
                        transition={{ delay: i * 0.1, duration: 0.3 }}
                        className="h-full flex items-center justify-center text-xs font-bold text-white border-r border-slate-800"
                        style={{ backgroundColor: block.color }}
                    >
                        {block.processId}
                    </motion.div>
                ))}
            </div>
            <div className="flex text-[10px] text-slate-500 font-mono">
                {blocks.map((block, i) => (
                    <div
                        key={i}
                        style={{ width: `${((block.endTime - block.startTime) / totalWidth) * 100}%` }}
                        className="text-left pl-1"
                    >
                        {block.startTime}
                    </div>
                ))}
                {blocks.length > 0 && (
                    <span className="ml-auto">{blocks[blocks.length - 1].endTime}</span>
                )}
            </div>
        </div>
    );
};

export default function CPUSchedulerVisualizer() {
    const {
        processes,
        ganttChart,
        currentTime,
        isRunning,
        isComplete,
        algorithm,
        timeQuantum,
        avgWaitingTime,
        avgTurnaroundTime,
        addProcess,
        removeProcess,
        setAlgorithm,
        setTimeQuantum,
        setIsRunning,
        setIsComplete,
        setCurrentTime,
        updateProcess,
        addGanttBlock,
        calculateStats,
        resetSimulation,
        clearAll,
    } = useCPUSchedulerStore();

    const [arrivalTime, setArrivalTime] = useState(0);
    const [burstTime, setBurstTime] = useState(3);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const runFCFS = useCallback(async () => {
        const sorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
        let time = 0;

        for (const process of sorted) {
            if (time < process.arrivalTime) time = process.arrivalTime;

            updateProcess(process.id, { state: 'running', startTime: time });

            addGanttBlock({
                processId: process.id,
                startTime: time,
                endTime: time + process.burstTime,
                color: process.color,
            });

            time += process.burstTime;
            setCurrentTime(time);

            const waitingTime = time - process.arrivalTime - process.burstTime;
            const turnaroundTime = time - process.arrivalTime;

            updateProcess(process.id, {
                state: 'completed',
                finishTime: time,
                remainingTime: 0,
                waitingTime,
                turnaroundTime,
            });

            await new Promise((r) => setTimeout(r, 300));
        }

        calculateStats();
        setIsComplete(true);
        setIsRunning(false);
    }, [processes, updateProcess, addGanttBlock, setCurrentTime, calculateStats, setIsComplete, setIsRunning]);

    const runSJF = useCallback(async () => {
        const remaining = [...processes].map((p) => ({ ...p }));
        let time = 0;
        let completed = 0;

        while (completed < remaining.length) {
            const available = remaining.filter((p) => p.arrivalTime <= time && p.remainingTime > 0);

            if (available.length === 0) {
                time++;
                setCurrentTime(time);
                continue;
            }

            const shortest = available.reduce((min, p) => (p.remainingTime < min.remainingTime ? p : min));

            updateProcess(shortest.id, { state: 'running', startTime: shortest.startTime ?? time });

            addGanttBlock({
                processId: shortest.id,
                startTime: time,
                endTime: time + shortest.remainingTime,
                color: shortest.color,
            });

            time += shortest.remainingTime;
            setCurrentTime(time);

            const proc = remaining.find((p) => p.id === shortest.id)!;
            proc.remainingTime = 0;
            completed++;

            const waitingTime = time - proc.arrivalTime - proc.burstTime;
            const turnaroundTime = time - proc.arrivalTime;

            updateProcess(shortest.id, {
                state: 'completed',
                finishTime: time,
                remainingTime: 0,
                waitingTime,
                turnaroundTime,
            });

            await new Promise((r) => setTimeout(r, 300));
        }

        calculateStats();
        setIsComplete(true);
        setIsRunning(false);
    }, [processes, updateProcess, addGanttBlock, setCurrentTime, calculateStats, setIsComplete, setIsRunning]);

    const runRoundRobin = useCallback(async () => {
        const queue: Process[] = [];
        const remaining = new Map(processes.map((p) => [p.id, p.burstTime]));
        let time = 0;
        let arrivals = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);

        // Add initial arrivals
        while (arrivals.length && arrivals[0].arrivalTime <= time) {
            queue.push(arrivals.shift()!);
        }

        while (queue.length > 0 || arrivals.length > 0) {
            if (queue.length === 0 && arrivals.length > 0) {
                time = arrivals[0].arrivalTime;
                while (arrivals.length && arrivals[0].arrivalTime <= time) {
                    queue.push(arrivals.shift()!);
                }
            }

            if (queue.length === 0) break;

            const current = queue.shift()!;
            const rem = remaining.get(current.id)!;
            const execTime = Math.min(rem, timeQuantum);

            updateProcess(current.id, { state: 'running' });

            addGanttBlock({
                processId: current.id,
                startTime: time,
                endTime: time + execTime,
                color: current.color,
            });

            time += execTime;
            setCurrentTime(time);
            remaining.set(current.id, rem - execTime);
            updateProcess(current.id, { remainingTime: rem - execTime });

            // Check for new arrivals during execution
            while (arrivals.length && arrivals[0].arrivalTime <= time) {
                queue.push(arrivals.shift()!);
            }

            if (remaining.get(current.id)! > 0) {
                queue.push(current);
                updateProcess(current.id, { state: 'waiting' });
            } else {
                const waitingTime = time - current.arrivalTime - current.burstTime;
                const turnaroundTime = time - current.arrivalTime;
                updateProcess(current.id, {
                    state: 'completed',
                    finishTime: time,
                    waitingTime,
                    turnaroundTime,
                });
            }

            await new Promise((r) => setTimeout(r, 200));
        }

        calculateStats();
        setIsComplete(true);
        setIsRunning(false);
    }, [processes, timeQuantum, updateProcess, addGanttBlock, setCurrentTime, calculateStats, setIsComplete, setIsRunning]);

    const startSimulation = () => {
        if (processes.length === 0) return;
        resetSimulation();
        setIsRunning(true);

        setTimeout(() => {
            if (algorithm === 'fcfs') runFCFS();
            else if (algorithm === 'sjf') runSJF();
            else runRoundRobin();
        }, 100);
    };

    const handleAddProcess = () => {
        if (burstTime <= 0) return;
        addProcess(arrivalTime, burstTime);
        setArrivalTime((prev) => prev + 2);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl">
                <select
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value as any)}
                    disabled={isRunning}
                    className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                    <option value="fcfs">FCFS (First Come First Serve)</option>
                    <option value="sjf">SJF (Shortest Job First)</option>
                    <option value="roundRobin">Round Robin</option>
                </select>

                {algorithm === 'roundRobin' && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Quantum:</span>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={timeQuantum}
                            onChange={(e) => setTimeQuantum(parseInt(e.target.value) || 2)}
                            disabled={isRunning}
                            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-3 py-1 text-sm w-16"
                        />
                    </div>
                )}

                <button
                    onClick={startSimulation}
                    disabled={isRunning || processes.length === 0}
                    className="px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105"
                >
                    Run Simulation
                </button>

                <button
                    onClick={resetSimulation}
                    disabled={isRunning}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-sm font-medium transition-all border border-slate-700"
                >
                    Reset
                </button>

                <button
                    onClick={clearAll}
                    disabled={isRunning}
                    className="px-4 py-2 bg-slate-800 hover:bg-rose-600/20 disabled:opacity-50 text-slate-200 rounded-xl text-sm font-medium transition-all border border-slate-700 hover:border-rose-500/50"
                >
                    Clear All
                </button>
            </div>

            {/* Add Process */}
            <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500">Arrival Time:</label>
                    <input
                        type="number"
                        min="0"
                        value={arrivalTime}
                        onChange={(e) => setArrivalTime(parseInt(e.target.value) || 0)}
                        disabled={isRunning}
                        className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-3 py-1 text-sm w-20"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500">Burst Time:</label>
                    <input
                        type="number"
                        min="1"
                        value={burstTime}
                        onChange={(e) => setBurstTime(parseInt(e.target.value) || 1)}
                        disabled={isRunning}
                        className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-3 py-1 text-sm w-20"
                    />
                </div>
                <button
                    onClick={handleAddProcess}
                    disabled={isRunning}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all"
                >
                    + Add Process
                </button>
            </div>

            {/* Process List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
                <AnimatePresence>
                    {processes.map((process) => (
                        <ProcessRow
                            key={process.id}
                            process={process}
                            onRemove={() => removeProcess(process.id)}
                            disabled={isRunning}
                        />
                    ))}
                </AnimatePresence>
                {processes.length === 0 && (
                    <p className="text-center text-slate-500 text-sm py-4">Add processes to begin</p>
                )}
            </div>

            {/* Gantt Chart */}
            <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
                <h3 className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-3">Gantt Chart</h3>
                <GanttChart blocks={ganttChart} maxTime={currentTime || 10} />
            </div>

            {/* Statistics */}
            {isComplete && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-around p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl"
                >
                    <div className="text-center">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Avg Waiting Time</p>
                        <p className="text-2xl font-mono font-bold text-amber-400">{avgWaitingTime.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Avg Turnaround Time</p>
                        <p className="text-2xl font-mono font-bold text-cyan-400">{avgTurnaroundTime.toFixed(2)}</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
