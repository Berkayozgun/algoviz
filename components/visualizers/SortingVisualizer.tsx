'use client';

import { motion } from 'framer-motion';
import { useSortingStore, BarState } from '@/store/useSortingStore';
import { bubbleSort, quickSort, mergeSort } from '@/lib/sortingAlgorithms';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

const getBarColor = (state: BarState): string => {
    switch (state) {
        case 'comparing':
            return 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]';
        case 'swapping':
            return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
        case 'sorted':
            return 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]';
        default:
            return 'bg-violet-500';
    }
};

export default function SortingVisualizer() {
    const {
        bars,
        barCount,
        speed,
        selectedAlgorithm,
        isRunning,
        setBarCount,
        setSpeed,
        setAlgorithm,
        setIsRunning,
        setIsSorted,
        updateBar,
        swapBars,
        setBars,
        generateRandomBars,
        resetBarStates,
    } = useSortingStore();

    const abortRef = useRef(false);

    const getDelay = () => {
        switch (speed) {
            case 'fast': return 5;
            case 'medium': return 30;
            case 'slow': return 100;
            default: return 30;
        }
    };

    const handleSort = async () => {
        if (isRunning) return;

        resetBarStates();
        setIsRunning(true);
        abortRef.current = false;

        const delayMs = getDelay();
        const barsCopy = [...bars];

        try {
            let generator;
            switch (selectedAlgorithm) {
                case 'bubble':
                    generator = bubbleSort(barsCopy, updateBar, swapBars, delayMs);
                    break;
                case 'quick':
                    generator = quickSort(barsCopy, updateBar, swapBars, delayMs);
                    break;
                case 'merge':
                    generator = mergeSort(barsCopy, updateBar, setBars, delayMs);
                    break;
            }

            for await (const _ of generator) {
                if (abortRef.current) break;
            }

            // Mark all as sorted
            if (!abortRef.current) {
                bars.forEach((_, i) => updateBar(i, { state: 'sorted' }));
                setIsSorted(true);
            }
        } catch (error) {
            console.error('Sorting error:', error);
        }

        setIsRunning(false);
    };

    const handleStop = () => {
        abortRef.current = true;
        setIsRunning(false);
    };

    const handleBarCountChange = (count: number) => {
        if (isRunning) return;
        setBarCount(count);
        const newBars = Array.from({ length: count }, (_, i) => ({
            id: i,
            value: Math.floor(Math.random() * 400) + 20,
            state: 'default' as BarState,
        }));
        setBars(newBars);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl">
                <select
                    value={selectedAlgorithm}
                    onChange={(e) => setAlgorithm(e.target.value as any)}
                    disabled={isRunning}
                    className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                >
                    <option value="bubble">Bubble Sort</option>
                    <option value="quick">Quick Sort</option>
                    <option value="merge">Merge Sort</option>
                </select>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Bars:</span>
                    <input
                        type="range"
                        min="10"
                        max="100"
                        value={barCount}
                        onChange={(e) => handleBarCountChange(parseInt(e.target.value))}
                        disabled={isRunning}
                        className="w-24 accent-violet-500"
                    />
                    <span className="text-xs text-slate-400 w-8">{barCount}</span>
                </div>

                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                    {(['slow', 'medium', 'fast'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setSpeed(s)}
                            disabled={isRunning}
                            className={cn(
                                "px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-all",
                                speed === s
                                    ? "bg-violet-600 text-white shadow-lg"
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <button
                    onClick={generateRandomBars}
                    disabled={isRunning}
                    className="px-4 py-2 bg-slate-800 hover:bg-violet-600/20 disabled:opacity-50 text-slate-200 rounded-xl text-sm font-medium transition-all border border-slate-700 hover:border-violet-500/50"
                >
                    Randomize
                </button>

                {isRunning ? (
                    <button
                        onClick={handleStop}
                        className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                    >
                        Stop
                    </button>
                ) : (
                    <button
                        onClick={handleSort}
                        className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 active:scale-95"
                    >
                        Start Sorting
                    </button>
                )}
            </div>

            {/* Bars Container */}
            <div className="flex items-end justify-center gap-[2px] h-[450px] p-6 bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
                {bars.map((bar, index) => (
                    <motion.div
                        key={bar.id}
                        layout
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className={cn(
                            'rounded-t-sm transition-colors duration-150',
                            getBarColor(bar.state)
                        )}
                        style={{
                            height: `${bar.value}px`,
                            width: `${Math.max(800 / bars.length - 2, 4)}px`,
                        }}
                    />
                ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-violet-500 rounded-sm"></div> Default
                </span>
                <span className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-rose-500 rounded-sm shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div> Comparing
                </span>
                <span className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-500 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> Swapping
                </span>
                <span className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-cyan-500 rounded-sm shadow-[0_0_8px_rgba(6,182,212,0.4)]"></div> Sorted
                </span>
            </div>
        </div>
    );
}
