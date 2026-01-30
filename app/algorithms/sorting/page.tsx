import PageHeader from '@/components/PageHeader';
import SortingVisualizer from '@/components/visualizers/SortingVisualizer';

export default function SortingPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="Sorting Algorithms"
                description="Visualize how sorting algorithms rearrange elements. Watch Bubble Sort, Quick Sort, and Merge Sort in action with color-coded comparisons and swaps."
                tags={['Bubble Sort', 'Quick Sort', 'Merge Sort', 'O(n²)', 'O(n log n)']}
            />
            <SortingVisualizer />
        </div>
    );
}
