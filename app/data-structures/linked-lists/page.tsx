import PageHeader from '@/components/PageHeader';

export default function LinkedListsPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="Linked Lists"
                description="Understand linked list data structures including singly linked, doubly linked, and circular linked lists. Explore operations like insertion, deletion, and reversal."
                tags={['Singly Linked', 'Doubly Linked', 'Circular', 'Node', 'O(1) Insertion']}
            />
            <div className="flex items-center justify-center h-64 bg-slate-900/30 border border-slate-800 rounded-2xl">
                <p className="text-slate-500 text-lg">🚧 Coming Soon...</p>
            </div>
        </div>
    );
}
