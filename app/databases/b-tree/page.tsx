import PageHeader from '@/components/PageHeader';
import BTreeVisualizer from '@/components/visualizers/BTreeVisualizer';

export default function BTreePage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="B-Tree Indexing Visualizer"
                description="Visualize how B-Trees power database indexing. Watch insertions, node splits, and how the tree grows from bottom to top. Order 3 means max 2 keys per node."
                tags={['B-Tree', 'Database Index', 'Balanced Tree', 'Node Splitting', 'Order 3']}
            />
            <BTreeVisualizer />
        </div>
    );
}
