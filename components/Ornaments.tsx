import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMorphState, OrnamentData } from '../types';
import { getRandomSpherePoint, getTreeSpiralPoint, CONSTANTS } from '../utils/math';

interface OrnamentGroupProps {
  state: TreeMorphState;
  type: 'SPHERE' | 'BOX';
  count: number;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  scaleBase: number;
  palette?: string[]; // Optional color palette
}

const OrnamentGroup: React.FC<OrnamentGroupProps> = ({ state, type, count, geometry, material, scaleBase, palette }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Initialize Data
  const data = useMemo(() => {
    const items: OrnamentData[] = [];
    const colorObj = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const scatter = getRandomSpherePoint(CONSTANTS.SCATTER_RADIUS);
      const tree = getTreeSpiralPoint(i, count, CONSTANTS.TREE_HEIGHT, CONSTANTS.TREE_RADIUS_BASE * (type === 'BOX' ? 0.8 : 0.9));
      
      // Jitter tree position
      tree[0] += (Math.random() - 0.5) * 0.5;
      tree[2] += (Math.random() - 0.5) * 0.5;

      // Pick random color from palette if exists
      let colorHex = '#d4af37';
      if (palette && palette.length > 0) {
          colorHex = palette[Math.floor(Math.random() * palette.length)];
      }
      
      // Scale Logic
      let scaleVec: [number, number, number] = [1, 1, 1];
      let itemScaleBase = scaleBase;

      if (type === 'BOX') {
        // Randomize dimensions to make flat boxes, tall boxes, cubes
        scaleVec = [
            0.8 + Math.random() * 0.4, // Width
            0.6 + Math.random() * 0.6, // Height
            0.8 + Math.random() * 0.4  // Depth
        ];
        // Standard variation for boxes
        itemScaleBase = scaleBase * (0.8 + Math.random() * 0.4);
      } else if (type === 'SPHERE') {
         // Stratified sizing for Spheres
         // Default to small detail spheres
         itemScaleBase = scaleBase * (0.8 + Math.random() * 0.4);

         // If NOT Red (Red is #8a0000), apply chance for larger sizes to fill gaps
         if (colorHex !== '#8a0000') {
             const r = Math.random();
             if (r < 0.04) {
                 // 4% Very Large (Focus/Fill) - 2.2x to 2.4x
                 itemScaleBase = scaleBase * (2.2 + Math.random() * 0.2);
             } else if (r < 0.20) {
                 // 16% Medium-Large (Main Decor) - 1.4x to 1.8x
                 itemScaleBase = scaleBase * (1.4 + Math.random() * 0.4);
             }
         }
      }

      items.push({
        id: i,
        type,
        scatter: scatter,
        tree: tree,
        scale: itemScaleBase,
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
        color: colorHex,
        speed: 0.2 + Math.random() * 0.5,
        offset: Math.random() * 100,
        // @ts-ignore - attaching custom scale vector to data
        scaleVector: scaleVec 
      });
    }
    return items;
  }, [count, type, scaleBase, palette]);

  // Set initial instance colors
  useEffect(() => {
      if (!meshRef.current) return;
      const colorHelper = new THREE.Color();
      data.forEach((item, i) => {
          colorHelper.set(item.color);
          meshRef.current!.setColorAt(i, colorHelper);
      });
      meshRef.current.instanceColor!.needsUpdate = true;
  }, [data]);

  const tempObj = new THREE.Object3D();
  const progressRef = useRef(0);

  useFrame((clock, delta) => {
    if (!meshRef.current) return;

    // Transition Logic
    const target = state === TreeMorphState.TREE_SHAPE ? 1.0 : 0.0;
    const lerpSpeed = type === 'BOX' ? 1.2 : 1.8;
    progressRef.current += (target - progressRef.current) * lerpSpeed * delta;
    
    const t = progressRef.current;
    // Cubic ease
    const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const time = clock.clock.getElapsedTime();

    data.forEach((item, i) => {
      const x = THREE.MathUtils.lerp(item.scatter[0], item.tree[0], easeT);
      const y = THREE.MathUtils.lerp(item.scatter[1], item.tree[1], easeT);
      const z = THREE.MathUtils.lerp(item.scatter[2], item.tree[2], easeT);

      const floatY = Math.sin(time * item.speed + item.offset) * (0.2 * (1-easeT));
      
      tempObj.position.set(x, y + floatY, z);
      
      tempObj.rotation.x = item.rotation[0] + (time * 0.2 * (1-easeT));
      tempObj.rotation.y = item.rotation[1] + (time * 0.1);
      tempObj.rotation.z = item.rotation[2];

      // Apply base scale + individual vector scale + pop animation
      const scalePop = item.scale * (0.8 + 0.2 * Math.sin(time + item.offset));
      // @ts-ignore
      const sv = item.scaleVector || [1,1,1];
      
      tempObj.scale.set(
          sv[0] * scalePop, 
          sv[1] * scalePop, 
          sv[2] * scalePop
      );

      tempObj.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObj.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} castShadow receiveShadow />
  );
};

const Ornaments: React.FC<{ state: TreeMorphState }> = ({ state }) => {
  // Shared Geometries
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 24, 24), []);
  // Use a Box geometry with bevels to catch light better for "Luxury" feel
  const boxGeo = useMemo(() => {
      // RoundedBoxGeometry is not standard three, sticking to Box with bevel effect via chamfer if possible, 
      // but simple BoxGeometry is cleaner for InstancedMesh performance.
      // We rely on the material roughness/metalness for the "premium" look.
      return new THREE.BoxGeometry(1, 1, 1); 
  }, []);
  
  // Materials - Use white base color so instanceColor works correctly
  const goldMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffffff', // White base allows instance color to tint fully
    metalness: 1.0,
    roughness: 0.1,
    envMapIntensity: 2.0,
  }), []);

  const giftMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffffff', // White base
    metalness: 0.3, // Less metal, more glossy paper/satin
    roughness: 0.2,
    envMapIntensity: 1.2,
  }), []);

  // Palette for boxes: Deep Red, Chocolate, White/Cream, Gold, Deep Green
  const giftPalette = [
      '#8a0000', // Deep Red
      '#8B4513', // Chocolate
      '#F5F5F5', // White/Silver
      '#D4AF37', // Gold
      '#D4AF37', // More Gold
      '#064e3b'  // Deep Green
  ];

  const spherePalette = [
      '#ffc125', // Gold
      '#ffc125', // Gold
      '#ffc125', // Gold
      '#8a0000', // Occasional Red
      '#ffffff'  // Occasional Pearl
  ];

  return (
    <group>
      {/* Spheres - Mostly Gold, some variety */}
      <OrnamentGroup 
        state={state} 
        type="SPHERE" 
        count={250} 
        geometry={sphereGeo} 
        material={goldMaterial} 
        scaleBase={0.25} 
        palette={spherePalette}
      />
      
      {/* Gift Boxes - Colorful, varied shapes */}
      <OrnamentGroup 
        state={state} 
        type="BOX" 
        count={100} 
        geometry={boxGeo} 
        material={giftMaterial} 
        scaleBase={0.4} 
        palette={giftPalette}
      />
    </group>
  );
};

export default Ornaments;