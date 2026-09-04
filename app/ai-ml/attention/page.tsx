import PageHeader from '@/components/PageHeader';
import AttentionVisualizer from '@/components/visualizers/AttentionVisualizer';

export default function AttentionPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="Interactive Self-Attention Visualizer"
                description="See how Transformer self-attention works step by step. Tokenize a sentence, project into Q, K, V matrices, and explore the attention heatmap across syntactic and semantic heads."
                tags={['Self-Attention', 'Transformer', 'NLP', 'QKV', 'Softmax']}
            />
            <AttentionVisualizer />
        </div>
    );
}
