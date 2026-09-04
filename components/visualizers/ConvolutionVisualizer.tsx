'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConvolutionStore } from '@/store/useConvolutionStore';
import {
    GRID_SIZE,
    KERNEL_SIZE,
    FEATURE_MAP_SIZE,
    POOLED_MAP_SIZE,
    POOL_SIZE,
    POOL_STRIDE,
    SPEED_MS,
    KERNEL_LABELS,
    PRESET_LABELS,
    extractPatch,
    formatConvolutionFormula,
    getEducationalNote,
    getKernel,
    getReLUNote,
    pixelToColor,
    featureToColor,
    type KernelType,
    type PresetName,
    type Speed,
} from '@/lib/convolution';
import { cn } from '@/lib/utils';

const INPUT_CELL = 28;
const FEATURE_CELL = 32;
const POOL_CELL = 40;

function PixelGrid({
    grid,
    cellSize,
    colorFn,
    onCellInteraction,
    highlightRect,
    poolHighlightRect,
    label,
    computedHighlight,
}: {
    grid: (number | null)[][];
    cellSize: number;
    colorFn: (v: number | null) => string;
    onCellInteraction?: (row: number, col: number) => void;
    highlightRect?: { row: number; col: number; size: number } | null;
    poolHighlightRect?: { row: number; col: number; size: number } | null;
    label: string;
    computedHighlight?: { row: number; col: number } | null;
}) {
    const size = grid.length;
    const totalSize = size * cellSize;

    return (
        <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-slate-400">{label}</span>
            <div
                className="relative border border-slate-700 rounded-lg overflow-hidden"
                style={{ width: totalSize, height: totalSize }}
            >
                {grid.map((row, r) =>
                    row.map((val, c) => (
                        <div
                            key={`${r}-${c}`}
                            className={cn(
                                'absolute border border-slate-800/50 transition-colors',
                                onCellInteraction && 'cursor-crosshair hover:brightness-125'
                            )}
                            style={{
                                left: c * cellSize,
                                top: r * cellSize,
                                width: cellSize,
                                height: cellSize,
                                backgroundColor: colorFn(val),
                            }}
                            onMouseDown={() => onCellInteraction?.(r, c)}
                            onMouseEnter={(e) => {
                                if (e.buttons === 1) onCellInteraction?.(r, c);
                            }}
                        />
                    ))
                )}

                {highlightRect && (
                    <motion.div
                        className="absolute border-2 border-amber-400 rounded pointer-events-none"
                        style={{
                            left: highlightRect.col * cellSize - 1,
                            top: highlightRect.row * cellSize - 1,
                            width: highlightRect.size * cellSize + 2,
                            height: highlightRect.size * cellSize + 2,
                            boxShadow: '0 0 12px rgba(251,191,36,0.4)',
                        }}
                        layout
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                )}

                {poolHighlightRect && (
                    <motion.div
                        className="absolute border-2 border-emerald-400 rounded pointer-events-none"
                        style={{
                            left: poolHighlightRect.col * cellSize - 1,
                            top: poolHighlightRect.row * cellSize - 1,
                            width: poolHighlightRect.size * cellSize + 2,
                            height: poolHighlightRect.size * cellSize + 2,
                            boxShadow: '0 0 12px rgba(52,211,153,0.4)',
                        }}
                        layout
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                )}

                {computedHighlight && (
                    <motion.div
                        className="absolute border-2 border-violet-400 rounded pointer-events-none"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                            left: computedHighlight.col * cellSize,
                            top: computedHighlight.row * cellSize,
                            width: cellSize,
                            height: cellSize,
                            boxShadow: '0 0 16px rgba(167,139,250,0.6)',
                        }}
                    />
                )}
            </div>
        </div>
    );
}

