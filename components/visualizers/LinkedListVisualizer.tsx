'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLinkedListStore, type LinkedListType, type ListSpeed } from '@/store/useLinkedListStore';
import { getOrderedNodes, getSpeedMs, type ListNode, type PointerState } from '@/lib/linkedList';
import { cn } from '@/lib/utils';

const NODE_WIDTH = 88;
const NODE_GAP = 48;

function ListNodeBox({
    node,
    listType,
    isActive,
    pointers,
    onDelete,
}: {
    node: ListNode;
    listType: LinkedListType;
    isActive: boolean;
    pointers: PointerState[];
    onDelete: () => void;
}) {
    const nodePointers = pointers.filter((p) => p.nodeId === node.id);

    return (
        <div className="relative flex flex-col items-center">
            {nodePointers.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center mb-2 max-w-[100px]">
                    {nodePointers.map((p) => (
                        <span
                            key={p.name}
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded border"
                            style={{ color: p.color, borderColor: p.color, backgroundColor: `${p.color}22` }}
                        >
                            {p.name}
                        </span>
                    ))}
                </div>
            )}
            <motion.div
                animate={{ scale: isActive ? [1, 1.08, 1] : 1 }}
                transition={isActive ? { repeat: Infinity, duration: 0.8 } : {}}
                className={cn(
                    'border-2 rounded-xl overflow-hidden font-mono',
                    isActive
                        ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)]'
                        : 'border-slate-600'
                )}
            >
                <div className="bg-slate-800 px-3 py-2 text-center text-white font-bold text-sm border-b border-slate-600">
                    {node.value}
                </div>
                <div className="bg-slate-900 px-2 py-1 text-[9px] text-slate-500 text-center">
                    {listType === 'doubly' ? 'prev/next' : 'next →'}
                </div>
            </motion.div>
            <button
                onClick={onDelete}
                className="mt-1 text-[9px] text-slate-600 hover:text-rose-400 transition-colors"
            >
                sil
            </button>
        </div>
    );
}

