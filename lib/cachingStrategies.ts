export type CacheStrategy = 'cache-aside' | 'write-through' | 'write-back';

export type SystemComponent = 'client' | 'api' | 'cache' | 'database';

export type PacketStatus = 'hit' | 'miss' | 'write' | 'sync' | 'read' | 'response';

export type DataStore = Record<string, string>;

export interface FlowPacket {
    id: string;
    from: SystemComponent;
    to: SystemComponent;
    label: string;
    status: PacketStatus;
    progress: number;
}

export interface CacheStats {
    hits: number;
    misses: number;
    reads: number;
    writes: number;
}

export interface CachingState {
    strategy: CacheStrategy;
    cacheData: DataStore;
    dbData: DataStore;
    dirtyKeys: string[];
    stats: CacheStats;
    latencyMs: number;
}

export interface SimulationStep {
    description: string;
    packets: Omit<FlowPacket, 'id' | 'progress'>[];
    latencyMs: number;
    apply: (state: CachingState) => CachingState;
}

export type PresetName = 'cold-cache' | 'high-write' | 'write-back-sync';

export type OperationType = 'read' | 'write';

export interface Operation {
    type: OperationType;
    key: string;
    value?: string;
}

let packetCounter = 0;

export const COMPONENT_ORDER: SystemComponent[] = ['client', 'api', 'cache', 'database'];

export const COMPONENT_LABELS: Record<SystemComponent, string> = {
    client: 'Client',
    api: 'API Server',
    cache: 'Cache (Redis)',
    database: 'Database (PostgreSQL)',
};

export const INITIAL_DB: DataStore = {
    'user:1': 'Active',
    'user:2': 'Guest',
    'user:3': 'Pending',
};

export function createInitialState(strategy: CacheStrategy = 'cache-aside'): CachingState {
    packetCounter = 0;
    return {
        strategy,
        cacheData: {},
        dbData: { ...INITIAL_DB },
        dirtyKeys: [],
        stats: { hits: 0, misses: 0, reads: 0, writes: 0 },
        latencyMs: 0,
    };
}

function withStats(state: CachingState, patch: Partial<CacheStats>): CachingState {
    return { ...state, stats: { ...state.stats, ...patch } };
}

function addDirtyKey(state: CachingState, key: string): CachingState {
    if (state.dirtyKeys.includes(key)) return state;
    return { ...state, dirtyKeys: [...state.dirtyKeys, key] };
}

function removeDirtyKey(state: CachingState, key: string): CachingState {
    return { ...state, dirtyKeys: state.dirtyKeys.filter((k) => k !== key) };
}

export function generateReadSteps(key: string, state: CachingState): SimulationStep[] {
    switch (state.strategy) {
        case 'cache-aside':
            return generateCacheAsideRead(key, state);
        case 'write-through':
            return generateCacheAsideRead(key, state);
        case 'write-back':
            return generateCacheAsideRead(key, state);
    }
}

export function generateWriteSteps(key: string, value: string, state: CachingState): SimulationStep[] {
    switch (state.strategy) {
        case 'cache-aside':
            return generateCacheAsideWrite(key, value, state);
        case 'write-through':
            return generateWriteThroughWrite(key, value, state);
        case 'write-back':
            return generateWriteBackWrite(key, value, state);
    }
}

function generateCacheAsideRead(key: string, state: CachingState): SimulationStep[] {
    const cached = key in state.cacheData;

    if (cached) {
        return [
            {
                description: `Client → API: READ("${key}") isteği gönderildi.`,
                packets: [{ from: 'client', to: 'api', label: `READ ${key}`, status: 'read' }],
                latencyMs: 5,
                apply: (s) => s,
            },
            {
                description: `API → Cache: GET kontrolü yapılıyor.`,
                packets: [{ from: 'api', to: 'cache', label: `GET ${key}`, status: 'read' }],
                latencyMs: 2,
                apply: (s) => s,
            },
            {
                description: `Cache HIT! Veri anında döndürülüyor (düşük gecikme).`,
                packets: [
                    { from: 'cache', to: 'api', label: `HIT: ${state.cacheData[key]}`, status: 'hit' },
                    { from: 'api', to: 'client', label: state.cacheData[key], status: 'response' },
                ],
                latencyMs: 3,
                apply: (s) => withStats(s, { hits: s.stats.hits + 1, reads: s.stats.reads + 1 }),
            },
        ];
    }

    return [
        {
            description: `Client → API: READ("${key}") isteği gönderildi.`,
            packets: [{ from: 'client', to: 'api', label: `READ ${key}`, status: 'read' }],
            latencyMs: 5,
            apply: (s) => s,
        },
        {
            description: `API → Cache: GET kontrolü yapılıyor.`,
            packets: [{ from: 'api', to: 'cache', label: `GET ${key}`, status: 'read' }],
            latencyMs: 2,
            apply: (s) => s,
        },
        {
            description: `Cache MISS — veri önbellekte yok, DB'ye gidiliyor.`,
            packets: [{ from: 'cache', to: 'api', label: 'MISS', status: 'miss' }],
            latencyMs: 2,
            apply: (s) => withStats(s, { misses: s.stats.misses + 1 }),
        },
        {
            description: `API → Database: SELECT sorgusu (yüksek gecikme).`,
            packets: [{ from: 'api', to: 'database', label: 'SELECT', status: 'read' }],
            latencyMs: 45,
            apply: (s) => s,
        },
        {
            description: `DB yanıt verdi; API cache'e lazy-load yazıyor.`,
            packets: [
                { from: 'database', to: 'api', label: state.dbData[key] ?? 'NULL', status: 'response' },
                { from: 'api', to: 'cache', label: `SET ${key}`, status: 'write' },
            ],
            latencyMs: 8,
            apply: (s) => ({
                ...withStats(s, { reads: s.stats.reads + 1 }),
                cacheData: { ...s.cacheData, [key]: s.dbData[key] ?? 'NULL' },
            }),
        },
        {
            description: `Veri Client'a döndürülüyor. Sonraki okuma HIT olacak.`,
            packets: [{ from: 'api', to: 'client', label: 'OK', status: 'response' }],
            latencyMs: 5,
            apply: (s) => s,
        },
    ];
}

