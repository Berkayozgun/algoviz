import PageHeader from '@/components/PageHeader';
import SearchingVisualizer from '@/components/visualizers/SearchingVisualizer';

export default function SearchingPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="Searching Algorithms"
                description="Linear Search, Binary Search ve Interpolation Search algoritmalarını sıralı diziler üzerinde adım adım karşılaştırın."
                tags={['Linear Search', 'Binary Search', 'Interpolation Search', 'O(log N)']}
            />
            <SearchingVisualizer />
        </div>
    );
}
