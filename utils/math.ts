import * as THREE from 'three';

// Constants for tree shape
const TREE_HEIGHT = 12;
const TREE_RADIUS_BASE = 5.5;
const SCATTER_RADIUS = 18;

// Helper to get a random point inside a sphere
export const getRandomSpherePoint = (radius: number): [number, number, number] => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  return [x, y, z];
};

// Helper to get a point on a cone surface (The Tree) with volume
export const getTreePoint = (height: number, radiusBase: number, yOffset = -5): [number, number, number] => {
  // Normalized height (0 at bottom, 1 at top)
  const h = Math.random(); 
  const y = h * height;
  
  // Radius at this height (linear taper)
  const currentRadius = (1 - h) * radiusBase;
  
  // Random angle
  const angle = Math.random() * Math.PI * 2;
  
  // Volume distribution (mostly surface but some depth)
  const r = Math.sqrt(Math.random()) * currentRadius;

  const x = r * Math.cos(angle);
  const z = r * Math.sin(angle);

  return [x, y + yOffset, z];
};

// Helper to spiral points for ornaments (more aesthetically pleasing than random volume)
export const getTreeSpiralPoint = (t: number, totalPoints: number, height: number, radiusBase: number, yOffset = -5): [number, number, number] => {
  const hRatio = t / totalPoints; // 0 to 1
  const y = hRatio * height + yOffset;
  const r = (1 - hRatio) * radiusBase;
  
  // Golden angle spiral
  const angle = t * 2.39996; 
  
  const x = r * Math.cos(angle);
  const z = r * Math.sin(angle);
  
  return [x, y, z];
};

export const CONSTANTS = {
  TREE_HEIGHT,
  TREE_RADIUS_BASE,
  SCATTER_RADIUS
};