import PageHeader from '@/components/PageHeader';
import BSTVisualizer from '@/components/visualizers/BSTVisualizer';

export default function TreesPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="Binary Search Tree"
                description="Visualize BST operations. Insert values to build the tree, search for nodes, and traverse in different orders. Left subtree contains smaller values, right subtree contains larger values."
                tags={['BST', 'In-Order', 'Pre-Order', 'Post-Order', 'O(log n)']}
            />
            <BSTVisualizer />
        </div>
    );
}
