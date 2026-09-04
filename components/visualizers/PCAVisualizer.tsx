'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { usePCAStore } from '@/store/usePCAStore';
import {
    extendLineThroughPoint,
    interpolatePoint,
    type PresetName,
} from '@/lib/pca';
import { cn } from '@/lib/utils';

const CANVAS_SIZE = 400;
const ARROW_SCALE = CANVAS_SIZE / 12;

function toCanvasX(value: number): number {
    return (value / 100) * CANVAS_SIZE;
}

function toCanvasY(value: number): number {
    return CANVAS_SIZE - (value / 100) * CANVAS_SIZE;
}

function getEducationalMessage(
    variancePC1: number,
    projectionProgress: number
): string {
    if (projectionProgress >= 0.95) {
        return 'İzdüşüm slider\'ını 1.0 yaptığınızda 2D veriyi en az bilgi kaybıyla 1 boyuta sıkıştırmış olursunuz. PC1 ekseni maksimum varyans yönünü temsil eder.';
    }
    if (variancePC1 > 80) {
        return 'PC1 ekseni verinin en çok saçıldığı (maksimum varyans) yönü yakalar. Bu kümede tek bileşenle çoğu bilgi korunabilir.';
    }
    if (variancePC1 < 55) {
        return 'Özdeğerler birbirine yakın — veri dairesel/decorrelated. 1D izdüşüm daha fazla bilgi kaybına yol açar.';
    }
    return 'PC1 ve PC2 birbirine dik temel bileşenlerdir. PC1 maksimum varyansı, PC2 kalan varyansı açıklar.';
}

