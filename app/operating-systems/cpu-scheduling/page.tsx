import PageHeader from '@/components/PageHeader';
import CPUSchedulerVisualizer from '@/components/visualizers/CPUSchedulerVisualizer';

export default function CPUSchedulingPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="CPU Scheduling Simulation"
                description="Simulate how operating systems schedule processes on the CPU. Add processes with arrival and burst times, then watch different scheduling algorithms in action with a Gantt Chart."
                tags={['FCFS', 'SJF', 'Round Robin', 'Gantt Chart', 'Waiting Time']}
            />
            <CPUSchedulerVisualizer />
        </div>
    );
}
