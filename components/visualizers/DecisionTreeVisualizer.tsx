'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useDecisionTreeStore } from '@/store/useDecisionTreeStore';
import {
    extractSplitLines,
    GRID_RESOLUTION,
    type PresetName,
    type TreeNode,
} from '@/lib/decisionTree';
import { cn } from '@/lib/utils';

const CANVAS_SIZE = 400;

function toCanvasX(value: number): number {
    return (value / 100) * CANVAS_SIZE;
}

function toCanvasY(value: number): number {
    return CANVAS_SIZE - (value / 100) * CANVAS_SIZE;
}

function getDepthMessage(maxDepth: number): { title: string; body: string; tone: string } {
    if (maxDepth <= 2) {
        return {
            title: 'Underfitting',
            body: 'Model verideki örüntüyü yakalayamıyor; basit bir çizgiyle bölüyor.',
            tone: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
        };
    }
    if (maxDepth <= 5) {
        return {
            title: 'Dengeli Genelleme',
            body: 'Doğal karar sınırları oluştu; model veri yapısını makul şekilde öğreniyor.',
            tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
        };
    }
    return {
        title: 'Overfitting Uyarısı',
        body: 'Ağaç tekil aykırı değerleri (noise) izole etmek için gereksiz küçük kutular açmaya başladı.',
        tone: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
    };
}