function generateCacheAsideWrite(key: string, value: string, state: CachingState): SimulationStep[] {
    return [
        {
            description: `Client → API: WRITE("${key}", "${value}") — Cache-Aside yazma.`,
            packets: [{ from: 'client', to: 'api', label: `WRITE ${key}`, status: 'write' }],
            latencyMs: 5,
            apply: (s) => s,
        },
        {
            description: `Cache-Aside: Önce DB güncellenir (cache invalidation riski).`,
            packets: [{ from: 'api', to: 'database', label: `UPDATE ${key}`, status: 'write' }],
            latencyMs: 40,
            apply: (s) => s,
        },
        {
            description: `DB onayladı; stale cache entry siliniyor veya güncelleniyor.`,
            packets: [
                { from: 'database', to: 'api', label: 'OK', status: 'response' },
                { from: 'api', to: 'cache', label: `DEL/SET ${key}`, status: 'write' },
            ],
            latencyMs: 8,
            apply: (s) => ({
                ...withStats(s, { writes: s.stats.writes + 1 }),
                dbData: { ...s.dbData, [key]: value },
                cacheData: { ...s.cacheData, [key]: value },
            }),
        },
        {
            description: `Client'a yazma onayı döndürüldü.`,
            packets: [{ from: 'api', to: 'client', label: 'OK', status: 'response' }],
            latencyMs: 5,
            apply: (s) => s,
        },
    ];
}

function generateWriteThroughWrite(key: string, value: string, state: CachingState): SimulationStep[] {
    return [
        {
            description: `Client → API: WRITE("${key}", "${value}") — Write-Through.`,
            packets: [{ from: 'client', to: 'api', label: `WRITE ${key}`, status: 'write' }],
            latencyMs: 5,
            apply: (s) => s,
        },
        {
            description: `API → Cache: Veri önce cache katmanına yazılıyor.`,
            packets: [{ from: 'api', to: 'cache', label: `SET ${key}`, status: 'write' }],
            latencyMs: 3,
            apply: (s) => ({
                ...s,
                cacheData: { ...s.cacheData, [key]: value },
            }),
        },
        {
            description: `Cache → DB: Senkron replikasyon (tutarlılık garantisi, yüksek gecikme).`,
            packets: [{ from: 'cache', to: 'database', label: 'SYNC', status: 'sync' }],
            latencyMs: 50,
            apply: (s) => s,
        },
        {
            description: `DB onayladı; cache ve DB tutarlı.`,
            packets: [
                { from: 'database', to: 'cache', label: 'ACK', status: 'response' },
                { from: 'api', to: 'client', label: 'OK', status: 'response' },
            ],
            latencyMs: 5,
            apply: (s) => ({
                ...withStats(s, { writes: s.stats.writes + 1 }),
                dbData: { ...s.dbData, [key]: value },
            }),
        },
    ];
}

function generateWriteBackWrite(key: string, value: string, state: CachingState): SimulationStep[] {
    return [
        {
            description: `Client → API: WRITE("${key}", "${value}") — Write-Back.`,
            packets: [{ from: 'client', to: 'api', label: `WRITE ${key}`, status: 'write' }],
            latencyMs: 5,
            apply: (s) => s,
        },
        {
            description: `API → Cache: Veri cache'e yazıldı, dirty flag işaretlendi.`,
            packets: [{ from: 'api', to: 'cache', label: `SET ${key} [dirty]`, status: 'write' }],
            latencyMs: 3,
            apply: (s) =>
                addDirtyKey(
                    {
                        ...withStats(s, { writes: s.stats.writes + 1 }),
                        cacheData: { ...s.cacheData, [key]: value },
                    },
                    key
                ),
        },
        {
            description: `Client'a anında OK döndü — DB henüz güncellenmedi (düşük gecikme).`,
            packets: [{ from: 'api', to: 'client', label: 'OK (fast)', status: 'response' }],
            latencyMs: 2,
            apply: (s) => s,
        },
    ];
}

