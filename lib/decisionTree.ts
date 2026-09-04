export interface DataPoint {
    x: number;
    y: number;
    label: 0 | 1;
}

export interface TreeNode {
    feature: 'x' | 'y';
    threshold: number;
    left?: TreeNode;
    right?: TreeNode;
    prediction?: number;
    impurity: number;
    samples: number;
}

export interface SplitLine {
    feature: 'x' | 'y';
    threshold: number;
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
}

export interface TreeMetrics {
    accuracy: number;
    totalNodes: number;
    treeDepth: number;
}

export type Criterion = 'gini' | 'entropy';
export type PresetName = 'linear' | 'moons' | 'circles' | 'xor';

const GRID_SIZE = 60;
const DOMAIN_MIN = 0;
const DOMAIN_MAX = 100;

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function countLabels(points: DataPoint[]): [number, number] {
    let class0 = 0;
    let class1 = 0;
    for (const point of points) {
        if (point.label === 0) class0++;
        else class1++;
    }
    return [class0, class1];
}

export function giniImpurity(points: DataPoint[]): number {
    if (points.length === 0) return 0;
    const [class0, class1] = countLabels(points);
    const p0 = class0 / points.length;
    const p1 = class1 / points.length;
    return 1 - p0 * p0 - p1 * p1;
}

export function entropyImpurity(points: DataPoint[]): number {
    if (points.length === 0) return 0;
    const [class0, class1] = countLabels(points);
    let result = 0;
    for (const count of [class0, class1]) {
        if (count === 0) continue;
        const p = count / points.length;
        result -= p * Math.log2(p);
    }
    return result;
}

function impurity(points: DataPoint[], criterion: Criterion): number {
    return criterion === 'gini' ? giniImpurity(points) : entropyImpurity(points);
}

function majorityLabel(points: DataPoint[]): 0 | 1 {
    const [class0, class1] = countLabels(points);
    return class1 > class0 ? 1 : 0;
}

function splitPoints(
    points: DataPoint[],
    feature: 'x' | 'y',
    threshold: number
): [DataPoint[], DataPoint[]] {
    const left: DataPoint[] = [];
    const right: DataPoint[] = [];
    for (const point of points) {
        if (point[feature] <= threshold) left.push(point);
        else right.push(point);
    }
    return [left, right];
}

function uniqueThresholds(values: number[]): number[] {
    const sorted = [...values].sort((a, b) => a - b);
    const thresholds: number[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
        thresholds.push((sorted[i] + sorted[i + 1]) / 2);
    }
    return thresholds;
}

function findBestSplit(
    points: DataPoint[],
    criterion: Criterion
): { feature: 'x' | 'y'; threshold: number; gain: number } | null {
    const parentImpurity = impurity(points, criterion);
    let bestGain = 0;
    let bestFeature: 'x' | 'y' | null = null;
    let bestThreshold = 0;

    for (const feature of ['x', 'y'] as const) {
        const thresholds = uniqueThresholds(points.map((p) => p[feature]));
        for (const threshold of thresholds) {
            const [left, right] = splitPoints(points, feature, threshold);
            if (left.length === 0 || right.length === 0) continue;

            const weightedImpurity =
                (left.length / points.length) * impurity(left, criterion) +
                (right.length / points.length) * impurity(right, criterion);
            const gain = parentImpurity - weightedImpurity;

            if (gain > bestGain) {
                bestGain = gain;
                bestFeature = feature;
                bestThreshold = threshold;
            }
        }
    }

    if (!bestFeature || bestGain <= 0) return null;
    return { feature: bestFeature, threshold: bestThreshold, gain: bestGain };
}

