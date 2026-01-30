import PageHeader from '@/components/PageHeader';

export default function CachingPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="Caching"
                description="Explore caching strategies and eviction policies like LRU, LFU, and FIFO. Understand how caching improves system performance and reduces latency."
                tags={['LRU', 'LFU', 'FIFO', 'Cache Invalidation', 'TTL']}
            />
            <div className="flex items-center justify-center h-64 bg-slate-900/30 border border-slate-800 rounded-2xl">
                <p className="text-slate-500 text-lg">🚧 Coming Soon...</p>
            </div>
        </div>
    );
}
