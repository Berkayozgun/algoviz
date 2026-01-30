import { create } from 'zustand';

export type DNSServer = 'client' | 'resolver' | 'root' | 'tld' | 'authoritative';

export interface ServerInfo {
    id: DNSServer;
    name: string;
    description: string;
    x: number;
    y: number;
    icon: string;
}

export interface Packet {
    id: number;
    from: DNSServer;
    to: DNSServer;
    message: string;
    isResponse: boolean;
}

interface DNSState {
    domain: string;
    resolvedIP: string | null;
    currentStep: number;
    isRunning: boolean;
    isComplete: boolean;
    packets: Packet[];
    activeServer: DNSServer | null;
    tooltipMessage: string;
    setDomain: (domain: string) => void;
    setResolvedIP: (ip: string | null) => void;
    setCurrentStep: (step: number) => void;
    setIsRunning: (isRunning: boolean) => void;
    setIsComplete: (isComplete: boolean) => void;
    addPacket: (packet: Omit<Packet, 'id'>) => void;
    clearPackets: () => void;
    setActiveServer: (server: DNSServer | null) => void;
    setTooltipMessage: (message: string) => void;
    reset: () => void;
}

export const servers: ServerInfo[] = [
    {
        id: 'client',
        name: 'Client (Browser)',
        description: 'Your computer wants to visit a website. It needs to find the IP address.',
        x: 80,
        y: 250,
        icon: '💻',
    },
    {
        id: 'resolver',
        name: 'ISP Resolver',
        description: 'Your ISP\'s DNS resolver. It caches DNS records and queries other servers.',
        x: 280,
        y: 250,
        icon: '🏢',
    },
    {
        id: 'root',
        name: 'Root Server (.)',
        description: 'The root of DNS hierarchy. Knows where to find TLD servers (.com, .org, etc.)',
        x: 480,
        y: 100,
        icon: '🌍',
    },
    {
        id: 'tld',
        name: 'TLD Server (.com)',
        description: 'Top-Level Domain server. Knows which authoritative servers handle each domain.',
        x: 480,
        y: 250,
        icon: '📁',
    },
    {
        id: 'authoritative',
        name: 'Authoritative Server',
        description: 'The final authority for this domain. Has the actual IP address.',
        x: 480,
        y: 400,
        icon: '🎯',
    },
];

let packetIdCounter = 0;

export const useDNSStore = create<DNSState>((set) => ({
    domain: '',
    resolvedIP: null,
    currentStep: 0,
    isRunning: false,
    isComplete: false,
    packets: [],
    activeServer: null,
    tooltipMessage: '',

    setDomain: (domain) => set({ domain }),
    setResolvedIP: (resolvedIP) => set({ resolvedIP }),
    setCurrentStep: (currentStep) => set({ currentStep }),
    setIsRunning: (isRunning) => set({ isRunning }),
    setIsComplete: (isComplete) => set({ isComplete }),
    addPacket: (packet) =>
        set((state) => ({ packets: [...state.packets, { ...packet, id: ++packetIdCounter }] })),
    clearPackets: () => set({ packets: [] }),
    setActiveServer: (activeServer) => set({ activeServer }),
    setTooltipMessage: (tooltipMessage) => set({ tooltipMessage }),
    reset: () => {
        packetIdCounter = 0;
        set({
            resolvedIP: null,
            currentStep: 0,
            isRunning: false,
            isComplete: false,
            packets: [],
            activeServer: null,
            tooltipMessage: '',
        });
    },
}));
