import PageHeader from '@/components/PageHeader';
import PCAVisualizer from '@/components/visualizers/PCAVisualizer';

export default function PCAPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="Interactive PCA Visualizer"
                description="Temel Bileşen Analizi ile 2D verinin nasıl 1 boyuta indirgendiğini keşfedin. Kovaryans matrisi, özvektörler ve izdüşüm animasyonunu gerçek zamanlı gözlemleyin."
                tags={['PCA', 'Dimensionality Reduction', 'Eigenvectors', 'Covariance', 'Linear Algebra']}
            />
            <PCAVisualizer />
        </div>
    );
}
