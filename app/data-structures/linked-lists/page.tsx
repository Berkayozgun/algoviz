import PageHeader from '@/components/PageHeader';
import LinkedListVisualizer from '@/components/visualizers/LinkedListVisualizer';

export default function LinkedListsPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="Linked List Visualizer"
                description="Singly, Doubly ve Circular bağlı listeler üzerinde ekleme, silme, reverse ve Floyd Cycle Detection algoritmasını adım adım keşfedin."
                tags={['Linked List', 'Singly', 'Doubly', 'Reverse', 'Floyd Cycle Detection']}
            />
            <LinkedListVisualizer />
        </div>
    );
}
