# Algoviz

Interactive visualizations for computer science concepts. Built with Next.js 16, TypeScript, and Tailwind CSS.

**Live demo:** [https://algoviz-rho.vercel.app](https://algoviz-rho.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat-square&logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## Overview

Algoviz is an educational platform designed to help students and developers understand complex computer science concepts through interactive visualizations. Each module provides step-by-step animations and hands-on controls.

## Interactive Modules (12 live)

| Category | Module | Route | Highlights |
|----------|--------|-------|------------|
| **Algorithms** | Pathfinding | `/algorithms/pathfinding` | Dijkstra/BFS, A*, maze generation |
| **Algorithms** | Sorting | `/algorithms/sorting` | Bubble, Quick, Merge sort animations |
| **Data Structures** | Binary Search Tree | `/data-structures/trees` | Insert, find, in/pre/post-order traversal |
| **Databases** | B-Tree Indexing | `/databases/b-tree` | Insert, search, split animations |
| **System Design** | Load Balancing | `/system-design/load-balancing` | Round Robin, Random, Least Connections |
| **Operating Systems** | CPU Scheduling | `/operating-systems/cpu-scheduling` | FCFS, SJF, Round Robin Gantt charts |
| **Networking** | DNS Lookup | `/networking/dns-lookup` | Root → TLD → Authoritative resolution |
| **Security** | Cryptography | `/security/cryptography` | SHA-256 hashing, encryption demo |
| **Security** | Diffie-Hellman | `/security/diffie-hellman` | Key exchange with color mixing metaphor |
| **Security** | SQL Injection | `/security/sql-injection` | Vulnerable vs. prepared statement comparison |
| **AI & ML** | K-Means Clustering | `/ai-ml/k-means` | Centroid movement and cluster assignment |
| **AI & ML** | Neural Network | `/ai-ml/neural-network` | MLP training on XOR with decision boundary |

> **Coming soon:** Searching, Graphs, Linked Lists, LRU Cache, Caching, Raft Consensus

## Features

### Algorithms
- **Pathfinding** — Dijkstra's and A* algorithms with grid-based visualization
- **Sorting** — Bubble Sort, Quick Sort, Merge Sort with animated comparisons
- **Searching** — Binary Search and Linear Search *(coming soon)*

### Data Structures
- **Binary Search Tree** — Insert, find, and traverse operations
- **Graphs** — Adjacency representation and traversal *(coming soon)*
- **Linked Lists** — Node manipulation and pointer visualization *(coming soon)*

### Databases
- **B-Tree Indexing** — Order-2 B-Tree with split and search animations
- **LRU Cache** — Eviction policy visualization *(coming soon)*

### System Design
- **Load Balancing** — Round Robin, Random, and Least Connections strategies
- **Caching** — Cache hit/miss visualization *(coming soon)*

### Distributed Systems
- **Raft Consensus** — Leader election and log replication *(coming soon)*

### Operating Systems
- **CPU Scheduling** — FCFS, SJF, and Round Robin algorithms

### Networking
- **DNS Lookup** — Root → TLD → Authoritative resolution chain

### Security
- **Cryptography** — SHA-256 hashing and public/private key concepts
- **Diffie-Hellman** — Key exchange using color mixing metaphor
- **SQL Injection** — Vulnerable raw queries vs. parameterized prepared statements

### AI & Machine Learning
- **K-Means Clustering** — Animated centroid movement and cluster assignment
- **Neural Network** — MLP training on XOR problem with decision boundary

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| State | Zustand |
| Animation | Framer Motion |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/berkayozgun/algoviz.git
cd algoviz

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── algorithms/         # Algorithm visualizers
│   ├── data-structures/    # Data structure visualizers
│   ├── databases/          # Database concept visualizers
│   ├── security/           # Security visualizers
│   ├── ai-ml/              # ML visualizers
│   └── ...
├── components/
│   ├── visualizers/        # Core visualization components
│   ├── Sidebar.tsx         # Navigation sidebar
│   └── PageHeader.tsx      # Page header component
├── store/                  # Zustand state stores
└── lib/                    # Utility functions
```

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/berkayozgun/algoviz)

```bash
# Using Vercel CLI
npm i -g vercel
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Design Philosophy

- **Engineering Aesthetic** — Clean, matte surfaces with micro-borders
- **Desaturated Palette** — Zinc-based colors for reduced eye strain
- **Light Typography** — Font-light headings, zinc-200 text
- **Subtle Patterns** — 5% opacity dot pattern background

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Berkay Özgün**

- GitHub: [@berkayozgun](https://github.com/berkayozgun)

---

Built with ❤️ using Next.js
