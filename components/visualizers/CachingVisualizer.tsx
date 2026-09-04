'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCachingStore, type CacheStrategy, type PresetName } from '@/store/useCachingStore';
import {
    COMPONENT_LABELS,
    COMPONENT_ORDER,
    componentPosition,
    getStrategyInfo,
    interpolatePacket,
    packetColor,
    PRESETS,
    type SystemComponent,
} from '@/lib/cachingStrategies';
import { cn } from '@/lib/utils';

const TOPOLOGY_WIDTH = 800;
const TOPOLOGY_HEIGHT = 200;

const STRATEGIES: { id: CacheStrategy; label: string }[] = [
    { id: 'cache-aside', label: 'Cache-Aside' },
    { id: 'write-through', label: 'Write-Through' },
    { id: 'write-back', label: 'Write-Back' },
];

function DataTable({
    title,
    data,
    dirtyKeys,
    accent,
}: {
    title: string;
    data: Record<string, string>;
    dirtyKeys?: string[];
    accent: string;
}) {
    const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex-1 min-w-[200px]">
            <h4 className={cn('text-xs font-bold mb-3', accent)}>{title}</h4>
            {entries.length === 0 ? (
                <p className="text-xs text-slate-600">Boş</p>
            ) : (
                <table className="w-full text-xs font-mono">
                    <thead>
                        <tr className="text-slate-500 border-b border-slate-700">
                            <th className="py-1 text-left">Key</th>
                            <th className="py-1 text-left">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map(([key, value]) => (
                            <tr key={key} className="border-b border-slate-800/50">
                                <td className="py-1.5 text-slate-300">{key}</td>
                                <td className="py-1.5 text-slate-400 flex items-center gap-1">
                                    {value}
                                    {dirtyKeys?.includes(key) && (
                                        <span className="text-[9px] px-1 py-0.5 bg-amber-500/20 text-amber-400 rounded border border-amber-600/40">
                                            dirty
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

function LayerBox({ component, x, y }: { component: SystemComponent; x: number; y: number }) {
    const icons: Record<SystemComponent, string> = {
        client: '👤',
        api: '⚙️',
        cache: '⚡',
        database: '🗄️',
    };

    return (
        <div
            className="absolute -translate-x-1/2 -translate-y-1/2 w-36 p-3 bg-slate-800/90 border border-slate-600 rounded-xl text-center"
            style={{ left: x, top: y }}
        >
            <div className="text-2xl mb-1">{icons[component]}</div>
            <div className="text-xs font-bold text-slate-200">{COMPONENT_LABELS[component]}</div>
        </div>
    );
}

export default function CachingVisualizer() {
    const {
        strategy,
        cacheData,
        dbData,
        dirtyKeys,
        activePackets,
        stepDescription,
        latencyMs,
        stats,
        isAnimating,
        readKey,
        writeKey,
        setStrategy,
        flushWriteBackQueue,
        reset,
        runPreset,
    } = useCachingStore();

    const strategyInfo = getStrategyInfo(strategy);

    const positions = useMemo(
        () =>
            Object.fromEntries(
                COMPONENT_ORDER.map((c) => [c, componentPosition(c, TOPOLOGY_WIDTH, TOPOLOGY_HEIGHT)])
            ) as Record<SystemComponent, { x: number; y: number }>,
        []
    );

    const hitRatio =
        stats.reads > 0 ? ((stats.hits / stats.reads) * 100).toFixed(1) : '—';

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1">
                    {STRATEGIES.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setStrategy(s.id)}
                            disabled={isAnimating}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                                strategy === s.id
                                    ? 'bg-violet-600 text-white'
                                    : 'text-slate-400 hover:text-slate-200'
                            )}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                <div className="w-px h-6 bg-slate-700" />

                <button
                    onClick={() => readKey('user:1')}
                    disabled={isAnimating}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-mono font-bold"
                >
                    READ(&quot;user:1&quot;)
                </button>
                <button
                    onClick={() => readKey('user:2')}
                    disabled={isAnimating}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-mono font-bold"
                >
                    READ(&quot;user:2&quot;)
                </button>
                <button
                    onClick={() => writeKey('user:1', 'Active')}
                    disabled={isAnimating}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-mono font-bold"
                >
                    WRITE(&quot;user:1&quot;, &quot;Active&quot;)
                </button>
                <button
                    onClick={() => writeKey('user:1', 'Banned')}
                    disabled={isAnimating}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-mono font-bold"
                >
                    UPDATE(&quot;user:1&quot;, &quot;Banned&quot;)
                </button>

                {strategy === 'write-back' && (
                    <button
                        onClick={() => flushWriteBackQueue()}
                        disabled={isAnimating || dirtyKeys.length === 0}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
                    >
                        Flush Queue ({dirtyKeys.length})
                    </button>
                )}

                <select
                    defaultValue=""
                    onChange={(e) => {
                        if (e.target.value) runPreset(e.target.value as PresetName);
                        e.target.value = '';
                    }}
                    disabled={isAnimating}
                    className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                >
                    <option value="" disabled>Senaryo seç</option>
                    {(Object.entries(PRESETS) as [PresetName, { label: string }][]).map(
                        ([name, p]) => (
                            <option key={name} value={name}>{p.label}</option>
                        )
                    )}
                </select>

                <button
                    onClick={reset}
                    disabled={isAnimating}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
                >
                    Sıfırla
                </button>
            </div>

            {/* Metrics */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <div>
                    <span className="text-slate-500">Hits: </span>
                    <span className="text-emerald-400 font-bold font-mono">{stats.hits}</span>
                </div>
                <div>
                    <span className="text-slate-500">Misses: </span>
                    <span className="text-rose-400 font-bold font-mono">{stats.misses}</span>
                </div>
                <div>
                    <span className="text-slate-500">Hit Ratio: </span>
                    <span className="text-violet-400 font-bold font-mono">{hitRatio}%</span>
                </div>
                <div>
                    <span className="text-slate-500">Reads: </span>
                    <span className="text-indigo-400 font-bold font-mono">{stats.reads}</span>
                </div>
                <div>
                    <span className="text-slate-500">Writes: </span>
                    <span className="text-cyan-400 font-bold font-mono">{stats.writes}</span>
                </div>
                <div>
                    <span className="text-slate-500">Latency: </span>
                    <span className="text-amber-400 font-bold font-mono">{latencyMs}ms</span>
                </div>
            </div>

            {/* Topology */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 overflow-x-auto">
                <div
                    className="relative mx-auto"
                    style={{ width: TOPOLOGY_WIDTH, height: TOPOLOGY_HEIGHT }}
                >
                    <svg
                        width={TOPOLOGY_WIDTH}
                        height={TOPOLOGY_HEIGHT}
                        className="absolute inset-0 pointer-events-none"
                    >
                        {COMPONENT_ORDER.slice(0, -1).map((comp, i) => {
                            const from = positions[comp];
                            const to = positions[COMPONENT_ORDER[i + 1]];
                            return (
                                <line
                                    key={comp}
                                    x1={from.x}
                                    y1={from.y}
                                    x2={to.x}
                                    y2={to.y}
                                    stroke="#334155"
                                    strokeWidth={2}
                                    strokeDasharray="6 4"
                                />
                            );
                        })}

                        <AnimatePresence>
                            {activePackets.map((pkt) => {
                                const from = positions[pkt.from];
                                const to = positions[pkt.to];
                                const pos = interpolatePacket(from, to, pkt.progress);
                                return (
                                    <g key={pkt.id}>
                                        <motion.circle
                                            cx={pos.x}
                                            cy={pos.y}
                                            r={8}
                                            fill={packetColor(pkt.status)}
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                        />
                                        <text
                                            x={pos.x}
                                            y={pos.y - 14}
                                            textAnchor="middle"
                                            fill="#e2e8f0"
                                            fontSize={9}
                                            fontFamily="monospace"
                                        >
                                            {pkt.label}
                                        </text>
                                    </g>
                                );
                            })}
                        </AnimatePresence>
                    </svg>

                    {COMPONENT_ORDER.map((comp) => (
                        <LayerBox
                            key={comp}
                            component={comp}
                            x={positions[comp].x}
                            y={positions[comp].y}
                        />
                    ))}
                </div>
            </div>

            {/* Data stores */}
            <div className="flex flex-col md:flex-row gap-4">
                <DataTable
                    title="Cache Layer (Redis)"
                    data={cacheData}
                    dirtyKeys={dirtyKeys}
                    accent="text-amber-400"
                />
                <DataTable
                    title="Database (PostgreSQL)"
                    data={dbData}
                    accent="text-emerald-400"
                />
            </div>

            {/* Consistency indicator */}
            {strategy === 'write-back' && dirtyKeys.length > 0 && (
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs">
                    Tutarsızlık uyarısı: {dirtyKeys.length} dirty key henüz DB&apos;ye yazılmadı
                    ({dirtyKeys.join(', ')}).
                </div>
            )}

            {/* Strategy card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <h3 className="text-sm font-bold text-violet-300 mb-2">{strategyInfo.title}</h3>
                    <p className="text-xs text-slate-400 mb-3">{strategyInfo.summary}</p>
                    <div className="text-xs space-y-2">
                        <div>
                            <span className="text-emerald-400 font-bold">+ </span>
                            {strategyInfo.pros.join(' · ')}
                        </div>
                        <div>
                            <span className="text-rose-400 font-bold">− </span>
                            {strategyInfo.cons.join(' · ')}
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2 p-4 rounded-xl border border-slate-700/50 bg-slate-800/50 text-sm text-slate-300">
                    {stepDescription}
                </div>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl text-xs text-slate-400 leading-relaxed">
                Modern web mimarilerinde cache katmanı DB yükünü azaltır ve gecikmeyi düşürür.
                Cache-Aside okumada lazy loading kullanır; Write-Through tutarlılığı senkron yazar;
                Write-Back yazmayı hızlandırır ancak geçici tutarsızlık ve veri kaybı riski taşır.
            </div>
        </div>
    );
}
