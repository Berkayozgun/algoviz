import { create } from 'zustand';
import {
    applyOperation,
    createLRUCache,
    resetCache,
    setCapacity as setCacheCapacity,
    SEQUENCES,
    lruGet,
    lruPut,
    type CacheAction,
    type LRUCacheState,
    type SequenceName,
} from '@/lib/lruCache';

interface LRUCacheStoreState {
    engine: LRUCacheState;
    lastAction: CacheAction | null;
    isRunningSequence: boolean;

    put: (key: string, value: string) => void;
    get: (key: string) => void;
    setCapacity: (cap: number) => void;
    reset: () => void;
    runSequence: (sequenceName: SequenceName) => Promise<void>;
}

export const useLRUCacheStore = create<LRUCacheStoreState>((set, get) => ({
    engine: createLRUCache(),
    lastAction: null,
    isRunningSequence: false,

    put: (key, value) => {
        const trimmedKey = key.trim().toUpperCase();
        const trimmedValue = value.trim();
        if (!trimmedKey) return;

        const { state, action } = lruPut(get().engine, trimmedKey, trimmedValue || '—');
        set({ engine: state, lastAction: action });
    },

    get: (key) => {
        const trimmedKey = key.trim().toUpperCase();
        if (!trimmedKey) return;

        const { state, action } = lruGet(get().engine, trimmedKey);
        set({ engine: state, lastAction: action });
    },

    setCapacity: (cap) => {
        const state = setCacheCapacity(get().engine, cap);
        set({
            engine: state,
            lastAction: {
                type: 'RESET',
                message: `Kapasite ${state.capacity} olarak ayarlandı. Fazla elemanlar LRU sırasına göre tahliye edildi.`,
            },
        });
    },

    reset: () => {
        const { state, action } = resetCache(get().engine.capacity);
        set({ engine: state, lastAction: action, isRunningSequence: false });
    },

    runSequence: async (sequenceName) => {
        const sequence = SEQUENCES[sequenceName];
        if (!sequence) return;

        const { state } = resetCache(get().engine.capacity);
        set({ engine: state, lastAction: null, isRunningSequence: true });

        for (const op of sequence.ops) {
            await new Promise((resolve) => setTimeout(resolve, 700));
            const result = applyOperation(get().engine, op);
            set({ engine: result.state, lastAction: result.action });
        }

        set({ isRunningSequence: false });
    },
}));

export type { CacheAction, SequenceName };
