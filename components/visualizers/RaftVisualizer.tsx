'use client';

import { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRaftStore, type RaftSpeed } from '@/store/useRaftStore';
import {
    CLIENT_COMMANDS,
    getSpeedInterval,
    interpolateMessage,
    nodePosition,
    NODE_COUNT,
    QUORUM,
    type NetworkMessage,
    type RaftNode,
    type RaftRole,
} from '@/lib/raft';
import { cn } from '@/lib/utils';

const CANVAS_SIZE = 420;
const CENTER = CANVAS_SIZE / 2;
const RADIUS = 150;

function roleStyles(role: RaftRole): { ring: string; bg: string; label: string } {
    switch (role) {
        case 'leader':
            return {
                ring: 'ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.5)]',
                bg: 'bg-amber-500/20 border-amber-400',
                label: 'Lider',
            };
        case 'candidate':
            return {
                ring: 'ring-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.4)]',
                bg: 'bg-indigo-500/20 border-indigo-400',
                label: 'Aday',
            };
        case 'crashed':
            return {
                ring: 'ring-red-900',
                bg: 'bg-slate-900/80 border-red-800',
                label: 'Çökmüş',
            };
        default:
            return {
                ring: 'ring-emerald-500/50',
                bg: 'bg-emerald-500/10 border-emerald-600',
                label: 'Takipçi',
            };
    }
}

function messageColor(type: NetworkMessage['type']): string {
    switch (type) {
        case 'RequestVote':
            return '#818cf8';
        case 'VoteGranted':
            return '#a78bfa';
        case 'AppendEntries':
            return '#22d3ee';
        case 'Heartbeat':
            return '#fbbf24';
        default:
            return '#94a3b8';
    }
}

