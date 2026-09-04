'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLRUCacheStore } from '@/store/useLRUCacheStore';
import {
    getSnapshot,
    nodePointer,
    SEQUENCES,
    type SequenceName,
} from '@/lib/lruCache';
import { cn } from '@/lib/utils';

const QUICK_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

function getActionTone(type: string): string {
    switch (type) {
        case 'HIT':
            return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
        case 'MISS':
            return 'border-rose-500/40 bg-rose-500/10 text-rose-200';
        case 'EVICT':
            return 'border-red-500/40 bg-red-500/10 text-red-200';
        case 'INSERT':
        case 'UPDATE':
            return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200';
        default:
            return 'border-slate-600/40 bg-slate-800/50 text-slate-300';
    }
}

export default function LRUCacheVisualizer() {
    const {
        engine,
        lastAction,
        isRunningSequence,
        put,
        get,
        setCapacity,
        reset,
        runSequence,
    } = useLRUCacheStore();

    const [getKey, setGetKey] = useState('A');
    const [putKey, setPutKey] = useState('A');
    const [putValue, setPutValue] = useState('1');
    const [ghostEvictedKey, setGhostEvictedKey] = useState<string | null>(null);

    useEffect(() => {
        if (lastAction?.evictedKey) {
            setGhostEvictedKey(lastAction.evictedKey);
            const timer = setTimeout(() => setGhostEvictedKey(null), 800);
            return () => clearTimeout(timer);
        }
    }, [lastAction]);

    const snapshot = useMemo(() => getSnapshot(engine), [engine]);
    const fillRatio = engine.capacity > 0 ? snapshot.orderedKeys.length / engine.capacity : 0;

    const highlightedKey = lastAction?.key ?? null;
    const evictedKey = lastAction?.evictedKey ?? null;
    const isHit = lastAction?.type === 'HIT';
    const isMiss = lastAction?.type === 'MISS';

    const handleRunSequence = (name: SequenceName) => {
        if (!isRunningSequence) runSequence(name);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">Kapasite:</label>
                    <select
                        value={engine.capacity}
                        onChange={(e) => setCapacity(parseInt(e.target.value, 10))}
                        disabled={isRunningSequence}
                        className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                    >
                        {[3, 4, 5, 6, 7].map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        maxLength={1}
                        value={getKey}
                        onChange={(e) => setGetKey(e.target.value.toUpperCase())}
                        disabled={isRunningSequence}
                        className="w-12 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-sm text-center font-mono"
                        placeholder="K"
                    />
                    <button
                        onClick={() => get(getKey)}
                        disabled={isRunningSequence || !getKey}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all"
                    >
                        GET
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        maxLength={1}
                        value={putKey}
                        onChange={(e) => setPutKey(e.target.value.toUpperCase())}
                        disabled={isRunningSequence}
                        className="w-12 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-sm text-center font-mono"
                        placeholder="K"
                    />
                    <input
                        type="text"
                        value={putValue}
                        onChange={(e) => setPutValue(e.target.value)}
                        disabled={isRunningSequence}
                        className="w-16 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-sm text-center font-mono"
                        placeholder="V"
                    />
                    <button
                        onClick={() => put(putKey, putValue)}
                        disabled={isRunningSequence || !putKey}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all"
                    >
                        PUT
                    </button>
                </div>

                <div className="flex items-center gap-1">
                    {QUICK_KEYS.map((key) => (
                        <button
                            key={key}
                            onClick={() => get(key)}
                            disabled={isRunningSequence}
                            className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold font-mono transition-all"
                        >
                            {key}
                        </button>
                    ))}
                </div>

                <select
                    defaultValue=""
                    onChange={(e) => {
                        if (e.target.value) handleRunSequence(e.target.value as SequenceName);
                        e.target.value = '';
                    }}
                    disabled={isRunningSequence}
                    className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                >
                    <option value="" disabled>Senaryo seç</option>
                    {(Object.entries(SEQUENCES) as [SequenceName, { label: string }][]).map(
                        ([name, seq]) => (
                            <option key={name} value={name}>{seq.label}</option>
                        )
                    )}
                </select>

                <button
                    onClick={reset}
                    disabled={isRunningSequence}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all"
                >
                    Sıfırla
                </button>
            </div>

            {/* Metrics */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <div>
                    <span className="text-slate-500">Cache Hits: </span>
                    <span className="text-emerald-400 font-bold font-mono">{snapshot.hits}</span>
                </div>
                <div>
                    <span className="text-slate-500">Cache Misses: </span>
                    <span className="text-rose-400 font-bold font-mono">{snapshot.misses}</span>
                </div>
                <div>
                    <span className="text-slate-500">Hit Ratio: </span>
                    <span className="text-violet-400 font-bold font-mono">
                        {(snapshot.hitRatio * 100).toFixed(1)}%
                    </span>
                </div>
                <div>
                    <span className="text-slate-500">Doluluk: </span>
                    <span className="text-cyan-400 font-bold font-mono">
                        {snapshot.orderedKeys.length} / {engine.capacity}
                    </span>
                </div>
            </div>

            {/* Doubly Linked List */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-emerald-400">MRU (Head)</h3>
                    <h3 className="text-sm font-bold text-rose-400">LRU (Tail)</h3>
                </div>

                <div className="flex items-center justify-center min-h-[120px] overflow-x-auto py-4">
                    {snapshot.orderedKeys.length === 0 ? (
                        <p className="text-slate-500 text-sm">Önbellek boş — PUT ile eleman ekleyin.</p>
                    ) : (
                        <div className="flex items-center gap-1">
                            <AnimatePresence mode="popLayout">
                                {snapshot.orderedKeys.map((key, index) => {
                                    const node = engine.nodes[key];
                                    const isHead = index === 0;
                                    const isTail = index === snapshot.orderedKeys.length - 1;
                                    const isHighlighted = highlightedKey === key;
                                    const isEvicted = evictedKey === key && lastAction?.type === 'EVICT';

                                    return (
                                        <div key={key} className="flex items-center">
                                            {index > 0 && (
                                                <div className="flex flex-col items-center mx-1 text-slate-500">
                                                    <span className="text-[10px]">↔</span>
                                                </div>
                                            )}
                                            <motion.div
                                                layout
                                                layoutId={`lru-node-${key}`}
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{
                                                    scale: isEvicted ? [1, 1.08, 0.95, 1] : isHighlighted ? [1, 1.05, 1] : 1,
                                                    opacity: 1,
                                                    boxShadow: isEvicted
                                                        ? '0 0 24px rgba(239, 68, 68, 0.8)'
                                                        : isHighlighted && isHit
                                                            ? '0 0 20px rgba(16, 185, 129, 0.5)'
                                                            : '0 0 0 rgba(0,0,0,0)',
                                                }}
                                                exit={{ scale: 0.5, opacity: 0, x: 20 }}
                                                transition={{
                                                    layout: { type: 'spring', stiffness: 350, damping: 30 },
                                                    scale: isEvicted ? { repeat: 2, duration: 0.3 } : { duration: 0.3 },
                                                }}
                                                className={cn(
                                                    'relative w-20 h-24 rounded-xl border-2 flex flex-col items-center justify-center font-mono',
                                                    isEvicted
                                                        ? 'border-red-500 bg-red-950/60'
                                                        : isHead
                                                            ? 'border-emerald-500 bg-emerald-950/40'
                                                            : isTail
                                                                ? 'border-rose-500/70 bg-rose-950/30'
                                                                : 'border-slate-600 bg-slate-800/80'
                                                )}
                                            >
                                                <span className="text-lg font-bold text-white">{key}</span>
                                                <span className="text-[10px] text-slate-400 mt-1">
                                                    val: {node?.value ?? '—'}
                                                </span>
                                                <span className="text-[9px] text-slate-500 mt-1">
                                                    {nodePointer(key)}
                                                </span>
                                                {isHead && (
                                                    <span className="absolute -top-2 text-[9px] text-emerald-400 font-bold">
                                                        HEAD
                                                    </span>
                                                )}
                                                {isTail && (
                                                    <span className="absolute -bottom-2 text-[9px] text-rose-400 font-bold">
                                                        TAIL
                                                    </span>
                                                )}
                                            </motion.div>
                                        </div>
                                    );
                                })}
                            </AnimatePresence>
                            {ghostEvictedKey && (
                                <motion.div
                                    initial={{ opacity: 1, scale: 1 }}
                                    animate={{ opacity: 0, scale: 0.6, x: 30 }}
                                    transition={{ duration: 0.8 }}
                                    className="ml-2 w-20 h-24 rounded-xl border-2 border-red-500 bg-red-950/70 flex flex-col items-center justify-center font-mono"
                                >
                                    <span className="text-lg font-bold text-red-300 line-through">
                                        {ghostEvictedKey}
                                    </span>
                                    <span className="text-[9px] text-red-400 mt-1 font-bold">EVICTED</span>
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                        style={{ width: `${fillRatio * 100}%` }}
                    />
                </div>
            </div>

            {/* Hash Map */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-slate-300 mb-4">
                    Hash Map — O(1) Lookup
                </h3>

                {Object.keys(engine.cacheMap).length === 0 ? (
                    <p className="text-slate-500 text-sm">Hash map boş.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm font-mono">
                            <thead>
                                <tr className="text-slate-500 text-xs">
                                    <th className="py-2 px-3 text-left border-b border-slate-700">Key</th>
                                    <th className="py-2 px-3 text-left border-b border-slate-700">Value</th>
                                    <th className="py-2 px-3 text-left border-b border-slate-700">Node Pointer</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(engine.cacheMap)
                                    .sort()
                                    .map((key) => {
                                        const isRowHighlighted = highlightedKey === key;
                                        return (
                                            <motion.tr
                                                key={key}
                                                animate={{
                                                    backgroundColor: isRowHighlighted
                                                        ? isMiss
                                                            ? 'rgba(239, 68, 68, 0.15)'
                                                            : isHit
                                                                ? 'rgba(16, 185, 129, 0.15)'
                                                                : 'rgba(6, 182, 212, 0.15)'
                                                        : 'transparent',
                                                }}
                                                className="border-b border-slate-800"
                                            >
                                                <td className={cn(
                                                    'py-2 px-3 font-bold',
                                                    isRowHighlighted && isHit && 'text-emerald-400',
                                                    isRowHighlighted && isMiss && 'text-rose-400',
                                                    isRowHighlighted && !isHit && !isMiss && 'text-cyan-400',
                                                    !isRowHighlighted && 'text-slate-200'
                                                )}>
                                                    {key}
                                                </td>
                                                <td className="py-2 px-3 text-slate-300">
                                                    {engine.cacheMap[key]}
                                                </td>
                                                <td className="py-2 px-3 text-violet-400">
                                                    → {nodePointer(key)}
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Educational note */}
            <div className={cn(
                'p-4 rounded-xl border text-sm',
                lastAction ? getActionTone(lastAction.type) : 'border-slate-700/50 bg-slate-800/50 text-slate-300'
            )}>
                {lastAction?.message ??
                    'LRU Cache, Hash Map ile O(1) erişim ve Doubly Linked List ile O(1) taşıma/tahliye sağlar. GET veya PUT ile başlayın.'}
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl text-xs text-slate-400 leading-relaxed">
                Hash map anahtarı düğüme anında yönlendirir; doubly linked list kullanım sırasını takip eder.
                Kapasite dolduğunda tail (LRU) düğümü silinir, yeni eleman head (MRU) konumuna eklenir.
                Her GET/PUT işlemi ilgili düğümü head&apos;e taşır — böylece tüm operasyonlar O(1) kalır.
            </div>
        </div>
    );
}