function buildTreeRecursive(
    points: DataPoint[],
    maxDepth: number,
    minSamplesSplit: number,
    criterion: Criterion,
    depth: number
): TreeNode {
    const nodeImpurity = impurity(points, criterion);

    if (
        depth >= maxDepth ||
        points.length < minSamplesSplit ||
        nodeImpurity === 0
    ) {
        return {
            feature: 'x',
            threshold: 0,
            prediction: majorityLabel(points),
            impurity: nodeImpurity,
            samples: points.length,
        };
    }

    const bestSplit = findBestSplit(points, criterion);
    if (!bestSplit) {
        return {
            feature: 'x',
            threshold: 0,
            prediction: majorityLabel(points),
            impurity: nodeImpurity,
            samples: points.length,
        };
    }

    const [left, right] = splitPoints(points, bestSplit.feature, bestSplit.threshold);

    return {
        feature: bestSplit.feature,
        threshold: bestSplit.threshold,
        impurity: nodeImpurity,
        samples: points.length,
        left: buildTreeRecursive(left, maxDepth, minSamplesSplit, criterion, depth + 1),
        right: buildTreeRecursive(right, maxDepth, minSamplesSplit, criterion, depth + 1),
    };
}

export function buildTree(
    points: DataPoint[],
    maxDepth: number,
    criterion: Criterion,
    minSamplesSplit = 2
): TreeNode | null {
    if (points.length === 0) return null;
    return buildTreeRecursive(points, maxDepth, minSamplesSplit, criterion, 0);
}

export function predict(node: TreeNode, x: number, y: number): 0 | 1 {
    if (node.prediction !== undefined) return node.prediction as 0 | 1;

    const goesLeft = node.feature === 'x' ? x <= node.threshold : y <= node.threshold;
    const child = goesLeft ? node.left : node.right;

    if (!child) return node.prediction ?? 0;
    return predict(child, x, y);
}

export function predictGrid(tree: TreeNode | null, gridSize = GRID_SIZE): number[][] {
    const grid: number[][] = [];
    if (!tree) return grid;

    for (let row = 0; row < gridSize; row++) {
        const rowValues: number[] = [];
        for (let col = 0; col < gridSize; col++) {
            const x = DOMAIN_MIN + ((col + 0.5) / gridSize) * (DOMAIN_MAX - DOMAIN_MIN);
            const y = DOMAIN_MAX - ((row + 0.5) / gridSize) * (DOMAIN_MAX - DOMAIN_MIN);
            rowValues.push(predict(tree, x, y));
        }
        grid.push(rowValues);
    }

    return grid;
}

export function countNodes(node: TreeNode | null): number {
    if (!node) return 0;
    return 1 + countNodes(node.left ?? null) + countNodes(node.right ?? null);
}

export function treeDepth(node: TreeNode | null): number {
    if (!node) return 0;
    if (node.prediction !== undefined && !node.left && !node.right) return 1;
    return 1 + Math.max(treeDepth(node.left ?? null), treeDepth(node.right ?? null));
}

export function computeAccuracy(tree: TreeNode | null, points: DataPoint[]): number {
    if (!tree || points.length === 0) return 0;
    let correct = 0;
    for (const point of points) {
        if (predict(tree, point.x, point.y) === point.label) correct++;
    }
    return correct / points.length;
}

export function computeMetrics(tree: TreeNode | null, points: DataPoint[]): TreeMetrics {
    return {
        accuracy: computeAccuracy(tree, points),
        totalNodes: countNodes(tree),
        treeDepth: treeDepth(tree),
    };
}

export function extractSplitLines(
    node: TreeNode | null,
    bounds = { xMin: DOMAIN_MIN, xMax: DOMAIN_MAX, yMin: DOMAIN_MIN, yMax: DOMAIN_MAX }
): SplitLine[] {
    if (!node || node.prediction !== undefined) return [];

    const lines: SplitLine[] = [
        {
            feature: node.feature,
            threshold: node.threshold,
            xMin: bounds.xMin,
            xMax: bounds.xMax,
            yMin: bounds.yMin,
            yMax: bounds.yMax,
        },
    ];

    if (node.feature === 'x') {
        lines.push(
            ...extractSplitLines(node.left ?? null, {
                xMin: bounds.xMin,
                xMax: node.threshold,
                yMin: bounds.yMin,
                yMax: bounds.yMax,
            }),
            ...extractSplitLines(node.right ?? null, {
                xMin: node.threshold,
                xMax: bounds.xMax,
                yMin: bounds.yMin,
                yMax: bounds.yMax,
            })
        );
    } else {
        lines.push(
            ...extractSplitLines(node.left ?? null, {
                xMin: bounds.xMin,
                xMax: bounds.xMax,
                yMin: bounds.yMin,
                yMax: node.threshold,
            }),
            ...extractSplitLines(node.right ?? null, {
                xMin: bounds.xMin,
                xMax: bounds.xMax,
                yMin: node.threshold,
                yMax: bounds.yMax,
            })
        );
    }

    return lines;
}

function randomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

function generateLinearSeparable(count: number): DataPoint[] {
    const points: DataPoint[] = [];
    for (let i = 0; i < count; i++) {
        const x = randomInRange(5, 95);
        const y = randomInRange(5, 95);
        const label = (x + y > 100 ? 1 : 0) as 0 | 1;
        points.push({
            x: clamp(x + (Math.random() - 0.5) * 8, 5, 95),
            y: clamp(y + (Math.random() - 0.5) * 8, 5, 95),
            label,
        });
    }
    return points;
}

function generateMoons(count: number): DataPoint[] {
    const points: DataPoint[] = [];
    const half = Math.floor(count / 2);

    for (let i = 0; i < half; i++) {
        const angle = Math.PI * randomInRange(0.1, 0.9);
        const radius = 28 + (Math.random() - 0.5) * 4;
        points.push({
            x: clamp(35 + Math.cos(angle) * radius + (Math.random() - 0.5) * 3, 5, 95),
            y: clamp(50 + Math.sin(angle) * radius + (Math.random() - 0.5) * 3, 5, 95),
            label: 0,
        });
    }

    for (let i = 0; i < count - half; i++) {
        const angle = Math.PI * randomInRange(0.1, 0.9);
        const radius = 28 + (Math.random() - 0.5) * 4;
        points.push({
            x: clamp(65 - Math.cos(angle) * radius + (Math.random() - 0.5) * 3, 5, 95),
            y: clamp(50 - Math.sin(angle) * radius + (Math.random() - 0.5) * 3, 5, 95),
            label: 1,
        });
    }

    return points;
}

function generateConcentricCircles(count: number): DataPoint[] {
    const points: DataPoint[] = [];
    const centerX = 50;
    const centerY = 50;

    for (let i = 0; i < count; i++) {
        const angle = randomInRange(0, Math.PI * 2);
        const useInner = i % 2 === 0;
        const radius = useInner
            ? randomInRange(8, 22)
            : randomInRange(32, 42);
        const x = centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 2;
        const y = centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 2;
        points.push({
            x: clamp(x, 5, 95),
            y: clamp(y, 5, 95),
            label: useInner ? 0 : 1,
        });
    }

    return points;
}

function generateXor(count: number): DataPoint[] {
    const points: DataPoint[] = [];
    const regions: Array<{ cx: number; cy: number; label: 0 | 1 }> = [
        { cx: 25, cy: 25, label: 0 },
        { cx: 75, cy: 75, label: 0 },
        { cx: 75, cy: 25, label: 1 },
        { cx: 25, cy: 75, label: 1 },
    ];

    for (let i = 0; i < count; i++) {
        const region = regions[i % regions.length];
        points.push({
            x: clamp(region.cx + (Math.random() - 0.5) * 18, 5, 95),
            y: clamp(region.cy + (Math.random() - 0.5) * 18, 5, 95),
            label: region.label,
        });
    }

    return points;
}

export function generatePreset(preset: PresetName, count = 40): DataPoint[] {
    switch (preset) {
        case 'linear':
            return generateLinearSeparable(count);
        case 'moons':
            return generateMoons(count);
        case 'circles':
            return generateConcentricCircles(count);
        case 'xor':
            return generateXor(count);
    }
}

export function generateRandomPoints(count: number): DataPoint[] {
    const points: DataPoint[] = [];
    for (let i = 0; i < count; i++) {
        points.push({
            x: randomInRange(5, 95),
            y: randomInRange(5, 95),
            label: (Math.random() > 0.5 ? 1 : 0) as 0 | 1,
        });
    }
    return points;
}

export const GRID_RESOLUTION = GRID_SIZE;
export const DOMAIN = { min: DOMAIN_MIN, max: DOMAIN_MAX };
