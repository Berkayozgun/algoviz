'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSearchingStore, type SearchAlgorithm, type SearchSpeed } from '@/store/useSearchingStore';
import { getAlgorithmInfo, getSpeedMs, pickMissingTarget } from '@/lib/searching';
import { cn } from '@/lib/utils';

const ALGORITHMS: { id: SearchAlgorithm; label: string }[] = [
    { id: 'linear', label: 'Linear' },
    { id: 'binary', label: 'Binary' },
    { id: 'interpolation', label: 'Interpolation' },
];

export default function SearchingVisualizer() {
    const {
        array,
        target,
        algorithm,
        steps,
        currentStepIndex,
        isPlaying,
        isFound,
        speed,
        setAlgorithm,
        setTarget,
        generateNewArray,
        generateUniformArray,
        runSearch,
        stepForward,
        stepBackward,
        play,
        pause,
        reset,
        setSpeed,
    } = useSearchingStore();

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
    const algoInfo = getAlgorithmInfo(algorithm);

    useEffect(() => {
        if (isPlaying && currentStepIndex < steps.length - 1) {
            intervalRef.current = setInterval(() => {
                const s = useSearchingStore.getState();
                if (s.currentStepIndex < s.steps.length - 1) {
                    const next = s.currentStepIndex + 1;
                    useSearchingStore.setState({
                        currentStepIndex: next,
                        isFound: s.steps[next]?.found ?? s.isFound,
                    });
                } else {
                    useSearchingStore.setState({ isPlaying: false });
                }
            }, getSpeedMs(speed));
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (isPlaying && currentStepIndex >= steps.length - 1) pause();
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPlaying, speed, currentStepIndex, steps.length, pause]);

    const maxVal = Math.max(...array, 1);

    const getBarColor = (index: number) => {
        if (currentStep?.targetIndex === index && currentStep.found) {
            return 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.6)]';
        }
        if (currentStep?.activeIndices.includes(index)) {
            return 'bg-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.5)]';
        }
        if (currentStep?.eliminatedIndices.includes(index)) {
            return 'bg-slate-800/60 opacity-40';
        }
        if (array[index] === target && isFound) {
            return 'bg-emerald-500/80';
        }
        return 'bg-slate-600';
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1">
                    {ALGORITHMS.map((a) => (
                        <button
                            key={a.id}
                            onClick={() => setAlgorithm(a.id)}
                            disabled={isPlaying}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                                algorithm === a.id
                                    ? 'bg-violet-600 text-white'
                                    : 'text-slate-400 hover:text-slate-200'
                            )}
                        >
                            {a.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">Hedef:</label>
                    <input
                        type="number"
                        value={target}
                        onChange={(e) => setTarget(parseInt(e.target.value, 10) || 0)}
                        disabled={isPlaying}
                        className="w-20 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-sm font-mono text-center"
                    />
                    <button
                        onClick={() => setTarget(pickMissingTarget(array))}
                        disabled={isPlaying}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs"
                    >
                        Yok sayı
                    </button>
                </div>

                <button
                    onClick={() => generateNewArray(true)}
                    disabled={isPlaying}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
                >
                    Sıralı Dizi
                </button>
                <button
                    onClick={() => generateNewArray(false)}
                    disabled={isPlaying}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
                >
                    Rastgele Dizi
                </button>
                <button
                    onClick={generateUniformArray}
                    disabled={isPlaying}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
                >
                    Uniform Dizi
                </button>

                <button
                    onClick={runSearch}
                    disabled={isPlaying}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
                >
                    Çalıştır
                </button>
                <button onClick={play} disabled={isPlaying} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold">▶</button>
                <button onClick={pause} disabled={!isPlaying} className="px-3 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold">⏸</button>
                <button onClick={stepBackward} disabled={currentStepIndex <= 0} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold">◀</button>
                <button onClick={stepForward} disabled={currentStepIndex >= steps.length - 1 || steps.length === 0} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold">▶|</button>
                <button onClick={reset} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold">Sıfırla</button>

                <select
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value as SearchSpeed)}
                    className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                >
                    <option value="slow">Yavaş</option>
                    <option value="normal">Normal</option>
                    <option value="fast">Hızlı</option>
                </select>
            </div>

            {/* Metrics */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <div>
                    <span className="text-slate-500">Karşılaştırma: </span>
                    <span className="text-amber-400 font-bold font-mono">
                        {currentStep?.comparisons ?? 0}
                    </span>
                </div>
                <div>
                    <span className="text-slate-500">Karmaşıklık: </span>
                    <span className="text-violet-400 font-bold font-mono">{algoInfo.complexity}</span>
                </div>
                <div>
                    <span className="text-slate-500">Dizi: </span>
                    <span className="text-cyan-400 font-bold font-mono">{array.length} eleman</span>
                </div>
                <div>
                    <span className="text-slate-500">Sonuç: </span>
                    <span className={cn(
                        'font-bold font-mono',
                        isFound === true && 'text-emerald-400',
                        isFound === false && 'text-rose-400',
                        isFound === null && 'text-slate-500'
                    )}>
                        {isFound === true ? 'Bulundu ✓' : isFound === false ? 'Bulunamadı ✗' : '—'}
                    </span>
                </div>
                {steps.length > 0 && (
                    <div>
                        <span className="text-slate-500">Adım: </span>
                        <span className="text-slate-300 font-mono">{currentStepIndex + 1}/{steps.length}</span>
                    </div>
                )}
            </div>

            {/* Array visualization */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 overflow-x-auto">
                <div className="flex items-end justify-center gap-1 min-w-max mx-auto" style={{ minHeight: 220 }}>
                    {array.map((value, index) => {
                        const height = Math.max(40, (value / maxVal) * 160);
                        const isMid = currentStep?.mid === index;
                        const isLow = currentStep?.low === index;
                        const isHigh = currentStep?.high === index;

                        return (
                            <div key={index} className="flex flex-col items-center gap-1">
                                <div className="h-5 flex items-end">
                                    {isLow && algorithm !== 'linear' && (
                                        <span className="text-[9px] font-bold text-cyan-400">LOW</span>
                                    )}
                                    {isMid && algorithm !== 'linear' && (
                                        <span className="text-[9px] font-bold text-amber-400 mx-0.5">MID</span>
                                    )}
                                    {isHigh && algorithm !== 'linear' && (
                                        <span className="text-[9px] font-bold text-rose-400">HIGH</span>
                                    )}
                                    {algorithm === 'linear' && currentStep?.activeIndices.includes(index) && (
                                        <span className="text-[9px] font-bold text-amber-400">PTR</span>
                                    )}
                                </div>
                                <motion.div
                                    animate={{
                                        scale: currentStep?.activeIndices.includes(index) ? [1, 1.05, 1] : 1,
                                    }}
                                    transition={
                                        currentStep?.activeIndices.includes(index)
                                            ? { repeat: Infinity, duration: 0.7 }
                                            : {}
                                    }
                                    className={cn(
                                        'w-10 rounded-t-lg flex items-end justify-center relative',
                                        getBarColor(index)
                                    )}
                                    style={{ height }}
                                >
                                    <span className="absolute -top-5 text-xs font-mono font-bold text-slate-200">
                                        {value}
                                    </span>
                                </motion.div>
                                <span className="text-[9px] text-slate-600 font-mono">[{index}]</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Algorithm info + step description */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                    <h3 className="text-sm font-bold text-violet-300 mb-1">{algoInfo.title}</h3>
                    <p className="text-xs text-slate-500 mb-2">{algoInfo.complexity} · {algoInfo.requirement}</p>
                    <p className="text-xs text-slate-400">{algoInfo.summary}</p>
                </div>
                <div className="md:col-span-2 p-4 rounded-xl border border-slate-700/50 bg-slate-800/50 text-sm text-slate-300">
                    {currentStep?.description ??
                        'Algoritma seçin, hedef değeri ayarlayın ve "Çalıştır" veya Play ile aramayı başlatın.'}
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500" /> Aktif</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-800 opacity-40 border border-slate-600" /> Elenen</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" /> Bulundu</div>
                <div className="flex items-center gap-1.5"><span className="text-cyan-400 font-bold text-[10px]">LOW</span> alt sınır</div>
                <div className="flex items-center gap-1.5"><span className="text-amber-400 font-bold text-[10px]">MID</span> orta</div>
                <div className="flex items-center gap-1.5"><span className="text-rose-400 font-bold text-[10px]">HIGH</span> üst sınır</div>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl text-xs text-slate-400 leading-relaxed">
                Linear Search her elemanı sırayla kontrol eder. Binary Search sıralı dizide arama uzayını her adımda yarıya indirir.
                Interpolation Search uniform dağılımda hedef değerin konumunu formülle tahmin ederek daha hızlı yakınsar.
            </div>
        </div>
    );
}
