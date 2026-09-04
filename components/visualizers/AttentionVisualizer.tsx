'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAttentionStore } from '@/store/useAttentionStore';
import {
    computeAttention,
    getEducationalNote,
    getHeadInfo,
    attentionToColor,
    formatMatrixPreview,
    type AttentionHead,
} from '@/lib/attention';
import { cn } from '@/lib/utils';

const HEAD_LABELS: Record<AttentionHead, string> = {
    head1: 'Head 1 — Syntactic',
    head2: 'Head 2 — Semantic',
};

export default function AttentionVisualizer() {
    const {
        sentence,
        presetSentences,
        selectedHead,
        selectedTokenIndex,
        temperature,
        setSentence,
        setHead,
        setSelectedToken,
        setTemperature,
    } = useAttentionStore();

    const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
    const [expandedStep, setExpandedStep] = useState<number | null>(0);

    const result = useMemo(
        () => computeAttention(sentence, selectedHead, temperature),
        [sentence, selectedHead, temperature]
    );

    const headInfo = getHeadInfo(selectedHead);
    const educationalNote = useMemo(
        () => getEducationalNote(selectedHead, temperature),
        [selectedHead, temperature]
    );

    const activeRow =
        hoveredCell?.row ?? selectedTokenIndex ?? null;

    const tokens = result?.tokens ?? [];
    const n = tokens.length;

    const handlePresetChange = (value: string) => {
        if (value) setSentence(value);
    };

    const mathSteps = result
        ? [
              {
                  title: '1. Embeddings & Projections',
                  formula: 'Q = XW_Q,  K = XW_K,  V = XW_V',
                  dims: `X: ${n}×${result.dModel}  →  Q,K,V: ${n}×${result.dK}`,
                  preview: `Q (preview):\n${formatMatrixPreview(result.Q)}`,
              },
              {
                  title: '2. Raw Scores — QKᵀ',
                  formula: 'Scores = Q · Kᵀ',
                  dims: `${n}×${result.dK} · ${result.dK}×${n}  →  ${n}×${n}`,
                  preview: formatMatrixPreview(result.rawScores),
              },
              {
                  title: '3. Scale',
                  formula: `Scaled = Scores / √d_k  (d_k = ${result.dK})`,
                  dims: `${n}×${n}`,
                  preview: formatMatrixPreview(result.scaledScores),
              },
              {
                  title: '4. Softmax (Temperature τ)',
                  formula: `A_{ij} = exp(s_{ij}/τ) / Σ_k exp(s_{ik}/τ)`,
                  dims: `${n}×${n},  Σ_j A_{ij} = 1`,
                  preview: formatMatrixPreview(result.attentionWeights),
              },
              {
                  title: '5. Output — A × V',
                  formula: 'Out = A · V',
                  dims: `${n}×${n} · ${n}×${result.dK}  →  ${n}×${result.dK}`,
                  preview: formatMatrixPreview(result.output),
              },
          ]
        : [];

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <div className="flex flex-col gap-1 min-w-[280px] flex-1 max-w-lg">
                    <label className="text-xs text-slate-400">Cümle</label>
                    <input
                        type="text"
                        value={sentence}
                        onChange={(e) => setSentence(e.target.value)}
                        placeholder="Bir cümle girin..."
                        className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                    />
                </div>

                <div className="flex flex-col gap-1 min-w-[200px]">
                    <label className="text-xs text-slate-400">Hazır Örnekler</label>
                    <select
                        value=""
                        onChange={(e) => handlePresetChange(e.target.value)}
                        className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-2 text-sm"
                    >
                        <option value="">Seçin...</option>
                        {presetSentences.map((s) => (
                            <option key={s} value={s}>
                                {s.length > 45 ? s.slice(0, 45) + '…' : s}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">Attention Head</label>
                    <select
                        value={selectedHead}
                        onChange={(e) => setHead(e.target.value as AttentionHead)}
                        className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-2 text-sm"
                    >
                        {(Object.keys(HEAD_LABELS) as AttentionHead[]).map((key) => (
                            <option key={key} value={key}>
                                {HEAD_LABELS[key]}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1 min-w-[180px]">
                    <label className="text-xs text-slate-400">
                        Temperature τ: {temperature.toFixed(2)}
                    </label>
                    <input
                        type="range"
                        min={0.1}
                        max={2}
                        step={0.05}
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full accent-violet-500"
                    />
                </div>
            </div>

            {!result ? (
                <div className="flex items-center justify-center h-48 bg-slate-900/30 border border-slate-800 rounded-2xl">
                    <p className="text-slate-500">Geçerli bir cümle girin</p>
                </div>
            ) : (
                <>
                    {/* Head info + stats */}
                    <div className="flex flex-wrap justify-center gap-6 text-sm">
                        <span className="text-slate-500">
                            Token: <span className="text-cyan-400 font-bold">{n}</span>
                        </span>
                        <span className="text-slate-500">
                            d_model: <span className="text-violet-400 font-bold">{result.dModel}</span>
                        </span>
                        <span className="text-slate-500">
                            d_k: <span className="text-violet-400 font-bold">{result.dK}</span>
                        </span>
                        <span className="text-slate-400 text-xs italic">{headInfo.description}</span>
                    </div>

                    {/* Bipartite Graph */}
                    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                        <h3 className="text-sm font-bold text-violet-400 mb-4 text-center">
                            Bipartite Attention Graph
                        </h3>
                        <div className="relative flex justify-between items-stretch min-h-[280px] px-4">
                            {/* Left tokens (Query) */}
                            <div className="flex flex-col justify-around gap-2 z-10">
                                {tokens.map((token, i) => (
                                    <button
                                        key={`left-${i}`}
                                        onClick={() =>
                                            setSelectedToken(selectedTokenIndex === i ? null : i)
                                        }
                                        onMouseEnter={() => setSelectedToken(i)}
                                        className={cn(
                                            'px-3 py-1.5 rounded-lg text-xs font-mono transition-all border',
                                            activeRow === i
                                                ? 'bg-violet-600/30 border-violet-500 text-violet-200'
                                                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-violet-600/50'
                                        )}
                                    >
                                        {token}
                                    </button>
                                ))}
                            </div>

                            {/* SVG connections */}
                            <svg
                                className="absolute inset-0 w-full h-full pointer-events-none"
                                preserveAspectRatio="none"
                            >
                                {activeRow !== null &&
                                    tokens.map((_, j) => {
                                        const weight = result.attentionWeights[activeRow][j];
                                        if (weight < 0.02) return null;

                                        const leftY = ((activeRow + 0.5) / n) * 100;
                                        const rightY = ((j + 0.5) / n) * 100;

                                        return (
                                            <motion.line
                                                key={`edge-${activeRow}-${j}`}
                                                x1="18%"
                                                y1={`${leftY}%`}
                                                x2="82%"
                                                y2={`${rightY}%`}
                                                stroke="#a78bfa"
                                                strokeWidth={1 + weight * 12}
                                                opacity={0.2 + weight * 0.8}
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        );
                                    })}
                            </svg>

                            {/* Right tokens (Key/Value) */}
                            <div className="flex flex-col justify-around gap-2 z-10">
                                {tokens.map((token, j) => {
                                    const weight =
                                        activeRow !== null
                                            ? result.attentionWeights[activeRow][j]
                                            : 0;
                                    return (
                                        <div
                                            key={`right-${j}`}
                                            className={cn(
                                                'px-3 py-1.5 rounded-lg text-xs font-mono border transition-all',
                                                activeRow !== null && weight > 0.05
                                                    ? 'border-emerald-500/60 text-emerald-300'
                                                    : 'bg-slate-800/80 border-slate-700 text-slate-400'
                                            )}
                                            style={{
                                                backgroundColor:
                                                    activeRow !== null
                                                        ? attentionToColor(weight)
                                                        : undefined,
                                                opacity:
                                                    activeRow !== null
                                                        ? 0.5 + weight * 0.5
                                                        : 1,
                                            }}
                                        >
                                            {token}
                                            {activeRow !== null && weight > 0.01 && (
                                                <span className="ml-1 text-[10px] opacity-80">
                                                    {(weight * 100).toFixed(1)}%
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <p className="text-center text-[10px] text-slate-500 mt-3">
                            Sol token&apos;a tıklayın veya üzerine gelin — sağdaki bağlantılar attention ağırlığını gösterir
                        </p>
                    </div>

                    {/* Attention Heatmap */}
                    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-x-auto">
                        <h3 className="text-sm font-bold text-indigo-400 mb-4 text-center">
                            Attention Matrix Heatmap
                        </h3>
                        <div className="inline-block min-w-full">
                            {/* Column headers */}
                            <div className="flex ml-24 mb-1">
                                {tokens.map((token, j) => (
                                    <div
                                        key={`col-${j}`}
                                        className="flex-1 min-w-[48px] text-center text-[10px] text-slate-500 truncate px-0.5"
                                        title={token}
                                    >
                                        {token.length > 6 ? token.slice(0, 5) + '…' : token}
                                    </div>
                                ))}
                            </div>

                            {tokens.map((rowToken, i) => (
                                <div key={`row-${i}`} className="flex items-center mb-0.5">
                                    <div
                                        className={cn(
                                            'w-24 shrink-0 text-right pr-2 text-[10px] font-mono truncate',
                                            activeRow === i ? 'text-violet-300 font-bold' : 'text-slate-500'
                                        )}
                                        title={rowToken}
                                    >
                                        {rowToken}
                                    </div>
                                    <div className="flex flex-1 gap-0.5">
                                        {tokens.map((_, j) => {
                                            const weight = result.attentionWeights[i][j];
                                            const isHovered =
                                                hoveredCell?.row === i && hoveredCell?.col === j;
                                            return (
                                                <div
                                                    key={`cell-${i}-${j}`}
                                                    className={cn(
                                                        'relative flex-1 min-w-[48px] aspect-square rounded-sm cursor-crosshair transition-all',
                                                        isHovered && 'ring-2 ring-white/60 scale-110 z-10'
                                                    )}
                                                    style={{ backgroundColor: attentionToColor(weight) }}
                                                    onMouseEnter={() =>
                                                        setHoveredCell({ row: i, col: j })
                                                    }
                                                    onMouseLeave={() => setHoveredCell(null)}
                                                    onClick={() => setSelectedToken(i)}
                                                >
                                                    <AnimatePresence>
                                                        {isHovered && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 4 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0 }}
                                                                className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none"
                                                            >
                                                                {(weight * 100).toFixed(1)}%
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Color scale */}
                        <div className="flex justify-center items-center gap-3 mt-4 text-xs text-slate-400">
                            <span>0%</span>
                            <div
                                className="h-3 w-48 rounded-full"
                                style={{
                                    background:
                                        'linear-gradient(to right, rgb(30,40,120), rgb(70,160,220))',
                                }}
                            />
                            <span>100%</span>
                        </div>
                    </div>

                    {/* Math Accordion */}
                    <div className="p-4 bg-slate-800/50 rounded-xl">
                        <h4 className="font-bold text-cyan-400 mb-3">
                            📐 Scaled Dot-Product Attention — Adım Adım
                        </h4>
                        <div className="space-y-2">
                            {mathSteps.map((step, idx) => (
                                <div
                                    key={idx}
                                    className="border border-slate-700/50 rounded-lg overflow-hidden"
                                >
                                    <button
                                        onClick={() =>
                                            setExpandedStep(expandedStep === idx ? null : idx)
                                        }
                                        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900/50 hover:bg-slate-900/80 text-left text-sm transition-colors"
                                    >
                                        <span className="font-medium text-slate-200">
                                            {step.title}
                                        </span>
                                        <span className="text-slate-500 text-xs">
                                            {expandedStep === idx ? '▲' : '▼'}
                                        </span>
                                    </button>
                                    <AnimatePresence>
                                        {expandedStep === idx && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 py-3 text-xs text-slate-400 space-y-2 border-t border-slate-700/50">
                                                    <p className="font-mono text-amber-400/90">
                                                        {step.formula}
                                                    </p>
                                                    <p className="text-slate-500">
                                                        Boyut: {step.dims}
                                                    </p>
                                                    <pre className="bg-slate-950/50 rounded p-2 font-mono text-[10px] text-emerald-400/80 overflow-x-auto">
                                                        {step.preview}
                                                    </pre>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Educational note */}
                    <div className="p-4 bg-slate-800/50 rounded-xl text-xs text-slate-400">
                        <h4 className="font-bold text-violet-400 mb-2">
                            🧠 {headInfo.label}
                        </h4>
                        <p className="leading-relaxed">{educationalNote}</p>
                        <p className="mt-2 text-slate-500">
                            Transformer&apos;da birden fazla head paralel çalışır; her biri farklı
                            ilişki türlerini öğrenir ve sonuçlar birleştirilir (concat + projection).
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
