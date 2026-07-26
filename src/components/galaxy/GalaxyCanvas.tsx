"use client";

import React, { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { GalaxyNebula, GalaxyStar } from "@/lib/types";

const fragmentShader = `
  varying vec3 vColor;
  void main() {
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    float strength = 0.05 / distanceToCenter - 0.1;
    strength = clamp(strength, 0.0, 1.0);
    gl_FragColor = vec4(vColor, strength);
  }
`;

const vertexShader = `
  attribute float size;
  attribute vec3 aColor;
  varying vec3 vColor;
  void main() {
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

function GalaxyScene({
  nebulas,
  onStarClick,
  inView,
}: {
  nebulas: GalaxyNebula[];
  onStarClick: (star: GalaxyStar) => void;
  inView: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { setFrameloop } = useThree();
  const [hoveredStar, setHoveredStar] = useState<GalaxyStar | null>(null);

  useEffect(() => {
    setFrameloop(inView ? "always" : "demand");
  }, [inView, setFrameloop]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  useFrame((_, delta) => {
    if (!inView) return;
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
      groupRef.current.rotation.x += delta * 0.01;
    }
  });

  const stars = useMemo(() => {
    const extractedStars = nebulas.flatMap((n) => n.stars);
    if (extractedStars.length > 0) return extractedStars;

    // Generate ambient galaxy particles if no nebulas provided
    const defaultStars: GalaxyStar[] = [];
    const colors = ["#8b5cf6", "#06b6d4", "#ec4899", "#f59e0b", "#ffffff"];
    for (let i = 0; i < 800; i++) {
      const radius = 5 + Math.random() * 35;
      const angle = Math.random() * Math.PI * 2;
      const branch = (i % 3) * ((Math.PI * 2) / 3);
      const x = Math.cos(angle + branch) * radius + (Math.random() - 0.5) * 4;
      const y = (Math.random() - 0.5) * (radius * 0.4);
      const z = Math.sin(angle + branch) * radius + (Math.random() - 0.5) * 4;
      const color = colors[Math.floor(Math.random() * colors.length)];

      defaultStars.push({
        id: `ambient-${i}`,
        label: `Knowledge Node #${i + 1}`,
        slug: `node-${i + 1}`,
        position: [x, y, z],
        color,
        size: 1.5 + Math.random() * 3.5,
        topicId: "default",
      });
    }
    return defaultStars;
  }, [nebulas]);

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(stars.length * 3);
    const colors = new Float32Array(stars.length * 3);
    const sizes = new Float32Array(stars.length);
    const colorObj = new THREE.Color();

    stars.forEach((star, i) => {
      positions[i * 3] = star.position[0];
      positions[i * 3 + 1] = star.position[1];
      positions[i * 3 + 2] = star.position[2];

      colorObj.set(star.color);
      colors[i * 3] = colorObj.r;
      colors[i * 3 + 1] = colorObj.g;
      colors[i * 3 + 2] = colorObj.b;

      sizes[i] = star.size || 1.0;
    });

    return { positions, colors, sizes };
  }, [stars]);

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.index !== undefined && stars[e.index]) {
      setHoveredStar(stars[e.index]);
      document.body.style.cursor = "pointer";
    }
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredStar(null);
    document.body.style.cursor = "auto";
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.index !== undefined && stars[e.index]) {
      onStarClick(stars[e.index]);
    }
  };

  return (
    <group ref={groupRef}>
      <points
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
          <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {hoveredStar && (
        <Html
          position={[
            hoveredStar.position[0],
            hoveredStar.position[1],
            hoveredStar.position[2],
          ]}
          center
        >
          <div className="bg-[#030014]/90 border border-cyan-500/30 text-white px-3 py-1.5 rounded-lg text-sm pointer-events-none whitespace-nowrap backdrop-blur-md z-50 shadow-lg glow-purple">
            {hoveredStar.label}
          </div>
        </Html>
      )}
    </group>
  );
}

export default function GalaxyCanvas({
  nebulas = [],
  onStarClick = () => {},
}: {
  nebulas?: GalaxyNebula[];
  onStarClick?: (star: GalaxyStar) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[500px] bg-[#030014] relative"
    >
      <Canvas camera={{ position: [0, 20, 50], fov: 60 }} dpr={[1, 2]}>
        <color attach="background" args={["#030014"]} />
        <ambientLight intensity={0.5} />
        <GalaxyScene
          nebulas={nebulas}
          onStarClick={onStarClick}
          inView={inView}
        />
        <OrbitControls enableZoom={true} enablePan={false} autoRotate={false} />
      </Canvas>
    </div>
  );
}
