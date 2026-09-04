'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useGradientDescentStore } from '@/store/useGradientDescentStore';
import {
    computeHeatmap,
    getEducationalNote,
    getLoss,
    lossToColor,
    SURFACE_DOMAINS,
    toCanvasCoords,
    toMathCoords,
    type OptimizerType,
    type SurfaceType,
} from '@/lib/optimization';
import { cn } from '@/lib/utils';

const LossLandscape3D = dynamic(() => import('./LossLandscape3D'), {
    ssr: false,
    loading: () => (
        <div
            className="flex items-center justify-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 text-sm"
            style={{ width: 480, height: 480 }}
        >
            3D sahne yükleniyor…
        </div>
    ),
});

type ViewMode = '2d' | '3d';

const CANVAS_SIZE = 480;
const GRID_SIZE = 40;

const SURFACE_LABELS: Record<SurfaceType, string> = {
    convex: 'Konveks Kase',
    saddle: 'Eyer Noktası',
    rosenbrock: 'Rosenbrock',
};

const OPTIMIZER_LABELS: Record<OptimizerType, string> = {
    sgd: 'SGD',
    momentum: 'Momentum',
    rmsprop: 'RMSprop',
    adam: 'Adam',
};

export default function GradientDescentVisualizer() {
    const [viewMode, setViewMode] = useState<ViewMode>('2d');

    const {
        surfaceType,
        optimizer,
        learningRate,
        momentum,
        currentPoint,
        history,
        isRunning,
        iteration,
        lastStepSize,
        isFinished,
        setSurfaceType,
        setOptimizer,
        setLearningRate,
        setMomentum,
        setStartingPoint,
        randomStart,
        step,
        reset,
        setIsRunning,
    } = useGradientDescentStore();

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const domain = SURFACE_DOMAINS[surfaceType];
    const currentLoss = getLoss(surfaceType, currentPoint);

    const heatmap = useMemo(
        () => computeHeatmap(surfaceType, GRID_SIZE),
        [surfaceType]
    );

    const cellSize = CANVAS_SIZE / GRID_SIZE;

    const trajectoryPath = useMemo(() => {
        if (history.length < 2) return '';
        return history
            .map((p, i) => {
                const c = toCanvasCoords(p, domain, CANVAS_SIZE);
                return `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`;
            })
            .join(' ');
    }, [history, domain]);

    const canvasPoint = toCanvasCoords(currentPoint, domain, CANVAS_SIZE);

    const educationalNote = useMemo(
        () => getEducationalNote(optimizer, surfaceType, learningRate),
        [optimizer, surfaceType, learningRate]
    );

    useEffect(() => {
        if (isRunning && !isFinished) {
            intervalRef.current = setInterval(() => {
                step();
            }, 80);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, isFinished, step]);

    const handleCanvasClick = useCallback(
        (e: React.MouseEvent<SVGSVGElement>) => {
            if (isRunning) return;
            const svg = svgRef.current;
            if (!svg) return;

            const rect = svg.getBoundingClientRect();
            const cx = e.clientX - rect.left;
            const cy = e.clientY - rect.top;
            const math = toMathCoords({ x: cx, y: cy }, domain, CANVAS_SIZE);
            setStartingPoint(math.x, math.y);
        },
        [isRunning, domain, setStartingPoint]
    );

    const handleRun = useCallback(() => {
        setIsRunning(true);
    }, [setIsRunning]);

    const handleStop = useCallback(() => {
        setIsRunning(false);
    }, [setIsRunning]);

    const handleReset = useCallback(() => {
        setIsRunning(false);
        reset();
    }, [setIsRunning, reset]);

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">Yüzey</label>
                    <select
                        value={surfaceType}
                        onChange={(e) => setSurfaceType(e.target.value as SurfaceType)}
                        disabled={isRunning}
                        className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                    >
                        {(Object.keys(SURFACE_LABELS) as SurfaceType[]).map((key) => (
                            <option key={key} value={key}>
                                {SURFACE_LABELS[key]}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">Optimizatör</label>
                    <select
                        value={optimizer}
                        onChange={(e) => setOptimizer(e.target.value as OptimizerType)}
                        disabled={isRunning}
                        className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                    >
                        {(Object.keys(OPTIMIZER_LABELS) as OptimizerType[]).map((key) => (
                            <option key={key} value={key}>
                                {OPTIMIZER_LABELS[key]}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 min-w-[180px]">
                    <label className="text-xs text-slate-400 whitespace-nowrap">
                        LR: {learningRate.toFixed(3)}
                    </label>
                    <input
                        type="range"
                        min={0.001}
                        max={1}
                        step={0.001}
                        value={learningRate}
                        onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                        disabled={isRunning}
                        className="w-full accent-violet-500"
                    />
                </div>

                {(optimizer === 'momentum' || optimizer === 'rmsprop') && (
                    <div className="flex items-center gap-2 min-w-[160px]">
                        <label className="text-xs text-slate-400 whitespace-nowrap">
                            β: {momentum.toFixed(2)}
                        </label>
                        <input
                            type="range"
                            min={0.5}
                            max={0.99}
                            step={0.01}
                            value={momentum}
                            onChange={(e) => setMomentum(parseFloat(e.target.value))}
                            disabled={isRunning}
                            className="w-full accent-cyan-500"
                        />
                    </div>
                )}

                <button
                    onClick={step}
                    disabled={isRunning || isFinished}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all"
                >
                    ⏭️ Adım
                </button>

                {!isRunning ? (
                    <button
                        onClick={handleRun}
                        disabled={isFinished}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all"
                    >
                        ▶️ Otomatik
                    </button>
                ) : (
                    <button
                        onClick={handleStop}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition-all"
                    >
                        ⏹️ Durdur
                    </button>
                )}

                <button
                    onClick={handleReset}
                    disabled={isRunning}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-sm"
                >
                    Sıfırla
                </button>

                <button
                    onClick={randomStart}
                    disabled={isRunning}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all"
                >
                    🎲 Rastgele Başlangıç
                </button>
            </div>

            {/* Live Metrics */}
            <div className="flex flex-wrap justify-center gap-6 text-sm font-mono">
                <span className="text-slate-500">
                    x: <span className="text-cyan-400 font-bold">{currentPoint.x.toFixed(4)}</span>
                </span>
                <span className="text-slate-500">
                    y: <span className="text-cyan-400 font-bold">{currentPoint.y.toFixed(4)}</span>
                </span>
                <span className="text-slate-500">
                    Loss: <span className="text-violet-400 font-bold">{currentLoss.toFixed(6)}</span>
                </span>
                <span className="text-slate-500">
                    İterasyon: <span className="text-amber-400 font-bold">{iteration}</span>
                </span>
                <span className="text-slate-500">
                    |Δθ|: <span className="text-emerald-400 font-bold">{lastStepSize.toFixed(6)}</span>
                </span>
                {isFinished && (
                    <span className="text-rose-400 font-bold animate-pulse">
                        Maksimum iterasyona ulaşıldı
                    </span>
                )}
            </div>

            {/* View mode toggle */}
            <div className="flex justify-center">
                <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1">
                    <button
                        onClick={() => setViewMode('2d')}
                        className={cn(
                            'px-4 py-2 rounded-lg text-xs font-bold transition-all',
                            viewMode === '2d'
                                ? 'bg-violet-600 text-white'
                                : 'text-slate-400 hover:text-slate-200'
                        )}
                    >
                        2D Contour Map
                    </button>
                    <button
                        onClick={() => setViewMode('3d')}
                        className={cn(
                            'px-4 py-2 rounded-lg text-xs font-bold transition-all',
                            viewMode === '3d'
                                ? 'bg-violet-600 text-white'
                                : 'text-slate-400 hover:text-slate-200'
                        )}
                    >
                        3D WebGL Landscape (Three.js)
                    </button>
                </div>
            </div>

            {/* Visualization */}
            <div className="flex justify-center">
                {viewMode === '2d' ? (
                <div
                    className="relative bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden cursor-crosshair"
                    style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
                >
                    <svg
                        ref={svgRef}
                        width={CANVAS_SIZE}
                        height={CANVAS_SIZE}
                        className="absolute inset-0"
                        onClick={handleCanvasClick}
                    >
                        {/* Heatmap grid */}
                        {heatmap.values.map((row, i) =>
                            row.map((loss, j) => (
                                <rect
                                    key={`${i}-${j}`}
                                    x={j * cellSize}
                                    y={i * cellSize}
                                    width={cellSize + 0.5}
                                    height={cellSize + 0.5}
                                    fill={lossToColor(loss, heatmap.min, heatmap.max)}
                                />
                            ))
                        )}

                        {/* Contour-like level lines (approximate) */}
                        {[0.25, 0.5, 0.75].map((level) => {
                            const threshold = heatmap.min + level * (heatmap.max - heatmap.min);
                            const points: string[] = [];
                            for (let i = 0; i < GRID_SIZE; i++) {
                                for (let j = 0; j < GRID_SIZE; j++) {
                                    const loss = heatmap.values[i][j];
                                    if (Math.abs(loss - threshold) / (heatmap.max - heatmap.min || 1) < 0.03) {
                                        points.push(`${j * cellSize + cellSize / 2},${i * cellSize + cellSize / 2}`);
                                    }
                                }
                            }
                            if (points.length === 0) return null;
                            return (
                                <g key={level} opacity={0.3}>
                                    {points.slice(0, 200).map((p, idx) => {
                                        const [cx, cy] = p.split(',').map(Number);
                                        return (
                                            <circle
                                                key={idx}
                                                cx={cx}
                                                cy={cy}
                                                r={0.8}
                                                fill="white"
                                            />
                                        );
                                    })}
                                </g>
                            );
                        })}

                        {/* Trajectory */}
                        {trajectoryPath && (
                            <motion.path
                                d={trajectoryPath}
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.3 }}
                                opacity={0.9}
                            />
                        )}

                        {/* History dots */}
                        {history.slice(0, -1).map((p, i) => {
                            const c = toCanvasCoords(p, domain, CANVAS_SIZE);
                            return (
                                <circle
                                    key={i}
                                    cx={c.x}
                                    cy={c.y}
                                    r={2}
                                    fill="#fbbf24"
                                    opacity={0.4 + (i / history.length) * 0.4}
                                />
                            );
                        })}

                        {/* Start point marker */}
                        {history.length > 0 && (
                            <circle
                                cx={toCanvasCoords(history[0], domain, CANVAS_SIZE).x}
                                cy={toCanvasCoords(history[0], domain, CANVAS_SIZE).y}
                                r={5}
                                fill="none"
                                stroke="#22d3ee"
                                strokeWidth={2}
                                strokeDasharray="3 2"
                            />
                        )}

                        {/* Current position with pulse */}
                        <motion.circle
                            cx={canvasPoint.x}
                            cy={canvasPoint.y}
                            r={14}
                            fill="#ef4444"
                            opacity={0.25}
                            animate={{
                                cx: canvasPoint.x,
                                cy: canvasPoint.y,
                                r: [14, 20, 14],
                                opacity: [0.25, 0.1, 0.25],
                            }}
                            transition={{
                                cx: { type: 'spring', stiffness: 200, damping: 20 },
                                cy: { type: 'spring', stiffness: 200, damping: 20 },
                                r: { duration: 1.5, repeat: Infinity },
                                opacity: { duration: 1.5, repeat: Infinity },
                            }}
                        />
                        <motion.circle
                            cx={canvasPoint.x}
                            cy={canvasPoint.y}
                            r={7}
                            fill="#ef4444"
                            stroke="white"
                            strokeWidth={2}
                            animate={{ cx: canvasPoint.x, cy: canvasPoint.y }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        />

                        {/* Axis labels */}
                        <text x={CANVAS_SIZE / 2} y={CANVAS_SIZE - 4} textAnchor="middle" fill="#64748b" fontSize={10}>
                            x
                        </text>
                        <text x={8} y={12} fill="#64748b" fontSize={10}>
                            y
                        </text>
                    </svg>

                    <div className="absolute bottom-2 left-2 text-[10px] text-slate-500 pointer-events-none">
                        Haritaya tıklayarak başlangıç noktası seçin
                    </div>
                </div>
                ) : (
                    <LossLandscape3D />
                )}
            </div>

            {/* Color legend */}
            <div className="flex justify-center items-center gap-3 text-xs text-slate-400">
                <span>Düşük Loss</span>
                <div
                    className="h-3 w-48 rounded-full"
                    style={{
                        background: 'linear-gradient(to right, rgb(30, 180, 180), rgb(210, 80, 40))',
                    }}
                />
                <span>Yüksek Loss</span>
            </div>

            {/* Educational note */}
            <div className="p-4 bg-slate-800/50 rounded-xl text-xs text-slate-400">
                <h4 className="font-bold text-violet-400 mb-2">
                    📐 {OPTIMIZER_LABELS[optimizer]} — {SURFACE_LABELS[surfaceType]}
                </h4>
                <p className="leading-relaxed">{educationalNote}</p>
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <h5 className="font-bold text-cyan-400 mb-1">Formüller</h5>
                    <ul className="space-y-1 list-disc list-inside">
                        {optimizer === 'sgd' && (
                            <li>
                                <strong className="text-amber-400">SGD:</strong>{' '}
                                θ<sub>t+1</sub> = θ<sub>t</sub> − α∇f(θ<sub>t</sub>)
                            </li>
                        )}
                        {optimizer === 'momentum' && (
                            <li>
                                <strong className="text-amber-400">Momentum:</strong>{' '}
                                v<sub>t+1</sub> = βv<sub>t</sub> + α∇f, θ<sub>t+1</sub> = θ<sub>t</sub> − v<sub>t+1</sub>
                            </li>
                        )}
                        {optimizer === 'rmsprop' && (
                            <li>
                                <strong className="text-amber-400">RMSprop:</strong>{' '}
                                s<sub>t+1</sub> = βs<sub>t</sub> + (1−β)(∇f)², θ<sub>t+1</sub> = θ<sub>t</sub> − α/√(s+ε)·∇f
                            </li>
                        )}
                        {optimizer === 'adam' && (
                            <li>
                                <strong className="text-amber-400">Adam:</strong>{' '}
                                m, v momentleri + bias düzeltmesi ile adaptif adım
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
