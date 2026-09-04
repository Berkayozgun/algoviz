export type RaftRole = 'follower' | 'candidate' | 'leader' | 'crashed';

export interface LogEntry {
    index: number;
    term: number;
    command: string;
    committed: boolean;
}

export interface RaftNode {
    id: number;
    role: RaftRole;
    currentTerm: number;
    votedFor: number | null;
    logs: LogEntry[];
    electionTimeout: number;
    electionTimeoutMax: number;
    heartbeatTimer: number;
    votesReceived: number;
}

export type MessageType = 'RequestVote' | 'AppendEntries' | 'VoteGranted' | 'Heartbeat';

export interface NetworkMessage {
    id: string;
    from: number;
    to: number;
    type: MessageType;
    term: number;
    payload?: {
        command?: string;
        entries?: LogEntry[];
        candidateId?: number;
    };
    progress: number;
}

export interface RaftClusterState {
    nodes: RaftNode[];
    currentTerm: number;
    leaderId: number | null;
    messages: NetworkMessage[];
    clusterLog: LogEntry[];
    statusMessage: string;
    messageIdCounter: number;
    replicationAcks: Record<number, number>;
}

export type RaftSpeed = 'slow' | 'normal' | 'fast';

export const NODE_COUNT = 5;
export const QUORUM = 3;
export const ELECTION_TIMEOUT_MIN = 18;
export const ELECTION_TIMEOUT_MAX = 30;
export const HEARTBEAT_INTERVAL = 10;
export const MESSAGE_TRAVEL_TICKS = 5;

let messageCounter = 0;

function randomElectionTimeout(): number {
    return (
        ELECTION_TIMEOUT_MIN +
        Math.floor(Math.random() * (ELECTION_TIMEOUT_MAX - ELECTION_TIMEOUT_MIN))
    );
}

function cloneNode(node: RaftNode): RaftNode {
    return {
        ...node,
        logs: node.logs.map((e) => ({ ...e })),
    };
}

function cloneState(state: RaftClusterState): RaftClusterState {
    return {
        ...state,
        nodes: state.nodes.map(cloneNode),
        messages: state.messages.map((m) => ({ ...m })),
        clusterLog: state.clusterLog.map((e) => ({ ...e })),
        replicationAcks: { ...state.replicationAcks },
    };
}

function aliveNodes(state: RaftClusterState): RaftNode[] {
    return state.nodes.filter((n) => n.role !== 'crashed');
}

function isAlive(state: RaftClusterState, id: number): boolean {
    return state.nodes.find((n) => n.id === id)?.role !== 'crashed';
}

function nextMessageId(state: RaftClusterState): string {
    messageCounter += 1;
    return `msg-${messageCounter}`;
}

function createMessage(
    state: RaftClusterState,
    from: number,
    to: number,
    type: MessageType,
    term: number,
    payload?: NetworkMessage['payload']
): NetworkMessage {
    return {
        id: nextMessageId(state),
        from,
        to,
        type,
        term,
        payload,
        progress: 0,
    };
}

function getNode(state: RaftClusterState, id: number): RaftNode {
    return state.nodes.find((n) => n.id === id)!;
}

function updateNode(state: RaftClusterState, id: number, patch: Partial<RaftNode>): RaftClusterState {
    return {
        ...state,
        nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    };
}

function becomeFollower(state: RaftClusterState, nodeId: number, term: number): RaftClusterState {
    let s = updateNode(state, nodeId, {
        role: 'follower',
        currentTerm: Math.max(getNode(state, nodeId).currentTerm, term),
        votedFor: null,
        votesReceived: 0,
        electionTimeout: randomElectionTimeout(),
    });
    const node = getNode(s, nodeId);
    if (term > node.currentTerm) {
        s = updateNode(s, nodeId, { currentTerm: term, votedFor: null });
    }
    return s;
}

function startElection(state: RaftClusterState, nodeId: number): RaftClusterState {
    const node = getNode(state, nodeId);
    if (node.role === 'crashed' || node.role === 'leader') return state;

    const newTerm = node.currentTerm + 1;
    let s = updateNode(state, nodeId, {
        role: 'candidate',
        currentTerm: newTerm,
        votedFor: nodeId,
        votesReceived: 1,
        electionTimeout: randomElectionTimeout(),
    });
    s = { ...s, currentTerm: newTerm, leaderId: null };

    const messages = [...s.messages];
    for (const target of s.nodes) {
        if (target.id !== nodeId && target.role !== 'crashed') {
            messages.push(
                createMessage(s, nodeId, target.id, 'RequestVote', newTerm, { candidateId: nodeId })
            );
        }
    }

    s = {
        ...s,
        messages,
        statusMessage: `Node ${nodeId}'nin zamanlayıcısı doldu; Term ${newTerm} için aday oldu ve oy topluyor.`,
    };

    if (getNode(s, nodeId).votesReceived >= QUORUM) {
        return becomeLeader(s, nodeId);
    }

    return s;
}

