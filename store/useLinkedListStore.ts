import { create } from 'zustand';
import {
    createInitialList,
    deleteNode,
    generateFloydSteps,
    generateReverseSteps,
    insertHead,
    insertTail,
    toggleCycle,
    type AnimationStep,
    type LinkedListType,
} from '@/lib/linkedList';

type ListSpeed = 'slow' | 'normal' | 'fast';

interface LinkedListStoreState {
    listType: LinkedListType;
    nodes: import('@/lib/linkedList').ListNode[];
    headId: string | null;
    cycleTargetId: string | null;
    steps: AnimationStep[];
    currentStepIndex: number;
    isPlaying: boolean;
    speed: ListSpeed;
    hasCycle: boolean;

    setListType: (t: LinkedListType) => void;
    insertHead: (value: number) => void;
    insertTail: (value: number) => void;
    deleteNode: (id: string) => void;
    reverse: () => void;
    createCycle: () => void;
    runFloydCycle: () => void;
    stepForward: () => void;
    stepBackward: () => void;
    play: () => void;
    pause: () => void;
    reset: () => void;
    setSpeed: (speed: ListSpeed) => void;
    applyCurrentStep: () => void;
}

function getStateSnapshot(get: () => LinkedListStoreState) {
    const s = get();
    return {
        listType: s.listType,
        nodes: s.nodes,
        headId: s.headId,
        cycleTargetId: s.cycleTargetId,
    };
}

function syncFromListState(
    listState: ReturnType<typeof getStateSnapshot> extends infer T ? T : never,
    extra: Partial<LinkedListStoreState> = {}
) {
    return {
        nodes: listState.nodes,
        headId: listState.headId,
        cycleTargetId: listState.cycleTargetId,
        hasCycle: listState.cycleTargetId !== null || listState.listType === 'circular',
        ...extra,
    };
}

export const useLinkedListStore = create<LinkedListStoreState>((set, get) => {
    const initial = createInitialList('singly');

    return {
        listType: initial.listType,
        nodes: initial.nodes,
        headId: initial.headId,
        cycleTargetId: initial.cycleTargetId,
        steps: [],
        currentStepIndex: -1,
        isPlaying: false,
        speed: 'normal',
        hasCycle: false,

        setListType: (t) => {
            const fresh = createInitialList(t);
            set({
                listType: t,
                nodes: fresh.nodes,
                headId: fresh.headId,
                cycleTargetId: fresh.cycleTargetId,
                hasCycle: t === 'circular',
                steps: [],
                currentStepIndex: -1,
                isPlaying: false,
            });
        },

        insertHead: (value) => {
            const next = insertHead(getStateSnapshot(get), value);
            set(syncFromListState(next, { steps: [], currentStepIndex: -1, isPlaying: false }));
        },

        insertTail: (value) => {
            const next = insertTail(getStateSnapshot(get), value);
            set(syncFromListState(next, { steps: [], currentStepIndex: -1, isPlaying: false }));
        },

        deleteNode: (id) => {
            const next = deleteNode(getStateSnapshot(get), id);
            set(syncFromListState(next, { steps: [], currentStepIndex: -1, isPlaying: false }));
        },

        reverse: () => {
            const steps = generateReverseSteps(getStateSnapshot(get));
            set({ steps, currentStepIndex: steps.length > 0 ? 0 : -1, isPlaying: false });
        },

        createCycle: () => {
            const next = toggleCycle(getStateSnapshot(get));
            set(syncFromListState(next, { steps: [], currentStepIndex: -1, isPlaying: false }));
        },

        runFloydCycle: () => {
            const steps = generateFloydSteps(getStateSnapshot(get));
            set({ steps, currentStepIndex: steps.length > 0 ? 0 : -1, isPlaying: false });
        },

        stepForward: () => {
            const { currentStepIndex, steps } = get();
            if (currentStepIndex < steps.length - 1) {
                set({ currentStepIndex: currentStepIndex + 1, isPlaying: false });
            } else if (currentStepIndex === steps.length - 1) {
                get().applyCurrentStep();
            }
        },

        stepBackward: () => {
            const { currentStepIndex } = get();
            if (currentStepIndex > 0) {
                set({ currentStepIndex: currentStepIndex - 1, isPlaying: false });
            }
        },

        play: () => {
            const { steps, currentStepIndex } = get();
            if (steps.length === 0) return;
            if (currentStepIndex < 0) {
                set({ currentStepIndex: 0, isPlaying: true });
            } else if (currentStepIndex < steps.length - 1) {
                set({ isPlaying: true });
            }
        },

        pause: () => set({ isPlaying: false }),

        applyCurrentStep: () => {
            const { steps, currentStepIndex } = get();
            const step = steps[currentStepIndex];
            if (!step?.finished) return;

            const headPointer = step.pointers.find(
                (p) => p.name === 'HEAD' || (p.name === 'PREV' && step.finished)
            );

            set({
                nodes: step.nodes.map((n) => ({ ...n })),
                headId: headPointer?.nodeId ?? get().headId,
                cycleTargetId: step.cycleTargetId ?? get().cycleTargetId,
                hasCycle: (step.cycleTargetId ?? get().cycleTargetId) !== null,
                isPlaying: false,
            });
        },

        reset: () => {
            const { listType } = get();
            const fresh = createInitialList(listType);
            set({
                nodes: fresh.nodes,
                headId: fresh.headId,
                cycleTargetId: fresh.cycleTargetId,
                hasCycle: listType === 'circular',
                steps: [],
                currentStepIndex: -1,
                isPlaying: false,
            });
        },

        setSpeed: (speed) => set({ speed }),
    };
});

export type { LinkedListType, ListSpeed };
