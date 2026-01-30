'use client';

import { motion } from 'framer-motion';
import { NodeType } from '../types/grid';
import { useGridStore } from '../store/useGridStore';
import { cn } from '@/lib/utils';

interface NodeProps {
    row: number;
    col: number;
    type: NodeType;
    onMouseDown: (row: number, col: number) => void;
    onMouseEnter: (row: number, col: number) => void;
    onContextMenu: (e: React.MouseEvent, row: number, col: number) => void;
}

const Node = ({ row, col, type, onMouseDown, onMouseEnter, onContextMenu }: NodeProps) => {
    const getBGColor = () => {
        switch (type) {
            case 'start':
                return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
            case 'end':
                return 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]';
            case 'wall':
                return 'bg-slate-700';
            case 'visited':
                return 'bg-cyan-500/30';
            case 'path':
                return 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.4)]';
            default:
                return 'bg-transparent';
        }
    };

    const variants = {
        initial: { scale: 1 },
        wall: { scale: [1, 1.2, 1], transition: { duration: 0.3 } },
        visited: {
            scale: [0.3, 1.1, 1],
            borderRadius: ["100%", "20%", "0%"],
            backgroundColor: [
                "rgba(0, 190, 218, 0.75)",
                "rgba(0, 190, 218, 0.5)",
                "rgba(6, 182, 212, 0.3)"
            ],
            transition: {
                duration: 0.6,
                ease: "easeOut"
            } as any
        },
        path: {
            scale: [1, 1.3, 1],
            backgroundColor: "#fbbf24", // Saffron yellow
            boxShadow: "0 0 20px rgba(251, 191, 36, 0.6)",
            transition: { duration: 0.4 } as any
        }
    };

    return (
        <motion.div
            initial="initial"
            animate={type === 'wall' ? 'wall' : type === 'visited' ? 'visited' : type === 'path' ? 'path' : 'initial'}
            variants={variants}
            className={cn(
                'w-full h-full border border-slate-800/10 transition-colors duration-200 ease-in-out cursor-pointer',
                getBGColor()
            )}
            onMouseDown={() => onMouseDown(row, col)}
            onMouseEnter={() => onMouseEnter(row, col)}
            onContextMenu={(e) => onContextMenu(e, row, col)}
        />
    );
};

export default Node;
