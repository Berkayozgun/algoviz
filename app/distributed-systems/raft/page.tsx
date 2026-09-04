import PageHeader from '@/components/PageHeader';
import RaftVisualizer from '@/components/visualizers/RaftVisualizer';

export default function RaftPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="Raft Consensus"
                description="5 düğümlü bir Raft kümesinde lider seçimi, heartbeat, log replikasyonu ve düğüm çökmesini interaktif olarak gözlemleyin."
                tags={['Raft', 'Consensus', 'Leader Election', 'Log Replication', 'Quorum']}
            />
            <RaftVisualizer />
        </div>
    );
}