export default function LinkedListVisualizer() {
    const {
        listType,
        nodes,
        headId,
        cycleTargetId,
        steps,
        currentStepIndex,
        isPlaying,
        speed,
        hasCycle,
        setListType,
        insertHead,
        insertTail,
        deleteNode,
        reverse,
        createCycle,
        runFloydCycle,
        stepForward,
        stepBackward,
        play,
        pause,
        reset,
        setSpeed,
        applyCurrentStep,
    } = useLinkedListStore();

    const [inputValue, setInputValue] = useState('50');
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

    const displayState = useMemo(() => {
        if (currentStep) {
            return {
                nodes: currentStep.nodes,
                cycleTargetId: currentStep.cycleTargetId ?? cycleTargetId,
                pointers: currentStep.pointers,
                activeNodeId: currentStep.activeNodeId,
                description: currentStep.description,
            };
        }
        return {
            nodes,
            cycleTargetId,
            pointers: [
                { name: 'HEAD', nodeId: headId, color: '#3b82f6' },
            ],
            activeNodeId: undefined,
            description: 'Değer ekleyin veya bir algoritma çalıştırın.',
        };
    }, [currentStep, nodes, headId, cycleTargetId]);

    const orderedNodes = useMemo(() => {
        return getOrderedNodes({
            listType,
            nodes: displayState.nodes,
            headId: headId,
            cycleTargetId: displayState.cycleTargetId,
        });
    }, [displayState.nodes, headId, displayState.cycleTargetId, listType]);

    useEffect(() => {
        if (isPlaying && currentStepIndex < steps.length - 1) {
            intervalRef.current = setInterval(() => {
                const s = useLinkedListStore.getState();
                if (s.currentStepIndex < s.steps.length - 1) {
                    useLinkedListStore.setState({ currentStepIndex: s.currentStepIndex + 1 });
                } else {
                    useLinkedListStore.getState().applyCurrentStep();
                    useLinkedListStore.setState({ isPlaying: false });
                }
            }, getSpeedMs(speed));
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (isPlaying && currentStepIndex >= steps.length - 1 && steps.length > 0) {
                applyCurrentStep();
                pause();
            }
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPlaying, speed, currentStepIndex, steps.length, applyCurrentStep, pause]);

    const handleInsertHead = () => {
        const val = parseInt(inputValue, 10);
        if (!isNaN(val)) insertHead(val);
    };

    const handleInsertTail = () => {
        const val = parseInt(inputValue, 10);
        if (!isNaN(val)) insertTail(val);
    };

    const tailId = orderedNodes.length > 0 ? orderedNodes[orderedNodes.length - 1].id : null;
    const totalWidth = orderedNodes.length * (NODE_WIDTH + NODE_GAP);

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1">
                    {(['singly', 'doubly', 'circular'] as LinkedListType[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setListType(t)}
                            disabled={isPlaying}
                            className={cn(
                                'px-2 py-1.5 rounded-lg text-xs font-bold capitalize transition-all',
                                listType === t ? 'bg-violet-600 text-white' : 'text-slate-400'
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isPlaying}
                    className="w-16 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-sm text-center font-mono"
                />
                <button
                    onClick={handleInsertHead}
                    disabled={isPlaying}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
                >
                    Insert Head
                </button>
                <button
                    onClick={handleInsertTail}
                    disabled={isPlaying}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
                >
                    Insert Tail
                </button>

                <div className="w-px h-6 bg-slate-700" />

                <button
                    onClick={reverse}
                    disabled={isPlaying}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
                >
                    Reverse List
                </button>
                <button
                    onClick={createCycle}
                    disabled={isPlaying || listType === 'circular'}
                    className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50',
                        hasCycle
                            ? 'bg-rose-600 hover:bg-rose-500 text-white'
                            : 'bg-amber-600 hover:bg-amber-500 text-white'
                    )}
                >
                    {hasCycle ? 'Remove Cycle' : 'Create Cycle'}
                </button>
                <button
                    onClick={runFloydCycle}
                    disabled={isPlaying}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
                >
                    Run Floyd&apos;s Detection
                </button>

                <div className="w-px h-6 bg-slate-700" />

                <button onClick={play} disabled={isPlaying || steps.length === 0} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold">▶</button>
                <button onClick={pause} disabled={!isPlaying} className="px-3 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold">⏸</button>
                <button onClick={stepBackward} disabled={currentStepIndex <= 0} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold">◀</button>
                <button onClick={stepForward} disabled={steps.length === 0 || currentStepIndex >= steps.length - 1} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold">▶|</button>
                <button onClick={reset} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold">Sıfırla</button>

                <select
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value as ListSpeed)}
                    className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                >
                    <option value="slow">Yavaş</option>
                    <option value="normal">Normal</option>
                    <option value="fast">Hızlı</option>
                </select>
            </div>

            {/* Step indicator */}
            {steps.length > 0 && (
                <div className="text-center text-sm text-slate-400">
                    Adım {currentStepIndex + 1} / {steps.length}
                </div>
            )}

            {/* List visualization */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 overflow-x-auto">
                {orderedNodes.length === 0 ? (
                    <p className="text-center text-slate-500">Liste boş — Insert Head veya Insert Tail ile başlayın.</p>
                ) : (
                    <div className="relative mx-auto" style={{ width: Math.max(totalWidth, 300), minHeight: 140 }}>
                        <svg
                            className="absolute inset-0 pointer-events-none"
                            width={Math.max(totalWidth, 300)}
                            height={140}
                        >
                            {orderedNodes.map((node, i) => {
                                if (i >= orderedNodes.length - 1) return null;
                                const x1 = i * (NODE_WIDTH + NODE_GAP) + NODE_WIDTH;
                                const x2 = (i + 1) * (NODE_WIDTH + NODE_GAP);
                                const y = 70;
                                return (
                                    <g key={`arrow-${node.id}`}>
                                        <line x1={x1} y1={y} x2={x2 - 6} y2={y} stroke="#64748b" strokeWidth={2} />
                                        <polygon
                                            points={`${x2 - 6},${y - 4} ${x2},${y} ${x2 - 6},${y + 4}`}
                                            fill="#64748b"
                                        />
                                        {listType === 'doubly' && (
                                            <>
                                                <line x1={x2} y1={y + 12} x2={x1 + 6} y2={y + 12} stroke="#475569" strokeWidth={1.5} strokeDasharray="3 2" />
                                                <polygon
                                                    points={`${x1 + 6},${y + 8} ${x1},${y + 12} ${x1 + 6},${y + 16}`}
                                                    fill="#475569"
                                                />
                                            </>
                                        )}
                                    </g>
                                );
                            })}

                            {hasCycle && tailId && displayState.cycleTargetId && (
                                <path
                                    d={`M ${(orderedNodes.length - 1) * (NODE_WIDTH + NODE_GAP) + NODE_WIDTH / 2} 100 
                                        Q ${totalWidth / 2} 150, ${orderedNodes.findIndex((n) => n.id === displayState.cycleTargetId) * (NODE_WIDTH + NODE_GAP) + NODE_WIDTH / 2} 100`}
                                    fill="none"
                                    stroke="#f87171"
                                    strokeWidth={2}
                                    strokeDasharray="6 4"
                                />
                            )}
                        </svg>

                        <div className="flex items-start relative" style={{ paddingTop: 20 }}>
                            {orderedNodes.map((node) => (
                                <div
                                    key={node.id}
                                    style={{ width: NODE_WIDTH, marginRight: NODE_GAP }}
                                >
                                    <ListNodeBox
                                        node={node}
                                        listType={listType}
                                        isActive={displayState.activeNodeId === node.id}
                                        pointers={displayState.pointers}
                                        onDelete={() => deleteNode(node.id)}
                                    />
                                </div>
                            ))}
                            <span className="text-slate-600 text-lg self-center">→ NULL</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Pointer legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
                <span><span className="text-blue-400 font-bold">HEAD</span> liste başı</span>
                <span><span className="text-yellow-400 font-bold">TAIL</span> liste sonu</span>
                <span><span className="text-emerald-400 font-bold">🐢 SLOW</span> Floyd yavaş</span>
                <span><span className="text-orange-400 font-bold">🐇 FAST</span> Floyd hızlı</span>
                {hasCycle && <span className="text-rose-400">Kesikli kırmızı ok = döngü</span>}
            </div>

            {/* Description */}
            <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-800/50 text-sm text-slate-300">
                {currentStep?.description ?? displayState.description}
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl text-xs text-slate-400 leading-relaxed">
                Bağlı liste düğümleri bellekte ardışık olmak zorunda değildir; pointer&apos;lar bir sonraki (ve doubly&apos;de önceki) düğümü takip eder.
                Reverse üç pointer ile O(n) sürede yapılır. Floyd&apos;s Cycle Detection (Tortoise & Hare) döngüyü O(n) zaman ve O(1) ek alanla bulur.
            </div>
        </div>
    );
}
