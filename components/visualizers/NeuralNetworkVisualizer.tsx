'use client';

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNeuralNetworkStore, XOR_DATA } from '@/store/useNeuralNetworkStore';
import { cn } from '@/lib/utils';

const NETWORK_WIDTH = 350;
const NETWORK_HEIGHT = 300;
const HEATMAP_SIZE = 250;
const HEATMAP_RESOLUTION = 25;

// Layer positions
const layers = {
    input: { x: 60, neurons: [100, 200] },
    hidden: { x: 175, neurons: [50, 117, 183, 250] },
    output: { x: 290, neurons: [150] },
};

export default function NeuralNetworkVisualizer() {
    const {
        weightsInputHidden,
        weightsHiddenOutput,
        epoch,
        loss,
        isTraining,
        initNetwork,
        forward,
        trainStep,
        reset,
        setIsTraining,
    } = useNeuralNetworkStore();

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialized = weightsInputHidden.length > 0;

    // Auto-training effect
    useEffect(() => {
        if (isTraining) {
            intervalRef.current = setInterval(() => {
                trainStep();
            }, 50);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isTraining, trainStep]);

    const handleInit = useCallback(() => {
        initNetwork();
    }, [initNetwork]);

    const handleTrain = useCallback(() => {
        if (!isInitialized) initNetwork();
        setIsTraining(true);
    }, [isInitialized, initNetwork, setIsTraining]);

    const handleStop = useCallback(() => {
        setIsTraining(false);
    }, [setIsTraining]);

    const handleStep = useCallback(() => {
        if (!isInitialized) initNetwork();
        trainStep();
    }, [isInitialized, initNetwork, trainStep]);

    const handleReset = useCallback(() => {
        setIsTraining(false);
        reset();
    }, [setIsTraining, reset]);

    // Generate heatmap data
    const heatmapData = useMemo(() => {
        if (!isInitialized) return [];

        const data: { x: number; y: number; value: number }[] = [];
        for (let i = 0; i <= HEATMAP_RESOLUTION; i++) {
            for (let j = 0; j <= HEATMAP_RESOLUTION; j++) {
                const x = i / HEATMAP_RESOLUTION;
                const y = j / HEATMAP_RESOLUTION;
                const { output } = forward(x, y);
                data.push({ x: i, y: j, value: output });
            }
        }
        return data;
    }, [isInitialized, forward, weightsInputHidden, weightsHiddenOutput, epoch]);

    // Get weight color and width
    const getWeightStyle = (weight: number) => {
        const absWeight = Math.abs(weight);
        const color = weight >= 0 ? '#22c55e' : '#ef4444';
        const width = Math.min(Math.max(absWeight * 2, 0.5), 5);
        return { color, width };
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <button
                    onClick={handleInit}
                    disabled={isTraining}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
                >
                    🔄 Ağı Başlat
                </button>

                <button
                    onClick={handleStep}
                    disabled={isTraining}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
                >
                    ⏭️ Adım
                </button>

                {!isTraining ? (
                    <button
                        onClick={handleTrain}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold"
                    >
                        ▶️ Eğit
                    </button>
                ) : (
                    <button
                        onClick={handleStop}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold"
                    >
                        ⏹️ Durdur
                    </button>
                )}

                <button
                    onClick={handleReset}
                    disabled={isTraining}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-sm"
                >
                    Sıfırla
                </button>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8 text-sm">
                <span className="text-slate-500">
                    Epoch: <span className="text-violet-400 font-bold font-mono">{epoch}</span>
                </span>
                <span className="text-slate-500">
                    Loss: <span className={cn(
                        "font-bold font-mono",
                        loss < 0.1 ? "text-emerald-400" : loss < 0.25 ? "text-amber-400" : "text-rose-400"
                    )}>{loss.toFixed(4)}</span>
                </span>
                {loss < 0.01 && (
                    <span className="text-emerald-400 font-bold animate-pulse">✓ Öğrendi!</span>
                )}
            </div>

            {/* Split View */}
            <div className="flex flex-wrap justify-center gap-6">
                {/* Left: Network Graph */}
                <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                    <h3 className="text-sm font-bold text-violet-400 mb-3 text-center">Sinir Ağı (2-4-1)</h3>
                    <svg width={NETWORK_WIDTH} height={NETWORK_HEIGHT}>
                        {isInitialized && (
                            <>
                                {/* Connections: Input -> Hidden */}
                                {layers.input.neurons.map((iy, i) =>
                                    layers.hidden.neurons.map((hy, h) => {
                                        const style = getWeightStyle(weightsInputHidden[i]?.[h] || 0);
                                        return (
                                            <motion.line
                                                key={`ih-${i}-${h}`}
                                                x1={layers.input.x}
                                                y1={iy}
                                                x2={layers.hidden.x}
                                                y2={hy}
                                                stroke={style.color}
                                                strokeWidth={style.width}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 0.7, stroke: style.color, strokeWidth: style.width }}
                                                transition={{ duration: 0.2 }}
                                            />
                                        );
                                    })
                                )}

                                {/* Connections: Hidden -> Output */}
                                {layers.hidden.neurons.map((hy, h) => {
                                    const style = getWeightStyle(weightsHiddenOutput[h] || 0);
                                    return (
                                        <motion.line
                                            key={`ho-${h}`}
                                            x1={layers.hidden.x}
                                            y1={hy}
                                            x2={layers.output.x}
                                            y2={layers.output.neurons[0]}
                                            stroke={style.color}
                                            strokeWidth={style.width}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 0.7, stroke: style.color, strokeWidth: style.width }}
                                            transition={{ duration: 0.2 }}
                                        />
                                    );
                                })}
                            </>
                        )}

                        {/* Input neurons */}
                        {layers.input.neurons.map((y, i) => (
                            <g key={`input-${i}`}>
                                <circle cx={layers.input.x} cy={y} r={20} fill="#3b82f6" stroke="#60a5fa" strokeWidth={2} />
                                <text x={layers.input.x} y={y + 5} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">
                                    {i === 0 ? 'X' : 'Y'}
                                </text>
                            </g>
                        ))}

                        {/* Hidden neurons */}
                        {layers.hidden.neurons.map((y, i) => (
                            <g key={`hidden-${i}`}>
                                <circle cx={layers.hidden.x} cy={y} r={18} fill="#8b5cf6" stroke="#a78bfa" strokeWidth={2} />
                                <text x={layers.hidden.x} y={y + 5} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">
                                    H{i + 1}
                                </text>
                            </g>
                        ))}

                        {/* Output neuron */}
                        <g>
                            <circle cx={layers.output.x} cy={layers.output.neurons[0]} r={22} fill="#f59e0b" stroke="#fbbf24" strokeWidth={2} />
                            <text x={layers.output.x} y={layers.output.neurons[0] + 5} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">
                                Out
                            </text>
                        </g>

                        {/* Layer labels */}
                        <text x={layers.input.x} y={280} textAnchor="middle" fill="#64748b" fontSize={10}>Input</text>
                        <text x={layers.hidden.x} y={280} textAnchor="middle" fill="#64748b" fontSize={10}>Hidden</text>
                        <text x={layers.output.x} y={280} textAnchor="middle" fill="#64748b" fontSize={10}>Output</text>
                    </svg>
                </div>

                {/* Right: Decision Boundary */}
                <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                    <h3 className="text-sm font-bold text-cyan-400 mb-3 text-center">Karar Sınırı (XOR)</h3>
                    <div className="relative" style={{ width: HEATMAP_SIZE, height: HEATMAP_SIZE }}>
                        {/* Heatmap */}
                        <svg width={HEATMAP_SIZE} height={HEATMAP_SIZE} className="absolute inset-0">
                            {heatmapData.map(({ x, y, value }) => {
                                const cellSize = HEATMAP_SIZE / (HEATMAP_RESOLUTION + 1);
                                // Interpolate color: 0 = red, 1 = blue
                                const r = Math.round(239 * (1 - value) + 59 * value);
                                const g = Math.round(68 * (1 - value) + 130 * value);
                                const b = Math.round(68 * (1 - value) + 246 * value);
                                return (
                                    <rect
                                        key={`cell-${x}-${y}`}
                                        x={x * cellSize}
                                        y={(HEATMAP_RESOLUTION - y) * cellSize}
                                        width={cellSize + 1}
                                        height={cellSize + 1}
                                        fill={`rgb(${r},${g},${b})`}
                                        opacity={0.7}
                                    />
                                );
                            })}
                        </svg>

                        {/* XOR Data Points */}
                        {XOR_DATA.map((point, i) => (
                            <motion.div
                                key={i}
                                className={cn(
                                    "absolute w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold",
                                    point.target === 0 ? "bg-red-500" : "bg-blue-500"
                                )}
                                style={{
                                    left: point.x * (HEATMAP_SIZE - 24) + 12 - 12,
                                    bottom: point.y * (HEATMAP_SIZE - 24) + 12 - 12,
                                }}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                            >
                                {point.target}
                            </motion.div>
                        ))}

                        {/* Axis labels */}
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-500">X</div>
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">Y</div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-500">
                <span className="flex items-center gap-2">
                    <span className="w-8 h-1 bg-emerald-500 rounded"></span> Pozitif Ağırlık
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-8 h-1 bg-rose-500 rounded"></span> Negatif Ağırlık
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-red-500 border border-white"></span> Hedef: 0
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-500 border border-white"></span> Hedef: 1
                </span>
            </div>

            {/* Info */}
            <div className="p-4 bg-slate-800/50 rounded-xl text-xs text-slate-400">
                <h4 className="font-bold text-violet-400 mb-2">🧠 XOR Problemi</h4>
                <p className="mb-2">XOR (exclusive or) lineer olmayan bir problemdir. Tek katmanlı ağlar çözemez!</p>
                <ul className="space-y-1">
                    <li>• <strong className="text-amber-400">Girdi:</strong> (0,0)→0, (0,1)→1, (1,0)→1, (1,1)→0</li>
                    <li>• <strong className="text-cyan-400">Gizli Katman:</strong> Lineer olmayan karar sınırları öğrenir</li>
                    <li>• <strong className="text-emerald-400">Hedef:</strong> Köşegenler farklı renklerde olmalı</li>
                </ul>
            </div>
        </div>
    );
}
