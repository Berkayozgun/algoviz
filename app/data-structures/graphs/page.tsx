import PageHeader from '@/components/PageHeader';
import GraphVisualizer from '@/components/visualizers/GraphVisualizer';

export default function GraphsPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="Graph Visualizer"
                description="Çizge veri yapısı üzerinde BFS, DFS ve Dijkstra algoritmalarını adım adım keşfedin. Kuyruk, yığın ve priority queue davranışlarını görselleştirin."
                tags={['Graph', 'BFS', 'DFS', 'Dijkstra', 'Traversal', 'Shortest Path']}
            />
            <GraphVisualizer />
        </div>
    );
}
