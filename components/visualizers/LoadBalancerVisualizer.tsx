'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoadBalancerStore, selectServer, createRequest, Server, Request } from '@/store/useLoadBalancerStore';
import { cn } from '@/lib/utils';

const ServerComponent = ({ server, onToggleHealth }: { server: Server; onToggleHealth: () => void }) => {
    return (
        <div
            className={cn(
                "relative w-28 p-3 rounded-xl border transition-all duration-300",
                server.isHealthy
                    ? "bg-slate-800/80 border-slate-700"
                    : "bg-rose-950/50 border-rose-800 opacity-60"
            )}
        >
            <div className="text-xs font-bold text-center mb-2" style={{ color: server.color }}>
                {server.name}
            </div>

            {/* CPU Load Bar */}
            <div className="h-24 w-full bg-slate-900 rounded-lg overflow-hidden relative">
                <motion.div
                    className="absolute bottom-0 w-full rounded-b-lg"
                    style={{ backgroundColor: server.color }}
                    animate={{ height: `${server.load}%` }}
                    transition={{ type: 'spring', stiffness: 100 }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-mono font-bold text-white drop-shadow-lg">
                        {Math.round(server.load)}%
                    </span>
                </div>
            </div>

            <div className="text-[10px] text-slate-500 text-center mt-2">
                {server.connections} conn
            </div>

            <button
                onClick={onToggleHealth}
                className={cn(
                    "absolute -top-2 -right-2 w-6 h-6 rounded-full text-[10px] font-bold transition-all",
                    server.isHealthy
                        ? "bg-emerald-500 hover:bg-rose-500"
                        : "bg-rose-500 hover:bg-emerald-500"
                )}
                title={server.isHealthy ? "Crash Server" : "Recover Server"}
            >
                {server.isHealthy ? "✕" : "↻"}
            </button>
        </div>
    );
};

const RequestBall = ({ request, servers }: { request: Request; servers: Server[] }) => {
    const server = servers.find((s) => s.id === request.targetServerId);
    const color = server?.color || '#a855f7';

    // Calculate positions based on phase
    let x = 50;
    let y = 200;

    if (request.phase === 'client') {
        x = 80;
        y = 200;
    } else if (request.phase === 'lb') {
        x = 350;
        y = 200;
    } else if (request.phase === 'server' && server) {
        x = 580;
        const serverIndex = servers.findIndex((s) => s.id === server.id);
        y = 80 + serverIndex * 100;
    }

    return (
        <motion.div
            key={request.id}
            className="absolute w-4 h-4 rounded-full shadow-lg"
            style={{ backgroundColor: color }}
            initial={{ x: 80, y: 200, scale: 0 }}
            animate={{ x, y, scale: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        />
    );
};

export default function LoadBalancerVisualizer() {
    const {
        servers,
        requests,
        isRunning,
        algorithm,
        requestsPerSecond,
        roundRobinIndex,
        totalRequests,
        setIsRunning,
        setAlgorithm,
        setRequestsPerSecond,
        addRequest,
        updateRequest,
        removeRequest,
        updateServerLoad,
        toggleServerHealth,
        incrementRoundRobin,
        resetSimulation,
    } = useLoadBalancerStore();

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const processingRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

    const processRequest = useCallback((requestId: number) => {
        // Move to LB
        updateRequest(requestId, { phase: 'lb' });

        setTimeout(() => {
            const currentServers = useLoadBalancerStore.getState().servers;
            const server = selectServer(currentServers, algorithm, roundRobinIndex);

            if (!server) {
                removeRequest(requestId);
                return;
            }

            if (algorithm === 'roundRobin') {
                incrementRoundRobin();
            }

            // Move to server
            updateRequest(requestId, { phase: 'server', targetServerId: server.id });
            updateServerLoad(server.id, 15);

            // Process and remove after delay
            const timeout = setTimeout(() => {
                updateServerLoad(server.id, -15);
                removeRequest(requestId);
                processingRef.current.delete(requestId);
            }, 2000);

            processingRef.current.set(requestId, timeout);
        }, 500);
    }, [algorithm, roundRobinIndex, updateRequest, removeRequest, updateServerLoad, incrementRoundRobin]);

    const startSimulation = useCallback(() => {
        if (intervalRef.current) return;

        setIsRunning(true);
        intervalRef.current = setInterval(() => {
            const request = createRequest();
            addRequest(request);
            processRequest(request.id);
        }, 1000 / requestsPerSecond);
    }, [requestsPerSecond, setIsRunning, addRequest, processRequest]);

    const stopSimulation = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsRunning(false);
    }, [setIsRunning]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            processingRef.current.forEach((timeout) => clearTimeout(timeout));
        };
    }, []);

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl">
                <select
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value as any)}
                    disabled={isRunning}
                    className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                    <option value="roundRobin">Round Robin</option>
                    <option value="random">Random</option>
                    <option value="leastConnections">Least Connections</option>
                </select>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">RPS:</span>
                    <input
                        type="range"
                        min="1"
                        max="5"
                        value={requestsPerSecond}
                        onChange={(e) => setRequestsPerSecond(parseInt(e.target.value))}
                        disabled={isRunning}
                        className="w-20 accent-violet-500"
                    />
                    <span className="text-xs text-slate-400 w-4">{requestsPerSecond}</span>
                </div>

                {isRunning ? (
                    <button
                        onClick={stopSimulation}
                        className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                    >
                        Stop Traffic
                    </button>
                ) : (
                    <button
                        onClick={startSimulation}
                        className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 active:scale-95"
                    >
                        Start Traffic
                    </button>
                )}

                <button
                    onClick={resetSimulation}
                    disabled={isRunning}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-sm font-medium transition-all border border-slate-700"
                >
                    Reset
                </button>

                <div className="text-xs text-slate-500">
                    Total Requests: <span className="text-violet-400 font-bold">{totalRequests}</span>
                </div>
            </div>

            {/* Simulation Canvas */}
            <div className="relative h-[450px] bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden p-6">
                {/* Client */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl">👤</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Client</span>
                </div>

                {/* Arrow Client -> LB */}
                <svg className="absolute left-24 top-1/2 -translate-y-1/2 w-32 h-4">
                    <line x1="0" y1="8" x2="110" y2="8" className="stroke-slate-600 stroke-2" markerEnd="url(#arrowhead)" />
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" className="fill-slate-600" />
                        </marker>
                    </defs>
                </svg>

                {/* Load Balancer */}
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                    <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl border-2 border-amber-400/50">
                        <span className="text-3xl">⚖️</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Load Balancer</span>
                    <span className="text-[10px] text-amber-400 font-mono">
                        {algorithm === 'roundRobin' ? 'Round Robin' : algorithm === 'random' ? 'Random' : 'Least Conn'}
                    </span>
                </div>

                {/* Servers */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4">
                    {servers.map((server) => (
                        <ServerComponent
                            key={server.id}
                            server={server}
                            onToggleHealth={() => toggleServerHealth(server.id)}
                        />
                    ))}
                </div>

                {/* Animated Requests */}
                <AnimatePresence>
                    {requests.map((request) => (
                        <RequestBall key={request.id} request={request} servers={servers} />
                    ))}
                </AnimatePresence>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full"></div> Healthy Server
                </span>
                <span className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-rose-500 rounded-full"></div> Crashed Server
                </span>
                <span className="text-xs">
                    💡 Click the <span className="text-rose-400 font-bold">✕</span> on a server to crash it
                </span>
            </div>
        </div>
    );
}