function becomeLeader(state: RaftClusterState, nodeId: number): RaftClusterState {
    let s = updateNode(state, nodeId, {
        role: 'leader',
        heartbeatTimer: HEARTBEAT_INTERVAL,
        votesReceived: 0,
        electionTimeout: randomElectionTimeout(),
    });
    s = { ...s, leaderId: nodeId, statusMessage: `Node ${nodeId} çoğunluk oylarını aldı (≥${QUORUM}/5) ve Term ${s.currentTerm} lideri oldu.` };
    s = sendHeartbeats(s, nodeId);
    return s;
}

function sendHeartbeats(state: RaftClusterState, leaderId: number): RaftClusterState {
    const leader = getNode(state, leaderId);
    const messages = [...state.messages];

    for (const target of state.nodes) {
        if (target.id !== leaderId && target.role !== 'crashed') {
            messages.push(
                createMessage(state, leaderId, target.id, 'Heartbeat', leader.currentTerm)
            );
        }
    }

    return {
        ...state,
        messages,
        statusMessage: `Lider Node ${leaderId} takipçilere heartbeat sinyalleri gönderiyor.`,
    };
}

function sendAppendEntries(
    state: RaftClusterState,
    leaderId: number,
    entries: LogEntry[]
): RaftClusterState {
    const leader = getNode(state, leaderId);
    const messages = [...state.messages];

    for (const target of state.nodes) {
        if (target.id !== leaderId && target.role !== 'crashed') {
            messages.push(
                createMessage(state, leaderId, target.id, 'AppendEntries', leader.currentTerm, {
                    entries: entries.map((e) => ({ ...e })),
                })
            );
        }
    }

    return {
        ...state,
        messages,
        statusMessage: `Lider Node ${leaderId} yeni log girdilerini AppendEntries ile takipçilere dağıtıyor.`,
    };
}

function handleRequestVote(state: RaftClusterState, msg: NetworkMessage): RaftClusterState {
    const candidateId = msg.payload?.candidateId ?? msg.from;
    const node = getNode(state, msg.to);
    if (node.role === 'crashed') return state;

    let s = state;

    if (msg.term > node.currentTerm) {
        s = becomeFollower(s, msg.to, msg.term);
    }

    const updated = getNode(s, msg.to);
    const canVote =
        msg.term >= updated.currentTerm &&
        (updated.votedFor === null || updated.votedFor === candidateId);

    if (canVote) {
        s = updateNode(s, msg.to, { votedFor: candidateId, electionTimeout: randomElectionTimeout() });
        s = {
            ...s,
            messages: [
                ...s.messages,
                createMessage(s, msg.to, candidateId, 'VoteGranted', msg.term, { candidateId }),
            ],
            statusMessage: `Node ${msg.to}, Node ${candidateId}'nin Term ${msg.term} oy isteğini onayladı.`,
        };
    }

    return s;
}

function handleVoteGranted(state: RaftClusterState, msg: NetworkMessage): RaftClusterState {
    const candidateId = msg.payload?.candidateId ?? msg.to;
    const candidate = getNode(state, candidateId);
    if (candidate.role !== 'candidate') return state;
    if (msg.term < candidate.currentTerm) return state;

    const votesReceived = candidate.votesReceived + 1;
    let s = updateNode(state, candidateId, { votesReceived });

    if (votesReceived >= QUORUM && getNode(s, candidateId).role === 'candidate') {
        s = becomeLeader(s, candidateId);
    } else {
        s = {
            ...s,
            statusMessage: `Node ${candidateId} Term ${msg.term}'de ${votesReceived}/${QUORUM} oy aldı.`,
        };
    }

    return s;
}

