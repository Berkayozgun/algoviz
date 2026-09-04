import PageHeader from '@/components/PageHeader';
import CachingVisualizer from '@/components/visualizers/CachingVisualizer';

export default function CachingPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="Caching Strategies"
                description="Client, API, Cache ve Database katmanları arasındaki veri akışını keşfedin. Cache-Aside, Write-Through ve Write-Back stratejilerini karşılaştırın."
                tags={['Cache-Aside', 'Write-Through', 'Write-Back', 'Redis', 'Consistency']}
            />
            <CachingVisualizer />
        </div>
    );
}