function TreeDiagramNode({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
    const isLeaf = node.prediction !== undefined;

    return (
        <div className={cn('flex flex-col items-center', depth > 0 && 'mt-3')}>
            <div
                className={cn(
                    'px-3 py-2 rounded-lg border text-xs font-mono text-center min-w-[140px]',
                    isLeaf
                        ? 'bg-slate-800/80 border-slate-600 text-slate-200'
                        : 'bg-violet-950/40 border-violet-500/40 text-violet-100'
                )}
            >
                {isLeaf ? (
                    <>
                        <div className="font-bold">
                            Sınıf: {node.prediction === 0 ? 'Mavi (0)' : 'Kırmızı (1)'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                            Gini/Ent: {node.impurity.toFixed(3)} · n={node.samples}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="font-bold">
                            {node.feature} &le; {node.threshold.toFixed(1)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                            Safsızlık: {node.impurity.toFixed(3)} · n={node.samples}
                        </div>
                    </>
                )}
            </div>

            {!isLeaf && (node.left || node.right) && (
                <div className="flex gap-6 mt-3 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-3 bg-slate-600" />
                    {node.left && (
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-500 mb-1">Sol</span>
                            <TreeDiagramNode node={node.left} depth={depth + 1} />
                        </div>
                    )}
                    {node.right && (
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-500 mb-1">Sağ</span>
                            <TreeDiagramNode node={node.right} depth={depth + 1} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function DecisionTreeVisualizer() {
    const {
        points,
        selectedClass,
        maxDepth,
        criterion,
        tree,
        decisionGrid,
        metrics,
        addPoint,
        clearPoints,
        loadPreset,
        setMaxDepth,
        setCriterion,
        setSelectedClass,
        generateRandom,
        trainTree,
    } = useDecisionTreeStore();

    useEffect(() => {
        trainTree();
    }, [trainTree]);

    const splitLines = useMemo(() => extractSplitLines(tree), [tree]);
    const depthMessage = getDepthMessage(maxDepth);
    const cellSize = CANVAS_SIZE / GRID_RESOLUTION;

    const handleCanvasClick = useCallback(
        (event: React.MouseEvent<SVGSVGElement>) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const canvasX = ((event.clientX - rect.left) / rect.width) * CANVAS_SIZE;
            const canvasY = ((event.clientY - rect.top) / rect.height) * CANVAS_SIZE;
            const x = (canvasX / CANVAS_SIZE) * 100;
            const y = ((CANVAS_SIZE - canvasY) / CANVAS_SIZE) * 100;
            addPoint(
                Math.max(0, Math.min(100, x)),
                Math.max(0, Math.min(100, y))
            );
        },
        [addPoint]
    );

    const handlePresetChange = (value: string) => {
        loadPreset(value as PresetName);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Nokta Sınıfı:</span>
                    <button
                        onClick={() => setSelectedClass(0)}
                        className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                            selectedClass === 0
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        )}
                    >
                        Mavi (0)
                    </button>
                    <button
                        onClick={() => setSelectedClass(1)}
                        className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                            selectedClass === 1
                                ? 'bg-red-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        )}
                    >
                        Kırmızı (1)
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <label className="text-xs text-slate-400 whitespace-nowrap">
                        Max Depth: <span className="text-violet-400 font-bold">{maxDepth}</span>
                    </label>
                    <input
                        type="range"
                        min={1}
                        max={10}
                        value={maxDepth}
                        onChange={(e) => setMaxDepth(parseInt(e.target.value, 10))}
                        className="w-32 accent-violet-500"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">Kriter:</label>
                    <select
                        value={criterion}
                        onChange={(e) => setCriterion(e.target.value as 'gini' | 'entropy')}
                        className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                    >
                        <option value="gini">Gini Impurity</option>
                        <option value="entropy">Entropy</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">Preset:</label>
                    <select
                        onChange={(e) => handlePresetChange(e.target.value)}
                        defaultValue=""
                        className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                    >
                        <option value="" disabled>
                            Veri kümesi seç
                        </option>
                        <option value="linear">Linear Separable</option>
                        <option value="moons">Moons (İki Hilal)</option>
                        <option value="circles">Concentric Circles</option>
                        <option value="xor">XOR Pattern</option>
                    </select>
                </div>

                <button
                    onClick={clearPoints}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all"
                >
                    Temizle
                </button>

                <button
                    onClick={() => generateRandom(20)}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold transition-all"
                >
                    Rastgele 20 Nokta
                </button>
            </div>

            {/* Metrics */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <div>
                    <span className="text-slate-500">Doğruluk: </span>
                    <span className="text-emerald-400 font-bold font-mono">
                        {(metrics.accuracy * 100).toFixed(1)}%
                    </span>
                </div>
                <div>
                    <span className="text-slate-500">Düğüm Sayısı: </span>
                    <span className="text-violet-400 font-bold font-mono">{metrics.totalNodes}</span>
                </div>
                <div>
                    <span className="text-slate-500">Ağaç Derinliği: </span>
                    <span className="text-cyan-400 font-bold font-mono">{metrics.treeDepth}</span>
                </div>
                <div>
                    <span className="text-slate-500">Nokta: </span>
                    <span className="text-slate-300 font-bold font-mono">{points.length}</span>
                </div>
            </div>

            {/* Main visualization */}
            <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6">
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
                        {/* Decision regions */}
                        {decisionGrid.map((row, rowIndex) =>
                            row.map((label, colIndex) => (
                                <rect
                                    key={`${rowIndex}-${colIndex}`}
                                    x={colIndex * cellSize}
                                    y={rowIndex * cellSize}
                                    width={cellSize + 0.5}
                                    height={cellSize + 0.5}
                                    fill={label === 0 ? 'rgba(59, 130, 246, 0.18)' : 'rgba(239, 68, 68, 0.18)'}
                                />
                            ))
                        )}

                        {/* Split lines */}
                        {splitLines.map((line, index) =>
                            line.feature === 'x' ? (
                                <line
                                    key={`split-${index}`}
                                    x1={toCanvasX(line.threshold)}
                                    y1={toCanvasY(line.yMax)}
                                    x2={toCanvasX(line.threshold)}
                                    y2={toCanvasY(line.yMin)}
                                    stroke="rgba(250, 204, 21, 0.85)"
                                    strokeWidth={1.5}
                                    strokeDasharray="4 3"
                                />
                            ) : (
                                <line
                                    key={`split-${index}`}
                                    x1={toCanvasX(line.xMin)}
                                    y1={toCanvasY(line.threshold)}
                                    x2={toCanvasX(line.xMax)}
                                    y2={toCanvasY(line.threshold)}
                                    stroke="rgba(250, 204, 21, 0.85)"
                                    strokeWidth={1.5}
                                    strokeDasharray="4 3"
                                />
                            )
                        )}

                        {/* Axes border */}
                        <rect
                            x={0}
                            y={0}
                            width={CANVAS_SIZE}
                            height={CANVAS_SIZE}
                            fill="none"
                            stroke="rgba(148, 163, 184, 0.25)"
                            strokeWidth={1}
                        />

                        {/* Data points */}
                        {points.map((point, index) => (
                            <circle
                                key={`point-${index}`}
                                cx={toCanvasX(point.x)}
                                cy={toCanvasY(point.y)}
                                r={6}
                                fill={point.label === 0 ? '#3b82f6' : '#ef4444'}
                                stroke="#0f172a"
                                strokeWidth={2}
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
                    </svg>
                </div>

                {/* Tree diagram */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 overflow-auto min-h-[400px]">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Karar Ağacı Yapısı</h3>
                    {tree ? (
                        <div className="overflow-x-auto pb-4">
                            <TreeDiagramNode node={tree} />
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">
                            Ağacı görmek için en az bir veri noktası ekleyin veya bir preset yükleyin.
                        </p>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    Mavi Sınıf (0)
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    Kırmızı Sınıf (1)
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-8 h-0.5 border-t-2 border-dashed border-yellow-400" />
                    Karar Sınırı
                </div>
            </div>

            {/* Educational note */}
            <div className={cn('p-4 rounded-xl border text-sm', depthMessage.tone)}>
                <span className="font-bold">{depthMessage.title}: </span>
                {depthMessage.body}
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl text-xs text-slate-400 leading-relaxed">
                CART algoritması her düğümde x veya y eksenine paralel en iyi bölmeyi seçer.
                Gini Gain / Information Gain maksimize edilir. Karar ağaçları doğrusal olmayan
                sınırları dikdörtgen kutularla yaklaşık olarak modeller — bu yüzden dairesel veya
                XOR gibi örüntülerde derinlik arttıkça overfitting görülür.
            </div>
        </div>
    );
}
