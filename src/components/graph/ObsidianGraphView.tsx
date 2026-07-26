"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import type { GraphData, GraphNode } from '@/lib/types';

export default function ObsidianGraphView({ 
  data, 
  onNodeClick 
}: { 
  data: GraphData; 
  onNodeClick: (node: GraphNode) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);

  // Responsive dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      if (entries.length > 0) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Intersection observer to pause simulation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // @ts-ignore
          fgRef.current?.resumeAnimation?.();
        } else {
          // @ts-ignore
          fgRef.current?.pauseAnimation?.();
        }
      },
      { threshold: 0.1 }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoverNode(node);
    document.body.style.cursor = node ? 'pointer' : 'auto';
  }, []);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isHovered = hoverNode === node;
    const isConnected = hoverNode && (
      data.links.some(l => 
        (l.source === hoverNode.id && l.target === node.id) ||
        (l.target === hoverNode.id && l.source === node.id) ||
        // Check expanded objects from force-graph
        // @ts-ignore
        (l.source.id === hoverNode.id && l.target.id === node.id) ||
        // @ts-ignore
        (l.target.id === hoverNode.id && l.source.id === node.id)
      )
    );
    
    const isActive = isHovered || isConnected;
    const opacity = hoverNode ? (isActive ? 1 : 0.2) : 1;

    let size = 4;
    let color = '#8b5cf6'; // notes = purple
    if (node.type === 'topic') {
      size = 6;
      color = '#06b6d4'; // topics = cyan
    } else if (node.type === 'channel') {
      size = 8;
      color = '#ec4899'; // channels = pink
    }
    if (node.color) color = node.color;
    if (node.size) size = node.size;

    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    ctx.fill();

    // Glow effect
    if (isActive) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Label
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.label || '', node.x, node.y + size + fontSize);
    ctx.globalAlpha = 1;
  }, [hoverNode, data.links]);

  const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const isHovered = hoverNode && (link.source.id === hoverNode?.id || link.target.id === hoverNode?.id);
    const opacity = hoverNode ? (isHovered ? 0.6 : 0.1) : 0.3;

    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`; // purple line
    ctx.lineWidth = isHovered ? 2 : 1;
    ctx.stroke();
  }, [hoverNode]);

  // Clean up cursor on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[500px] bg-[#030014]">
      <ForceGraph2D
        // @ts-ignore
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={data}
        nodeLabel={() => ''} // custom label rendering
        nodeCanvasObject={paintNode}
        linkCanvasObject={paintLink}
        onNodeHover={handleNodeHover as any}
        onNodeClick={onNodeClick as any}
        backgroundColor="#030014"
        d3VelocityDecay={0.3}
      />
    </div>
  );
}
