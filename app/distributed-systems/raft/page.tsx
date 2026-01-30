import PageHeader from '@/components/PageHeader';

export default function RaftPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="Raft Consensus"
                description="Visualize the Raft consensus algorithm used in distributed systems. See leader election, log replication, and fault tolerance in action."
                tags={['Raft', 'Consensus', 'Leader Election', 'Distributed Systems']}
            />

            <div className="mt-8 p-8 bg-slate-900/50 border border-slate-800 rounded-2xl text-center">
                <div className="text-6xl mb-4">🗳️</div>
                <h2 className="text-2xl font-bold text-emerald-400 mb-2">Coming Soon</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                    Interactive Raft simulation with multiple nodes. Watch leader elections,
                    heartbeats, log replication, and how the cluster handles node failures.
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {['Leader Election', 'Log Replication', 'Node Failure', 'Split Brain Prevention'].map((feature) => (
                        <span key={feature} className="px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-full border border-slate-700">
                            {feature}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