function handleHeartbeat(state: RaftClusterState, msg: NetworkMessage): RaftClusterState {
    const node = getNode(state, msg.to);
    if (node.role === 'crashed') return state;

    let s = state;
    if (msg.term >= node.currentTerm) {
        s = updateNode(s, msg.to, {
            role: 'follower',
            currentTerm: msg.term,
            votedFor: null,
            votesReceived: 0,
            electionTimeout: randomElectionTimeout(),
        });
        s = { ...s, leaderId: msg.from, currentTerm: Math.max(s.currentTerm, msg.term) };
    }

    return s;
}

function handleAppendEntries(state: RaftClusterState, msg: NetworkMessage): RaftClusterState {
    const node = getNode(state, msg.to);
    if (node.role === 'crashed') return state;

    let s = handleHeartbeat(state, { ...msg, type: 'Heartbeat' });
    const entries = msg.payload?.entries ?? [];
    if (entries.length === 0) return s;

    const follower = getNode(s, msg.to);
    const newLogs = [...follower.logs];

    for (const entry of entries) {
        const existing = newLogs.find((e) => e.index === entry.index);
        if (existing) {
            Object.assign(existing, { ...entry, committed: existing.committed });
        } else {
            newLogs.push({ ...entry });
        }
    }

    newLogs.sort((a, b) => a.index - b.index);
    s = updateNode(s, msg.to, { logs: newLogs });

    const leaderId = msg.from;
    const entryIndex = entries[entries.length - 1]?.index;
    if (entryIndex !== undefined) {
        const acks = (s.replicationAcks[entryIndex] ?? 1) + 1;
        s = {
            ...s,
            replicationAcks: { ...s.replicationAcks, [entryIndex]: acks },
        };

        if (acks >= QUORUM) {
            s = commitEntry(s, entryIndex, leaderId);
        }
    }

    return s;
}

function commitEntry(state: RaftClusterState, index: number, leaderId: number): RaftClusterState {
    let s = state;
    const leader = getNode(s, leaderId);

    const commitLogs = (logs: LogEntry[]) =>
        logs.map((e) => (e.index === index ? { ...e, committed: true } : e));

    s = {
        ...s,
        nodes: s.nodes.map((n) => ({
            ...n,
            logs: commitLogs(n.logs),
        })),
    };

    const committed = leader.logs.find((e) => e.index === index);
    if (committed) {
        const committedEntry = { ...committed, committed: true };
        const existing = s.clusterLog.find((e) => e.index === index);
        s = {
            ...s,
            clusterLog: existing
                ? s.clusterLog.map((e) => (e.index === index ? committedEntry : e))
                : [...s.clusterLog, committedEntry].sort((a, b) => a.index - b.index),
            statusMessage: `Log girdisi #${index} ("${committed.command}") çoğunluk quorum'u ile commit edildi.`,
        };
    }

    return s;
}

function deliverMessage(state: RaftClusterState, msg: NetworkMessage): RaftClusterState {
    switch (msg.type) {
        case 'RequestVote':
            return handleRequestVote(state, msg);
        case 'VoteGranted':
            return handleVoteGranted(state, msg);
        case 'Heartbeat':
            return handleHeartbeat(state, msg);
        case 'AppendEntries':
            return handleAppendEntries(state, msg);
        default:
            return state;
    }
}

function processElectionTimeouts(state: RaftClusterState): RaftClusterState {
    let s = state;

    for (const node of s.nodes) {
        if (node.role === 'crashed' || node.role === 'leader') continue;

        const timeout = node.electionTimeout - 1;
        s = updateNode(s, node.id, { electionTimeout: timeout });

        if (timeout <= 0) {
            s = startElection(s, node.id);
            break;
        }
    }

    return s;
}

function processLeaderHeartbeats(state: RaftClusterState): RaftClusterState {
    if (state.leaderId === null) return state;
    const leader = getNode(state, state.leaderId);
    if (leader.role !== 'leader') return state;

    const timer = leader.heartbeatTimer - 1;
    let s = updateNode(state, state.leaderId, { heartbeatTimer: timer });

    if (timer <= 0) {
        s = updateNode(s, state.leaderId!, { heartbeatTimer: HEARTBEAT_INTERVAL });
        s = sendHeartbeats(s, state.leaderId!);
    }

    return s;
}

function advanceMessages(state: RaftClusterState): RaftClusterState {
    let s = state;
    const remaining: NetworkMessage[] = [];
    const toDeliver: NetworkMessage[] = [];

    for (const msg of s.messages) {
        const progress = msg.progress + 1 / MESSAGE_TRAVEL_TICKS;
        if (progress >= 1) {
            toDeliver.push({ ...msg, progress: 1 });
        } else {
            remaining.push({ ...msg, progress });
        }
    }

    s = { ...s, messages: remaining };
    for (const msg of toDeliver) {
        if (isAlive(s, msg.to)) {
            s = deliverMessage(s, msg);
        }
    }

    return s;
}

