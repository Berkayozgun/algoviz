import { create } from 'zustand';
import {
    createInitialCluster,
    sendClientCommand,
    tickCluster,
    toggleNodeCrash,
    type RaftClusterState,
    type RaftSpeed,
} from '@/lib/raft';

interface RaftStoreState extends RaftClusterState {
    isRunning: boolean;
    speed: RaftSpeed;

    tick: () => void;
    toggleNodeCrash: (id: number) => void;
    sendClientCommand: (cmd: string) => void;
    resetCluster: () => void;
    pause: () => void;
    resume: () => void;
    setSpeed: (speed: RaftSpeed) => void;
}

function extractCluster(state: RaftStoreState): RaftClusterState {
    return {
        nodes: state.nodes,
        currentTerm: state.currentTerm,
        leaderId: state.leaderId,
        messages: state.messages,
        clusterLog: state.clusterLog,
        statusMessage: state.statusMessage,
        messageIdCounter: state.messageIdCounter,
        replicationAcks: state.replicationAcks,
    };
}

function applyCluster(cluster: RaftClusterState): Partial<RaftStoreState> {
    return {
        nodes: cluster.nodes,
        currentTerm: cluster.currentTerm,
        leaderId: cluster.leaderId,
        messages: cluster.messages,
        clusterLog: cluster.clusterLog,
        statusMessage: cluster.statusMessage,
        messageIdCounter: cluster.messageIdCounter,
        replicationAcks: cluster.replicationAcks,
    };
}

const initial = createInitialCluster();

export const useRaftStore = create<RaftStoreState>((set, get) => ({
    ...initial,
    isRunning: true,
    speed: 'normal',

    tick: () => {
        const cluster = tickCluster(extractCluster(get()));
        set(applyCluster(cluster));
    },

    toggleNodeCrash: (id) => {
        const cluster = toggleNodeCrash(extractCluster(get()), id);
        set(applyCluster(cluster));
    },

    sendClientCommand: (cmd) => {
        const cluster = sendClientCommand(extractCluster(get()), cmd);
        set(applyCluster(cluster));
    },

    resetCluster: () => {
        set({ ...createInitialCluster(), isRunning: true });
    },

    pause: () => set({ isRunning: false }),

    resume: () => set({ isRunning: true }),

    setSpeed: (speed) => set({ speed }),
}));

export type { RaftSpeed };