function ClusterNode({
    node,
    isLeader,
    onToggleCrash,
}: {
    node: RaftNode;
    isLeader: boolean;
    onToggleCrash: () => void;
}) {
    const pos = nodePosition(node.id, CENTER, CENTER, RADIUS);
    const styles = roleStyles(node.role);
    const timeoutProgress =
        node.role === 'leader' || node.role === 'crashed'
            ? 0
            : 1 - node.electionTimeout / node.electionTimeoutMax;

    return (
        <motion.button
            layout
            onClick={onToggleCrash}
            className={cn(
                'absolute w-20 h-20 -ml-10 -mt-10 rounded-full border-2 flex flex-col items-center justify-center transition-all cursor-pointer',
                styles.bg,
                styles.ring,
                node.role === 'crashed' && 'opacity-60'
            )}
            style={{ left: pos.x, top: pos.y }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            title={node.role === 'crashed' ? 'Canlandır' : 'Çökert'}
        >
            {isLeader && node.role === 'leader' && (
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-amber-400/60"
                    animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />
            )}
            <span className="text-sm font-bold text-white">N{node.id}</span>
            <span className="text-[9px] text-slate-400">{styles.label}</span>
            <span className="text-[9px] text-cyan-400 font-mono">T{node.currentTerm}</span>
            {node.role !== 'crashed' && node.role !== 'leader' && (
                <div className="absolute -bottom-3 w-14 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-rose-400 rounded-full transition-all"
                        style={{ width: `${Math.min(100, timeoutProgress * 100)}%` }}
                    />
                </div>
            )}
        </motion.button>
    );
}

export default function RaftVisualizer() {
    const {
        nodes,
        messages,
        currentTerm,
        leaderId,
        clusterLog,
        statusMessage,
        isRunning,
        speed,
        tick,
        toggleNodeCrash,
        sendClientCommand,
        resetCluster,
        pause,
        resume,
        setSpeed,
    } = useRaftStore();

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => tick(), getSpeedInterval(speed));
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, speed, tick]);

    const positions = useMemo(
        () =>
            Object.fromEntries(
                Array.from({ length: NODE_COUNT }, (_, i) => {
                    const id = i + 1;
                    return [id, nodePosition(id, CENTER, CENTER, RADIUS)];
                })
            ),
        []
    );

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400">Komut:</span>
                {CLIENT_COMMANDS.map((cmd) => (
                    <button
                        key={cmd}
                        onClick={() => sendClientCommand(cmd)}
                        disabled={!isRunning}
                        className="px-3 py-1.5 bg-cyan-600/80 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-mono font-bold transition-all"
                    >
                        {cmd}
                    </button>
                ))}

                <div className="w-px h-6 bg-slate-700 mx-1" />

                {nodes.map((node) => (
                    <button
                        key={node.id}
                        onClick={() => toggleNodeCrash(node.id)}
                        className={cn(
                            'px-2 py-1 rounded-lg text-xs font-bold transition-all',
                            node.role === 'crashed'
                                ? 'bg-red-900/50 text-red-300 border border-red-700'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        )}
                    >
                        N{node.id} {node.role === 'crashed' ? '↻' : '✕'}
                    </button>
                ))}

                <div className="w-px h-6 bg-slate-700 mx-1" />

                <select
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value as RaftSpeed)}
                    className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                >
                    <option value="slow">Yavaş</option>
                    <option value="normal">Normal</option>
                    <option value="fast">Hızlı</option>
                </select>

                {isRunning ? (
                    <button
                        onClick={pause}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold"
                    >
                        Duraklat
                    </button>
                ) : (
                    <button
                        onClick={resume}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold"
                    >
                        Devam Et
                    </button>
                )}

                <button
                    onClick={resetCluster}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold"
                >
                    Sıfırla
                </button>
            </div>

            {/* Metrics */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <div>
                    <span className="text-slate-500">Term: </span>
                    <span className="text-cyan-400 font-bold font-mono">{currentTerm}</span>
                </div>
                <div>
                    <span className="text-slate-500">Lider: </span>
                    <span className="text-amber-400 font-bold font-mono">
                        {leaderId ? `Node ${leaderId}` : '—'}
                    </span>
                </div>
                <div>
                    <span className="text-slate-500">Quorum: </span>
                    <span className="text-violet-400 font-bold font-mono">{QUORUM}/5</span>
                </div>
                <div>
                    <span className="text-slate-500">Commit Log: </span>
                    <span className="text-emerald-400 font-bold font-mono">{clusterLog.length}</span>
                </div>
            </div>

            {/* Circular cluster */}
            <div
                className="relative bg-slate-900/50 border border-slate-800 rounded-2xl mx-auto overflow-hidden"
                style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
            >
                <svg width={CANVAS_SIZE} height={CANVAS_SIZE} className="absolute inset-0 pointer-events-none">
                    {/* Heartbeat pulse from leader */}
                    {leaderId && (
                        <motion.circle
                            cx={positions[leaderId].x}
                            cy={positions[leaderId].y}
                            r={30}
                            fill="none"
                            stroke="rgba(251, 191, 36, 0.3)"
                            strokeWidth={2}
                            animate={{ r: [30, 80, 30], opacity: [0.5, 0, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2.5 }}
                        />
                    )}

                    {/* In-flight messages */}
                    <AnimatePresence>
                        {messages.map((msg) => {
                            const from = positions[msg.from];
                            const to = positions[msg.to];
                            const pos = interpolateMessage(from, to, msg.progress);
                            return (
                                <motion.circle
                                    key={msg.id}
                                    cx={pos.x}
                                    cy={pos.y}
                                    r={5}
                                    fill={messageColor(msg.type)}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0 }}
                                />
                            );
                        })}
                    </AnimatePresence>
                </svg>

                {nodes.map((node) => (
                    <ClusterNode
                        key={node.id}
                        node={node}
                        isLeader={leaderId === node.id}
                        onToggleCrash={() => toggleNodeCrash(node.id)}
                    />
                ))}
            </div>

            {/* Replicated logs panel */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 overflow-x-auto">
                <h3 className="text-sm font-bold text-slate-300 mb-4">Dağıtık Log (Replikasyon)</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 min-w-[600px]">
                    {nodes.map((node) => (
                        <div key={node.id} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                            <div className="text-xs font-bold text-slate-400 mb-2 flex items-center justify-between">
                                <span>Node {node.id}</span>
                                <span className={cn(
                                    'px-1.5 py-0.5 rounded text-[10px]',
                                    node.role === 'leader' && 'bg-amber-500/20 text-amber-300',
                                    node.role === 'candidate' && 'bg-indigo-500/20 text-indigo-300',
                                    node.role === 'follower' && 'bg-emerald-500/20 text-emerald-300',
                                    node.role === 'crashed' && 'bg-red-500/20 text-red-300'
                                )}>
                                    {node.role}
                                </span>
                            </div>
                            {node.logs.length === 0 ? (
                                <p className="text-[10px] text-slate-600">Log boş</p>
                            ) : (
                                <div className="space-y-1">
                                    {node.logs.map((entry) => (
                                        <div
                                            key={entry.index}
                                            className={cn(
                                                'text-[10px] font-mono px-2 py-1 rounded border',
                                                entry.committed
                                                    ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300'
                                                    : 'bg-slate-900 border-slate-600 text-slate-400'
                                            )}
                                        >
                                            #{entry.index} T{entry.term}: {entry.command}
                                            {entry.committed && ' ✓'}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Message legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
                {(['RequestVote', 'VoteGranted', 'Heartbeat', 'AppendEntries'] as const).map((type) => (
                    <div key={type} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: messageColor(type) }} />
                        {type}
                    </div>
                ))}
            </div>

            {/* Educational note */}
            <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-800/50 text-sm text-slate-300">
                {statusMessage}
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl text-xs text-slate-400 leading-relaxed">
                Raft, dağıtık sistemlerde tutarlılık sağlamak için lider tabanlı consensus kullanır.
                Lider heartbeat ile otoritesini korur; timeout olan takipçi aday olur ve çoğunluk oyu (≥3/5)
                ile yeni lider seçilir. İstemci komutları yalnızca lidere yazılır, log replike edilir ve
                quorum commit sonrası kalıcı hale gelir.
            </div>
        </div>
    );
}
