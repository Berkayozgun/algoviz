export interface Point2D {
    x: number;
    y: number;
}

export interface CovarianceMatrix {
    xx: number;
    xy: number;
    yy: number;
}

export interface PCAResult {
    mean: Point2D;
    covariance: CovarianceMatrix;
    eigenvalues: [number, number];
    eigenvectors: [Point2D, Point2D];
    varianceExplained: [number, number];
    projectedPoints: Point2D[];
    reconstructionMSE: number;
}

export type PresetName = 'positive' | 'negative' | 'spherical' | 'outliers';

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function dot(a: Point2D, b: Point2D): number {
    return a.x * b.x + a.y * b.y;
}

function subtract(a: Point2D, b: Point2D): Point2D {
    return { x: a.x - b.x, y: a.y - b.y };
}

function add(a: Point2D, b: Point2D): Point2D {
    return { x: a.x + b.x, y: a.y + b.y };
}

function scale(v: Point2D, s: number): Point2D {
    return { x: v.x * s, y: v.y * s };
}

function length(v: Point2D): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
}

function normalize(v: Point2D): Point2D {
    const len = length(v);
    if (len === 0) return { x: 1, y: 0 };
    return { x: v.x / len, y: v.y / len };
}

export function computeMean(points: Point2D[]): Point2D {
    if (points.length === 0) return { x: 0, y: 0 };
    const sum = points.reduce(
        (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
        { x: 0, y: 0 }
    );
    return { x: sum.x / points.length, y: sum.y / points.length };
}

export function computeCovariance(points: Point2D[], mean: Point2D): CovarianceMatrix {
    if (points.length < 2) {
        return { xx: 0, xy: 0, yy: 0 };
    }

    let xx = 0;
    let xy = 0;
    let yy = 0;
    const n = points.length;

    for (const point of points) {
        const dx = point.x - mean.x;
        const dy = point.y - mean.y;
        xx += dx * dx;
        xy += dx * dy;
        yy += dy * dy;
    }

    const divisor = n - 1;
    return { xx: xx / divisor, xy: xy / divisor, yy: yy / divisor };
}

function computeEigenDecomposition(cov: CovarianceMatrix): {
    eigenvalues: [number, number];
    eigenvectors: [Point2D, Point2D];
} {
    const { xx, xy, yy } = cov;
    const trace = xx + yy;
    const det = xx * yy - xy * xy;
    const discriminant = Math.max(0, trace * trace - 4 * det);
    const sqrtDisc = Math.sqrt(discriminant);

    let lambda1 = (trace + sqrtDisc) / 2;
    let lambda2 = (trace - sqrtDisc) / 2;

    if (lambda1 < lambda2) {
        [lambda1, lambda2] = [lambda2, lambda1];
    }

    lambda1 = Math.max(0, lambda1);
    lambda2 = Math.max(0, lambda2);

    function eigenvectorForLambda(lambda: number): Point2D {
        if (Math.abs(xy) > 1e-10) {
            return normalize({ x: lambda - yy, y: xy });
        }
        if (Math.abs(xx - lambda) > Math.abs(yy - lambda)) {
            return normalize({ x: 1, y: 0 });
        }
        return normalize({ x: 0, y: 1 });
    }

    let v1 = eigenvectorForLambda(lambda1);
    let v2 = eigenvectorForLambda(lambda2);

    // Ensure v2 is orthogonal to v1 (90° rotation for 2D)
    v2 = normalize({ x: -v1.y, y: v1.x });

    return {
        eigenvalues: [lambda1, lambda2],
        eigenvectors: [v1, v2],
    };
}

export function projectOntoPC1(
    point: Point2D,
    mean: Point2D,
    pc1: Point2D
): Point2D {
    const centered = subtract(point, mean);
    const scalar = dot(centered, pc1);
    return add(mean, scale(pc1, scalar));
}

export function interpolatePoint(
    original: Point2D,
    projected: Point2D,
    progress: number
): Point2D {
    const t = clamp(progress, 0, 1);
    return {
        x: original.x + t * (projected.x - original.x),
        y: original.y + t * (projected.y - original.y),
    };
}

export function computePCA(points: Point2D[]): PCAResult | null {
    if (points.length < 2) return null;

    const mean = computeMean(points);
    const covariance = computeCovariance(points, mean);
    const { eigenvalues, eigenvectors } = computeEigenDecomposition(covariance);

    const [lambda1, lambda2] = eigenvalues;
    const totalVariance = lambda1 + lambda2;

    const varianceExplained: [number, number] =
        totalVariance > 0
            ? [(lambda1 / totalVariance) * 100, (lambda2 / totalVariance) * 100]
            : [50, 50];

    const pc1 = eigenvectors[0];
    const projectedPoints = points.map((p) => projectOntoPC1(p, mean, pc1));

    let sumSquaredError = 0;
    for (let i = 0; i < points.length; i++) {
        const dx = points[i].x - projectedPoints[i].x;
        const dy = points[i].y - projectedPoints[i].y;
        sumSquaredError += dx * dx + dy * dy;
    }
    const reconstructionMSE = sumSquaredError / points.length;

    return {
        mean,
        covariance,
        eigenvalues,
        eigenvectors,
        varianceExplained,
        projectedPoints,
        reconstructionMSE,
    };
}

function randomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

function generateCorrelatedEllipse(
    count: number,
    slopeSign: 1 | -1
): Point2D[] {
    const centerX = 50;
    const centerY = 50;
    const points: Point2D[] = [];

    for (let i = 0; i < count; i++) {
        const t = randomInRange(-30, 30);
        const noise = (Math.random() - 0.5) * 4;
        const along = t;
        const perp = (Math.random() - 0.5) * 6;
        points.push({
            x: clamp(centerX + along + perp * slopeSign * 0.3, 5, 95),
            y: clamp(centerY + slopeSign * along * 0.85 + perp * 0.5, 5, 95),
        });
    }

    return points;
}

function generateSpherical(count: number): Point2D[] {
    const centerX = 50;
    const centerY = 50;
    const points: Point2D[] = [];

    for (let i = 0; i < count; i++) {
        const angle = randomInRange(0, Math.PI * 2);
        const radius = Math.sqrt(Math.random()) * 22;
        points.push({
            x: clamp(centerX + Math.cos(angle) * radius, 5, 95),
            y: clamp(centerY + Math.sin(angle) * radius, 5, 95),
        });
    }

    return points;
}

function generateOutliers(count: number): Point2D[] {
    const points: Point2D[] = [];
    const clusterCount = Math.max(count - 4, Math.floor(count * 0.75));

    for (let i = 0; i < clusterCount; i++) {
        points.push({
            x: clamp(50 + (Math.random() - 0.5) * 16, 5, 95),
            y: clamp(50 + (Math.random() - 0.5) * 10, 5, 95),
        });
    }

    const outliers: Point2D[] = [
        { x: 12, y: 88 },
        { x: 88, y: 15 },
        { x: 90, y: 85 },
        { x: 10, y: 20 },
    ];

    for (let i = clusterCount; i < count; i++) {
        points.push(outliers[i - clusterCount] ?? {
            x: randomInRange(5, 95),
            y: randomInRange(5, 95),
        });
    }

    return points;
}

export function generatePreset(preset: PresetName, count = 30): Point2D[] {
    switch (preset) {
        case 'positive':
            return generateCorrelatedEllipse(count, 1);
        case 'negative':
            return generateCorrelatedEllipse(count, -1);
        case 'spherical':
            return generateSpherical(count);
        case 'outliers':
            return generateOutliers(count);
    }
}

export function generateRandomPoints(count: number): Point2D[] {
    const points: Point2D[] = [];
    for (let i = 0; i < count; i++) {
        points.push({
            x: randomInRange(10, 90),
            y: randomInRange(10, 90),
        });
    }
    return points;
}

export function extendLineThroughPoint(
    origin: Point2D,
    direction: Point2D,
    domainMin: number,
    domainMax: number
): { start: Point2D; end: Point2D } {
    const dir = normalize(direction);
    const spans: number[] = [];

    if (Math.abs(dir.x) > 1e-10) {
        spans.push((domainMin - origin.x) / dir.x);
        spans.push((domainMax - origin.x) / dir.x);
    }
    if (Math.abs(dir.y) > 1e-10) {
        spans.push((domainMin - origin.y) / dir.y);
        spans.push((domainMax - origin.y) / dir.y);
    }

    const tValues = spans.filter((t) => Number.isFinite(t)).sort((a, b) => a - b);
    const tMin = tValues[0] ?? -50;
    const tMax = tValues[tValues.length - 1] ?? 50;

    return {
        start: add(origin, scale(dir, tMin)),
        end: add(origin, scale(dir, tMax)),
    };
}

export const DOMAIN = { min: 0, max: 100 };
