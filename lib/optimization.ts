export type SurfaceType = 'convex' | 'saddle' | 'rosenbrock';
export type OptimizerType = 'sgd' | 'momentum' | 'rmsprop' | 'adam';

export interface Point2D {
    x: number;
    y: number;
}

export interface HistoryPoint extends Point2D {
    loss: number;
}

export interface Domain {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
}

export interface OptimizerState {
    velocity?: Point2D;
    sqGradAvg?: Point2D;
    m?: Point2D;
    v?: Point2D;
    t?: number;
}

export interface OptimizerStepResult {
    point: Point2D;
    loss: number;
    stepSize: number;
    state: OptimizerState;
}

const EPSILON = 1e-8;
const ADAM_BETA1 = 0.9;
const ADAM_BETA2 = 0.999;

export const SURFACE_DOMAINS: Record<SurfaceType, Domain> = {
    convex: { xMin: -3, xMax: 3, yMin: -3, yMax: 3 },
    saddle: { xMin: -3, xMax: 3, yMin: -3, yMax: 3 },
    rosenbrock: { xMin: -2, xMax: 2, yMin: -1, yMax: 3 },
};

export const DEFAULT_START_POINTS: Record<SurfaceType, Point2D> = {
    convex: { x: -2, y: 2 },
    saddle: { x: -2, y: -2 },
    rosenbrock: { x: -1.5, y: 1.5 },
};

export function lossConvex(p: Point2D): number {
    return p.x ** 2 + p.y ** 2;
}

export function gradConvex(p: Point2D): Point2D {
    return { x: 2 * p.x, y: 2 * p.y };
}

export function lossSaddle(p: Point2D): number {
    return p.x ** 2 - p.y ** 2;
}

export function gradSaddle(p: Point2D): Point2D {
    return { x: 2 * p.x, y: -2 * p.y };
}

export function lossRosenbrock(p: Point2D): number {
    const { x, y } = p;
    return (1 - x) ** 2 + 100 * (y - x ** 2) ** 2;
}

export function gradRosenbrock(p: Point2D): Point2D {
    const { x, y } = p;
    return {
        x: -2 * (1 - x) - 400 * x * (y - x ** 2),
        y: 200 * (y - x ** 2),
    };
}

export function getLoss(surface: SurfaceType, p: Point2D): number {
    switch (surface) {
        case 'convex':
            return lossConvex(p);
        case 'saddle':
            return lossSaddle(p);
        case 'rosenbrock':
            return lossRosenbrock(p);
    }
}

export function getGradient(surface: SurfaceType, p: Point2D): Point2D {
    switch (surface) {
        case 'convex':
            return gradConvex(p);
        case 'saddle':
            return gradSaddle(p);
        case 'rosenbrock':
            return gradRosenbrock(p);
    }
}

function magnitude(v: Point2D): number {
    return Math.sqrt(v.x ** 2 + v.y ** 2);
}

function subtract(a: Point2D, b: Point2D): Point2D {
    return { x: a.x - b.x, y: a.y - b.y };
}

export function stepSGD(
    surface: SurfaceType,
    point: Point2D,
    learningRate: number,
    state: OptimizerState
): OptimizerStepResult {
    const grad = getGradient(surface, point);
    const next = {
        x: point.x - learningRate * grad.x,
        y: point.y - learningRate * grad.y,
    };
    const loss = getLoss(surface, next);
    const stepSize = magnitude(subtract(next, point));

    return { point: next, loss, stepSize, state: { ...state } };
}

export function stepMomentum(
    surface: SurfaceType,
    point: Point2D,
    learningRate: number,
    momentum: number,
    state: OptimizerState
): OptimizerStepResult {
    const grad = getGradient(surface, point);
    const velocity = state.velocity ?? { x: 0, y: 0 };

    const nextVelocity = {
        x: momentum * velocity.x + learningRate * grad.x,
        y: momentum * velocity.y + learningRate * grad.y,
    };

    const next = {
        x: point.x - nextVelocity.x,
        y: point.y - nextVelocity.y,
    };
    const loss = getLoss(surface, next);
    const stepSize = magnitude(subtract(next, point));

    return {
        point: next,
        loss,
        stepSize,
        state: { ...state, velocity: nextVelocity },
    };
}

export function stepRMSprop(
    surface: SurfaceType,
    point: Point2D,
    learningRate: number,
    beta: number,
    state: OptimizerState
): OptimizerStepResult {
    const grad = getGradient(surface, point);
    const sqGradAvg = state.sqGradAvg ?? { x: 0, y: 0 };

    const nextSqGradAvg = {
        x: beta * sqGradAvg.x + (1 - beta) * grad.x ** 2,
        y: beta * sqGradAvg.y + (1 - beta) * grad.y ** 2,
    };

    const next = {
        x: point.x - (learningRate / Math.sqrt(nextSqGradAvg.x + EPSILON)) * grad.x,
        y: point.y - (learningRate / Math.sqrt(nextSqGradAvg.y + EPSILON)) * grad.y,
    };
    const loss = getLoss(surface, next);
    const stepSize = magnitude(subtract(next, point));

    return {
        point: next,
        loss,
        stepSize,
        state: { ...state, sqGradAvg: nextSqGradAvg },
    };
}

