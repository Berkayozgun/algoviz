'use client';

import { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGraphStore, type GraphAlgorithm, type GraphPreset, type GraphSpeed } from '@/store/useGraphStore';
import {
    getAlgorithmInfo,
    getEdgeKey,
    getSpeedMs,
    PRESETS,
} from '@/lib/graph';
import { cn } from '@/lib/utils';

const CANVAS_WIDTH = 560;
const CANVAS_HEIGHT = 360;

const ALGORITHMS: { id: GraphAlgorithm; label: string }[] = [
    { id: 'bfs', label: 'BFS' },
    { id: 'dfs', label: 'DFS' },
    { id: 'dijkstra', label: 'Dijkstra' },
];

export default function GraphVisualizer() {
    const {
        nodes,
        edges,
        selectedAlgorithm,
        startNode,
        targetNode,
        currentStepIndex,
        steps,
        isPlaying,
        speed,
        selectionMode,
        setAlgorithm,
        setStartNode,
        setTargetNode,
        setSelectionMode,
        loadPreset,
        runTraversal,
        stepForward,
        stepBackward,
        play,
        pause,
        reset,
        setSpeed,
    } = useGraphStore();

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
    const algoInfo = getAlgorithmInfo(selectedAlgorithm);

    useEffect(() => {
        if (isPlaying && currentStepIndex < steps.length - 1) {
            intervalRef.current = setInterval(() => {
                const state = useGraphStore.getState();
                if (state.currentStepIndex < state.steps.length - 1) {
                    useGraphStore.setState({ currentStepIndex: state.currentStepIndex + 1 });
                } else {
                    useGraphStore.setState({ isPlaying: false });
                }
            }, getSpeedMs(speed));
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            if (currentStepIndex >= steps.length - 1 && steps.length > 0) {
                pause();
            }
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPlaying, speed, currentStepIndex, steps.length, pause]);

    const visitedSet = useMemo(
        () => new Set(currentStep?.visitedNodes ?? []),
        [currentStep]
    );

    const pathSet = useMemo(
        () => new Set(currentStep?.pathNodes ?? []),
        [currentStep]
    );

    const activeEdgeKey = currentStep?.activeEdge
        ? getEdgeKey(currentStep.activeEdge.from, currentStep.activeEdge.to)
        : null;

    const handleNodeClick = (id: string) => {
        if (steps.length > 0 && isPlaying) return;
        if (selectionMode === 'start') {
            setStartNode(id);
        } else {
            setTargetNode(id);
        }
    };

    const getNodeColor = (id: string) => {
        if (currentStep?.pathNodes?.includes(id)) return 'bg-indigo-500 border-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.6)]';
        if (currentStep?.activeNode === id) return 'bg-amber-500 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)]';
        if (visitedSet.has(id)) return 'bg-emerald-600/80 border-emerald-400';
        if (id === startNode) return 'bg-cyan-600/60 border-cyan-400';
        if (id === targetNode) return 'bg-violet-600/60 border-violet-400';
        return 'bg-slate-700 border-slate-500';
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1">
                    {ALGORITHMS.map((a) => (
                        <button
                            key={a.id}
                            onClick={() => setAlgorithm(a.id)}
                            disabled={isPlaying}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                                selectedAlgorithm === a.id
                                    ? 'bg-violet-600 text-white'
                                    : 'text-slate-400 hover:text-slate-200'
                            )}
                        >
                            {a.label}
                        </button>
                    ))}
                </div>

                <select
                    value={startNode}
                    onChange={(e) => setStartNode(e.target.value)}
                    disabled={isPlaying}
                    className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                >
                    {nodes.map((n) => (
                        <option key={n.id} value={n.id}>Start: {n.label}</option>
                    ))}
                </select>

                {selectedAlgorithm === 'dijkstra' && (
                    <select
                        value={targetNode ?? ''}
                        onChange={(e) => setTargetNode(e.target.value || null)}
                        disabled={isPlaying}
                        className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                    >
                        {nodes.map((n) => (
                            <option key={n.id} value={n.id}>Target: {n.label}</option>
                        ))}
                    </select>
                )}

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setSelectionMode('start')}
                        className={cn(
                            'px-2 py-1 rounded text-xs font-bold',
                            selectionMode === 'start' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                        )}
                    >
                        Tıkla: Start
                    </button>
                    <button
                        onClick={() => setSelectionMode('target')}
                        className={cn(
                            'px-2 py-1 rounded text-xs font-bold',
                            selectionMode === 'target' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'
                        )}
                    >
                        Tıkla: Target
                    </button>
                </div>

                <select
                    onChange={(e) => loadPreset(e.target.value as GraphPreset)}
                    defaultValue=""
                    disabled={isPlaying}
                    className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                >
                    <option value="" disabled>Graf seç</option>
                    {(Object.entries(PRESETS) as [GraphPreset, { label: string }][]).map(
                        ([key, p]) => (
                            <option key={key} value={key}>{p.label}</option>
                        )
                    )}
                </select>

                <button
                    onClick={runTraversal}
                    disabled={isPlaying}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
                >
                    Çalıştır
                </button>
                <button
                    onClick={play}
                    disabled={isPlaying || (steps.length === 0 && false)}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
                >
                    ▶
                </button>
                <button
                    onClick={pause}
                    disabled={!isPlaying}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
                >
                    ⏸
                </button>
                <button
                    onClick={stepBackward}
                    disabled={currentStepIndex <= 0}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
                >
                    ◀
                </button>
                <button
                    onClick={stepForward}
                    disabled={currentStepIndex >= steps.length - 1}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
                >
                    ▶|
                </button>
                <button
                    onClick={reset}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold"
                >
                    Sıfırla
                </button>

                <select
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value as GraphSpeed)}
                    className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                >
                    <option value="slow">Yavaş</option>
                    <option value="normal">Normal</option>
                    <option value="fast">Hızlı</option>
                </select>
            </div>

            {/* Step indicator */}
            <div className="text-center text-sm text-slate-400">
                Adım {currentStepIndex + 1} / {steps.length || 0}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[560px_1fr] gap-6">
                {/* Graph canvas */}
                <div
                    className="relative bg-slate-900/50 border border-slate-800 rounded-2xl mx-auto xl:mx-0 overflow-hidden"
                    style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
                >
                    <svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="absolute inset-0">
                        {edges.map((edge) => {
                            const fromNode = nodes.find((n) => n.id === edge.from);
                            const toNode = nodes.find((n) => n.id === edge.to);
                            if (!fromNode || !toNode) return null;
                            const key = getEdgeKey(edge.from, edge.to);
                            const isActive = activeEdgeKey === key;
                            const isPath =
                                currentStep?.pathNodes &&
                                currentStep.pathNodes.includes(edge.from) &&
                                currentStep.pathNodes.includes(edge.to) &&
                                Math.abs(
                                    currentStep.pathNodes.indexOf(edge.from) -
                                    currentStep.pathNodes.indexOf(edge.to)
                                ) === 1;

                            return (
                                <g key={key}>
                                    <line
                                        x1={fromNode.x}
                                        y1={fromNode.y}
                                        x2={toNode.x}
                                        y2={toNode.y}
                                        stroke={isPath ? '#6366f1' : isActive ? '#fbbf24' : '#475569'}
                                        strokeWidth={isPath ? 4 : isActive ? 3 : 2}
                                        strokeOpacity={isActive || isPath ? 1 : 0.7}
                                    />
                                    <text
                                        x={(fromNode.x + toNode.x) / 2}
                                        y={(fromNode.y + toNode.y) / 2 - 6}
                                        textAnchor="middle"
                                        fill="#94a3b8"
                                        fontSize={11}
                                        fontFamily="monospace"
                                    >
                                        {edge.weight > 1 ? edge.weight : ''}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>

                    {nodes.map((node) => (
                        <motion.button
                            key={node.id}
                            onClick={() => handleNodeClick(node.id)}
                            className={cn(
                                'absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-2 flex items-center justify-center font-bold text-white text-sm cursor-pointer',
                                getNodeColor(node.id)
                            )}
                            style={{ left: node.x, top: node.y }}
                            animate={{ scale: currentStep?.activeNode === node.id ? [1, 1.12, 1] : 1 }}
                            transition={
                                currentStep?.activeNode === node.id
                                    ? { repeat: Infinity, duration: 1 }
                                    : { duration: 0.2 }
                            }
                        >
                            {node.label}
                        </motion.button>
                    ))}
                </div>

                {/* Data structure inspector */}
                <div className="flex flex-col gap-4">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
                        <h3 className="text-sm font-bold text-slate-300 mb-3">
                            {selectedAlgorithm === 'bfs' && 'Queue (FIFO)'}
                            {selectedAlgorithm === 'dfs' && 'Call Stack (LIFO)'}
                            {selectedAlgorithm === 'dijkstra' && 'Priority Queue'}
                        </h3>

                        {selectedAlgorithm === 'bfs' && (
                            <div className="flex items-center gap-1 min-h-[48px] p-2 bg-slate-800/50 rounded-xl border border-slate-700 overflow-x-auto">
                                <span className="text-[10px] text-slate-500 mr-2">dequeue →</span>
                                {(currentStep?.dataStructureState ?? []).length === 0 ? (
                                    <span className="text-xs text-slate-600">Boş</span>
                                ) : (
                                    currentStep?.dataStructureState.map((item, i) => (
                                        <div
                                            key={`${item}-${i}`}
                                            className={cn(
                                                'px-3 py-2 rounded-lg text-xs font-mono font-bold border',
                                                i === 0
                                                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                                                    : 'bg-slate-700 border-slate-600 text-slate-300'
                                            )}
                                        >
                                            {item}
                                        </div>
                                    ))
                                )}
                                <span className="text-[10px] text-slate-500 ml-2">← enqueue</span>
                            </div>
                        )}

                        {selectedAlgorithm === 'dfs' && (
                            <div className="flex flex-col-reverse items-center gap-1 min-h-[120px] p-2 bg-slate-800/50 rounded-xl border border-slate-700">
                                <span className="text-[10px] text-slate-500">↑ pop (top)</span>
                                {(currentStep?.dataStructureState ?? []).length === 0 ? (
                                    <span className="text-xs text-slate-600">Boş yığın</span>
                                ) : (
                                    [...(currentStep?.dataStructureState ?? [])].reverse().map((item, i, arr) => (
                                        <div
                                            key={`${item}-${i}`}
                                            className={cn(
                                                'w-full max-w-[120px] px-3 py-2 rounded-lg text-xs font-mono font-bold border text-center',
                                                i === arr.length - 1
                                                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                                                    : 'bg-slate-700 border-slate-600 text-slate-300'
                                            )}
                                        >
                                            {item}
                                        </div>
                                    ))
                                )}
                                <span className="text-[10px] text-slate-500">↓ push</span>
                            </div>
                        )}

                        {selectedAlgorithm === 'dijkstra' && (
                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-1 min-h-[40px] p-2 bg-slate-800/50 rounded-xl border border-slate-700">
                                    {(currentStep?.dataStructureState ?? []).length === 0 ? (
                                        <span className="text-xs text-slate-600">PQ boş</span>
                                    ) : (
                                        currentStep?.dataStructureState.map((item, i) => (
                                            <div
                                                key={`${item}-${i}`}
                                                className="px-2 py-1 bg-violet-500/20 border border-violet-500/50 rounded text-xs font-mono text-violet-200"
                                            >
                                                {item}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <table className="w-full text-xs font-mono">
                                    <thead>
                                        <tr className="text-slate-500 border-b border-slate-700">
                                            <th className="py-1 text-left">Node</th>
                                            <th className="py-1 text-right">Dist</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {nodes.map((n) => {
                                            const dist = currentStep?.distances?.[n.id];
                                            return (
                                                <tr key={n.id} className="border-b border-slate-800/50">
                                                    <td className="py-1 text-slate-300">{n.label}</td>
                                                    <td className={cn(
                                                        'py-1 text-right',
                                                        dist === 0 ? 'text-cyan-400' :
                                                        dist !== undefined && dist < Infinity ? 'text-emerald-400' :
                                                        'text-slate-600'
                                                    )}>
                                                        {dist === undefined ? '—' : dist === Infinity ? '∞' : dist}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Algorithm info */}
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                        <h3 className="text-sm font-bold text-violet-300 mb-1">{algoInfo.title}</h3>
                        <p className="text-xs text-slate-500 mb-2">{algoInfo.structure} · {algoInfo.complexity}</p>
                        <p className="text-xs text-slate-400">{algoInfo.summary}</p>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-600" /> Varsayılan</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> Aktif</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-600" /> Ziyaret edildi</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500" /> En kısa yol</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-cyan-600" /> Start</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-violet-600" /> Target</div>
            </div>

            {/* Step description */}
            <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-800/50 text-sm text-slate-300">
                {currentStep?.description ??
                    'Algoritma seçin, başlangıç düğümünü ayarlayın ve "Çalıştır" veya Play ile adım adım keşfe başlayın.'}
            </div>
        </div>
    );
}
