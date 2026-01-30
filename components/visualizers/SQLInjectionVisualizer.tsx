'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function SQLInjectionVisualizer() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isVulnerable, setIsVulnerable] = useState(false);
    const [isHacked, setIsHacked] = useState(false);
    const [attemptLogin, setAttemptLogin] = useState(false);

    // Build the query string
    const buildQuery = () => {
        const sanitizedUsername = username.replace(/'/g, "'''");
        return `SELECT * FROM users WHERE name = '${username}' AND password = '${password}'`;
    };

    // Check for SQL injection patterns
    useEffect(() => {
        const injectionPatterns = [
            "' --",
            "' OR ",
            "' or ",
            "1=1",
            "' OR '1'='1",
            "admin'--",
            "' OR 1=1--",
        ];

        const hasInjection = injectionPatterns.some(
            pattern => username.includes(pattern) || password.includes(pattern)
        );

        setIsVulnerable(hasInjection);
    }, [username, password]);

    const handleLogin = () => {
        setAttemptLogin(true);
        if (isVulnerable) {
            setTimeout(() => setIsHacked(true), 500);
        }
    };

    const resetDemo = () => {
        setUsername('');
        setPassword('');
        setIsVulnerable(false);
        setIsHacked(false);
        setAttemptLogin(false);
    };

    // Highlight the dangerous parts of the query
    const renderQuery = () => {
        const query = buildQuery();

        if (username.includes("'")) {
            const parts = query.split("'");
            return (
                <span>
                    {parts.map((part, i) => (
                        <span key={i}>
                            {i > 0 && <span className="text-rose-400 font-bold">&apos;</span>}
                            <span className={
                                i > 0 && (part.includes('--') || part.toLowerCase().includes(' or '))
                                    ? 'text-rose-400 bg-rose-500/20 px-1 rounded'
                                    : ''
                            }>
                                {part}
                            </span>
                        </span>
                    ))}
                </span>
            );
        }

        return <span>{query}</span>;
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Login Form */}
            <div className="max-w-md mx-auto w-full p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <h3 className="text-lg font-bold text-violet-400 mb-4 flex items-center gap-2">
                    🔑 Vulnerable Login Form
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username..."
                            disabled={isHacked}
                            className={cn(
                                "w-full mt-1 bg-slate-800 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2",
                                isVulnerable
                                    ? "border-rose-500 text-rose-400 focus:ring-rose-500"
                                    : "border-slate-700 text-slate-200 focus:ring-violet-500"
                            )}
                        />
                    </div>

                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold">Password</label>
                        <input
                            type="text"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password..."
                            disabled={isHacked}
                            className="w-full mt-1 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleLogin}
                            disabled={isHacked}
                            className="flex-1 px-4 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all"
                        >
                            Login
                        </button>
                        <button
                            onClick={resetDemo}
                            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-all border border-slate-700"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Injection hint */}
                <div className="mt-4 p-3 bg-slate-800/50 rounded-xl text-xs text-slate-500">
                    💡 Try typing: <code className="text-amber-400">admin&apos; --</code> as the username
                </div>
            </div>

            {/* Live Query Preview */}
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                        🔍 Live SQL Query Preview
                    </h3>
                    {isVulnerable && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="px-3 py-1 bg-rose-500/20 text-rose-400 text-xs font-bold rounded-full border border-rose-500/30"
                        >
                            ⚠️ VULNERABLE!
                        </motion.span>
                    )}
                </div>

                <div className={cn(
                    "p-4 rounded-xl font-mono text-sm overflow-x-auto transition-all",
                    isVulnerable
                        ? "bg-rose-950/30 border-2 border-rose-500/50"
                        : "bg-slate-800 border border-slate-700"
                )}>
                    <pre className="text-slate-300 whitespace-pre-wrap">
                        {renderQuery()}
                    </pre>
                </div>

                {/* Query Explanation */}
                <AnimatePresence>
                    {isVulnerable && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 p-4 bg-rose-950/20 border border-rose-500/30 rounded-xl"
                        >
                            <p className="text-sm text-rose-300 mb-2">
                                <strong>🚨 SQL Injection Detected!</strong>
                            </p>
                            <p className="text-xs text-slate-400">
                                The <code className="text-rose-400">&apos; --</code> sequence closes the username string
                                and comments out the rest of the query (including the password check).
                                This allows bypassing authentication!
                            </p>
                            <div className="mt-3 p-2 bg-slate-900 rounded text-xs font-mono">
                                <span className="text-slate-500">-- What the server sees:</span><br />
                                <span className="text-emerald-400">SELECT * FROM users WHERE name = &apos;admin&apos;</span>
                                <span className="text-slate-600"> -- &apos; AND password = &apos;&apos;</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Hacked State */}
            <AnimatePresence>
                {isHacked && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-8 bg-gradient-to-r from-rose-500/20 to-red-500/20 border-2 border-rose-500/50 rounded-2xl text-center"
                    >
                        <motion.div
                            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                            transition={{ duration: 0.5 }}
                            className="text-6xl mb-4"
                        >
                            💀
                        </motion.div>
                        <h3 className="text-2xl font-bold text-rose-400 mb-2">
                            SYSTEM HACKED!
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">
                            The attacker bypassed authentication using SQL Injection
                        </p>
                        <div className="inline-block p-3 bg-slate-900 rounded-xl text-xs font-mono text-emerald-400">
                            Access granted as: <span className="text-amber-400">admin</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Prevention Tips */}
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl">
                <h4 className="text-sm font-bold text-emerald-400 mb-2">🛡️ How to Prevent SQL Injection</h4>
                <ul className="text-xs text-slate-400 space-y-1">
                    <li>• <strong>Parameterized Queries</strong>: Use prepared statements</li>
                    <li>• <strong>Input Validation</strong>: Whitelist allowed characters</li>
                    <li>• <strong>Escape Special Characters</strong>: Sanitize user input</li>
                    <li>• <strong>ORMs</strong>: Use Object-Relational Mappers</li>
                </ul>
            </div>
        </div>
    );
}
