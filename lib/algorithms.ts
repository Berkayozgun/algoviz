import { GridType, Point } from '../types/grid';
import { ROWS, COLS } from '../constants/grid';

export interface PathfindingResult {
    visitedNodesInOrder: Point[];
    shortestPath: Point[];
}

export const bfs = (grid: GridType, startNode: Point, endNode: Point): PathfindingResult => {
    const visitedNodesInOrder: Point[] = [];
    const queue: Point[] = [startNode];
    const visited = new Set<string>();
    const parentMap = new Map<string, string | null>();

    const nodeToKey = (p: Point) => `${p.row}-${p.col}`;
    const keyToPoint = (key: string): Point => {
        const [row, col] = key.split('-').map(Number);
        return { row, col };
    };

    visited.add(nodeToKey(startNode));
    parentMap.set(nodeToKey(startNode), null);

    const directions = [
        { row: -1, col: 0 }, // Up
        { row: 1, col: 0 },  // Down
        { row: 0, col: -1 }, // Left
        { row: 0, col: 1 },  // Right
    ];

    while (queue.length > 0) {
        const current = queue.shift()!;
        visitedNodesInOrder.push(current);

        if (current.row === endNode.row && current.col === endNode.col) {
            return {
                visitedNodesInOrder,
                shortestPath: getShortestPath(parentMap, endNode),
            };
        }

        for (const dir of directions) {
            const next: Point = {
                row: current.row + dir.row,
                col: current.col + dir.col,
            };

            if (
                next.row >= 0 &&
                next.row < ROWS &&
                next.col >= 0 &&
                next.col < COLS &&
                grid[next.row][next.col].type !== 'wall' &&
                !visited.has(nodeToKey(next))
            ) {
                visited.add(nodeToKey(next));
                parentMap.set(nodeToKey(next), nodeToKey(current));
                queue.push(next);
            }
        }
    }

    return { visitedNodesInOrder, shortestPath: [] };
};

export const recursiveDivision = (
    width: number,
    height: number,
    startNode: Point,
    endNode: Point
): Point[] => {
    const walls: Point[] = [];

    const isStartOrEnd = (row: number, col: number) => {
        return (row === startNode.row && col === startNode.col) ||
            (row === endNode.row && col === endNode.col);
    };

    const divide = (
        rowStart: number,
        rowEnd: number,
        colStart: number,
        colEnd: number,
        orientation: 'horizontal' | 'vertical'
    ) => {
        if (rowEnd - rowStart < 2 || colEnd - colStart < 2) return;

        const horizontal = orientation === 'horizontal';

        // Choose where to draw the wall
        let wallRow: number, wallCol: number;
        if (horizontal) {
            // Draw horizontal wall, pick a row between rowStart+1 and rowEnd-1
            wallRow = Math.floor(Math.random() * (rowEnd - rowStart - 1)) + rowStart + 1;
            // Pick a random gap (passage) in this wall
            const gapCol = Math.floor(Math.random() * (colEnd - colStart + 1)) + colStart;

            for (let col = colStart; col <= colEnd; col++) {
                if (col === gapCol) continue;
                if (isStartOrEnd(wallRow, col)) continue;
                walls.push({ row: wallRow, col });
            }

            // Recurse into top and bottom chambers
            divide(rowStart, wallRow - 1, colStart, colEnd, chooseOrientation(wallRow - 1 - rowStart, colEnd - colStart));
            divide(wallRow + 1, rowEnd, colStart, colEnd, chooseOrientation(rowEnd - wallRow - 1, colEnd - colStart));
        } else {
            // Draw vertical wall, pick a column between colStart+1 and colEnd-1
            wallCol = Math.floor(Math.random() * (colEnd - colStart - 1)) + colStart + 1;
            // Pick a random gap (passage) in this wall
            const gapRow = Math.floor(Math.random() * (rowEnd - rowStart + 1)) + rowStart;

            for (let row = rowStart; row <= rowEnd; row++) {
                if (row === gapRow) continue;
                if (isStartOrEnd(row, wallCol)) continue;
                walls.push({ row, col: wallCol });
            }

            // Recurse into left and right chambers
            divide(rowStart, rowEnd, colStart, wallCol - 1, chooseOrientation(rowEnd - rowStart, wallCol - 1 - colStart));
            divide(rowStart, rowEnd, wallCol + 1, colEnd, chooseOrientation(rowEnd - rowStart, colEnd - wallCol - 1));
        }
    };

    const chooseOrientation = (height: number, width: number): 'horizontal' | 'vertical' => {
        if (width < height) return 'horizontal';
        if (height < width) return 'vertical';
        return Math.random() < 0.5 ? 'horizontal' : 'vertical';
    };

    // Initial call
    divide(0, height - 1, 0, width - 1, chooseOrientation(height, width));
    return walls;
};

