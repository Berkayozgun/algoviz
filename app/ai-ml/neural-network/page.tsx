import PageHeader from '@/components/PageHeader';
import NeuralNetworkVisualizer from '@/components/visualizers/NeuralNetworkVisualizer';

export default function NeuralNetworkPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="Neural Network Visualizer"
                description="Watch a Multi-Layer Perceptron (MLP) learn the XOR problem. See how hidden layers create non-linear decision boundaries through backpropagation."
                tags={['Neural Network', 'MLP', 'XOR', 'Backpropagation', 'Deep Learning']}
            />
            <NeuralNetworkVisualizer />
        </div>
    );
}
