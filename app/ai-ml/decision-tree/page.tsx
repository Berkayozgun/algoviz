import PageHeader from '@/components/PageHeader';
import DecisionTreeVisualizer from '@/components/visualizers/DecisionTreeVisualizer';

export default function DecisionTreePage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="Decision Tree Playground"
                description="Karar ağacının bölünme mantığını keşfedin. 2D düzleme nokta ekleyin, max depth ve Gini/Entropy kriterlerini değiştirerek overfitting ve underfitting dengesini gerçek zamanlı gözlemleyin."
                tags={['Decision Tree', 'CART', 'Gini Impurity', 'Entropy', 'Overfitting', 'Classification']}
            />
            <DecisionTreeVisualizer />
        </div>
    );
}
