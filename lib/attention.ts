export type AttentionHead = 'head1' | 'head2';

export interface AttentionResult {
    tokens: string[];
    embeddings: number[][];
    Q: number[][];
    K: number[][];
    V: number[][];
    rawScores: number[][];
    scaledScores: number[][];
    attentionWeights: number[][];
    output: number[][];
    dModel: number;
    dK: number;
}

export const D_MODEL = 6;
export const D_K = 4;

export const DEFAULT_SENTENCE =
    'The animal did not cross the street because it was too tired';

export const PRESET_SENTENCES = [
    'The animal did not cross the street because it was too tired',
    'The bank of the river was steep',
    'Time flies like an arrow',
    'I saw her duck under the fence',
];

const SEMANTIC_GROUPS: string[][] = [
    ['animal', 'it', 'he', 'she', 'they', 'her', 'him'],
    ['bank', 'river', 'water', 'steep'],
    ['time', 'flies', 'arrow'],
    ['duck', 'saw', 'her', 'fence'],
    ['street', 'cross', 'tired'],
];

const COREF_PAIRS: [string, string][] = [
    ['animal', 'it'],
    ['it', 'animal'],
    ['bank', 'river'],
    ['river', 'bank'],
    ['time', 'arrow'],
    ['her', 'duck'],
];

function hashString(s: string): number {
    let h = 5381;
    for (let i = 0; i < s.length; i++) {
        h = (h * 33) ^ s.charCodeAt(i);
    }
    return h >>> 0;
}

function normalizeToken(token: string): string {
    return token.toLowerCase().replace(/[^a-z0-9']/g, '');
}

function shareSemanticGroup(a: string, b: string): boolean {
    const na = normalizeToken(a);
    const nb = normalizeToken(b);
    return SEMANTIC_GROUPS.some(
        (group) => group.includes(na) && group.includes(nb) && na !== nb
    );
}

function isCorefPair(a: string, b: string): boolean {
    const na = normalizeToken(a);
    const nb = normalizeToken(b);
    return COREF_PAIRS.some(([x, y]) => x === na && y === nb);
}

export function tokenize(sentence: string): string[] {
    return sentence.trim().split(/\s+/).filter(Boolean);
}

export function tokenEmbedding(token: string, dim: number = D_MODEL): number[] {
    const normalized = normalizeToken(token);
    const vec: number[] = [];

    for (let i = 0; i < dim; i++) {
        const seed = hashString(`${normalized}:${i}`);
        vec.push(Math.sin(seed * 0.01) * 0.6 + Math.cos(seed * 0.017) * 0.4);
    }

    for (const group of SEMANTIC_GROUPS) {
        if (group.includes(normalized)) {
            const groupSeed = hashString(group.join('-'));
            for (let i = 0; i < dim; i++) {
                vec[i] += Math.sin(groupSeed + i * 3.7) * 0.15;
            }
            break;
        }
    }

    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
}

function createWeightMatrix(rows: number, cols: number, seed: number): number[][] {
    const m: number[][] = [];
    for (let i = 0; i < rows; i++) {
        m[i] = [];
        for (let j = 0; j < cols; j++) {
            m[i][j] = Math.sin(seed + i * 7.3 + j * 13.1) * 0.45;
        }
    }
    return m;
}

const W_V = createWeightMatrix(D_MODEL, D_K, 999);

const HEAD_WEIGHTS: Record<
    AttentionHead,
    { W_Q: number[][]; W_K: number[][]; label: string; description: string }
> = {
    head1: {
        W_Q: createWeightMatrix(D_MODEL, D_K, 101),
        W_K: createWeightMatrix(D_MODEL, D_K, 102),
        label: 'Head 1 — Syntactic',
        description: 'Yakın komşuluk ve gramer ilişkilerine odaklanır',
    },
    head2: {
        W_Q: createWeightMatrix(D_MODEL, D_K, 201),
        W_K: createWeightMatrix(D_MODEL, D_K, 202),
        label: 'Head 2 — Semantic',
        description: 'Anlamsal benzerlik ve coreference (özne-zamir) ilişkilerine odaklanır',
    },
};

export function getHeadInfo(head: AttentionHead) {
    return HEAD_WEIGHTS[head];
}

function matMul(A: number[][], B: number[][]): number[][] {
    const rows = A.length;
    const cols = B[0].length;
    const inner = B.length;
    const result: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            let sum = 0;
            for (let k = 0; k < inner; k++) {
                sum += A[i][k] * B[k][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
}

function transpose(A: number[][]): number[][] {
    const rows = A.length;
    const cols = A[0].length;
    const result: number[][] = Array.from({ length: cols }, () => new Array(rows).fill(0));
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            result[j][i] = A[i][j];
        }
    }
    return result;
}

function softmaxRow(logits: number[], temperature: number): number[] {
    const t = Math.max(temperature, 0.01);
    const scaled = logits.map((x) => x / t);
    const max = Math.max(...scaled);
    const exps = scaled.map((x) => Math.exp(x - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((e) => e / sum);
}

function softmaxMatrix(matrix: number[][], temperature: number): number[][] {
    return matrix.map((row) => softmaxRow(row, temperature));
}

function applyHeadBias(
    scores: number[][],
    tokens: string[],
    head: AttentionHead
): number[][] {
    const n = tokens.length;
    const biased = scores.map((row) => [...row]);

    if (head === 'head1') {
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const dist = Math.abs(i - j);
                if (dist === 0) biased[i][j] += 1.5;
                else if (dist === 1) biased[i][j] += 2.5;
                else if (dist === 2) biased[i][j] += 0.8;
            }
        }
    } else {
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (shareSemanticGroup(tokens[i], tokens[j])) {
                    biased[i][j] += 2.0;
                }
                if (isCorefPair(tokens[i], tokens[j])) {
                    biased[i][j] += 3.5;
                }
            }
        }
    }

    return biased;
}

