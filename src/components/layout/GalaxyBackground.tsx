"use client";

import React, { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  baseY: number;
  radius: number;
  alpha: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  waveOffset: number;
}

export default function GalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Create 110 star dots
    const starCount = Math.floor(Math.min(width, 1600) * 0.08);
    const stars: Star[] = [];

    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 1.6 + 0.6; // 0.6px to 2.2px
      const baseAlpha = Math.random() * 0.5 + 0.15; // 0.15 to 0.65
      stars.push({
        x,
        y,
        baseY: y,
        radius,
        alpha: baseAlpha,
        baseAlpha,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
        waveOffset: Math.random() * Math.PI * 2,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    let scrollY = window.scrollY;
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    let time = 0;
    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Wave motion on scroll + subtle floating
        const scrollWave = Math.sin(star.x * 0.003 + scrollY * 0.0025 + star.waveOffset) * 18;
        const floatWave = Math.cos(time + star.waveOffset) * 4;
        const currentY = (star.baseY + scrollWave + floatWave) % height;
        const finalY = currentY < 0 ? height + currentY : currentY;

        // Twinkle luminance
        star.twinklePhase += star.twinkleSpeed;
        const luminance = Math.sin(star.twinklePhase) * 0.25 + 0.75;
        const currentAlpha = Math.min(1, Math.max(0.05, star.baseAlpha * luminance));

        // Draw star dot with radial glow
        ctx.beginPath();
        ctx.arc(star.x, finalY, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha.toFixed(2)})`;
        ctx.shadowBlur = star.radius > 1.4 ? 6 : 2;
        ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-80"
    />
  );
}
