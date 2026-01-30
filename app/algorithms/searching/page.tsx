import PageHeader from '@/components/PageHeader';

export default function SearchingPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="Searching Algorithms"
                description="Learn about searching algorithms like Binary Search, Linear Search, and more. Visualize how they efficiently locate elements within data structures."
                tags={['Binary Search', 'Linear Search', 'Hash Tables', 'O(log n)']}
            />
            <div className="flex items-center justify-center h-64 bg-slate-900/30 border border-slate-800 rounded-2xl">
                <p className="text-slate-500 text-lg">🚧 Coming Soon...</p>
            </div>
        </div>
    );
}
