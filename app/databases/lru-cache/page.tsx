import PageHeader from '@/components/PageHeader';
import LRUCacheVisualizer from '@/components/visualizers/LRUCacheVisualizer';

export default function LRUCachePage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="LRU Cache Eviction"
                description="Hash Map + Doubly Linked List yapısını kullanan LRU önbelleğin O(1) GET, PUT ve tahliye mantığını adım adım görselleştirin."
                tags={['LRU', 'Cache', 'Hash Map', 'Doubly Linked List', 'O(1) Operations']}
            />
            <LRUCacheVisualizer />
        </div>
    );
}
