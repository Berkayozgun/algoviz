'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useBSTStore, BSTNode, NodeState } from '@/store/useBSTStore';
import { findValue, inOrderTraversal, preOrderTraversal, postOrderTraversal, animatedInsert, delay } from '@/lib/bstAlgorithms';
import { cn } from '@/lib/utils';

const getNodeColor = (state: NodeState): string => {
    switch (state) {
        case 'visiting':
            return 'fill-amber-500 stroke-amber-400';
        case 'found':
            return 'fill-emerald-500 stroke-emerald-400';
        case 'path':
            return 'fill-cyan-500 stroke-cyan-400';
        case 'inserted':
            return 'fill-violet-500 stroke-violet-400';
        default:
            return 'fill-slate-700 stroke-slate-500';
    }
};

const TreeNode = ({ node }: { node: BSTNode }) => {
    return (
        <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
            {/* Edge to left child */}
            {node.left && (
                <motion.line
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3 }}
                    x1={node.x}
                    y1={node.y}
                    x2={node.left.x}
                    y2={node.left.y}
                    className="stroke-slate-600 stroke-2"
                />
            )}
            {/* Edge to right child */}
            {node.right && (
                <motion.line
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3 }}
                    x1={node.x}
                    y1={node.y}
                    x2={node.right.x}
                    y2={node.right.y}
                    className="stroke-slate-600 stroke-2"
                />
            )}
            {/* Node circle */}
            <motion.circle
                cx={node.x}
                cy={node.y}
                r={25}
                className={cn('stroke-2 transition-colors duration-200', getNodeColor(node.state))}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            />
            {/* Node value */}
            <text
                x={node.x}
                y={node.y + 5}
                textAnchor="middle"
                className="fill-white text-sm font-bold select-none"
            >
                {node.value}
            </text>
            {/* Render children */}
            {node.left && <TreeNode node={node.left} />}
            {node.right && <TreeNode node={node.right} />}
        </motion.g>
    );
};

export default function BSTVisualizer() {
    const {
        root,
        isRunning,
        speed,
        traversalResult,
        setIsRunning,
        setSpeed,
        setTraversalResult,
        updateNodeState,
        insertValue,
        clearTree,
        resetNodeStates,
    } = useBSTStore();

    const [inputValue, setInputValue] = useState('');
    const [mode, setMode] = useState<'insert' | 'find' | 'traverse'>('insert');
    const [traverseType, setTraverseType] = useState<'inorder' | 'preorder' | 'postorder'>('inorder');
    const abortRef = useRef(false);

    const getDelay = () => {
        switch (speed) {
            case 'fast': return 200;
            case 'medium': return 500;
            case 'slow': return 1000;
            default: return 500;
        }
    };

    const handleInsert = async () => {
        const value = parseInt(inputValue);
        if (isNaN(value) || isRunning) return;

        setIsRunning(true);
        resetNodeStates();

        if (root) {
            const generator = animatedInsert(root, value, updateNodeState, getDelay());
            for await (const _ of generator) {
                if (abortRef.current) break;
            }
        }

        await delay(getDelay());
        insertValue(value);
        setInputValue('');
        setIsRunning(false);
    };

    const handleFind = async () => {
        const value = parseInt(inputValue);
        if (isNaN(value) || isRunning || !root) return;

        setIsRunning(true);
        resetNodeStates();

        const generator = findValue(root, value, updateNodeState, getDelay());
        for await (const result of generator) {
            if (abortRef.current) break;
        }

        setIsRunning(false);
    };

    const handleTraverse = async () => {
        if (isRunning || !root) return;

        setIsRunning(true);
        resetNodeStates();
        setTraversalResult([]);

        let generator;
        switch (traverseType) {
            case 'inorder':
                generator = inOrderTraversal(root, updateNodeState, getDelay());
                break;
            case 'preorder':
                generator = preOrderTraversal(root, updateNodeState, getDelay());
                break;
            case 'postorder':
                generator = postOrderTraversal(root, updateNodeState, getDelay());
                break;
        }

        for await (const result of generator) {
            if (abortRef.current) break;
            setTraversalResult(result);
        }

        setIsRunning(false);
    };

    const handleAction = () => {
        switch (mode) {
            case 'insert':
                handleInsert();
                break;
            case 'find':
                handleFind();
                break;
            case 'traverse':
                handleTraverse();
                break;
        }
    };

    const handleQuickInsert = () => {
        if (isRunning) return;
        const values = [50, 30, 70, 20, 40, 60, 80];
        values.forEach((v, i) => {
            setTimeout(() => insertValue(v), i * 100);
        });
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl">
                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                    {(['insert', 'find', 'traverse'] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            disabled={isRunning}
                            className={cn(
                                "px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-all",
                                mode === m
                                    ? "bg-violet-600 text-white shadow-lg"
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            {m}
                        </button>
                    ))}
                </div>

                {mode === 'traverse' ? (
                    <select
                        value={traverseType}
                        onChange={(e) => setTraverseType(e.target.value as any)}
                        disabled={isRunning}
                        className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                        <option value="inorder">In-Order</option>
                        <option value="preorder">Pre-Order</option>
                        <option value="postorder">Post-Order</option>
                    </select>
                ) : (
                    <input
                        type="number"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Enter value..."
                        disabled={isRunning}
                        className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-4 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleAction()}
                    />
                )}

                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                    {(['slow', 'medium', 'fast'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setSpeed(s)}
                            disabled={isRunning}
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

                <button
                    onClick={handleAction}
                    disabled={isRunning}
                    className="px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 active:scale-95"
                >
                    {mode === 'insert' ? 'Insert' : mode === 'find' ? 'Find' : 'Run Traversal'}
                </button>

                <button
                    onClick={handleQuickInsert}
                    disabled={isRunning || root !== null}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-sm font-medium transition-all border border-slate-700"
                >
                    Sample Tree
                </button>

                <button
                    onClick={() => { clearTree(); setTraversalResult([]); }}
                    disabled={isRunning}
                    className="px-4 py-2 bg-slate-800 hover:bg-rose-600/20 disabled:opacity-50 text-slate-200 rounded-xl text-sm font-medium transition-all border border-slate-700 hover:border-rose-500/50"
                >
                    Clear
                </button>
            </div>

            {/* Tree SVG Canvas */}
            <div className="h-[500px] bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
                {root ? (
                    <svg width="100%" height="100%" viewBox="0 0 800 500" className="overflow-visible">
                        <TreeNode node={root} />
                    </svg>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        Insert a value to start building the tree
                    </div>
                )}
            </div>

            {/* Traversal Result */}
            {traversalResult.length > 0 && (
                <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                        Traversal Result:
                    </span>
                    <p className="text-lg font-mono text-emerald-400 mt-1">
                        [{traversalResult.join(' → ')}]
                    </p>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-700 rounded-full border-2 border-slate-500"></div> Default
                </span>
                <span className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-amber-500 rounded-full border-2 border-amber-400"></div> Visiting
                </span>
                <span className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-cyan-500 rounded-full border-2 border-cyan-400"></div> Path
                </span>
                <span className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-emerald-400"></div> Found
                </span>
            </div>
        </div>
    );
}