export default function ConvolutionVisualizer() {
    const {
        inputGrid,
        selectedKernel,
        customKernelMatrix,
        applyReLU,
        activeKernelPos,
        activePoolPos,
        featureMap,
        pooledMap,
        isPlaying,
        speed,
        phase,
        stepIndex,
        lastRawSum,
        setPixel,
        loadPreset,
        setKernel,
        setCustomKernelValue,
        setApplyReLU,
        setSpeed,
        setIsDrawing,
        step,
        play,
        pause,
        reset,
    } = useConvolutionStore();

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const kernel = useMemo(
        () => getKernel(selectedKernel, customKernelMatrix),
        [selectedKernel, customKernelMatrix]
    );

    const currentPatch = useMemo(() => {
        if (!activeKernelPos) return null;
        return extractPatch(inputGrid, activeKernelPos.row, activeKernelPos.col);
    }, [inputGrid, activeKernelPos]);

    const formula = useMemo(() => {
        if (!currentPatch) return null;
        return formatConvolutionFormula(currentPatch, kernel);
    }, [currentPatch, kernel]);

    const finalValue = useMemo(() => {
        if (lastRawSum === null) return null;
        return applyReLU ? Math.max(0, lastRawSum) : lastRawSum;
    }, [lastRawSum, applyReLU]);

    const featureMax = useMemo(() => {
        let max = 1;
        for (const row of featureMap) {
            for (const v of row) {
                if (v !== null) max = Math.max(max, Math.abs(v));
            }
        }
        return max;
    }, [featureMap]);

    useEffect(() => {
        if (isPlaying && phase !== 'done') {
            intervalRef.current = setInterval(() => {
                step();
            }, SPEED_MS[speed]);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPlaying, phase, speed, step]);

    useEffect(() => {
        if (phase === 'done') pause();
    }, [phase, pause]);

    const handleDraw = useCallback(
        (row: number, col: number) => {
            setIsDrawing(true);
            setPixel(row, col, 255);
        },
        [setPixel, setIsDrawing]
    );

    const poolHighlightOnFeature =
        activePoolPos && phase === 'pool'
            ? {
                  row: activePoolPos.row * POOL_STRIDE,
                  col: activePoolPos.col * POOL_STRIDE,
                  size: POOL_SIZE,
              }
            : null;

    const computedFeatureCell =
        phase === 'conv' && activeKernelPos
            ? { row: activeKernelPos.row, col: activeKernelPos.col }
            : null;

    const computedPoolCell =
        phase === 'pool' && activePoolPos ? activePoolPos : null;

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">Desen</label>
                    <select
                        value=""
                        onChange={(e) => {
                            const v = e.target.value as PresetName;
                            if (v) loadPreset(v);
                        }}
                        disabled={isPlaying}
                        className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-2 text-sm"
                    >
                        <option value="">Seçin...</option>
                        {(Object.keys(PRESET_LABELS) as PresetName[]).map((key) => (
                            <option key={key} value={key}>
                                {PRESET_LABELS[key]}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">Filtre</label>
                    <select
                        value={selectedKernel}
                        onChange={(e) => setKernel(e.target.value as KernelType)}
                        disabled={isPlaying}
                        className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-2 text-sm"
                    >
                        {(Object.keys(KERNEL_LABELS) as KernelType[]).map((key) => (
                            <option key={key} value={key}>
                                {KERNEL_LABELS[key]}
                            </option>
                        ))}
                    </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-slate-400">ReLU</span>
                    <button
                        onClick={() => setApplyReLU(!applyReLU)}
                        disabled={isPlaying}
                        className={cn(
                            'relative w-10 h-5 rounded-full transition-colors',
                            applyReLU ? 'bg-emerald-600' : 'bg-slate-600',
                            isPlaying && 'opacity-50'
                        )}
                    >
                        <span
                            className={cn(
                                'absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform',
                                applyReLU ? 'translate-x-5' : 'translate-x-0.5'
                            )}
                        />
                    </button>
                </label>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">Hız</label>
                    <select
                        value={speed}
                        onChange={(e) => setSpeed(e.target.value as Speed)}
                        className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-2 text-sm"
                    >
                        <option value="slow">Yavaş</option>
                        <option value="normal">Normal</option>
                        <option value="fast">Hızlı</option>
                    </select>
                </div>

                <button
                    onClick={step}
                    disabled={isPlaying || phase === 'done'}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all"
                >
                    ⏭️ Adım
                </button>

                {!isPlaying ? (
                    <button
                        onClick={play}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all"
                    >
                        ▶️ Oynat
                    </button>
                ) : (
                    <button
                        onClick={pause}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition-all"
                    >
                        ⏹️ Duraklat
                    </button>
                )}

                <button
                    onClick={reset}
                    disabled={isPlaying}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-sm"
                >
                    Sıfırla
                </button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-6 text-sm font-mono">
                <span className="text-slate-500">
                    Faz:{' '}
                    <span className="text-violet-400 font-bold">
                        {phase === 'idle' ? 'Hazır' : phase === 'conv' ? 'Konvolüsyon' : phase === 'pool' ? 'Max Pooling' : 'Tamamlandı'}
                    </span>
                </span>
                <span className="text-slate-500">
                    Adım: <span className="text-amber-400 font-bold">{stepIndex}</span>
                </span>
                <span className="text-slate-500">
                    Input: <span className="text-cyan-400">{GRID_SIZE}×{GRID_SIZE}</span>
                </span>
                <span className="text-slate-500">
                    Feature Map: <span className="text-emerald-400">{FEATURE_MAP_SIZE}×{FEATURE_MAP_SIZE}</span>
                </span>
                <span className="text-slate-500">
                    Pooled: <span className="text-rose-400">{POOLED_MAP_SIZE}×{POOLED_MAP_SIZE}</span>
                </span>
            </div>

            {/* Pipeline: Input → Kernel/Formula → Feature Map → Pooled */}
            <div className="flex flex-wrap justify-center items-start gap-6 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-x-auto">
                <PixelGrid
                    grid={inputGrid}
                    cellSize={INPUT_CELL}
                    colorFn={(v) => pixelToColor(v ?? 0)}
                    onCellInteraction={isPlaying ? undefined : handleDraw}
                    highlightRect={
                        activeKernelPos
                            ? { ...activeKernelPos, size: KERNEL_SIZE }
                            : null
                    }
                    label="Input Grid"
                />

                {/* Kernel + Formula panel */}
                <div className="flex flex-col items-center gap-3 min-w-[180px]">
                    <span className="text-xs font-bold text-slate-400">Kernel 3×3</span>
                    <div className="grid grid-cols-3 gap-1">
                        {(selectedKernel === 'custom'
                            ? customKernelMatrix
                            : kernel
                        ).map((row, r) =>
                            row.map((val, c) =>
                                selectedKernel === 'custom' ? (
                                    <input
                                        key={`k-${r}-${c}`}
                                        type="number"
                                        step={0.1}
                                        value={val}
                                        disabled={isPlaying}
                                        onChange={(e) =>
                                            setCustomKernelValue(r, c, parseFloat(e.target.value) || 0)
                                        }
                                        className="w-12 h-10 text-center text-xs font-mono bg-slate-800 border border-slate-600 rounded text-amber-300"
                                    />
                                ) : (
                                    <div
                                        key={`k-${r}-${c}`}
                                        className="w-12 h-10 flex items-center justify-center text-xs font-mono bg-slate-800 border border-slate-600 rounded text-amber-300"
                                    >
                                        {Number.isInteger(val) ? val : val.toFixed(2)}
                                    </div>
                                )
                            )
                        )}
                    </div>

                    <div className="w-full p-3 bg-slate-950/60 border border-slate-700 rounded-xl text-[10px] font-mono text-slate-400 min-h-[100px]">
                        {formula ? (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`${activeKernelPos?.row}-${activeKernelPos?.col}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <p className="text-amber-400/80 mb-1">Σ (I × K)</p>
                                    <p className="leading-relaxed break-all">
                                        {formula.terms.join(' + ')}
                                    </p>
                                    <p className="mt-2 text-slate-300">
                                        = {formula.rawSum.toFixed(1)}
                                        {applyReLU && (
                                            <span className="text-emerald-400">
                                                {' → ReLU → '}
                                                {Math.max(0, formula.rawSum).toFixed(1)}
                                            </span>
                                        )}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        ) : (
                            <p className="text-slate-600 italic">
                                Oynat veya Adım ile taramayı başlatın
                            </p>
                        )}
                    </div>

                    {finalValue !== null && phase !== 'idle' && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-sm font-mono text-violet-300"
                        >
                            Çıktı: <span className="font-bold">{finalValue.toFixed(2)}</span>
                        </motion.div>
                    )}
                </div>

                <div className="flex items-center text-2xl text-slate-600 self-center">→</div>

                <PixelGrid
                    grid={featureMap}
                    cellSize={FEATURE_CELL}
                    colorFn={(v) => featureToColor(v, featureMax)}
                    poolHighlightRect={poolHighlightOnFeature}
                    computedHighlight={computedFeatureCell}
                    label="Feature Map"
                />

                <div className="flex items-center text-2xl text-slate-600 self-center">→</div>

                <PixelGrid
                    grid={pooledMap}
                    cellSize={POOL_CELL}
                    colorFn={(v) => featureToColor(v, featureMax)}
                    computedHighlight={computedPoolCell}
                    label="Max Pool 2×2"
                />
            </div>

            <p className="text-center text-[10px] text-slate-500">
                Input grid üzerinde fare ile çizim yapın (beyaz = 255). Valid padding, stride=1 konvolüsyon.
            </p>

            {/* Kernel reference when not custom */}
            {selectedKernel !== 'custom' && (
                <div className="flex justify-center gap-4 flex-wrap">
                    {(['sobel_h', 'sobel_v', 'sharpen', 'blur'] as const).map((k) => (
                        <button
                            key={k}
                            onClick={() => setKernel(k)}
                            disabled={isPlaying}
                            className={cn(
                                'px-3 py-1.5 text-xs rounded-lg border transition-all',
                                selectedKernel === k
                                    ? 'bg-violet-600/30 border-violet-500 text-violet-200'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                            )}
                        >
                            {KERNEL_LABELS[k]}
                        </button>
                    ))}
                </div>
            )}

            {/* Educational note */}
            <div className="p-4 bg-slate-800/50 rounded-xl text-xs text-slate-400">
                <h4 className="font-bold text-violet-400 mb-2">
                    🔬 {KERNEL_LABELS[selectedKernel]}
                </h4>
                <p className="leading-relaxed">{getEducationalNote(selectedKernel)}</p>
                <p className="mt-2 text-slate-500">{getReLUNote(applyReLU)}</p>
                <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-1">
                    <p>
                        <strong className="text-cyan-400">Konvolüsyon:</strong>{' '}
                        3×3 kernel input üzerinde kayarak element-wise çarpım ve toplam — çıktı boyutu{' '}
                        {FEATURE_MAP_SIZE}×{FEATURE_MAP_SIZE} (valid).
                    </p>
                    <p>
                        <strong className="text-emerald-400">Max Pooling:</strong>{' '}
                        2×2 pencerelerin maksimumu alınarak boyut {POOLED_MAP_SIZE}×{POOLED_MAP_SIZE}&apos;e
                        düşürülür — konum bilgisine dayanıklılık ve hesaplama azaltma.
                    </p>
                </div>
            </div>
        </div>
    );
}
