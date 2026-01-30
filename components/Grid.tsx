'use client';

import React, { useState } from 'react';
import { useGridStore } from '../store/useGridStore';
import Node from './Node';
import { ROWS, COLS } from '../constants/grid';

const Grid = () => {
    const { grid, isDragging, setDragging, toggleWall, moveStart, moveEnd } = useGridStore();
    const [movingNodeType, setMovingNodeType] = useState<'start' | 'end' | null>(null);

    const handleMouseDown = (row: number, col: number) => {
        const node = grid[row][col];
        if (node.type === 'start') {
            setMovingNodeType('start');
        } else if (node.type === 'end') {
            setMovingNodeType('end');
        } else {
            toggleWall(row, col);
        }
        setDragging(true);
    };

    const handleMouseEnter = (row: number, col: number) => {
        if (!isDragging) return;

        if (movingNodeType === 'start') {
            moveStart(row, col);
        } else if (movingNodeType === 'end') {
            moveEnd(row, col);
        } else {
            const node = grid[row][col];
            if (node.type !== 'start' && node.type !== 'end') {
                toggleWall(row, col);
            }
        }
    };

    const handleMouseUp = () => {
        setDragging(false);
        setMovingNodeType(null);
    };

    const handleContextMenu = (e: React.MouseEvent, row: number, col: number) => {
        e.preventDefault();
        // Alternating between moving start and end on right click
        const node = grid[row][col];
        if (node.type === 'start' || node.type === 'end') return;

        // Logic: move start if it was empty, or move end if start is already there.
        // Simplifying: Just toggle start/end on right click for now or allow drag-to-move as implemented in handleMouseDown
    };

    return (
        <div
            className="grid gap-0 border border-slate-700 bg-slate-900 shadow-2xl rounded-lg overflow-hidden"
            style={{
                gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                width: 'min(90vw, 600px)',
                height: 'min(90vw, 600px)',
            }}
            onMouseLeave={handleMouseUp}
            onMouseUp={handleMouseUp}
        >
            {grid.map((row, rowIndex) =>
                row.map((node, colIndex) => (
                    <Node
                        key={`${rowIndex}-${colIndex}`}
                        row={rowIndex}
                        col={colIndex}
                        type={node.type}
                        onMouseDown={handleMouseDown}
                        onMouseEnter={handleMouseEnter}
                        onContextMenu={handleContextMenu}
                    />
                ))
            )}
        </div>
    );
};

export default Grid;
