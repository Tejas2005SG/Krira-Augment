"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const PARTICLE_COUNT = 10000;
const LOGO_URL = "/krira-augment-logo.png";

const COLORS = ["#4f46e5", "#06b6d4", "#1e1b4b"];

function Particles({ logoUrl }: { logoUrl: string }) {
  const [logoPoints, setLogoPoints] = useState<Float32Array | null>(null);
  const pointsRef = useRef<THREE.Points>(null);
  
  // Load Logo and Sample Points
  useEffect(() => {
    const img = new Image();
    img.src = logoUrl;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const width = 400;
      const scaleFactor = width / img.width;
      const height = Math.floor(img.height * scaleFactor);
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      ctx.drawImage(img, 0, 0, width, height);
      const data = ctx.getImageData(0, 0, width, height).data;
      
      const validPixels: number[] = [];
      for (let i = 0; i < width * height; i++) {
        const alpha = data[i * 4 + 3];
        if (alpha > 20) { 
          validPixels.push(i);
        }
      }
      
      const points = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const pixelIndex = validPixels[Math.floor(Math.random() * validPixels.length)];
        const x = (pixelIndex % width) - width / 2;
        const y = -(Math.floor(pixelIndex / width) - height / 2);
        
        const worldScale = 12 / width;
        
        points[i * 3] = x * worldScale;
        points[i * 3 + 1] = y * worldScale;
        points[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
      }
      
      setLogoPoints(points);
    };
  }, [logoUrl]);

  // Colors
  const colors = useMemo(() => {
    const c = new Float32Array(PARTICLE_COUNT * 3);
    const pseudoRandom = (seed: number) => {
      const value = Math.sin(seed + 1) * 10000;
      return value - Math.floor(value);
    };
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const colorHex = COLORS[Math.floor(pseudoRandom(i) * COLORS.length)];
      const color = new THREE.Color(colorHex);
      c[i * 3] = color.r;
      c[i * 3 + 1] = color.g;
      c[i * 3 + 2] = color.b;
    }
    return c;
  }, []);

  // Animation Loop - only gentle rotation
  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.05;
  });

  // Don't render until logo points are ready
  if (!logoPoints) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[logoPoints, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function ParticleText() {
  return (
    <div className="h-[600px] w-full relative flex items-center justify-center overflow-visible">
      <Canvas 
        camera={{ position: [0, 0, 18], fov: 35 }} 
        gl={{ antialias: true, alpha: true }}
        className="!absolute !top-[60%] !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !w-[1200px] !h-[800px]"
      >
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <Particles logoUrl={LOGO_URL} />
        <OrbitControls enableZoom={false} autoRotate={false} enablePan={false} maxPolarAngle={Math.PI / 1.5} minPolarAngle={Math.PI / 3} />
      </Canvas>
    </div>
  );
}
