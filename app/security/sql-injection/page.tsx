import PageHeader from '@/components/PageHeader';
import SQLInjectionVisualizer from '@/components/visualizers/SQLInjectionVisualizer';

export default function SQLInjectionPage() {
    return (
        <div className="p-8 text-slate-100">
            <PageHeader
                title="SQL Injection Demo"
                description="Learn how SQL injection attacks work and why input sanitization is critical. See how malicious input can bypass authentication and compromise databases."
                tags={['SQL Injection', 'Security', 'Authentication Bypass', 'Input Validation']}
            />
            <SQLInjectionVisualizer />
        </div>
    );
}
