import PageHeader from '@/components/PageHeader';

export default function GraphsPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="Graphs"
                description="Dive into graph theory and data structures. Learn about directed, undirected, weighted graphs, and fundamental algorithms like DFS and BFS."
                tags={['Adjacency Matrix', 'Adjacency List', 'DFS', 'BFS', 'Weighted Graphs']}
            />
            <div className="flex items-center justify-center h-64 bg-slate-900/30 border border-slate-800 rounded-2xl">
                <p className="text-slate-500 text-lg">🚧 Coming Soon...</p>
            </div>
        </div>
    );
}
