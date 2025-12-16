import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ----------------------
// BACKGROUND STARS (Cool, Twinkling)
// ----------------------
const StarMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#aaccff') }
  },
  vertexShader: `
    uniform float uTime;
    attribute float aSize;
    attribute float aSpeed;
    varying float vAlpha;
    
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      
      // Twinkle effect based on time and random speed
      float twinkle = 0.5 + 0.5 * sin(uTime * aSpeed + position.x * 100.0);
      
      gl_PointSize = aSize * (30.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
      
      vAlpha = twinkle;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    varying float vAlpha;
    
    void main() {
      // Circle shape
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;
      
      // Glow center
      float strength = 1.0 - (dist * 2.0);
      strength = pow(strength, 2.0);
      
      gl_FragColor = vec4(uColor, strength * vAlpha);
    }
  `
};

export const BackgroundStars = () => {
  const COUNT = 1500;
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const { positions, sizes, speeds } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const sz = new Float32Array(COUNT);
    const sp = new Float32Array(COUNT);
    
    for(let i=0; i<COUNT; i++) {
        // Distribute on a large sphere surface/volume
        const r = 60 + Math.random() * 40;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i*3+2] = r * Math.cos(phi);
        
        sz[i] = 10.0 + Math.random() * 20.0;
        sp[i] = 2.0 + Math.random() * 5.0; // Twinkle speed
    }
    return { positions: pos, sizes: sz, speeds: sp };
  }, []);

  useFrame((state) => {
    if(materialRef.current) {
        materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={COUNT} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={COUNT} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aSpeed" count={COUNT} array={speeds} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial 
        ref={materialRef} 
        args={[StarMaterial]} 
        transparent 
        blending={THREE.AdditiveBlending} 
        depthWrite={false} 
      />
    </points>
  )
}

// ----------------------
// GOLDEN STARDUST (Warm, Floating around tree)
// ----------------------
const DustMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#ffddaa') } // Warm Gold
  },
  vertexShader: `
    uniform float uTime;
    attribute float aScale;
    attribute vec3 aRandom; // x: offset, y: speed, z: noise
    varying float vAlpha;
    
    void main() {
      vec3 pos = position;
      
      // Floating movement
      // Upward drift
      float speed = aRandom.y * 0.5;
      pos.y += mod(uTime * speed, 20.0) - 10.0; // Loop vertically
      
      // Horizontal sway
      pos.x += sin(uTime * 0.5 + aRandom.x) * 0.5;
      pos.z += cos(uTime * 0.3 + aRandom.z) * 0.5;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = aScale * (15.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
      
      // Pulsing alpha
      vAlpha = 0.4 + 0.4 * sin(uTime * 2.0 + aRandom.x);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    varying float vAlpha;
    
    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;
      
      // Hot center for brightness
      float strength = pow(1.0 - (dist * 2.0), 3.0);
      
      gl_FragColor = vec4(uColor * 2.0, strength * vAlpha); // Boost color for bloom
    }
  `
};

export const GoldenDust = () => {
    const COUNT = 300;
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    
    const { positions, scales, randoms } = useMemo(() => {
        const pos = new Float32Array(COUNT * 3);
        const sc = new Float32Array(COUNT);
        const rnd = new Float32Array(COUNT * 3);
        
        for(let i=0; i<COUNT; i++) {
            // Cylinder distribution around tree
            const r = Math.random() * 12;
            const theta = Math.random() * Math.PI * 2;
            const y = (Math.random() - 0.5) * 20;
            
            pos[i*3] = r * Math.cos(theta);
            pos[i*3+1] = y;
            pos[i*3+2] = r * Math.sin(theta);
            
            sc[i] = 5.0 + Math.random() * 10.0;
            
            rnd[i*3] = Math.random() * 100; // offset
            rnd[i*3+1] = 0.5 + Math.random(); // speed
            rnd[i*3+2] = Math.random() * 100; // noise
        }
        return { positions: pos, scales: sc, randoms: rnd };
    }, []);

    useFrame((state) => {
        if(materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    return (
        <points>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={COUNT} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-aScale" count={COUNT} array={scales} itemSize={1} />
                <bufferAttribute attach="attributes-aRandom" count={COUNT} array={randoms} itemSize={3} />
            </bufferGeometry>
            <shaderMaterial 
                ref={materialRef} 
                args={[DustMaterial]} 
                transparent 
                blending={THREE.AdditiveBlending} 
                depthWrite={false} 
            />
        </points>
    );
};