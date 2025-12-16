import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { TreeMorphState } from '../types';
import Foliage from './Foliage';
import Ornaments from './Ornaments';
import { BackgroundStars, GoldenDust } from './Particles';

interface ExperienceProps {
  treeState: TreeMorphState;
}

// Camera rig that slowly rotates
const CameraRig = ({ state }: { state: TreeMorphState }) => {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (group.current) {
        // Rotate slowly
        group.current.rotation.y += delta * 0.05;
    }
  });
  return (
    <group ref={group}>
        <PerspectiveCamera makeDefault position={[0, 2, 24]} fov={45} />
    </group>
  )
}

// 5-Pointed Star Geometry
const StarShape = () => {
  const shape = useMemo(() => {
    const star = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.9;
    const innerRadius = 0.45;
    
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2; // Rotate to point up
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) star.moveTo(x, y);
      else star.lineTo(x, y);
    }
    star.closePath();
    return star;
  }, []);

  const extrudeSettings = useMemo(() => ({
    depth: 0.3,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 3
  }), []);

  return (
    // Rotated 180 degrees around X axis to flip front/back and up/down orientation
    // Positioned at 7.8 to sit tight on the tree tip (Tree top is ~7.0)
    <mesh position={[0, 7.8, 0]} rotation={[Math.PI, 0, 0]}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial 
        color="#FFF7E6" // Warm Ivory / White Gold
        emissive="#FFF7E6" // Matching warm glow
        emissiveIntensity={0.6} // Reduced intensity to prevent whiteout blob
        roughness={0.15} // Slight frosting for luxury feel
        metalness={0.9} // Retain metallic premium look
        side={THREE.DoubleSide} // Ensure visibility from all angles
      />
    </mesh>
  );
};

const Experience: React.FC<ExperienceProps> = ({ treeState }) => {
  return (
    <Canvas
      dpr={[1, 2]}
      // ACES Filmic for movie-grade dynamic range
      // Lower exposure (1.2) to preserve details and prevent whiteout
      gl={{ 
        antialias: false, 
        toneMapping: THREE.ACESFilmicToneMapping, 
        toneMappingExposure: 1.2, 
        outputColorSpace: THREE.SRGBColorSpace
      }}
      shadows
    >
      <color attach="background" args={['#000502']} />
      
      {/* Dark, distant fog to hide clipping plane but keep blacks deep */}
      <fog attach="fog" args={['#000502', 45, 90]} />

      {/* Environment Map for Gold Reflections */}
      <Environment preset="city" blur={1} background={false} />

      <CameraRig state={treeState} />
      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        minDistance={10} 
        maxDistance={50}
        maxPolarAngle={Math.PI / 1.6}
      />

      {/* --- CINEMATIC LIGHTING SETUP --- */}
      
      {/* 1. Fill Light (Warm Ambient) - lowered for contrast */}
      <ambientLight intensity={0.3} color="#ffebdb" />
      
      {/* 2. Key Light (Warm Gold from Top-Right) - Reduced intensity to stop blowout */}
      <spotLight 
        position={[15, 20, 15]} 
        angle={0.6} 
        penumbra={0.5} 
        intensity={10} 
        color="#ffaa00" 
        castShadow 
        shadow-bias={-0.0001}
      />
      
      {/* 3. Rim Light (Cool Blue from Back-Left) - Creates silhouette */}
      <spotLight 
        position={[-15, 5, -20]} 
        angle={1} 
        penumbra={1} 
        intensity={6} 
        color="#d0eeff" 
      />

      {/* 4. Center Tree Warmth (Internal Glow) */}
      <pointLight position={[0, 4, 0]} intensity={2} color="#ff8800" distance={12} decay={2} />


      {/* --- SCENE CONTENT --- */}
      <group position={[0, -2.5, 0]}>
        <Foliage state={treeState} />
        <Ornaments state={treeState} />
        
        {/* Top Star */}
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2} floatingRange={[-0.1, 0.1]}>
             <StarShape />
            {/* Dedicated light for star glow - moved down to match star, warm white color */}
            <pointLight position={[0, 7.8, 0]} intensity={3} color="#FFF7E6" distance={5} decay={2} />
        </Float>
        
        {/* Floating Golden Dust */}
        <GoldenDust />
      </group>

      {/* Twinkling Background Stars */}
      <BackgroundStars />

      {/* --- POST PROCESSING --- */}
      <EffectComposer enableNormalPass={false}>
        {/* Tight, controlled Bloom for "sparkle" not "glow" */}
        <Bloom 
            luminanceThreshold={0.85} // Only very bright things glow
            mipmapBlur 
            intensity={0.6} // Gentle luxury glow
            radius={0.3} // Small radius for sharp highlights
        />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
        <Noise opacity={0.015} />
      </EffectComposer>
    </Canvas>
  );
};

export default Experience;