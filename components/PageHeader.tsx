interface PageHeaderProps {
    title: string;
    description: string;
    tags?: string[];
}

export default function PageHeader({ title, description, tags }: PageHeaderProps) {
    return (
        <div className="mb-8 pb-6 border-b border-zinc-800">
            <h1 className="text-2xl font-light text-zinc-100 mb-2">
                {title}
            </h1>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-2xl">
                {description}
            </p>
            {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                    {tags.map((tag) => (
                        <span
                            key={tag}
                            className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-500 rounded border border-zinc-700/50"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