export default function PCAVisualizer() {
    const {
        points,
        pcaResult,
        projectionProgress,
        showEigenvectors,
        showProjectionLines,
        addPoint,
        clearPoints,
        loadPreset,
        setProjectionProgress,
        toggleEigenvectors,
        toggleProjectionLines,
        generateRandom,
        computePCA,
    } = usePCAStore();

    useEffect(() => {
        computePCA();
    }, [computePCA]);

    const displayPoints = useMemo(() => {
        if (!pcaResult) return points.map((p) => ({ ...p, original: p, projected: p }));
        return points.map((p, i) => ({
            ...interpolatePoint(p, pcaResult.projectedPoints[i], projectionProgress),
            original: p,
            projected: pcaResult.projectedPoints[i],
        }));
    }, [points, pcaResult, projectionProgress]);

    const pc1Line = useMemo(() => {
        if (!pcaResult) return null;
        return extendLineThroughPoint(pcaResult.mean, pcaResult.eigenvectors[0], 0, 100);
    }, [pcaResult]);

    const pc2Line = useMemo(() => {
        if (!pcaResult) return null;
        return extendLineThroughPoint(pcaResult.mean, pcaResult.eigenvectors[1], 0, 100);
    }, [pcaResult]);

    const handleCanvasClick = useCallback(
        (event: React.MouseEvent<SVGSVGElement>) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const canvasX = ((event.clientX - rect.left) / rect.width) * CANVAS_SIZE;
            const canvasY = ((event.clientY - rect.top) / rect.height) * CANVAS_SIZE;
            const x = (canvasX / CANVAS_SIZE) * 100;
            const y = ((CANVAS_SIZE - canvasY) / CANVAS_SIZE) * 100;
            addPoint(Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)));
        },
        [addPoint]
    );

    const variancePC1 = pcaResult?.varianceExplained[0] ?? 0;
    const variancePC2 = pcaResult?.varianceExplained[1] ?? 0;

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-3 min-w-[200px]">
                    <label className="text-xs text-slate-400 whitespace-nowrap">
                        İzdüşüm: <span className="text-cyan-400 font-bold">{projectionProgress.toFixed(2)}</span>
                    </label>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={projectionProgress}
                        onChange={(e) => setProjectionProgress(parseFloat(e.target.value))}
                        className="w-32 accent-cyan-500"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">Preset:</label>
                    <select
                        defaultValue=""
                        onChange={(e) => loadPreset(e.target.value as PresetName)}
                        className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                    >
                        <option value="" disabled>Veri kümesi seç</option>
                        <option value="positive">High Positive Correlation</option>
                        <option value="negative">High Negative Correlation</option>
                        <option value="spherical">Spherical / Uncorrelated</option>
                        <option value="outliers">Outliers Pattern</option>
                    </select>
                </div>

                <button
                    onClick={toggleEigenvectors}
                    className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                        showEigenvectors
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                    )}
                >
                    PC Vektörleri
                </button>

                <button
                    onClick={toggleProjectionLines}
                    className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                        showProjectionLines
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                    )}
                >
                    Hata Çizgileri
                </button>

                <button
                    onClick={clearPoints}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all"
                >
                    Temizle
                </button>

                <button
                    onClick={() => generateRandom(25)}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold transition-all"
                >
                    Rastgele 25 Nokta
                </button>
            </div>

            {/* Main layout */}
            <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6">
                {/* Canvas */}
                <div
                    className="relative bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden mx-auto xl:mx-0"
                    style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
                >
                    <svg
                        width={CANVAS_SIZE}
                        height={CANVAS_SIZE}
                        className="absolute inset-0 cursor-crosshair"
                        onClick={handleCanvasClick}
                    >
                        {/* Grid */}
                        {Array.from({ length: 11 }).map((_, i) => (
                            <g key={`grid-${i}`}>
                                <line
                                    x1={toCanvasX(i * 10)}
                                    y1={0}
                                    x2={toCanvasX(i * 10)}
                                    y2={CANVAS_SIZE}
                                    stroke="rgba(148, 163, 184, 0.08)"
                                    strokeWidth={1}
                                />
                                <line
                                    x1={0}
                                    y1={toCanvasY(i * 10)}
                                    x2={CANVAS_SIZE}
                                    y2={toCanvasY(i * 10)}
                                    stroke="rgba(148, 163, 184, 0.08)"
                                    strokeWidth={1}
                                />
                            </g>
                        ))}

                        {/* PC1 guide line */}
                        {showEigenvectors && pc1Line && (
                            <line
                                x1={toCanvasX(pc1Line.start.x)}
                                y1={toCanvasY(pc1Line.start.y)}
                                x2={toCanvasX(pc1Line.end.x)}
                                y2={toCanvasY(pc1Line.end.y)}
                                stroke="rgba(52, 211, 153, 0.35)"
                                strokeWidth={1.5}
                                strokeDasharray="6 4"
                            />
                        )}

                        {/* PC2 guide line */}
                        {showEigenvectors && pc2Line && (
                            <line
                                x1={toCanvasX(pc2Line.start.x)}
                                y1={toCanvasY(pc2Line.start.y)}
                                x2={toCanvasX(pc2Line.end.x)}
                                y2={toCanvasY(pc2Line.end.y)}
                                stroke="rgba(251, 146, 60, 0.3)"
                                strokeWidth={1}
                                strokeDasharray="4 4"
                            />
                        )}

                        {/* Projection error lines */}
                        {showProjectionLines &&
                            pcaResult &&
                            displayPoints.map((dp, i) => (
                                <line
                                    key={`proj-line-${i}`}
                                    x1={toCanvasX(dp.original.x)}
                                    y1={toCanvasY(dp.original.y)}
                                    x2={toCanvasX(dp.projected.x)}
                                    y2={toCanvasY(dp.projected.y)}
                                    stroke="rgba(148, 163, 184, 0.45)"
                                    strokeWidth={1}
                                    strokeDasharray="3 3"
                                />
                            ))}

                        {/* Mean center */}
                        {pcaResult && (
                            <g>
                                <line
                                    x1={toCanvasX(pcaResult.mean.x) - 8}
                                    y1={toCanvasY(pcaResult.mean.y)}
                                    x2={toCanvasX(pcaResult.mean.x) + 8}
                                    y2={toCanvasY(pcaResult.mean.y)}
                                    stroke="#facc15"
                                    strokeWidth={2}
                                />
                                <line
                                    x1={toCanvasX(pcaResult.mean.x)}
                                    y1={toCanvasY(pcaResult.mean.y) - 8}
                                    x2={toCanvasX(pcaResult.mean.x)}
                                    y2={toCanvasY(pcaResult.mean.y) + 8}
                                    stroke="#facc15"
                                    strokeWidth={2}
                                />
                            </g>
                        )}

                        {/* PC1 arrow */}
                        {showEigenvectors && pcaResult && (
                            <g>
                                <defs>
                                    <marker
                                        id="pc1-arrow"
                                        markerWidth="8"
                                        markerHeight="8"
                                        refX="6"
                                        refY="3"
                                        orient="auto"
                                    >
                                        <path d="M0,0 L6,3 L0,6 Z" fill="#34d399" />
                                    </marker>
                                </defs>
                                <line
                                    x1={toCanvasX(pcaResult.mean.x)}
                                    y1={toCanvasY(pcaResult.mean.y)}
                                    x2={toCanvasX(
                                        pcaResult.mean.x +
                                            pcaResult.eigenvectors[0].x *
                                                Math.sqrt(pcaResult.eigenvalues[0]) *
                                                ARROW_SCALE
                                    )}
                                    y2={toCanvasY(
                                        pcaResult.mean.y +
                                            pcaResult.eigenvectors[0].y *
                                                Math.sqrt(pcaResult.eigenvalues[0]) *
                                                ARROW_SCALE
                                    )}
                                    stroke="#34d399"
                                    strokeWidth={3}
                                    markerEnd="url(#pc1-arrow)"
                                />
                                <text
                                    x={toCanvasX(
                                        pcaResult.mean.x +
                                            pcaResult.eigenvectors[0].x *
                                                Math.sqrt(pcaResult.eigenvalues[0]) *
                                                ARROW_SCALE *
                                                1.15
                                    )}
                                    y={toCanvasY(
                                        pcaResult.mean.y +
                                            pcaResult.eigenvectors[0].y *
                                                Math.sqrt(pcaResult.eigenvalues[0]) *
                                                ARROW_SCALE *
                                                1.15
                                    )}
                                    fill="#34d399"
                                    fontSize={11}
                                    fontWeight="bold"
                                    textAnchor="middle"
                                >
                                    PC1
                                </text>
                            </g>
                        )}

                        {/* PC2 arrow */}
                        {showEigenvectors && pcaResult && (
                            <g>
                                <defs>
                                    <marker
                                        id="pc2-arrow"
                                        markerWidth="8"
                                        markerHeight="8"
                                        refX="6"
                                        refY="3"
                                        orient="auto"
                                    >
                                        <path d="M0,0 L6,3 L0,6 Z" fill="#fb923c" />
                                    </marker>
                                </defs>
                                <line
                                    x1={toCanvasX(pcaResult.mean.x)}
                                    y1={toCanvasY(pcaResult.mean.y)}
                                    x2={toCanvasX(
                                        pcaResult.mean.x +
                                            pcaResult.eigenvectors[1].x *
                                                Math.sqrt(pcaResult.eigenvalues[1]) *
                                                ARROW_SCALE
                                    )}
                                    y2={toCanvasY(
                                        pcaResult.mean.y +
                                            pcaResult.eigenvectors[1].y *
                                                Math.sqrt(pcaResult.eigenvalues[1]) *
                                                ARROW_SCALE
                                    )}
                                    stroke="#fb923c"
                                    strokeWidth={2}
                                    markerEnd="url(#pc2-arrow)"
                                />
                                <text
                                    x={toCanvasX(
                                        pcaResult.mean.x +
                                            pcaResult.eigenvectors[1].x *
                                                Math.sqrt(pcaResult.eigenvalues[1]) *
                                                ARROW_SCALE *
                                                1.15
                                    )}
                                    y={toCanvasY(
                                        pcaResult.mean.y +
                                            pcaResult.eigenvectors[1].y *
                                                Math.sqrt(pcaResult.eigenvalues[1]) *
                                                ARROW_SCALE *
                                                1.15
                                    )}
                                    fill="#fb923c"
                                    fontSize={11}
                                    fontWeight="bold"
                                    textAnchor="middle"
                                >
                                    PC2
                                </text>
                            </g>
                        )}

                        {/* Data points */}
                        {displayPoints.map((dp, i) => (
                            <motion.circle
                                key={`point-${i}`}
                                cx={toCanvasX(dp.x)}
                                cy={toCanvasY(dp.y)}
                                r={6}
                                fill="#3b82f6"
                                stroke="#0f172a"
                                strokeWidth={2}
                                animate={{
                                    cx: toCanvasX(dp.x),
                                    cy: toCanvasY(dp.y),
                                }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                        ))}

                        {points.length === 0 && (
                            <text
                                x={CANVAS_SIZE / 2}
                                y={CANVAS_SIZE / 2}
                                textAnchor="middle"
                                fill="#64748b"
                                fontSize={14}
                            >
                                Düzleme tıklayarak nokta ekleyin
                            </text>
                        )}

                        {points.length === 1 && (
                            <text
                                x={CANVAS_SIZE / 2}
                                y={CANVAS_SIZE / 2 + 24}
                                textAnchor="middle"
                                fill="#64748b"
                                fontSize={12}
                            >
                                PCA için en az 2 nokta gerekli
                            </text>
                        )}
                    </svg>
                </div>

                {/* Metrics panel */}
                <div className="flex flex-col gap-4">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
                        <h3 className="text-sm font-bold text-slate-300 mb-3">Kovaryans Matrisi (Σ)</h3>
                        {pcaResult ? (
                            <table className="w-full text-sm font-mono">
                                <tbody>
                                    <tr>
                                        <td className="py-2 px-3 bg-slate-800/60 text-slate-400 border border-slate-700" />
                                        <td className="py-2 px-3 bg-slate-800/60 text-slate-400 border border-slate-700 text-center">X</td>
                                        <td className="py-2 px-3 bg-slate-800/60 text-slate-400 border border-slate-700 text-center">Y</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 px-3 bg-slate-800/60 text-slate-400 border border-slate-700">X</td>
                                        <td className="py-2 px-3 bg-slate-800/40 text-emerald-300 border border-slate-700 text-center">
                                            {pcaResult.covariance.xx.toFixed(2)}
                                        </td>
                                        <td className="py-2 px-3 bg-slate-800/40 text-slate-200 border border-slate-700 text-center">
                                            {pcaResult.covariance.xy.toFixed(2)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 px-3 bg-slate-800/60 text-slate-400 border border-slate-700">Y</td>
                                        <td className="py-2 px-3 bg-slate-800/40 text-slate-200 border border-slate-700 text-center">
                                            {pcaResult.covariance.xy.toFixed(2)}
                                        </td>
                                        <td className="py-2 px-3 bg-slate-800/40 text-orange-300 border border-slate-700 text-center">
                                            {pcaResult.covariance.yy.toFixed(2)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-sm text-slate-500">En az 2 nokta ekleyin.</p>
                        )}
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-4">
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">PC1 Açıklanan Varyans</span>
                                <span className="text-emerald-400 font-bold font-mono">
                                    {variancePC1.toFixed(1)}%
                                </span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                    style={{ width: `${variancePC1}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">PC2 Açıklanan Varyans</span>
                                <span className="text-orange-400 font-bold font-mono">
                                    {variancePC2.toFixed(1)}%
                                </span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-orange-500 rounded-full transition-all duration-300"
                                    style={{ width: `${variancePC2}%` }}
                                />
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800">
                            <span className="text-slate-500 text-xs">Rekonstrüksiyon Kaybı (MSE): </span>
                            <span className="text-violet-400 font-bold font-mono text-sm">
                                {pcaResult ? pcaResult.reconstructionMSE.toFixed(3) : '—'}
                            </span>
                        </div>

                        {pcaResult && (
                            <div className="text-xs text-slate-500 font-mono space-y-1">
                                <div>λ₁ = {pcaResult.eigenvalues[0].toFixed(3)}</div>
                                <div>λ₂ = {pcaResult.eigenvalues[1].toFixed(3)}</div>
                                <div>
                                    μ = ({pcaResult.mean.x.toFixed(1)}, {pcaResult.mean.y.toFixed(1)})
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    Veri Noktası
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-yellow-400 font-bold">+</span>
                    Ortalama (μ)
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-6 h-0.5 bg-emerald-400" />
                    PC1 (max varyans)
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-6 h-0.5 bg-orange-400" />
                    PC2 (kalan varyans)
                </div>
            </div>

            {/* Educational note */}
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-sm text-slate-300">
                {getEducationalMessage(variancePC1, projectionProgress)}
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl text-xs text-slate-400 leading-relaxed">
                PCA veriyi ortalar, kovaryans matrisini hesaplar ve özdeğer ayrışımı ile birbirine dik
                temel bileşenleri bulur. PC1 maksimum varyans yönüdür; veriyi bu eksene izdüşürmek
                boyut indirgemenin en basit formudur. Aykırı değerler kovaryansı ve dolayısıyla
                temel bileşenleri önemli ölçüde etkileyebilir.
            </div>
        </div>
    );
}
