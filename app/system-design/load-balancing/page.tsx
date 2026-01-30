import PageHeader from '@/components/PageHeader';
import LoadBalancerVisualizer from '@/components/visualizers/LoadBalancerVisualizer';

export default function LoadBalancingPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="Load Balancer Simulation"
                description="Simulate how load balancers distribute traffic across multiple servers. Try different algorithms and observe how they handle server failures."
                tags={['Round Robin', 'Random', 'Least Connections', 'Health Check']}
            />
            <LoadBalancerVisualizer />
        </div>
    );
}
