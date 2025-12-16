import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMorphState } from '../types';
import { getRandomSpherePoint, getTreePoint, CONSTANTS } from '../utils/math';

// Custom Shader Material for the Foliage
// Handles morphing on the GPU
const FoliageMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uProgress: { value: 0 }, // 0 = scatter, 1 = tree
    // Deep luxurious emerald (almost black-green base)
    uColor: { value: new THREE.Color('#013321') }, 
    // High intensity gold (Reduced multiplier to prevent blowout)
    uColorHigh: { value: new THREE.Color('#ffc800') }, 
  },
  vertexShader: `
    uniform float uTime;
    uniform float uProgress;
    attribute vec3 aScatterPos;
    attribute vec3 aTreePos;
    attribute float aRandom;
    
    varying vec2 vUv;
    varying float vAlpha;
    varying float vGoldMix;

    // Easing function for smooth transition
    float easeInOutCubic(float x) {
      return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
    }

    void main() {
      vUv = uv;
      
      // Calculate smooth morph progress
      float t = easeInOutCubic(uProgress);
      
      // Interpolate positions
      vec3 pos = mix(aScatterPos, aTreePos, t);
      
      // Add "Breathing" animation
      float breathe = sin(uTime * 2.0 + aRandom * 10.0) * 0.1;
      
      // Add some "float" in scattered mode
      vec3 floatOffset = vec3(
        sin(uTime * 0.5 + aRandom * 5.0),
        cos(uTime * 0.3 + aRandom * 3.0),
        sin(uTime * 0.7 + aRandom * 2.0)
      ) * (1.0 - t) * 0.5; // Only float when scattered

      pos += normal * breathe;
      pos += floatOffset;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      
      // Point size attenuation
      gl_PointSize = (10.0 * (1.0 + aRandom * 0.5)) * (20.0 / -mvPosition.z);
      
      gl_Position = projectionMatrix * mvPosition;
      
      // Pass randomness to fragment
      vAlpha = 0.8 + 0.2 * sin(uTime + aRandom * 10.0);
      vGoldMix = aRandom; 
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform vec3 uColorHigh;
    varying float vAlpha;
    varying float vGoldMix;

    void main() {
      // Circular particle
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;

      // Soft edge
      float strength = 1.0 - (dist * 2.0);
      strength = pow(strength, 1.5);

      // Color mixing: mostly deep green, gold sparkles are rare but bright
      vec3 baseColor = uColor;
      vec3 goldColor = uColorHigh * 2.5; // Moderate Multiplier for controlled HDR glow
      
      // Step: Only top 5% of particles are gold
      vec3 finalColor = mix(baseColor, goldColor, step(0.95, vGoldMix));
      
      // Add a bit of extra brightness to the center of every particle
      finalColor += vec3(0.05, 0.1, 0.05) * strength;

      gl_FragColor = vec4(finalColor, strength * vAlpha);
    }
  `
};

interface FoliageProps {
  state: TreeMorphState;
}

const Foliage: React.FC<FoliageProps> = ({ state }) => {
  const COUNT = 14000;
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Calculate positions once
  const { scatterPositions, treePositions, randoms } = useMemo(() => {
    const sPos = new Float32Array(COUNT * 3);
    const tPos = new Float32Array(COUNT * 3);
    const rnd = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      // Scatter Logic
      const [sx, sy, sz] = getRandomSpherePoint(CONSTANTS.SCATTER_RADIUS);
      sPos[i * 3] = sx;
      sPos[i * 3 + 1] = sy;
      sPos[i * 3 + 2] = sz;

      // Tree Logic
      const [tx, ty, tz] = getTreePoint(CONSTANTS.TREE_HEIGHT, CONSTANTS.TREE_RADIUS_BASE);
      tPos[i * 3] = tx;
      tPos[i * 3 + 1] = ty;
      tPos[i * 3 + 2] = tz;

      rnd[i] = Math.random();
    }
    return { scatterPositions: sPos, treePositions: tPos, randoms: rnd };
  }, []);

  // Handle Lerping Logic in a ref to persist value between renders
  const progressRef = useRef(0);
  
  useFrame((_, delta) => {
    if (!materialRef.current) return;
    
    // Update time for animation
    materialRef.current.uniforms.uTime.value += delta;
    
    const target = state === TreeMorphState.TREE_SHAPE ? 1.0 : 0.0;
    // Linear interpolation with dampening for the uniform
    const speed = 1.5;
    progressRef.current += (target - progressRef.current) * speed * delta;
    
    materialRef.current.uniforms.uProgress.value = progressRef.current;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position" // Base position (not used directly, mixed in shader)
          count={COUNT}
          array={scatterPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScatterPos"
          count={COUNT}
          array={scatterPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTreePos"
          count={COUNT}
          array={treePositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={COUNT}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        args={[FoliageMaterial]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default Foliage;