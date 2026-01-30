import PageHeader from '@/components/PageHeader';
import DNSVisualizer from '@/components/visualizers/DNSVisualizer';

export default function DNSLookupPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="DNS Lookup Visualizer"
                description="Watch how your browser finds the IP address of a website. See the complete DNS resolution process from client to Root, TLD, and Authoritative servers."
                tags={['DNS', 'Root Server', 'TLD', 'Authoritative', 'IP Resolution']}
            />
            <DNSVisualizer />
        </div>
    );
}
