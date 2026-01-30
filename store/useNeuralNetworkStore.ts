import { create } from 'zustand';

// XOR training data
const XOR_DATA = [
    { x: 0, y: 0, target: 0 },
    { x: 0, y: 1, target: 1 },
    { x: 1, y: 0, target: 1 },
    { x: 1, y: 1, target: 0 },
];

// Sigmoid activation
function sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
}

function sigmoidDerivative(x: number): number {
    return x * (1 - x);
}

// Random weight initialization
function randomWeight(): number {
    return (Math.random() - 0.5) * 2;
}

export interface NeuralNetworkState {
    // Network architecture: 2 -> 4 -> 1
    weightsInputHidden: number[][]; // 2x4 matrix
    weightsHiddenOutput: number[]; // 4x1 vector
    biasHidden: number[]; // 4 biases
    biasOutput: number; // 1 bias

    // Training state
    epoch: number;
    loss: number;
    isTraining: boolean;
    learningRate: number;

    // Actions
    initNetwork: () => void;
    forward: (x: number, y: number) => { hidden: number[]; output: number };
    trainStep: () => void;
    reset: () => void;
    setIsTraining: (training: boolean) => void;
}

export const useNeuralNetworkStore = create<NeuralNetworkState>((set, get) => ({
    weightsInputHidden: [],
    weightsHiddenOutput: [],
    biasHidden: [],
    biasOutput: 0,
    epoch: 0,
    loss: 1,
    isTraining: false,
    learningRate: 0.5,

    initNetwork: () => {
        // Initialize weights randomly
        const weightsInputHidden = [
            [randomWeight(), randomWeight(), randomWeight(), randomWeight()], // input 1 -> hidden
            [randomWeight(), randomWeight(), randomWeight(), randomWeight()], // input 2 -> hidden
        ];
        const weightsHiddenOutput = [randomWeight(), randomWeight(), randomWeight(), randomWeight()];
        const biasHidden = [randomWeight(), randomWeight(), randomWeight(), randomWeight()];
        const biasOutput = randomWeight();

        set({
            weightsInputHidden,
            weightsHiddenOutput,
            biasHidden,
            biasOutput,
            epoch: 0,
            loss: 1,
        });
    },

    forward: (x: number, y: number) => {
        const { weightsInputHidden, weightsHiddenOutput, biasHidden, biasOutput } = get();

        // Hidden layer
        const hidden: number[] = [];
        for (let i = 0; i < 4; i++) {
            const sum = x * weightsInputHidden[0][i] + y * weightsInputHidden[1][i] + biasHidden[i];
            hidden.push(sigmoid(sum));
        }

        // Output layer
        let outputSum = biasOutput;
        for (let i = 0; i < 4; i++) {
            outputSum += hidden[i] * weightsHiddenOutput[i];
        }
        const output = sigmoid(outputSum);

        return { hidden, output };
    },

    trainStep: () => {
        const state = get();
        const { learningRate } = state;

        // Clone weights
        const wIH = state.weightsInputHidden.map(row => [...row]);
        const wHO = [...state.weightsHiddenOutput];
        const bH = [...state.biasHidden];
        let bO = state.biasOutput;

        let totalLoss = 0;

        // Train on all XOR samples
        for (const data of XOR_DATA) {
            const { x, y, target } = data;

            // Forward pass
            const hidden: number[] = [];
            for (let i = 0; i < 4; i++) {
                const sum = x * wIH[0][i] + y * wIH[1][i] + bH[i];
                hidden.push(sigmoid(sum));
            }

            let outputSum = bO;
            for (let i = 0; i < 4; i++) {
                outputSum += hidden[i] * wHO[i];
            }
            const output = sigmoid(outputSum);

            // Calculate loss
            const error = target - output;
            totalLoss += error * error;

            // Backpropagation
            // Output layer gradient
            const outputDelta = error * sigmoidDerivative(output);

            // Update hidden -> output weights
            for (let i = 0; i < 4; i++) {
                wHO[i] += learningRate * outputDelta * hidden[i];
            }
            bO += learningRate * outputDelta;

            // Hidden layer gradients
            for (let i = 0; i < 4; i++) {
                const hiddenError = outputDelta * wHO[i];
                const hiddenDelta = hiddenError * sigmoidDerivative(hidden[i]);

                wIH[0][i] += learningRate * hiddenDelta * x;
                wIH[1][i] += learningRate * hiddenDelta * y;
                bH[i] += learningRate * hiddenDelta;
            }
        }

        set({
            weightsInputHidden: wIH,
            weightsHiddenOutput: wHO,
            biasHidden: bH,
            biasOutput: bO,
            epoch: state.epoch + 1,
            loss: totalLoss / XOR_DATA.length,
        });
    },

    reset: () => {
        set({
            weightsInputHidden: [],
            weightsHiddenOutput: [],
            biasHidden: [],
            biasOutput: 0,
            epoch: 0,
            loss: 1,
            isTraining: false,
        });
    },

    setIsTraining: (isTraining) => set({ isTraining }),
}));

export { XOR_DATA };
