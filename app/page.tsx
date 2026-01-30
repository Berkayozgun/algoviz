'use client';

import Link from 'next/link';
import {
  Zap, Boxes, Database, Cloud, GitBranch, Cpu, Globe, Shield, Brain,
  ArrowRight
} from 'lucide-react';

const categories = [
  {
    title: 'Algorithms',
    icon: Zap,
    description: 'Sorting, searching, and pathfinding algorithms.',
    href: '/algorithms/pathfinding',
    items: ['Pathfinding', 'Sorting', 'Searching'],
  },
  {
    title: 'Data Structures',
    icon: Boxes,
    description: 'Trees, graphs, and linked lists fundamentals.',
    href: '/data-structures/trees',
    items: ['Trees', 'Graphs', 'Linked Lists'],
  },
  {
    title: 'Databases',
    icon: Database,
    description: 'B-Tree indexing and cache strategies.',
    href: '/databases/b-tree',
    items: ['B-Tree', 'LRU Cache'],
  },
  {
    title: 'System Design',
    icon: Cloud,
    description: 'Load balancing and caching patterns.',
    href: '/system-design/load-balancing',
    items: ['Load Balancing', 'Caching'],
  },
  {
    title: 'Distributed Systems',
    icon: GitBranch,
    description: 'Consensus algorithms and replication.',
    href: '/distributed-systems/raft',
    items: ['Raft Consensus'],
  },
  {
    title: 'Operating Systems',
    icon: Cpu,
    description: 'CPU scheduling and process management.',
    href: '/operating-systems/cpu-scheduling',
    items: ['CPU Scheduling'],
  },
  {
    title: 'Networking',
    icon: Globe,
    description: 'DNS resolution and network protocols.',
    href: '/networking/dns-lookup',
    items: ['DNS Lookup'],
  },
  {
    title: 'Security',
    icon: Shield,
    description: 'Cryptography and secure communication.',
    href: '/security/cryptography',
    items: ['Cryptography', 'Diffie-Hellman', 'SQL Injection'],
  },
  {
    title: 'AI & ML',
    icon: Brain,
    description: 'Machine learning and neural networks.',
    href: '/ai-ml/k-means',
    items: ['K-Means', 'Neural Network'],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="pt-16 pb-12 px-8">
        <div className="max-w-4xl">
          <h1 className="text-4xl font-light text-zinc-100 mb-3">
            CS Playground
          </h1>
          <p className="text-lg text-zinc-500 font-light">
            Interactive visualizations for computer science concepts.
          </p>

          {/* Stats */}
          <div className="mt-6 flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span className="text-zinc-400">12 modules</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
              <span className="text-zinc-400">9 categories</span>
            </div>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="flex-1 px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.title}
                href={category.href}
                className="group p-5 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-zinc-400 group-hover:text-zinc-300 transition-colors" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all" />
                </div>

                {/* Content */}
                <h3 className="text-base font-normal text-zinc-200 mb-1">
                  {category.title}
                </h3>
                <p className="text-sm text-zinc-500 mb-4 leading-relaxed">
                  {category.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {category.items.slice(0, 3).map((item) => (
                    <span
                      key={item}
                      className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-500 rounded border border-zinc-700/50"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-8 border-t border-zinc-800">
        <p className="text-sm text-zinc-600">
          Built with Next.js · Berkay Özgün
        </p>
      </footer>
    </div>
  );
}
