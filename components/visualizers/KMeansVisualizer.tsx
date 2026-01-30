'use client';

import { useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useKMeansStore } from '@/store/useKMeansStore';
import { cn } from '@/lib/utils';

const CANVAS_SIZE = 400;

export default function KMeansVisualizer() {
    const {
        points,
        centroids,
        k,
        iteration,
        isRunning,
        isConverged,
        generateData,
        setK,
        initCentroids,
        step,
        reset,
        setIsRunning,
    } = useKMeansStore();

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-run effect
    useEffect(() => {
        if (isRunning && !isConverged) {
            intervalRef.current = setInterval(() => {
                step();
            }, 500);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            if (isConverged) {
                setIsRunning(false);
            }
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, isConverged, step, setIsRunning]);

    const handleGenerate = useCallback(() => {
        generateData(100);
    }, [generateData]);

    const handleStart = useCallback(() => {
        if (centroids.length === 0) {
            initCentroids();
        }
    }, [centroids.length, initCentroids]);

    const handleRun = useCallback(() => {
        if (centroids.length === 0) {
            initCentroids();
        }
        setIsRunning(true);
    }, [centroids.length, initCentroids, setIsRunning]);

    const handleStop = useCallback(() => {
        setIsRunning(false);
    }, [setIsRunning]);

    const handleReset = useCallback(() => {
        setIsRunning(false);
        reset();
    }, [setIsRunning, reset]);

    // Get color for a point
    const getPointColor = (clusterId: number | null) => {
        if (clusterId === null) return '#64748b'; // gray
        const centroid = centroids.find((c) => c.id === clusterId);
        return centroid?.color || '#64748b';
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <button
                    onClick={handleGenerate}
                    disabled={isRunning}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all"
                >
                    📊 Veri Oluştur (100)
                </button>

                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">K =</label>
                    <select
                        value={k}
                        onChange={(e) => setK(parseInt(e.target.value))}
                        disabled={isRunning || centroids.length > 0}
                        className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                    >
                        {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleStart}
                    disabled={isRunning || points.length === 0 || centroids.length > 0}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all"
                >
                    🎯 Merkezleri Başlat
                </button>

                <button
                    onClick={step}
                    disabled={isRunning || centroids.length === 0 || isConverged}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all"
                >
                    ⏭️ Adım
                </button>

                {!isRunning ? (
                    <button
                        onClick={handleRun}
                        disabled={points.length === 0 || isConverged}
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
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-6 text-sm">
                <span className="text-slate-500">
                    Noktalar: <span className="text-slate-300 font-bold">{points.length}</span>
                </span>
                <span className="text-slate-500">
                    İterasyon: <span className="text-violet-400 font-bold">{iteration}</span>
                </span>
                {isConverged && (
                    <span className="text-emerald-400 font-bold animate-pulse">
                        ✓ Yakınsadı!
                    </span>
                )}
            </div>

            {/* Canvas */}
            <div className="flex justify-center">
                <div
                    className="relative bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden"
                    style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
                >
                    {points.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                            <div className="text-center">
                                <div className="text-4xl mb-2">📊</div>
                                <p>&ldquo;Veri Oluştur&rdquo; butonuna basın</p>
                            </div>
                        </div>
                    ) : (
                        <svg width={CANVAS_SIZE} height={CANVAS_SIZE} className="absolute inset-0">
                            {/* Data Points */}
                            {points.map((point) => (
                                <motion.circle
                                    key={point.id}
                                    cx={point.x}
                                    cy={point.y}
                                    r={4}
                                    initial={{ fill: '#64748b' }}
                                    animate={{ fill: getPointColor(point.clusterId) }}
                                    transition={{ duration: 0.3 }}
                                    className="opacity-80"
                                />
                            ))}

                            {/* Centroids */}
                            {centroids.map((centroid) => (
                                <motion.g key={centroid.id}>
                                    {/* Centroid glow */}
                                    <motion.circle
                                        cx={centroid.x}
                                        cy={centroid.y}
                                        r={18}
                                        fill={centroid.color}
                                        opacity={0.2}
                                        animate={{ cx: centroid.x, cy: centroid.y }}
                                        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                                    />
                                    {/* Centroid marker */}
                                    <motion.circle
                                        cx={centroid.x}
                                        cy={centroid.y}
                                        r={10}
                                        fill={centroid.color}
                                        stroke="white"
                                        strokeWidth={2}
                                        animate={{ cx: centroid.x, cy: centroid.y }}
                                        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                                    />
                                    {/* Centroid label */}
                                    <motion.text
                                        x={centroid.x}
                                        y={centroid.y + 4}
                                        textAnchor="middle"
                                        fill="white"
                                        fontSize={10}
                                        fontWeight="bold"
                                        animate={{ x: centroid.x, y: centroid.y + 4 }}
                                        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                                    >
                                        {centroid.id + 1}
                                    </motion.text>
                                </motion.g>
                            ))}
                        </svg>
                    )}
                </div>
            </div>

            {/* Legend */}
            {centroids.length > 0 && (
                <div className="flex flex-wrap justify-center gap-4">
                    {centroids.map((centroid, i) => (
                        <div key={centroid.id} className="flex items-center gap-2 text-xs text-slate-400">
                            <div
                                className="w-4 h-4 rounded-full border-2 border-white/50"
                                style={{ backgroundColor: centroid.color }}
                            />
                            Küme {i + 1}: {points.filter((p) => p.clusterId === centroid.id).length} nokta
                        </div>
                    ))}
                </div>
            )}

            {/* Algorithm Explanation */}
            <div className="p-4 bg-slate-800/50 rounded-xl text-xs text-slate-400">
                <h4 className="font-bold text-violet-400 mb-2">📊 K-Means Algoritması</h4>
                <ol className="space-y-1 list-decimal list-inside">
                    <li><strong className="text-cyan-400">Başlangıç:</strong> K adet rastgele merkez (centroid) seç</li>
                    <li><strong className="text-amber-400">Atama:</strong> Her noktayı en yakın merkeze ata</li>
                    <li><strong className="text-emerald-400">Güncelleme:</strong> Merkezleri küme ortalamasına taşı</li>
                    <li><strong className="text-rose-400">Tekrar:</strong> Merkezler sabitlenene kadar 2-3&apos;ü tekrarla</li>
                </ol>
            </div>
        </div>
    );
}
