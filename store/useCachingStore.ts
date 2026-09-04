import { create } from 'zustand';
import {
    createInitialState,
    createPacket,
    generateFlushSteps,
    generateReadSteps,
    generateWriteSteps,
    PRESETS,
    type CacheStrategy,
    type CachingState,
    type FlowPacket,
    type PresetName,
    type SimulationStep,
} from '@/lib/cachingStrategies';

interface CachingStoreState extends CachingState {
    activePackets: FlowPacket[];
    stepDescription: string;
    isAnimating: boolean;

    readKey: (key: string) => Promise<void>;
    writeKey: (key: string, value: string) => Promise<void>;
    setStrategy: (strategy: CacheStrategy) => void;
    flushWriteBackQueue: () => Promise<void>;
    reset: () => void;
    runPreset: (preset: PresetName) => Promise<void>;
}

const STEP_ANIMATION_MS = 600;

async function runSteps(
    steps: SimulationStep[],
    getState: () => CachingStoreState,
    setState: (partial: Partial<CachingStoreState>) => void
): Promise<void> {
    if (getState().isAnimating) return;

    setState({ isAnimating: true });

    for (const step of steps) {
        setState({ stepDescription: step.description });

        const packets = step.packets.map((p) => createPacket(p, 0));
        setState({ activePackets: packets });

        const frames = 20;
        for (let i = 1; i <= frames; i++) {
            await new Promise((r) => setTimeout(r, STEP_ANIMATION_MS / frames));
            setState({
                activePackets: packets.map((p) => ({ ...p, progress: i / frames })),
            });
        }

        const current = getState();
        const next = step.apply({
            strategy: current.strategy,
            cacheData: current.cacheData,
            dbData: current.dbData,
            dirtyKeys: current.dirtyKeys,
            stats: current.stats,
            latencyMs: current.latencyMs,
        });

        setState({
            ...next,
            latencyMs: current.latencyMs + step.latencyMs,
            activePackets: [],
        });

        await new Promise((r) => setTimeout(r, 150));
    }

    setState({ isAnimating: false });
}

export const useCachingStore = create<CachingStoreState>((set, get) => ({
    ...createInitialState(),
    activePackets: [],
    stepDescription: 'Bir strateji seçin ve READ veya WRITE operasyonu başlatın.',
    isAnimating: false,

    readKey: async (key) => {
        const state = get();
        const steps = generateReadSteps(key, state);
        await runSteps(steps, get, (partial) => set(partial));
    },

    writeKey: async (key, value) => {
        const state = get();
        const steps = generateWriteSteps(key, value, state);
        await runSteps(steps, get, (partial) => set(partial));
    },

    setStrategy: (strategy) => {
        if (get().isAnimating) return;
        const fresh = createInitialState(strategy);
        set({
            ...fresh,
            activePackets: [],
            stepDescription: `${strategy} stratejisi seçildi. Operasyon başlatın.`,
            isAnimating: false,
        });
    },

    flushWriteBackQueue: async () => {
        const state = get();
        const steps = generateFlushSteps(state);
        await runSteps(steps, get, (partial) => set(partial));
    },

    reset: () => {
        const strategy = get().strategy;
        set({
            ...createInitialState(strategy),
            activePackets: [],
            stepDescription: 'Simülasyon sıfırlandı.',
            isAnimating: false,
        });
    },

    runPreset: async (preset) => {
        const config = PRESETS[preset];
        if (!config || get().isAnimating) return;

        get().reset();

        if (preset === 'write-back-sync') {
            get().setStrategy('write-back');
        }

        for (const op of config.ops) {
            if (op.type === 'read') {
                await get().readKey(op.key);
            } else if (op.value) {
                await get().writeKey(op.key, op.value);
            }
        }

        if (config.flushAfter) {
            await get().flushWriteBackQueue();
        }
    },
}));

export type { CacheStrategy, PresetName };