export function createInitialCluster(): RaftClusterState {
    messageCounter = 0;
    const nodes: RaftNode[] = Array.from({ length: NODE_COUNT }, (_, i) => ({
        id: i + 1,
        role: 'follower',
        currentTerm: 0,
        votedFor: null,
        logs: [],
        electionTimeout: randomElectionTimeout(),
        electionTimeoutMax: ELECTION_TIMEOUT_MAX,
        heartbeatTimer: 0,
        votesReceived: 0,
    }));

    return {
        nodes,
        currentTerm: 0,
        leaderId: null,
        messages: [],
        clusterLog: [],
        statusMessage: 'Küme başlatıldı. Takipçiler lider seçimi için election timeout sayaçları çalışıyor.',
        messageIdCounter: 0,
        replicationAcks: {},
    };
}

export function tickCluster(state: RaftClusterState): RaftClusterState {
    let s = cloneState(state);
    s = advanceMessages(s);
    s = processLeaderHeartbeats(s);
    s = processElectionTimeouts(s);
    return s;
}

export function toggleNodeCrash(state: RaftClusterState, nodeId: number): RaftClusterState {
    let s = cloneState(state);
    const node = getNode(s, nodeId);

    if (node.role === 'crashed') {
        s = updateNode(s, nodeId, {
            role: 'follower',
            electionTimeout: randomElectionTimeout(),
            votesReceived: 0,
            votedFor: null,
        });
        s = {
            ...s,
            statusMessage: `Node ${nodeId} yeniden canlandırıldı ve takipçi olarak kümede.`,
        };
        return s;
    }

    const wasLeader = node.role === 'leader';
    s = updateNode(s, nodeId, { role: 'crashed', votesReceived: 0 });

    if (wasLeader) {
        s = { ...s, leaderId: null, statusMessage: `Lider Node ${nodeId} çöktü; kalan takipçiler yeni lider seçimine başlayacak.` };
    } else {
        s = { ...s, statusMessage: `Node ${nodeId} çöktü ve küme trafiğine yanıt vermiyor.` };
    }

    return s;
}

export function sendClientCommand(state: RaftClusterState, command: string): RaftClusterState {
    let s = cloneState(state);

    if (s.leaderId === null) {
        return {
            ...s,
            statusMessage: 'Henüz lider yok — komut reddedildi. Lider seçiminin tamamlanmasını bekleyin.',
        };
    }

    const leader = getNode(s, s.leaderId);
    if (leader.role !== 'leader') {
        return { ...s, statusMessage: 'Aktif lider bulunamadı.' };
    }

    const index = leader.logs.length > 0 ? Math.max(...leader.logs.map((e) => e.index)) + 1 : 1;
    const entry: LogEntry = {
        index,
        term: leader.currentTerm,
        command,
        committed: false,
    };

    const leaderId = s.leaderId;
    s = updateNode(s, leaderId, { logs: [...leader.logs, entry] });
    s = {
        ...s,
        replicationAcks: { ...s.replicationAcks, [index]: 1 },
        statusMessage: `İstemci komutu "${command}" Lider Node ${leaderId}'e yazıldı; replikasyon başlıyor.`,
    };

    s = sendAppendEntries(s, leaderId, [entry]);
    return s;
}

export function getSpeedInterval(speed: RaftSpeed): number {
    switch (speed) {
        case 'slow':
            return 400;
        case 'fast':
            return 100;
        default:
            return 200;
    }
}

export const CLIENT_COMMANDS = ['SET x=5', 'SET y=20', 'SET z=100', 'DEL x', 'INCR y'];

export function nodePosition(
    nodeId: number,
    centerX: number,
    centerY: number,
    radius: number
): { x: number; y: number } {
    const index = nodeId - 1;
    const angle = (2 * Math.PI * index) / NODE_COUNT - Math.PI / 2;
    return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
    };
}

export function interpolateMessage(
    from: { x: number; y: number },
    to: { x: number; y: number },
    progress: number
): { x: number; y: number } {
    return {
        x: from.x + (to.x - from.x) * progress,
        y: from.y + (to.y - from.y) * progress,
    };
}
