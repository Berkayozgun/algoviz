'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Step = 0 | 1 | 2 | 3 | 4 | 5;

const COLORS = {
    public: '#facc15', // Yellow
    aliceSecret: '#ef4444', // Red
    bobSecret: '#3b82f6', // Blue
    aliceMixed: '#f97316', // Orange (Yellow + Red)
    bobMixed: '#22c55e', // Green (Yellow + Blue)
    sharedSecret: '#78350f', // Brown (final shared secret)
};

const ColorCircle = ({ color, label, size = 'md', animate = false }: {
    color: string;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
    animate?: boolean;
}) => {
    const sizeClasses = {
        sm: 'w-8 h-8 text-[10px]',
        md: 'w-12 h-12 text-xs',
        lg: 'w-16 h-16 text-sm',
    };

    return (
        <motion.div
            initial={animate ? { scale: 0 } : undefined}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={cn(
                "rounded-full flex items-center justify-center font-bold text-white shadow-lg",
                sizeClasses[size]
            )}
            style={{ backgroundColor: color }}
        >
            {label}
        </motion.div>
    );
};

const Person = ({
    name,
    emoji,
    secretColor,
    secretLabel,
    mixedColor,
    mixedLabel,
    receivedColor,
    receivedLabel,
    finalColor,
    showSecret,
    showMixed,
    showReceived,
    showFinal,
    isActive,
    side,
}: {
    name: string;
    emoji: string;
    secretColor: string;
    secretLabel: string;
    mixedColor: string;
    mixedLabel: string;
    receivedColor: string;
    receivedLabel: string;
    finalColor: string;
    showSecret: boolean;
    showMixed: boolean;
    showReceived: boolean;
    showFinal: boolean;
    isActive: boolean;
    side: 'left' | 'right';
}) => (
    <div className={cn("flex flex-col items-center gap-3", side === 'left' ? 'items-start' : 'items-end')}>
        <motion.div
            animate={{ scale: isActive ? 1.1 : 1 }}
            className={cn(
                "w-20 h-20 rounded-2xl flex items-center justify-center text-4xl transition-all",
                isActive ? "bg-violet-600 shadow-[0_0_30px_rgba(139,92,246,0.5)]" : "bg-slate-800 border border-slate-700"
            )}
        >
            {emoji}
        </motion.div>
        <span className="text-sm font-bold text-slate-300">{name}</span>

        {/* Color inventory */}
        <div className="flex flex-col gap-2 mt-2">
            <AnimatePresence>
                {showSecret && (
                    <motion.div
                        initial={{ opacity: 0, x: side === 'left' ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                    >
                        <ColorCircle color={secretColor} size="sm" animate />
                        <span className="text-[10px] text-slate-500">{secretLabel} (Secret)</span>
                    </motion.div>
                )}
                {showMixed && (
                    <motion.div
                        initial={{ opacity: 0, x: side === 'left' ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                    >
                        <ColorCircle color={mixedColor} size="sm" animate />
                        <span className="text-[10px] text-slate-500">{mixedLabel}</span>
                    </motion.div>
                )}
                {showReceived && (
                    <motion.div
                        initial={{ opacity: 0, x: side === 'left' ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                    >
                        <ColorCircle color={receivedColor} size="sm" animate />
                        <span className="text-[10px] text-slate-500">{receivedLabel} (Received)</span>
                    </motion.div>
                )}
                {showFinal && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 p-2 bg-amber-500/20 rounded-lg border border-amber-500/30"
                    >
                        <ColorCircle color={finalColor} size="sm" animate />
                        <span className="text-[10px] text-amber-400 font-bold">🔑 Shared Secret!</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
);

export default function DiffieHellmanVisualizer() {
    const [step, setStep] = useState<Step>(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const stepDescriptions = [
        "Ready to start the Diffie-Hellman Key Exchange",
        "Step 1: Alice and Bob agree on a public color (Yellow) 🟡",
        "Step 2: Each mixes the public color with their secret color",
        "Step 3: They exchange their mixed colors publicly",
        "Step 4: Each adds their secret to the received color",
        "Step 5: Both arrive at the same Shared Secret! 🔐",
    ];

    const runSimulation = useCallback(async () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setStep(0);

        await delay(500);
        setStep(1); // Public color agreement
        await delay(2000);
        setStep(2); // Mixing
        await delay(2500);
        setStep(3); // Exchange
        await delay(2500);
        setStep(4); // Final mix
        await delay(2500);
        setStep(5); // Shared secret revealed

        setIsAnimating(false);
    }, [isAnimating]);

    const reset = () => {
        setStep(0);
        setIsAnimating(false);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl">
                <button
                    onClick={runSimulation}
                    disabled={isAnimating}
                    className="px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105"
                >
                    ▶️ Start Key Exchange
                </button>
                <button
                    onClick={reset}
                    disabled={isAnimating}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-sm font-medium transition-all border border-slate-700"
                >
                    Reset
                </button>
            </div>

            {/* Main Visualization */}
            <div className="relative h-[450px] bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden p-6">
                {/* Public Color (Center Top) */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                    <AnimatePresence>
                        {step >= 1 && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center gap-2"
                            >
                                <ColorCircle color={COLORS.public} size="lg" label="Public" animate />
                                <span className="text-xs text-slate-400">Public Color (Everyone sees)</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Alice (Left) */}
                <div className="absolute left-8 top-1/2 -translate-y-1/2">
                    <Person
                        name="Alice"
                        emoji="👩"
                        secretColor={COLORS.aliceSecret}
                        secretLabel="Red"
                        mixedColor={COLORS.aliceMixed}
                        mixedLabel="Orange (Yellow + Red)"
                        receivedColor={COLORS.bobMixed}
                        receivedLabel="Green"
                        finalColor={COLORS.sharedSecret}
                        showSecret={step >= 2}
                        showMixed={step >= 2}
                        showReceived={step >= 3}
                        showFinal={step >= 5}
                        isActive={step === 2 || step === 4}
                        side="left"
                    />
                </div>

                {/* Bob (Right) */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2">
                    <Person
                        name="Bob"
                        emoji="👨"
                        secretColor={COLORS.bobSecret}
                        secretLabel="Blue"
                        mixedColor={COLORS.bobMixed}
                        mixedLabel="Green (Yellow + Blue)"
                        receivedColor={COLORS.aliceMixed}
                        receivedLabel="Orange"
                        finalColor={COLORS.sharedSecret}
                        showSecret={step >= 2}
                        showMixed={step >= 2}
                        showReceived={step >= 3}
                        showFinal={step >= 5}
                        isActive={step === 2 || step === 4}
                        side="right"
                    />
                </div>

                {/* Hacker (Center) */}
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                    <div className="flex flex-col items-center gap-2">
                        <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all",
                            step >= 3 ? "bg-slate-700" : "bg-slate-800/50 border border-slate-700/50"
                        )}>
                            🕵️
                        </div>
                        <span className="text-xs text-slate-500">Hacker</span>

                        {/* What hacker sees */}
                        <AnimatePresence>
                            {step >= 3 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center gap-1 mt-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700"
                                >
                                    <span className="text-[10px] text-slate-500">Can see:</span>
                                    <div className="flex gap-2">
                                        <ColorCircle color={COLORS.public} size="sm" />
                                        <ColorCircle color={COLORS.aliceMixed} size="sm" />
                                        <ColorCircle color={COLORS.bobMixed} size="sm" />
                                    </div>
                                    <span className="text-[10px] text-rose-400 font-bold mt-1">
                                        ❌ Can&apos;t derive Brown!
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Animated exchanges */}
                <AnimatePresence>
                    {step === 3 && (
                        <>
                            <motion.div
                                className="absolute w-10 h-10 rounded-full"
                                style={{ backgroundColor: COLORS.aliceMixed }}
                                initial={{ left: 150, top: 200 }}
                                animate={{ left: 550, top: 200 }}
                                transition={{ duration: 1.5, ease: 'easeInOut' }}
                            />
                            <motion.div
                                className="absolute w-10 h-10 rounded-full"
                                style={{ backgroundColor: COLORS.bobMixed }}
                                initial={{ left: 550, top: 250 }}
                                animate={{ left: 150, top: 250 }}
                                transition={{ duration: 1.5, ease: 'easeInOut' }}
                            />
                        </>
                    )}
                </AnimatePresence>

                {/* Status */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-md text-center">
                    <motion.p
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "text-sm px-4 py-2 rounded-xl",
                            step === 5 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-slate-400"
                        )}
                    >
                        {stepDescriptions[step]}
                    </motion.p>
                </div>
            </div>

            {/* Final Result */}
            <AnimatePresence>
                {step === 5 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl text-center"
                    >
                        <h3 className="text-lg font-bold text-amber-400 mb-2">🔐 Key Exchange Complete!</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Both Alice and Bob now share the same secret (Brown) without ever transmitting it!
                        </p>
                        <div className="flex justify-center gap-8">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500">Alice:</span>
                                <ColorCircle color={COLORS.sharedSecret} size="md" label="🔑" />
                            </div>
                            <span className="text-2xl text-slate-600">=</span>
                            <div className="flex items-center gap-2">
                                <ColorCircle color={COLORS.sharedSecret} size="md" label="🔑" />
                                <span className="text-slate-500">:Bob</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Explanation */}
            <div className="p-4 bg-slate-800/50 rounded-xl text-xs text-slate-400">
                💡 <strong>How it works:</strong> Even though the hacker sees the public color and both mixed colors,
                they can&apos;t &quot;unmix&quot; them to find the secret colors. This is like trying to unseparate paint!
                In real DH, this uses the difficulty of discrete logarithms.
            </div>
        </div>
    );
}
