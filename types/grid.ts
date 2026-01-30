export type NodeType = 'empty' | 'wall' | 'start' | 'end' | 'visited' | 'path';

export interface GridNode {
  row: number;
  col: number;
  type: NodeType;
}

export type GridType = GridNode[][];

export interface Point {
  row: number;
  col: number;
}