export const astar = (grid: GridType, startNode: Point, endNode: Point): PathfindingResult => {
    const visitedNodesInOrder: Point[] = [];
    const openSet: Point[] = [startNode];
    const closedSet = new Set<string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    const parentMap = new Map<string, string | null>();

    const startKey = `${startNode.row}-${startNode.col}`;
    gScore.set(startKey, 0);
    fScore.set(startKey, manhattanDistance(startNode, endNode));
    parentMap.set(startKey, null);

    while (openSet.length > 0) {
        // Sort by fScore and pick the lowest
        openSet.sort((a, b) => {
            const fA = fScore.get(`${a.row}-${a.col}`) ?? Infinity;
            const fB = fScore.get(`${b.row}-${b.col}`) ?? Infinity;
            return fA - fB;
        });

        const current = openSet.shift()!;
        const currentKey = `${current.row}-${current.col}`;

        if (current.row === endNode.row && current.col === endNode.col) {
            return { visitedNodesInOrder, shortestPath: getShortestPath(parentMap, endNode) };
        }

        closedSet.add(currentKey);
        visitedNodesInOrder.push(current);

        const neighbors = getNeighbors(current, grid);
        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.row}-${neighbor.col}`;
            if (closedSet.has(neighborKey)) continue;

            const tentativeGScore = (gScore.get(currentKey) ?? Infinity) + 1;

            if (!openSet.some(p => `${p.row}-${p.col}` === neighborKey)) {
                openSet.push(neighbor);
            } else if (tentativeGScore >= (gScore.get(neighborKey) ?? Infinity)) {
                continue;
            }

            parentMap.set(neighborKey, currentKey);
            gScore.set(neighborKey, tentativeGScore);
            fScore.set(neighborKey, tentativeGScore + manhattanDistance(neighbor, endNode));
        }
    }

    return { visitedNodesInOrder, shortestPath: [] };
};

const manhattanDistance = (p1: Point, p2: Point): number => {
    return Math.abs(p1.row - p2.row) + Math.abs(p1.col - p2.col);
};

export const hasPath = (grid: GridType, startNode: Point, endNode: Point): boolean => {
    const queue: Point[] = [startNode];
    const visited = new Set<string>();
    const nodeToKey = (p: Point) => `${p.row}-${p.col}`;

    visited.add(nodeToKey(startNode));

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (current.row === endNode.row && current.col === endNode.col) return true;

        const neighbors = getNeighbors(current, grid);
        for (const neighbor of neighbors) {
            const key = nodeToKey(neighbor);
            if (!visited.has(key)) {
                visited.add(key);
                queue.push(neighbor);
            }
        }
    }

    return false;
};

const getNeighbors = (point: Point, grid: GridType): Point[] => {
    const neighbors: Point[] = [];
    const { row, col } = point;

    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < ROWS - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < COLS - 1) neighbors.push(grid[row][col + 1]);

    // Use type casting or cast neighbors to GridNode[] to filter by type
    return (neighbors as any[]).filter((neighbor) => neighbor.type !== 'wall');
};

const getShortestPath = (parentMap: Map<string, string | null>, endNode: Point): Point[] => {
    const path: Point[] = [];
    let currentKey: string | null = `${endNode.row}-${endNode.col}`;

    while (currentKey !== null) {
        const [row, col] = currentKey.split('-').map(Number);
        path.unshift({ row, col });
        currentKey = parentMap.get(currentKey) || null;
    }

    return path;
};
