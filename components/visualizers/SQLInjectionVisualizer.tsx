'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type QueryMode = 'vulnerable' | 'safe';

const INJECTION_PATTERNS = [
    "' --",
    "' OR ",
    "' or ",
    "1=1",
    "' OR '1'='1",
    "admin'--",
    "' OR 1=1--",
];

function hasInjectionPayload(username: string, password: string) {
    return INJECTION_PATTERNS.some(
        (pattern) => username.includes(pattern) || password.includes(pattern)
    );
}

export default function SQLInjectionVisualizer() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [queryMode, setQueryMode] = useState<QueryMode>('vulnerable');
    const [hasPayload, setHasPayload] = useState(false);
    const [isHacked, setIsHacked] = useState(false);
    const [attemptLogin, setAttemptLogin] = useState(false);

    useEffect(() => {
        setHasPayload(hasInjectionPayload(username, password));
    }, [username, password]);

    const isAttackBlocked = queryMode === 'safe' && hasPayload;
    const isAttackSuccessful = queryMode === 'vulnerable' && hasPayload && attemptLogin && isHacked;
    const showVulnerableWarning = queryMode === 'vulnerable' && hasPayload;

    const buildVulnerableQuery = () =>
        `SELECT * FROM users WHERE name = '${username}' AND password = '${password}'`;

    const handleLogin = () => {
        setAttemptLogin(true);
        if (queryMode === 'vulnerable' && hasPayload) {
            setTimeout(() => setIsHacked(true), 500);
        } else {
            setIsHacked(false);
        }
    };

    const resetDemo = () => {
        setUsername('');
        setPassword('');
        setHasPayload(false);
        setIsHacked(false);
        setAttemptLogin(false);
    };

    const educationalMessage = useMemo(() => {
        if (!username && !password) {
            return queryMode === 'vulnerable'
                ? 'In vulnerable mode, user input is concatenated directly into the SQL string. Try admin\' -- to see how a comment closes the string and bypasses the password check.'
                : 'In safe mode, placeholders (?) are bound separately from the SQL structure. Even malicious input is treated as literal data, not executable code.';
        }

        if (queryMode === 'vulnerable' && hasPayload) {
            return "Why it works: The single quote closes the username string early, and -- comments out the password clause. The database executes SELECT * FROM users WHERE name = 'admin' and ignores the rest — authentication is bypassed.";
        }

        if (queryMode === 'vulnerable' && !hasPayload) {
            return 'This query is syntactically normal. Without injection characters, the server checks both username and password as intended.';
        }

        if (queryMode === 'safe' && hasPayload) {
            return "Why it's blocked: Prepared statements send SQL structure and user values separately. admin' -- is bound as the literal username parameter — it never alters the query logic, so the password check still runs.";
        }

        return 'Safe mode: both username and password are passed as bound parameters. The query shape never changes regardless of input content.';
    }, [username, password, queryMode, hasPayload]);

    const renderVulnerableQuery = () => {
        const query = buildVulnerableQuery();

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

    const renderSafeQuery = () => (
        <div className="space-y-3">
            <div>
                <span className="text-slate-500 text-xs block mb-1">SQL Template</span>
                <code className="text-emerald-400">
                    SELECT * FROM users WHERE name = <span className="text-amber-400 font-bold">?</span> AND password = <span className="text-amber-400 font-bold">?</span>
                </code>
            </div>
            <div>
                <span className="text-slate-500 text-xs block mb-1">Bound Parameters</span>
                <pre className="text-cyan-400">{`[\n  "${username}",\n  "${password}"\n]`}</pre>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6">
            {/* Mode Toggle */}
            <div className="flex flex-wrap items-center justify-center gap-3 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Query Mode</span>
                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                    <button
                        onClick={() => { setQueryMode('vulnerable'); setIsHacked(false); setAttemptLogin(false); }}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-semibold transition-all",
                            queryMode === 'vulnerable'
                                ? "bg-rose-600 text-white shadow-lg"
                                : "text-slate-400 hover:text-white"
                        )}
                    >
                        Raw Query (Vulnerable)
                    </button>
                    <button
                        onClick={() => { setQueryMode('safe'); setIsHacked(false); setAttemptLogin(false); }}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-semibold transition-all",
                            queryMode === 'safe'
                                ? "bg-emerald-600 text-white shadow-lg"
                                : "text-slate-400 hover:text-white"
                        )}
                    >
                        Prepared Statement (Safe)
                    </button>
                </div>
            </div>

            {/* Login Form */}
            <div className="max-w-md mx-auto w-full p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <h3 className="text-lg font-bold text-violet-400 mb-4 flex items-center gap-2">
                    {queryMode === 'vulnerable' ? '🔓 Vulnerable Login Form' : '🛡️ Parameterized Login Form'}
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
                                showVulnerableWarning
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

                <div className="mt-4 p-3 bg-slate-800/50 rounded-xl text-xs text-slate-500">
                    💡 Try typing: <code className="text-amber-400">admin&apos; --</code> as the username
                </div>
            </div>

            {/* Educational Panel */}
            <div className={cn(
                "p-4 rounded-xl border text-sm leading-relaxed",
                queryMode === 'vulnerable' && hasPayload
                    ? "bg-rose-950/20 border-rose-500/30 text-rose-200"
                    : queryMode === 'safe' && hasPayload
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                        : "bg-slate-900/50 border-slate-800 text-slate-400"
            )}>
                <h4 className="font-bold mb-2 text-inherit">
                    {queryMode === 'vulnerable' && hasPayload && 'Why the attack works'}
                    {queryMode === 'safe' && hasPayload && 'Why the attack is blocked'}
                    {(!hasPayload || (queryMode === 'vulnerable' && !hasPayload)) && 'How this mode behaves'}
                </h4>
                <p>{educationalMessage}</p>
            </div>

            {/* Live Query Preview */}
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                        🔍 Live SQL Query Preview
                    </h3>
                    {showVulnerableWarning && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="px-3 py-1 bg-rose-500/20 text-rose-400 text-xs font-bold rounded-full border border-rose-500/30"
                        >
                            ⚠️ INJECTION RISK
                        </motion.span>
                    )}
                    {isAttackBlocked && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30"
                        >
                            ✓ BLOCKED
                        </motion.span>
                    )}
                </div>

                <div className={cn(
                    "p-4 rounded-xl font-mono text-sm overflow-x-auto transition-all",
                    showVulnerableWarning
                        ? "bg-rose-950/30 border-2 border-rose-500/50"
                        : queryMode === 'safe'
                            ? "bg-emerald-950/20 border-2 border-emerald-500/40"
                            : "bg-slate-800 border border-slate-700"
                )}>
                    <pre className="text-slate-300 whitespace-pre-wrap">
                        {queryMode === 'vulnerable' ? renderVulnerableQuery() : renderSafeQuery()}
                    </pre>
                </div>

                <AnimatePresence>
                    {queryMode === 'vulnerable' && hasPayload && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 p-4 bg-rose-950/20 border border-rose-500/30 rounded-xl"
                        >
                            <p className="text-sm text-rose-300 mb-2">
                                <strong>What the database executes:</strong>
                            </p>
                            <div className="p-2 bg-slate-900 rounded text-xs font-mono">
                                <span className="text-emerald-400">SELECT * FROM users WHERE name = &apos;admin&apos;</span>
                                <span className="text-slate-600"> -- &apos; AND password = &apos;&apos;</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                The password check is commented out — the WHERE clause is effectively bypassed.
                            </p>
                        </motion.div>
                    )}

                    {queryMode === 'safe' && hasPayload && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl"
                        >
                            <p className="text-sm text-emerald-300 mb-2">
                                <strong>What the database executes:</strong>
                            </p>
                            <div className="p-2 bg-slate-900 rounded text-xs font-mono space-y-1">
                                <div className="text-emerald-400">
                                    SELECT * FROM users WHERE name = ? AND password = ?
                                </div>
                                <div className="text-cyan-400">
                                    Params: [&quot;{username}&quot;, &quot;{password}&quot;]
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                The payload is a literal string value — it cannot break out of the parameter binding.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Login Result */}
            <AnimatePresence>
                {isAttackSuccessful && (
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
                            AUTHENTICATION BYPASSED
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Raw string concatenation allowed SQL injection to skip the password check.
                        </p>
                        <div className="inline-block p-3 bg-slate-900 rounded-xl text-xs font-mono text-emerald-400">
                            Access granted as: <span className="text-amber-400">admin</span>
                        </div>
                    </motion.div>
                )}

                {attemptLogin && queryMode === 'safe' && hasPayload && !isHacked && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 bg-emerald-950/30 border-2 border-emerald-500/40 rounded-2xl text-center"
                    >
                        <div className="text-4xl mb-3">🛡️</div>
                        <h3 className="text-xl font-bold text-emerald-400 mb-2">
                            Login Denied — Injection Neutralized
                        </h3>
                        <p className="text-slate-400 text-sm">
                            No matching user found. The malicious input was treated as a plain username string.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Prevention Tips */}
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl">
                <h4 className="text-sm font-bold text-emerald-400 mb-2">How to Prevent SQL Injection</h4>
                <ul className="text-xs text-slate-400 space-y-1">
                    <li>• <strong>Parameterized Queries</strong>: Use prepared statements with bound parameters</li>
                    <li>• <strong>Input Validation</strong>: Whitelist allowed characters where possible</li>
                    <li>• <strong>Least Privilege</strong>: Limit database user permissions</li>
                    <li>• <strong>ORMs</strong>: Use frameworks that parameterize queries by default</li>
                </ul>
            </div>
        </div>
    );
}
