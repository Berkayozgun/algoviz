import PageHeader from '@/components/PageHeader';

export default function LRUCachePage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="LRU Cache Eviction"
                description="Understand how Least Recently Used (LRU) cache eviction works. Visualize cache hits, misses, and the eviction policy in action."
                tags={['LRU', 'Cache', 'Eviction Policy', 'Memory Management']}
            />

            <div className="mt-8 p-8 bg-slate-900/50 border border-slate-800 rounded-2xl text-center">
                <div className="text-6xl mb-4">📦</div>
                <h2 className="text-2xl font-bold text-cyan-400 mb-2">Coming Soon</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                    Interactive LRU cache simulation with visual representation of the doubly-linked list
                    and hash map structure. Watch items get promoted on access and evicted when full.
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {['Cache Hits/Misses', 'Eviction Animation', 'Capacity Control', 'Access Patterns'].map((feature) => (
                        <span key={feature} className="px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-full border border-slate-700">
                            {feature}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
