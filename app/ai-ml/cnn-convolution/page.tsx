import PageHeader from '@/components/PageHeader';
import ConvolutionVisualizer from '@/components/visualizers/ConvolutionVisualizer';

export default function CNNConvolutionPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="Interactive CNN & Convolution Explorer"
                description="Draw on a pixel grid or choose presets, then watch a 3×3 kernel slide across the input to produce a feature map and max-pooled output. Explore Sobel edge detectors, sharpen, blur, and custom kernels with optional ReLU."
                tags={['CNN', 'Convolution', 'Max Pooling', 'Sobel', 'Computer Vision']}
            />
            <ConvolutionVisualizer />
        </div>
    );
}