export function stepAdam(
    surface: SurfaceType,
    point: Point2D,
    learningRate: number,
    state: OptimizerState
): OptimizerStepResult {
    const grad = getGradient(surface, point);
    const m = state.m ?? { x: 0, y: 0 };
    const v = state.v ?? { x: 0, y: 0 };
    const t = (state.t ?? 0) + 1;

    const nextM = {
        x: ADAM_BETA1 * m.x + (1 - ADAM_BETA1) * grad.x,
        y: ADAM_BETA1 * m.y + (1 - ADAM_BETA1) * grad.y,
    };
    const nextV = {
        x: ADAM_BETA2 * v.x + (1 - ADAM_BETA2) * grad.x ** 2,
        y: ADAM_BETA2 * v.y + (1 - ADAM_BETA2) * grad.y ** 2,
    };

    const mHat = {
        x: nextM.x / (1 - ADAM_BETA1 ** t),
        y: nextM.y / (1 - ADAM_BETA1 ** t),
    };
    const vHat = {
        x: nextV.x / (1 - ADAM_BETA2 ** t),
        y: nextV.y / (1 - ADAM_BETA2 ** t),
    };

    const next = {
        x: point.x - (learningRate * mHat.x) / (Math.sqrt(vHat.x) + EPSILON),
        y: point.y - (learningRate * mHat.y) / (Math.sqrt(vHat.y) + EPSILON),
    };
    const loss = getLoss(surface, next);
    const stepSize = magnitude(subtract(next, point));

    return {
        point: next,
        loss,
        stepSize,
        state: { ...state, m: nextM, v: nextV, t },
    };
}

export function optimizerStep(
    optimizer: OptimizerType,
    surface: SurfaceType,
    point: Point2D,
    learningRate: number,
    momentum: number,
    state: OptimizerState
): OptimizerStepResult {
    switch (optimizer) {
        case 'sgd':
            return stepSGD(surface, point, learningRate, state);
        case 'momentum':
            return stepMomentum(surface, point, learningRate, momentum, state);
        case 'rmsprop':
            return stepRMSprop(surface, point, learningRate, momentum, state);
        case 'adam':
            return stepAdam(surface, point, learningRate, state);
    }
}

export function computeHeatmap(
    surface: SurfaceType,
    gridSize: number
): { values: number[][]; min: number; max: number } {
    const domain = SURFACE_DOMAINS[surface];
    const values: number[][] = [];
    let min = Infinity;
    let max = -Infinity;

    for (let i = 0; i < gridSize; i++) {
        const row: number[] = [];
        const y = domain.yMin + ((domain.yMax - domain.yMin) * i) / (gridSize - 1);
        for (let j = 0; j < gridSize; j++) {
            const x = domain.xMin + ((domain.xMax - domain.xMin) * j) / (gridSize - 1);
            const loss = getLoss(surface, { x, y });
            row.push(loss);
            min = Math.min(min, loss);
            max = Math.max(max, loss);
        }
        values.push(row);
    }

    return { values, min, max };
}

export function lossToColor(
    loss: number,
    min: number,
    max: number
): string {
    const range = max - min || 1;
    const normalized = Math.max(0, Math.min(1, (loss - min) / range));
    const logNorm = Math.log1p(normalized * 10) / Math.log1p(10);

    const r = Math.round(30 + logNorm * 180);
    const g = Math.round(60 + (1 - logNorm) * 120);
    const b = Math.round(180 - logNorm * 140);

    return `rgb(${r}, ${g}, ${b})`;
}

export function toCanvasCoords(
    point: Point2D,
    domain: Domain,
    canvasSize: number
): Point2D {
    return {
        x: ((point.x - domain.xMin) / (domain.xMax - domain.xMin)) * canvasSize,
        y: canvasSize - ((point.y - domain.yMin) / (domain.yMax - domain.yMin)) * canvasSize,
    };
}

export function toMathCoords(
    canvasPoint: Point2D,
    domain: Domain,
    canvasSize: number
): Point2D {
    return {
        x: domain.xMin + (canvasPoint.x / canvasSize) * (domain.xMax - domain.xMin),
        y: domain.yMax - (canvasPoint.y / canvasSize) * (domain.yMax - domain.yMin),
    };
}

export function getEducationalNote(
    optimizer: OptimizerType,
    surface: SurfaceType,
    learningRate: number
): string {
    const lrHigh = learningRate > 0.3;
    const lrLow = learningRate < 0.01;

    const optimizerNotes: Record<OptimizerType, string> = {
        sgd: lrHigh
            ? 'SGD sabit adım büyüklüğü kullanır. Yüksek learning rate ile vadiden dışarı fırlayabilir veya salınım yapabilir.'
            : lrLow
              ? 'Learning rate çok düşük — SGD çok yavaş ilerler, binlerce adım gerekebilir.'
              : 'SGD en basit optimizatördür: her adımda gradyanın tersi yönünde sabit bir adım atar.',
        momentum: lrHigh
            ? 'Momentum birikmiş hız vektörüyle salınımları azaltır, ancak yüksek LR ile aşırı hızlanabilir.'
            : 'Momentum gradyan yönünde biriken bir hız vektörü kullanır — dar vadilerde SGD\'den daha hızlı ilerler.',
        rmsprop: 'RMSprop gradyan karelerinin üssel ortalamasıyla her parametreye adaptif bir öğrenme oranı uygular.',
        adam: 'Adam birinci ve ikinci momentleri birleştirir; bias düzeltmesiyle başlangıç adımlarında daha kararlıdır.',
    };

    const surfaceNotes: Record<SurfaceType, string> = {
        convex: 'Konveks kase yüzeyinde tüm optimizatörler global minimuma (0,0) yakınsamalıdır.',
        saddle: 'Eyer noktasında gradyan sıfırdır ama minimum değildir — optimizatörün yön seçimi kritiktir.',
        rosenbrock: 'Rosenbrock\'un banana vadisi dar ve eğimli bir geçit içerir; adaptif optimizatörler (Adam, RMSprop) genelde daha iyi performans gösterir.',
    };

    return `${optimizerNotes[optimizer]} ${surfaceNotes[surface]}`;
}
