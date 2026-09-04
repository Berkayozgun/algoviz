import { create } from 'zustand';
import {
    type AttentionHead,
    DEFAULT_SENTENCE,
    PRESET_SENTENCES,
} from '@/lib/attention';

interface AttentionState {
    sentence: string;
    presetSentences: string[];
    selectedHead: AttentionHead;
    selectedTokenIndex: number | null;
    temperature: number;

    setSentence: (text: string) => void;
    setHead: (head: AttentionHead) => void;
    setSelectedToken: (index: number | null) => void;
    setTemperature: (temp: number) => void;
}

export const useAttentionStore = create<AttentionState>((set) => ({
    sentence: DEFAULT_SENTENCE,
    presetSentences: PRESET_SENTENCES,
    selectedHead: 'head1',
    selectedTokenIndex: null,
    temperature: 1.0,

    setSentence: (text) => set({ sentence: text, selectedTokenIndex: null }),
    setHead: (head) => set({ selectedHead: head, selectedTokenIndex: null }),
    setSelectedToken: (index) => set({ selectedTokenIndex: index }),
    setTemperature: (temp) => set({ temperature: temp }),
}));
