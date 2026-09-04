'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBTreeStore, BTreeNode, BTreeSpeed } from '@/store/useBTreeStore';
import { cn } from '@/lib/utils';

function TreeNode({
    node,
    highlightedNodeId,
    highlightedKey,
}: {
    node: BTreeNode;
    highlightedNodeId: string | null;
    highlightedKey: number | null;
}) {
    const isNodeHighlighted = highlightedNodeId === node.id;
    const hasChildren = node.children.length > 0;

    return (
        <div className="flex flex-col items-center">
            <motion.div
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                    scale: isNodeHighlighted && highlightedKey !== null ? [1, 1.05, 1] : 1,
                    opacity: 1,
                }}
                transition={
                    isNodeHighlighted && highlightedKey !== null
                        ? { repeat: 2, duration: 0.4 }
                        : { duration: 0.3 }
                }
                className={cn(
                    "flex border-2 rounded-lg overflow-hidden mb-2",
                    isNodeHighlighted
                        ? "border-violet-500 shadow-[0_0_25px_rgba(139,92,246,0.6)]"
                        : "border-slate-600"
                )}
            >
                {node.keys.length === 0 ? (
                    <div className="w-12 h-12 flex items-center justify-center bg-slate-800 text-slate-600">
                        -
                    </div>
                ) : (
                    node.keys.map((key, i) => {
                        const isKeyMatch = isNodeHighlighted && highlightedKey === key;
                        return (
                            <motion.div
                                key={`${node.id}-${key}`}
                                initial={{ scale: 0 }}
                                animate={{
                                    scale: isKeyMatch ? [1, 1.2, 1] : 1,
                                }}
                                transition={
                                    isKeyMatch
                                        ? { repeat: Infinity, duration: 1.2, repeatType: 'reverse' }
                                        : { duration: 0.3 }
                                }
                                className={cn(
                                    "w-12 h-12 flex items-center justify-center font-mono font-bold text-white",
                                    i > 0 && "border-l-2 border-slate-600",
                                    isKeyMatch
                                        ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.6)]"
                                        : isNodeHighlighted
                                            ? "bg-violet-600"
                                            : "bg-slate-800"
                                )}
                            >
                                {key}
                            </motion.div>
                        );
                    })
                )}
            </motion.div>

            {hasChildren && (
                <div className="relative">
                    <svg
                        className="absolute left-0 right-0 h-8 -top-0 pointer-events-none"
                        style={{ width: '100%', overflow: 'visible' }}
                    >
                        {node.children.map((_, i) => {
                            const total = node.children.length;
                            const step = 100 / total;
                            const x = step * i + step / 2;
                            return (
                                <line
                                    key={i}
                                    x1="50%"
                                    y1="0"
                                    x2={`${x}%`}
                                    y2="100%"
                                    stroke="#475569"
                                    strokeWidth="2"
                                />
                            );
                        })}
                    </svg>

                    <div className="flex gap-4 pt-8">
                        {node.children.map((child) => (
                            <TreeNode
                                key={child.id}
                                node={child}
                                highlightedNodeId={highlightedNodeId}
                                highlightedKey={highlightedKey}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BTreeVisualizer() {
    const {
        root,
        order,
        highlightedNodeId,
        highlightedKey,
        isAnimating,
        speed,
        setSpeed,
        insertKey,
        searchKey,
        reset,
    } = useBTreeStore();

    const [inputValue, setInputValue] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const [searchFeedback, setSearchFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleInsert = useCallback(async () => {
        const num = parseInt(inputValue.trim(), 10);
        if (!isNaN(num)) {
            setSearchFeedback(null);
            await insertKey(num);
            setInputValue('');
        }
    }, [inputValue, insertKey]);

    const handleSearch = useCallback(async () => {
        const num = parseInt(searchValue.trim(), 10);
        if (isNaN(num)) return;

        const found = await searchKey(num);
        if (found) {
            setSearchFeedback({ type: 'success', message: `Key ${num} found in the tree.` });
        } else {
            setSearchFeedback({ type: 'error', message: `Key ${num} not found in the tree.` });
        }
    }, [searchValue, searchKey]);

    const handleRandom = useCallback(async () => {
        setSearchFeedback(null);
        for (let i = 0; i < 10; i++) {
            await insertKey(Math.floor(Math.random() * 99) + 1);
        }
    }, [insertKey]);

    const handleReset = useCallback(() => {
        setSearchFeedback(null);
        setInputValue('');
        setSearchValue('');
        reset();
    }, [reset]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
                        disabled={isAnimating}
                        placeholder="Enter key..."
                        className="w-28 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <button
                        onClick={handleInsert}
                        disabled={isAnimating || !inputValue}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
                    >
                        Insert
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        disabled={isAnimating || !root}
                        placeholder="Search key..."
                        className="w-28 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isAnimating || !searchValue || !root}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
                    >
                        Search
                    </button>
                </div>

                <button
                    onClick={handleRandom}
                    disabled={isAnimating}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
                >
                    Random 10
                </button>

                <button
                    onClick={handleReset}
                    disabled={isAnimating}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-sm"
                >
                    Reset
                </button>

                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                    {(['slow', 'normal', 'fast'] as BTreeSpeed[]).map((s) => (
                        <button
                            key={s}
                            onClick={() => setSpeed(s)}
                            disabled={isAnimating}
                            className={cn(
                                "px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-all",
                                speed === s
                                    ? "bg-violet-600 text-white shadow-lg"
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <span className="px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-lg border border-slate-700">
                    t={order} (max {2 * order - 1} keys)
                </span>
            </div>

            <AnimatePresence>
                {searchFeedback && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={cn(
                            "mx-auto px-4 py-2 rounded-xl text-sm font-medium border",
                            searchFeedback.type === 'success'
                                ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-400"
                                : "bg-rose-950/30 border-rose-500/40 text-rose-400"
                        )}
                    >
                        {searchFeedback.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="min-h-[400px] p-8 bg-slate-900/30 border border-slate-800 rounded-2xl overflow-auto flex justify-center items-start">
                {root ? (
                    <TreeNode
                        node={root}
                        highlightedNodeId={highlightedNodeId}
                        highlightedKey={highlightedKey}
                    />
                ) : (
                    <div className="text-center text-slate-600 mt-20">
                        <div className="text-5xl mb-4">🌳</div>
                        <p>Empty B-Tree. Insert a key to get started.</p>
                    </div>
                )}
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl text-xs text-slate-400">
                <h4 className="font-bold text-violet-400 mb-2">B-Tree (t={order})</h4>
                <ul className="space-y-1">
                    <li>• Each node holds at most <strong className="text-amber-400">{2 * order - 1}</strong> keys</li>
                    <li>• Each node has at most <strong className="text-amber-400">{2 * order}</strong> children</li>
                    <li>• When full, nodes <strong className="text-rose-400">SPLIT</strong> and the middle key moves up</li>
                </ul>
            </div>
        </div>
    );
}
