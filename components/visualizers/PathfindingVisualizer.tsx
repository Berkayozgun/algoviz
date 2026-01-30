'use client';

import Grid from '@/components/Grid';
import { useGridStore } from '@/store/useGridStore';
import { bfs, astar, recursiveDivision } from '@/lib/algorithms';
import { cn } from '@/lib/utils';
import { ROWS, COLS } from '@/constants/grid';

export default function PathfindingVisualizer() {
    const {
        grid, startNode, endNode, resetGrid, setNodeStatus,
        isRunning, setIsRunning, clearPath, speed, setSpeed,
        selectedAlgorithm, setAlgorithm, stats, setStats
    } = useGridStore();

    const getDelay = () => {
        switch (speed) {
            case 'fast': return 10;
            case 'medium': return 25;
            case 'slow': return 50;
            default: return 10;
        }
    };

    const handleStartVisualization = async () => {
        if (isRunning) return;

        clearPath();
        setIsRunning(true);

        const startTime = performance.now();
        const result = selectedAlgorithm === 'astar'
            ? astar(grid, startNode, endNode)
            : bfs(grid, startNode, endNode);

        const { visitedNodesInOrder, shortestPath } = result;
        const delay = getDelay();

        for (let i = 0; i < visitedNodesInOrder.length; i++) {
            const node = visitedNodesInOrder[i];
            if (
                (node.row === startNode.row && node.col === startNode.col) ||
                (node.row === endNode.row && node.col === endNode.col)
            ) continue;

            setNodeStatus(node.row, node.col, 'visited');
            await new Promise((resolve) => setTimeout(resolve, delay));
        }

        if (shortestPath.length > 0) {
            for (let i = 0; i < shortestPath.length; i++) {
                const node = shortestPath[i];
                if (
                    (node.row === startNode.row && node.col === startNode.col) ||
                    (node.row === endNode.row && node.col === endNode.col)
                ) continue;

                setNodeStatus(node.row, node.col, 'path');
                await new Promise((resolve) => setTimeout(resolve, delay * 3));
            }
        }

        const endTime = performance.now();
        setStats({
            visitedCount: visitedNodesInOrder.length,
            pathLength: shortestPath.length,
            timeElapsed: Math.round(endTime - startTime),
        });

        setIsRunning(false);
    };

    const handleGenerateMaze = async () => {
        if (isRunning) return;

        resetGrid();
        setIsRunning(true);

        const walls = recursiveDivision(COLS, ROWS, startNode, endNode);
        const delay = 10;

        for (const wall of walls) {
            setNodeStatus(wall.row, wall.col, 'wall');
            await new Promise((resolve) => setTimeout(resolve, delay));
        }

        setIsRunning(false);
    };

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Controls */}
            <div className="w-full flex flex-wrap items-center justify-center gap-4 p-4 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl">
                <select
                    value={selectedAlgorithm}
                    onChange={(e) => setAlgorithm(e.target.value as any)}
                    disabled={isRunning}
                    className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                >
                    <option value="dijkstra">Dijkstra (BFS)</option>
                    <option value="astar">A-Star Algorithm</option>
                </select>

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
                    onClick={handleGenerateMaze}
                    disabled={isRunning}
                    className="px-4 py-2 bg-slate-800 hover:bg-violet-600/20 disabled:opacity-50 text-slate-200 rounded-xl text-sm font-medium transition-all border border-slate-700 hover:border-violet-500/50"
                >
                    Generate Maze
                </button>

                <button
                    onClick={clearPath}
                    disabled={isRunning}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-sm font-medium transition-all border border-slate-700"
                >
                    Clear Path
                </button>

                <button
                    onClick={resetGrid}
                    disabled={isRunning}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-sm font-medium transition-all border border-slate-700"
                >
                    Reset All
                </button>

                <button
                    onClick={handleStartVisualization}
                    disabled={isRunning}
                    className="px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 active:scale-95"
                >
                    Run Algorithm
                </button>
            </div>

            {/* Grid */}
            <Grid />

            {/* Statistics Bar */}
            <div className="w-full max-w-3xl bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 flex justify-around items-center backdrop-blur-sm shadow-xl">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Visited Nodes</span>
                    <span className="text-xl font-mono font-black text-cyan-400">{stats.visitedCount}</span>
                </div>
                <div className="w-px h-8 bg-slate-800"></div>
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Path Length</span>
                    <span className="text-xl font-mono font-black text-amber-400">{stats.pathLength}</span>
                </div>
                <div className="w-px h-8 bg-slate-800"></div>
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Time Elapsed</span>
                    <span className="text-xl font-mono font-black text-rose-400">{stats.timeElapsed}<span className="text-xs ml-1 opacity-50">ms</span></span>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-500 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> Start
                </span>
                <span className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-rose-500 rounded-sm shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div> End
                </span>
                <span className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-700 rounded-sm"></div> Wall
                </span>
                <span className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-cyan-500/30 rounded-sm"></div> Visited
                </span>
                <span className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-amber-400 rounded-sm"></div> Path
                </span>
            </div>
        </div>
    );
}
