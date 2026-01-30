import PageHeader from '@/components/PageHeader';
import DiffieHellmanVisualizer from '@/components/visualizers/DiffieHellmanVisualizer';

export default function DiffieHellmanPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="Diffie-Hellman Key Exchange"
                description="Visualize how two parties can create a shared secret over an insecure channel using the color mixing metaphor. This is the foundation of end-to-end encryption (E2EE)."
                tags={['E2EE', 'Key Exchange', 'Shared Secret', 'Color Mixing', 'Public Key']}
            />
            <DiffieHellmanVisualizer />
        </div>
    );
}
