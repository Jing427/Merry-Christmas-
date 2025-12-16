export enum TreeMorphState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE'
}

export interface DualPosition {
  scatter: [number, number, number];
  tree: [number, number, number];
  scale: number;
  rotation: [number, number, number];
  color: string;
}

export interface OrnamentData extends DualPosition {
  id: number;
  type: 'SPHERE' | 'BOX' | 'STAR';
  speed: number; // For floating animation
  offset: number; // Random offset for sine waves
}