export function generateFlushSteps(state: CachingState): SimulationStep[] {
    if (state.dirtyKeys.length === 0) {
        return [
            {
                description: 'Write-Back kuyruğu boş — senkronize edilecek dirty key yok.',
                packets: [],
                latencyMs: 0,
                apply: (s) => s,
            },
        ];
    }

    const keys = [...state.dirtyKeys];
    const steps: SimulationStep[] = [
        {
            description: `Arka plan batch sync başladı: ${keys.join(', ')} DB'ye yazılıyor.`,
            packets: [{ from: 'cache', to: 'database', label: `BATCH (${keys.length})`, status: 'sync' }],
            latencyMs: 60,
            apply: (s) => s,
        },
    ];

    let working = state;
    const newDb = { ...working.dbData };
    for (const key of keys) {
        newDb[key] = working.cacheData[key];
    }

    steps.push({
        description: `DB batch commit tamamlandı; dirty flag'ler temizlendi.`,
        packets: [{ from: 'database', to: 'cache', label: 'ACK', status: 'response' }],
        latencyMs: 10,
        apply: (s) => ({
            ...s,
            dbData: newDb,
            dirtyKeys: [],
        }),
    });

    return steps;
}

export function createPacket(
    partial: Omit<FlowPacket, 'id' | 'progress'>,
    progress = 0
): FlowPacket {
    packetCounter += 1;
    return { ...partial, id: `pkt-${packetCounter}`, progress };
}

export function getStrategyInfo(strategy: CacheStrategy): {
    title: string;
    pros: string[];
    cons: string[];
    summary: string;
} {
    switch (strategy) {
        case 'cache-aside':
            return {
                title: 'Cache-Aside (Lazy Loading)',
                pros: ['Okuma HIT\'te çok hızlı', 'Cache yalnızca gerektiğinde dolar', 'Uygulama kontrolünde'],
                cons: ['İlk okuma MISS (yüksek gecikme)', 'Yazmada cache invalidation riski', 'Stale data olasılığı'],
                summary: 'Uygulama cache\'i yönetir. Okuma önce cache\'e bakar; MISS\'te DB\'den okuyup cache\'e yazar.',
            };
        case 'write-through':
            return {
                title: 'Write-Through',
                pros: ['Cache-DB her zaman tutarlı', 'Okuma güvenilir', 'Basit mental model'],
                cons: ['Her yazma 2 katmanı bekler (yüksek gecikme)', 'Yavaş yazma throughput', 'Gereksiz cache yazımları'],
                summary: 'Yazma önce cache\'e, ardından senkron DB\'ye gider. Tutarlılık yüksek, yazma gecikmesi artar.',
            };
        case 'write-back':
            return {
                title: 'Write-Back (Write-Behind)',
                pros: ['Yazma anında onay (düşük gecikme)', 'Batch DB sync verimli', 'Yüksek write throughput'],
                cons: ['Cache çökerse veri kaybı riski', 'Geçici tutarsızlık (dirty data)', 'Flush mekanizması gerekli'],
                summary: 'Yazma cache\'e hemen döner; DB güncellemesi asenkron batch ile yapılır.',
            };
    }
}

export const PRESETS: Record<PresetName, { label: string; ops: Operation[]; flushAfter?: boolean }> = {
    'cold-cache': {
        label: 'Cold Cache Read',
        ops: [{ type: 'read', key: 'user:1' }],
    },
    'high-write': {
        label: 'High Concurrency Write',
        ops: [
            { type: 'write', key: 'user:1', value: 'Active' },
            { type: 'write', key: 'user:2', value: 'Premium' },
            { type: 'write', key: 'user:3', value: 'Verified' },
            { type: 'read', key: 'user:1' },
        ],
    },
    'write-back-sync': {
        label: 'Write-Back Batch Sync',
        ops: [
            { type: 'write', key: 'user:1', value: 'Banned' },
            { type: 'write', key: 'user:2', value: 'Suspended' },
        ],
        flushAfter: true,
    },
};

export function componentPosition(
    component: SystemComponent,
    width: number,
    height: number
): { x: number; y: number } {
    const index = COMPONENT_ORDER.indexOf(component);
    const x = (width / (COMPONENT_ORDER.length + 1)) * (index + 1);
    return { x, y: height / 2 };
}

export function interpolatePacket(
    from: { x: number; y: number },
    to: { x: number; y: number },
    progress: number
): { x: number; y: number } {
    return {
        x: from.x + (to.x - from.x) * progress,
        y: from.y + (to.y - from.y) * progress,
    };
}

export function packetColor(status: PacketStatus): string {
    switch (status) {
        case 'hit':
            return '#34d399';
        case 'miss':
            return '#f87171';
        case 'write':
            return '#22d3ee';
        case 'sync':
            return '#fbbf24';
        case 'read':
            return '#818cf8';
        case 'response':
            return '#a78bfa';
        default:
            return '#94a3b8';
    }
}
