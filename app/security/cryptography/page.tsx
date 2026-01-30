import PageHeader from '@/components/PageHeader';
import CryptoVisualizer from '@/components/visualizers/CryptoVisualizer';

export default function CryptographyPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="Cryptography Visualizer"
                description="Explore cryptographic concepts through interactive visualizations. See how SHA-256 hashing creates unique fingerprints and how public/private key encryption secures communication."
                tags={['SHA-256', 'Hashing', 'Public Key', 'Private Key', 'Asymmetric Encryption']}
            />
            <CryptoVisualizer />
        </div>
    );
}
