'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCryptoStore, sha256, visualEncrypt, visualDecrypt, EncryptionStep } from '@/store/useCryptoStore';
import { cn } from '@/lib/utils';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Module A: Hashing
function HashingModule() {
    const { hashInput, hashOutput, previousHash, setHashInput, setHashOutput, setPreviousHash } = useCryptoStore();
    const [isHashing, setIsHashing] = useState(false);

    useEffect(() => {
        const hash = async () => {
            if (hashInput) {
                setIsHashing(true);
                setPreviousHash(hashOutput);
                const result = await sha256(hashInput);
                setHashOutput(result);
                setTimeout(() => setIsHashing(false), 300);
            } else {
                setHashOutput('');
                setPreviousHash('');
            }
        };
        hash();
    }, [hashInput, setHashOutput, setPreviousHash, hashOutput]);

    // Calculate how many characters changed (avalanche effect)
    const changedCount = hashOutput && previousHash
        ? hashOutput.split('').filter((c, i) => c !== previousHash[i]).length
        : 0;

    return (
        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <h3 className="text-lg font-bold text-violet-400 mb-4 flex items-center gap-2">
                🔒 SHA-256 Hashing
            </h3>

            <div className="space-y-4">
                <div>
                    <label className="text-xs text-slate-500 uppercase font-bold">Input Message</label>
                    <input
                        type="text"
                        value={hashInput}
                        onChange={(e) => setHashInput(e.target.value)}
                        placeholder="Type something..."
                        className="w-full mt-1 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                </div>

                <div className="flex items-center justify-center text-2xl py-2">
                    <motion.div
                        animate={{ rotate: isHashing ? 360 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        ⬇️
                    </motion.div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-slate-500 uppercase font-bold">SHA-256 Hash</label>
                        {changedCount > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-[10px] text-amber-400 font-bold"
                            >
                                {changedCount}/64 chars changed! 🔥
                            </motion.span>
                        )}
                    </div>
                    <div
                        className={cn(
                            "w-full bg-slate-800 border rounded-xl px-4 py-3 font-mono text-xs break-all min-h-[60px] transition-all duration-300",
                            isHashing ? "border-amber-500 bg-amber-500/10" : "border-slate-700"
                        )}
                    >
                        {hashOutput ? (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={hashOutput}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-emerald-400"
                                >
                                    {hashOutput.split('').map((char, i) => (
                                        <motion.span
                                            key={i}
                                            initial={{ color: previousHash && char !== previousHash[i] ? '#f59e0b' : '#34d399' }}
                                            animate={{ color: '#34d399' }}
                                            transition={{ delay: i * 0.01, duration: 0.5 }}
                                        >
                                            {char}
                                        </motion.span>
                                    ))}
                                </motion.div>
                            </AnimatePresence>
                        ) : (
                            <span className="text-slate-600">Hash will appear here...</span>
                        )}
                    </div>
                </div>

                <div className="p-3 bg-slate-800/50 rounded-xl text-xs text-slate-400">
                    💡 <strong>Avalanche Effect:</strong> Change just one character and watch the entire hash transform!
                    This makes hashes irreversible.
                </div>
            </div>
        </div>
    );
}

// Module B: Asymmetric Encryption
function EncryptionModule() {
    const {
        message,
        encryptedMessage,
        decryptedMessage,
        encryptionStep,
        hackerIntercepted,
        isAnimating,
        setMessage,
        setEncryptedMessage,
        setDecryptedMessage,
        setEncryptionStep,
        setHackerIntercepted,
        setIsAnimating,
        resetEncryption,
    } = useCryptoStore();

    const [inputMessage, setInputMessage] = useState('Merhaba Bob!');

    const runEncryption = useCallback(async (withHacker: boolean) => {
        if (isAnimating) return;
        resetEncryption();
        setIsAnimating(true);
        setHackerIntercepted(withHacker);
        setMessage(inputMessage);

        // Step 1: Writing
        setEncryptionStep('writing');
        await delay(1000);

        // Step 2: Encrypting with Bob's public key
        setEncryptionStep('encrypting');
        await delay(1200);
        const encrypted = visualEncrypt(inputMessage);
        setEncryptedMessage(encrypted);

        // Step 3: Sending
        setEncryptionStep('sending');
        await delay(1500);

        if (withHacker) {
            // Hacker intercepts
            setEncryptionStep('intercepted');
            await delay(2000);
            // Hacker can't decrypt
            setEncryptionStep('failed');
            await delay(1500);
        }

        // Step 4: Received by Bob
        setEncryptionStep('received');
        await delay(1000);

        // Step 5: Decrypting with private key
        setEncryptionStep('decrypting');
        await delay(1200);
        const decrypted = visualDecrypt(encrypted);
        setDecryptedMessage(decrypted);

        // Step 6: Done
        setEncryptionStep('decrypted');
        setIsAnimating(false);
    }, [inputMessage, isAnimating, resetEncryption, setIsAnimating, setHackerIntercepted, setMessage, setEncryptionStep, setEncryptedMessage, setDecryptedMessage]);

    const getPacketPosition = (): { x: number; y: number } => {
        switch (encryptionStep) {
            case 'writing':
            case 'encrypting':
                return { x: 100, y: 200 };
            case 'sending':
                return { x: 350, y: 200 };
            case 'intercepted':
            case 'failed':
                return { x: 350, y: 120 };
            case 'received':
            case 'decrypting':
            case 'decrypted':
                return { x: 600, y: 200 };
            default:
                return { x: 100, y: 200 };
        }
    };

    return (
        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
                🔑 Asymmetric Encryption (Public/Private Key)
            </h3>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    disabled={isAnimating}
                    placeholder="Message for Bob..."
                    className="flex-1 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                    onClick={() => runEncryption(false)}
                    disabled={isAnimating || !inputMessage}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all"
                >
                    Send Securely
                </button>
                <button
                    onClick={() => runEncryption(true)}
                    disabled={isAnimating || !inputMessage}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all"
                >
                    🕵️ With Hacker
                </button>
            </div>

            {/* Visualization */}
            <div className="relative h-[300px] bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden">
                {/* Alice */}
                <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                    <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all",
                        encryptionStep === 'writing' || encryptionStep === 'encrypting' ? "bg-violet-600 scale-110" : "bg-slate-800 border border-slate-700"
                    )}>
                        👩
                    </div>
                    <span className="text-xs text-slate-300 font-medium">Alice</span>
                    <div className="flex gap-1 mt-1">
                        <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center text-[10px]" title="Alice's Public Key">🔓</div>
                        <div className="w-5 h-5 bg-rose-500 rounded flex items-center justify-center text-[10px]" title="Alice's Private Key">🔐</div>
                    </div>
                </div>

                {/* Hacker */}
                <div className={cn(
                    "absolute left-1/2 -translate-x-1/2 top-8 flex flex-col items-center gap-2 transition-all",
                    hackerIntercepted && (encryptionStep === 'intercepted' || encryptionStep === 'failed') ? "opacity-100 scale-110" : "opacity-30"
                )}>
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl",
                        encryptionStep === 'failed' ? "bg-rose-600 animate-pulse" : "bg-slate-800 border border-slate-700"
                    )}>
                        🕵️
                    </div>
                    <span className="text-xs text-slate-400">Hacker</span>
                    {encryptionStep === 'failed' && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[10px] text-rose-400 font-bold"
                        >
                            ❌ Can&apos;t decrypt!
                        </motion.div>
                    )}
                </div>

                {/* Bob */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                    <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all",
                        encryptionStep === 'received' || encryptionStep === 'decrypting' || encryptionStep === 'decrypted' ? "bg-cyan-600 scale-110" : "bg-slate-800 border border-slate-700"
                    )}>
                        👨
                    </div>
                    <span className="text-xs text-slate-300 font-medium">Bob</span>
                    <div className="flex gap-1 mt-1">
                        <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center text-[10px]" title="Bob's Public Key">🔓</div>
                        <div className="w-5 h-5 bg-rose-500 rounded flex items-center justify-center text-[10px]" title="Bob's Private Key">🔐</div>
                    </div>
                </div>

                {/* Animated Packet */}
                <AnimatePresence>
                    {encryptionStep !== 'idle' && encryptionStep !== 'decrypted' && (
                        <motion.div
                            className={cn(
                                "absolute w-12 h-12 rounded-xl flex items-center justify-center text-xl",
                                encryptionStep === 'writing' ? "bg-slate-700" :
                                    encryptionStep === 'failed' ? "bg-rose-600" : "bg-amber-500"
                            )}
                            animate={getPacketPosition()}
                            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                        >
                            {encryptionStep === 'writing' ? '📝' :
                                encryptionStep === 'encrypting' ? '🔒' :
                                    encryptionStep === 'failed' ? '🔒' : '📦'}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Status */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
                    <span className="text-xs text-slate-500 font-medium">
                        {encryptionStep === 'idle' && 'Ready to send encrypted message'}
                        {encryptionStep === 'writing' && `Alice writes: "${message}"`}
                        {encryptionStep === 'encrypting' && "Encrypting with Bob's PUBLIC key 🔓"}
                        {encryptionStep === 'sending' && 'Sending encrypted message...'}
                        {encryptionStep === 'intercepted' && '🕵️ Hacker intercepted the message!'}
                        {encryptionStep === 'failed' && '❌ Hacker cannot decrypt without PRIVATE key!'}
                        {encryptionStep === 'received' && 'Bob received the encrypted message'}
                        {encryptionStep === 'decrypting' && "Decrypting with Bob's PRIVATE key 🔐"}
                        {encryptionStep === 'decrypted' && `✅ Bob reads: "${decryptedMessage}"`}
                    </span>
                </div>
            </div>

            {/* Explanation */}
            <div className="mt-4 p-3 bg-slate-800/50 rounded-xl text-xs text-slate-400">
                💡 <strong>How it works:</strong> Alice encrypts with Bob&apos;s <span className="text-emerald-400">public key</span>.
                Only Bob&apos;s <span className="text-rose-400">private key</span> can decrypt it.
                Even if a hacker intercepts, they can&apos;t read the message!
            </div>
        </div>
    );
}

export default function CryptoVisualizer() {
    return (
        <div className="flex flex-col gap-6">
            <HashingModule />
            <EncryptionModule />
        </div>
    );
}
