import PageHeader from '@/components/PageHeader';
import GradientDescentVisualizer from '@/components/visualizers/GradientDescentVisualizer';

export default function GradientDescentPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="Gradient Descent Playground"
                description="Explore how optimization algorithms navigate different loss landscapes in real time. Compare SGD, Momentum, RMSprop, and Adam on convex bowls, saddle points, and the Rosenbrock valley."
                tags={['Gradient Descent', 'Optimization', 'SGD', 'Adam', 'Loss Landscape']}
            />
            <GradientDescentVisualizer />
        </div>
    );
}
