import PageHeader from '@/components/PageHeader';
import PathfindingVisualizer from '@/components/visualizers/PathfindingVisualizer';

export default function PathfindingPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="Pathfinding Algorithms"
                description="Visualize how pathfinding algorithms like Dijkstra and A* navigate through a grid to find the shortest path. Create walls, generate mazes, and watch the algorithms explore the space in real-time."
                tags={['Dijkstra', 'A*', 'BFS', 'Graph Traversal', 'Maze Generation']}
            />
            <PathfindingVisualizer />
        </div>
    );
}
