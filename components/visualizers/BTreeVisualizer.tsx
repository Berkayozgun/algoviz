'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useBTreeStore, BTreeNode } from '@/store/useBTreeStore';
import { cn } from '@/lib/utils';

// Calculate tree width for proper spacing
function getTreeWidth(node: BTreeNode | null): number {
    if (!node) return 0;
    if (node.children.length === 0) return 1;
    return node.children.reduce((sum, child) => sum + getTreeWidth(child), 0);
}

// Recursive Tree Node Component
function TreeNode({
    node,
    highlightedNodeId,
}: {
    node: BTreeNode;
    highlightedNodeId: string | null;
}) {
    const isHighlighted = highlightedNodeId === node.id;
    const hasChildren = node.children.length > 0;

    return (
        <div className="flex flex-col items-center">
            {/* The Node Box */}
            <motion.div
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                    "flex border-2 rounded-lg overflow-hidden mb-2",
                    isHighlighted
                        ? "border-violet-500 shadow-[0_0_25px_rgba(139,92,246,0.6)]"
                        : "border-slate-600"
                )}
            >
                {node.keys.length === 0 ? (
                    <div className="w-12 h-12 flex items-center justify-center bg-slate-800 text-slate-600">
                        -
                    </div>
                ) : (
                    node.keys.map((key, i) => (
                        <motion.div
                            key={`${node.id}-${key}`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={cn(
                                "w-12 h-12 flex items-center justify-center font-mono font-bold text-white",
                                i > 0 && "border-l-2 border-slate-600",
                                isHighlighted ? "bg-violet-600" : "bg-slate-800"
                            )}
                        >
                            {key}
                        </motion.div>
                    ))
                )}
            </motion.div>

            {/* Children with connecting lines */}
            {hasChildren && (
                <div className="relative">
                    {/* SVG Lines from parent to children */}
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

                    {/* Children Nodes */}
                    <div className="flex gap-4 pt-8">
                        {node.children.map((child) => (
                            <TreeNode
                                key={child.id}
                                node={child}
                                highlightedNodeId={highlightedNodeId}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BTreeVisualizer() {
    const { root, order, highlightedNodeId, isAnimating, insertKey, reset } = useBTreeStore();
    const [inputValue, setInputValue] = useState('');

    const handleInsert = useCallback(async () => {
        const num = parseInt(inputValue.trim());
        if (!isNaN(num)) {
            await insertKey(num);
            setInputValue('');
        }
    }, [inputValue, insertKey]);

    const handleRandom = useCallback(async () => {
        for (let i = 0; i < 10; i++) {
            await insertKey(Math.floor(Math.random() * 99) + 1);
        }
    }, [insertKey]);

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
                        disabled={isAnimating}
                        placeholder="Sayı..."
                        className="w-24 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <button
                        onClick={handleInsert}
                        disabled={isAnimating || !inputValue}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
                    >
                        Ekle
                    </button>
                </div>

                <button
                    onClick={handleRandom}
                    disabled={isAnimating}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
                >
                    🎲 Rastgele 10
                </button>

                <button
                    onClick={reset}
                    disabled={isAnimating}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-sm"
                >
                    Sıfırla
                </button>

                <span className="px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-lg border border-slate-700">
                    t={order} (max {2 * order - 1} key)
                </span>
            </div>

            {/* Tree Visualization */}
            <div className="min-h-[400px] p-8 bg-slate-900/30 border border-slate-800 rounded-2xl overflow-auto flex justify-center items-start">
                {root ? (
                    <TreeNode node={root} highlightedNodeId={highlightedNodeId} />
                ) : (
                    <div className="text-center text-slate-600 mt-20">
                        <div className="text-5xl mb-4">🌳</div>
                        <p>B-Tree boş. Sayı ekleyin!</p>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4 bg-slate-800/50 rounded-xl text-xs text-slate-400">
                <h4 className="font-bold text-violet-400 mb-2">🌳 B-Tree (t={order})</h4>
                <ul className="space-y-1">
                    <li>• Her düğüm max <strong className="text-amber-400">{2 * order - 1}</strong> anahtar tutabilir</li>
                    <li>• Her düğüm max <strong className="text-amber-400">{2 * order}</strong> çocuk sahibi olabilir</li>
                    <li>• Düğüm dolunca <strong className="text-rose-400">SPLIT</strong>: orta anahtar yukarı çıkar</li>
                </ul>
            </div>
        </div>
    );
}
