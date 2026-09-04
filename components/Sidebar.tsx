'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
    Zap, Boxes, Database, Cloud, GitBranch, Cpu, Globe, Shield, Brain,
    ChevronDown, ChevronRight, Menu, X, Terminal
} from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
}

interface NavCategory {
    title: string;
    icon: React.ElementType;
    items: NavItem[];
}

const navigation: NavCategory[] = [
    {
        title: 'Algorithms',
        icon: Zap,
        items: [
            { label: 'Pathfinding', href: '/algorithms/pathfinding' },
            { label: 'Sorting', href: '/algorithms/sorting' },
            { label: 'Searching', href: '/algorithms/searching' },
        ],
    },
    {
        title: 'Data Structures',
        icon: Boxes,
        items: [
            { label: 'Trees', href: '/data-structures/trees' },
            { label: 'Graphs', href: '/data-structures/graphs' },
            { label: 'Linked Lists', href: '/data-structures/linked-lists' },
        ],
    },
    {
        title: 'Databases',
        icon: Database,
        items: [
            { label: 'B-Tree Indexing', href: '/databases/b-tree' },
            { label: 'LRU Cache', href: '/databases/lru-cache' },
        ],
    },
    {
        title: 'System Design',
        icon: Cloud,
        items: [
            { label: 'Load Balancing', href: '/system-design/load-balancing' },
            { label: 'Caching', href: '/system-design/caching' },
        ],
    },
    {
        title: 'Distributed Systems',
        icon: GitBranch,
        items: [
            { label: 'Raft Consensus', href: '/distributed-systems/raft' },
        ],
    },
    {
        title: 'Operating Systems',
        icon: Cpu,
        items: [
            { label: 'CPU Scheduling', href: '/operating-systems/cpu-scheduling' },
        ],
    },
    {
        title: 'Networking',
        icon: Globe,
        items: [
            { label: 'DNS Lookup', href: '/networking/dns-lookup' },
        ],
    },
    {
        title: 'Security',
        icon: Shield,
        items: [
            { label: 'Cryptography', href: '/security/cryptography' },
            { label: 'Diffie-Hellman', href: '/security/diffie-hellman' },
            { label: 'SQL Injection', href: '/security/sql-injection' },
        ],
    },
    {
        title: 'AI & ML',
        icon: Brain,
        items: [
            { label: 'K-Means Clustering', href: '/ai-ml/k-means' },
            { label: 'Neural Network', href: '/ai-ml/neural-network' },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [expandedCategories, setExpandedCategories] = useState<string[]>(
        navigation.map((cat) => cat.title)
    );
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const toggleCategory = (title: string) => {
        setExpandedCategories((prev) =>
            prev.includes(title)
                ? prev.filter((t) => t !== title)
                : [...prev, title]
        );
    };

    const isActive = (href: string) => pathname === href;

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <Link
                href="/"
                className="p-5 border-b border-zinc-800 flex items-center gap-3 hover:bg-zinc-900/50 transition-colors"
                onClick={() => setIsMobileOpen(false)}
            >
                <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <Terminal className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                    <h1 className="text-base font-normal text-zinc-100">Algoviz</h1>
                    <p className="text-[10px] text-zinc-600 font-mono">v1.0</p>
                </div>
            </Link>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-3">
                {navigation.map((category, index) => {
                    const Icon = category.icon;
                    const isExpanded = expandedCategories.includes(category.title);

                    return (
                        <div key={category.title}>
                            {/* Divider */}
                            {index > 0 && (
                                <div className="mx-4 my-2 border-t border-zinc-800/60" />
                            )}

                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(category.title)}
                                className="w-full flex items-center justify-between px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                <span className="flex items-center gap-2.5">
                                    <Icon className="w-4 h-4" />
                                    <span className="font-normal">{category.title}</span>
                                </span>
                                {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                )}
                            </button>

                            {/* Category Items */}
                            {isExpanded && (
                                <div className="ml-4 pl-4 border-l border-zinc-800/60">
                                    {category.items.map((item) => {
                                        const active = isActive(item.href);
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setIsMobileOpen(false)}
                                                className={cn(
                                                    "relative flex items-center py-1.5 px-3 text-sm rounded mx-2 my-0.5 transition-colors",
                                                    active
                                                        ? "bg-blue-600/10 text-blue-400"
                                                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                                                )}
                                            >
                                                {/* Active Indicator */}
                                                {active && (
                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-blue-600 rounded-full" />
                                                )}
                                                <span className="ml-1 font-normal">{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800 text-xs text-zinc-600">
                <div className="flex items-center justify-between">
                    <span>12 modules</span>
                    <span className="font-mono">Berkay Özgün</span>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="fixed top-4 left-4 z-[60] p-2 rounded-lg bg-zinc-900 border border-zinc-800 md:hidden"
            >
                {isMobileOpen ? (
                    <X className="w-5 h-5 text-zinc-400" />
                ) : (
                    <Menu className="w-5 h-5 text-zinc-400" />
                )}
            </button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-zinc-900 border-r border-zinc-800 z-50 flex-col">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-0 h-screen w-72 bg-zinc-900 border-r border-zinc-800 z-50 flex flex-col md:hidden transition-transform duration-300",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <SidebarContent />
            </aside>
        </>
    );
}
