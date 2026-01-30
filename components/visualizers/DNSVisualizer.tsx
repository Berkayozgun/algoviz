'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDNSStore, servers, DNSServer, ServerInfo } from '@/store/useDNSStore';
import { cn } from '@/lib/utils';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ServerNode = ({
    server,
    isActive,
    tooltip,
}: {
    server: ServerInfo;
    isActive: boolean;
    tooltip: string;
}) => (
    <div
        className="absolute flex flex-col items-center"
        style={{ left: server.x - 40, top: server.y - 40 }}
    >
        <motion.div
            animate={{
                scale: isActive ? 1.1 : 1,
                boxShadow: isActive ? '0 0 30px rgba(139, 92, 246, 0.6)' : '0 0 0px transparent',
            }}
            className={cn(
                "w-20 h-20 rounded-2xl flex items-center justify-center text-3xl transition-colors",
                isActive ? "bg-violet-600" : "bg-slate-800 border border-slate-700"
            )}
        >
            {server.icon}
        </motion.div>
        <p className="text-xs font-medium text-slate-300 mt-2 text-center max-w-[100px]">
            {server.name}
        </p>

        {/* Tooltip */}
        <AnimatePresence>
            {isActive && tooltip && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 p-2 bg-slate-900 border border-violet-500/50 rounded-lg text-[10px] text-slate-300 text-center shadow-xl z-50"
                >
                    {tooltip}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900 border-r border-b border-violet-500/50"></div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const AnimatedPacket = ({
    fromServer,
    toServer,
    message,
    isResponse,
}: {
    fromServer: ServerInfo;
    toServer: ServerInfo;
    message: string;
    isResponse: boolean;
}) => {
    return (
        <motion.div
            className={cn(
                "absolute w-8 h-8 rounded-full flex items-center justify-center text-sm z-40",
                isResponse ? "bg-emerald-500" : "bg-amber-500"
            )}
            initial={{ x: fromServer.x - 16, y: fromServer.y - 16, scale: 0 }}
            animate={{ x: toServer.x - 16, y: toServer.y - 16, scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
            {isResponse ? '📨' : '📧'}
        </motion.div>
    );
};

export default function DNSVisualizer() {
    const {
        domain,
        resolvedIP,
        isRunning,
        isComplete,
        packets,
        activeServer,
        tooltipMessage,
        setDomain,
        setResolvedIP,
        setIsRunning,
        setIsComplete,
        addPacket,
        clearPackets,
        setActiveServer,
        setTooltipMessage,
        reset,
    } = useDNSStore();

    const [inputDomain, setInputDomain] = useState('www.google.com');

    const getServer = (id: DNSServer) => servers.find((s) => s.id === id)!;

    const runDNSLookup = useCallback(async () => {
        if (isRunning) return;
        reset();
        setDomain(inputDomain);
        setIsRunning(true);
        clearPackets();

        const steps = [
            {
                from: 'client' as DNSServer,
                to: 'resolver' as DNSServer,
                message: `Where is ${inputDomain}?`,
                tooltip: "Client asks the ISP Resolver for the IP address",
                isResponse: false,
            },
            {
                from: 'resolver' as DNSServer,
                to: 'root' as DNSServer,
                message: 'Where is .com?',
                tooltip: "Resolver doesn't have it cached, asks Root Server",
                isResponse: false,
            },
            {
                from: 'root' as DNSServer,
                to: 'resolver' as DNSServer,
                message: 'Ask the .com TLD server',
                tooltip: "Root Server points to the TLD (.com) server",
                isResponse: true,
            },
            {
                from: 'resolver' as DNSServer,
                to: 'tld' as DNSServer,
                message: `Where is ${inputDomain.split('.')[1]}.com?`,
                tooltip: "Resolver asks TLD server for the domain",
                isResponse: false,
            },
            {
                from: 'tld' as DNSServer,
                to: 'resolver' as DNSServer,
                message: 'Ask Google\'s authoritative server',
                tooltip: "TLD server points to the authoritative nameserver",
                isResponse: true,
            },
            {
                from: 'resolver' as DNSServer,
                to: 'authoritative' as DNSServer,
                message: `What is the IP for ${inputDomain}?`,
                tooltip: "Resolver asks the authoritative server directly",
                isResponse: false,
            },
            {
                from: 'authoritative' as DNSServer,
                to: 'resolver' as DNSServer,
                message: '142.250.185.68',
                tooltip: "Authoritative server returns the actual IP address!",
                isResponse: true,
            },
            {
                from: 'resolver' as DNSServer,
                to: 'client' as DNSServer,
                message: '142.250.185.68',
                tooltip: "Resolver caches and returns the IP to client",
                isResponse: true,
            },
        ];

        for (const step of steps) {
            setActiveServer(step.to);
            setTooltipMessage(step.tooltip);
            addPacket(step);
            await delay(1500);
        }

        setResolvedIP('142.250.185.68');
        setActiveServer(null);
        setTooltipMessage('DNS lookup complete! Now the browser can connect.');
        setIsComplete(true);
        setIsRunning(false);
    }, [inputDomain, isRunning, reset, setDomain, setIsRunning, clearPackets, setActiveServer, setTooltipMessage, addPacket, setResolvedIP, setIsComplete]);

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2 border border-slate-700">
                    <span className="text-slate-500 text-sm">https://</span>
                    <input
                        type="text"
                        value={inputDomain}
                        onChange={(e) => setInputDomain(e.target.value)}
                        disabled={isRunning}
                        placeholder="www.example.com"
                        className="bg-transparent text-slate-200 text-sm w-48 focus:outline-none"
                    />
                </div>

                <button
                    onClick={runDNSLookup}
                    disabled={isRunning || !inputDomain}
                    className="px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105"
                >
                    🔍 Lookup DNS
                </button>

                <button
                    onClick={reset}
                    disabled={isRunning}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-sm font-medium transition-all border border-slate-700"
                >
                    Reset
                </button>
            </div>

            {/* Visualization Canvas */}
            <div className="relative h-[500px] bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
                {/* Connection Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                        <marker id="arrowhead2" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" className="fill-slate-600" />
                        </marker>
                    </defs>
                    {/* Client -> Resolver */}
                    <line x1="120" y1="250" x2="240" y2="250" className="stroke-slate-700 stroke-2" markerEnd="url(#arrowhead2)" />
                    {/* Resolver -> Root */}
                    <line x1="320" y1="210" x2="440" y2="140" className="stroke-slate-700 stroke-2" markerEnd="url(#arrowhead2)" />
                    {/* Resolver -> TLD */}
                    <line x1="320" y1="250" x2="440" y2="250" className="stroke-slate-700 stroke-2" markerEnd="url(#arrowhead2)" />
                    {/* Resolver -> Authoritative */}
                    <line x1="320" y1="290" x2="440" y2="360" className="stroke-slate-700 stroke-2" markerEnd="url(#arrowhead2)" />
                </svg>

                {/* Server Nodes */}
                {servers.map((server) => (
                    <ServerNode
                        key={server.id}
                        server={server}
                        isActive={activeServer === server.id}
                        tooltip={activeServer === server.id ? tooltipMessage : ''}
                    />
                ))}

                {/* Animated Packets */}
                <AnimatePresence>
                    {packets.slice(-1).map((packet) => (
                        <AnimatedPacket
                            key={packet.id}
                            fromServer={getServer(packet.from)}
                            toServer={getServer(packet.to)}
                            message={packet.message}
                            isResponse={packet.isResponse}
                        />
                    ))}
                </AnimatePresence>

                {/* Status Message */}
                {tooltipMessage && !activeServer && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-400 text-sm">
                        {tooltipMessage}
                    </div>
                )}
            </div>

            {/* Result */}
            {isComplete && resolvedIP && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl text-center"
                >
                    <p className="text-slate-500 text-sm">Resolved IP Address for <span className="text-violet-400 font-mono">{domain}</span></p>
                    <p className="text-3xl font-mono font-bold text-emerald-400 mt-2">{resolvedIP}</p>
                    <p className="text-xs text-slate-600 mt-2">Now the browser can send HTTP requests to this IP!</p>
                </motion.div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                    <span className="text-amber-500">📧</span> Query (Request)
                </span>
                <span className="flex items-center gap-2">
                    <span className="text-emerald-500">📨</span> Response
                </span>
            </div>
        </div>
    );
}