export function computeAttention(
    sentence: string,
    head: AttentionHead,
    temperature: number = 1.0
): AttentionResult | null {
    const tokens = tokenize(sentence);
    if (tokens.length === 0) return null;

    const embeddings = tokens.map((t) => tokenEmbedding(t, D_MODEL));
    const { W_Q, W_K } = HEAD_WEIGHTS[head];

    const Q = matMul(embeddings, W_Q);
    const K = matMul(embeddings, W_K);
    const V = matMul(embeddings, W_V);

    let rawScores = matMul(Q, transpose(K));
    rawScores = applyHeadBias(rawScores, tokens, head);

    const scale = Math.sqrt(D_K);
    const scaledScores = rawScores.map((row) => row.map((v) => v / scale));

    const attentionWeights = softmaxMatrix(scaledScores, temperature);
    const output = matMul(attentionWeights, V);

    return {
        tokens,
        embeddings,
        Q,
        K,
        V,
        rawScores,
        scaledScores,
        attentionWeights,
        output,
        dModel: D_MODEL,
        dK: D_K,
    };
}

export function attentionToColor(weight: number): string {
    const t = Math.max(0, Math.min(1, weight));
    const r = Math.round(30 + t * 40);
    const g = Math.round(40 + t * 120);
    const b = Math.round(120 + t * 100);
    return `rgb(${r}, ${g}, ${b})`;
}

export function formatMatrixPreview(matrix: number[][], maxRows = 4, maxCols = 4): string {
    const rows = matrix.slice(0, maxRows).map((row) =>
        row
            .slice(0, maxCols)
            .map((v) => v.toFixed(2).padStart(6))
            .join(' ')
    );
    const suffix =
        matrix.length > maxRows || matrix[0].length > maxCols
            ? `\n... (${matrix.length}×${matrix[0].length})`
            : '';
    return rows.join('\n') + suffix;
}

export function getEducationalNote(head: AttentionHead, temperature: number): string {
    const headNote =
        head === 'head1'
            ? 'Head 1 komşu token\'lara ve gramer yapısına yüksek attention verir — fiil-nesne, sıfat-isim gibi yerel ilişkileri yakalar.'
            : 'Head 2 anlamsal benzerlik ve coreference\'a odaklanır — "animal" ↔ "it" gibi uzak ama anlamlı bağlantıları bulur.';

    const tempNote =
        temperature < 0.5
            ? 'Düşük temperature softmax\'u keskinleştirir; model neredeyse tek bir token\'a odaklanır (argmax\'a yakın).'
            : temperature > 1.2
              ? 'Yüksek temperature dağılımı düzleştirir; attention daha homojen, belirsiz hale gelir.'
              : 'Temperature = 1 standart softmax davranışını verir.';

    return `${headNote} ${tempNote}`;
}
