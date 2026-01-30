import PageHeader from '@/components/PageHeader';
import KMeansVisualizer from '@/components/visualizers/KMeansVisualizer';

export default function KMeansPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="K-Means Clustering"
                description="Visualize the K-Means clustering algorithm step by step. Watch how data points are grouped and centroids converge to their final positions."
                tags={['K-Means', 'Clustering', 'Machine Learning', 'Unsupervised Learning', 'Centroids']}
            />
            <KMeansVisualizer />
        </div>
    );
}
