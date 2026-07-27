"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { extractBrainNodesAndLinks, BrainNode } from "@/lib/utils";

interface BrainMapModalProps {
  note: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function BrainMapModal({ note, isOpen, onClose }: BrainMapModalProps) {
  // Zoom & Pan State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Draggable Node State
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [nodeCustomPos, setNodeCustomPos] = useState<Record<string, { x: number; y: number }>>({});
  const nodeDragOriginRef = useRef<{ mouseX: number; mouseY: number; nodeX: number; nodeY: number } | null>(null);
  const hasDraggedRef = useRef<boolean>(false);

  const { nodes, edges } = useMemo(() => {
    if (!note) return { nodes: [], edges: [] };
    return extractBrainNodesAndLinks(note);
  }, [note]);

  // Initial position layout calculation
  const initialNodes = useMemo(() => {
    const width = 1200;
    const height = 800;
    const centerX = width / 2;
    const centerY = height / 2;

    const rootNode = nodes.find((n) => n.type === "ROOT_NOTE");
    const otherNodes = nodes.filter((n) => n.type !== "ROOT_NOTE");
    const totalOthers = otherNodes.length;
    const radius = Math.min(width, height) * 0.35;

    const result: Array<BrainNode & { defaultX: number; defaultY: number }> = [];

    if (rootNode) {
      result.push({ ...rootNode, defaultX: centerX, defaultY: centerY });
    }

    otherNodes.forEach((node, idx) => {
      const angle = (2 * Math.PI * idx) / (totalOthers || 1) - Math.PI / 2;
      const r = radius + (idx % 2 === 0 ? 0 : 45);
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      result.push({ ...node, defaultX: x, defaultY: y });
    });

    return result;
  }, [nodes]);

  // Current node positions (default + custom user drags)
  const currentNodes = useMemo(() => {
    return initialNodes.map((n) => {
      const custom = nodeCustomPos[n.id];
      return {
        ...n,
        x: custom ? custom.x : n.defaultX,
        y: custom ? custom.y : n.defaultY,
      };
    });
  }, [initialNodes, nodeCustomPos]);

  const nodePosMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    currentNodes.forEach((n) => map.set(n.id, { x: n.x, y: n.y }));
    return map;
  }, [currentNodes]);

  // Handle Zoom on Mouse Wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prev) => Math.min(4, Math.max(0.3, prev * zoomFactor)));
  };

  // Canvas Panning Handlers
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === "svg") {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else if (draggedNodeId && nodeDragOriginRef.current) {
      const dx = (e.clientX - nodeDragOriginRef.current.mouseX) / zoom;
      const dy = (e.clientY - nodeDragOriginRef.current.mouseY) / zoom;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasDraggedRef.current = true;
      }

      const newX = nodeDragOriginRef.current.nodeX + dx;
      const newY = nodeDragOriginRef.current.nodeY + dy;

      setNodeCustomPos((prev) => ({
        ...prev,
        [draggedNodeId]: { x: newX, y: newY },
      }));
    }
  };

  const handleMouseUpCanvas = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
    nodeDragOriginRef.current = null;
  };

  // Node Drag Start
  const handleMouseDownNode = (e: React.MouseEvent, node: BrainNode & { x: number; y: number }) => {
    e.stopPropagation();
    hasDraggedRef.current = false;
    setDraggedNodeId(node.id);
    nodeDragOriginRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      nodeX: node.x,
      nodeY: node.y,
    };
  };

  // Handle Node Click (Jump to Section in Note)
  const handleNodeClick = (node: BrainNode) => {
    if (hasDraggedRef.current) return;

    onClose();

    const rawLabel = node.label.replace(/^\[\[/, "").replace(/\]\]$/, "").trim();
    if (!rawLabel || node.type === "ROOT_NOTE") return;

    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
    const notePath = `/notes/${note.slug}`;

    const scrollToMatch = () => {
      const allElements = Array.from(
        document.querySelectorAll("h1, h2, h3, h4, a, p, li, span, div")
      );
      const match = allElements.find((el) => {
        const text = el.textContent || "";
        return (
          el.getAttribute("data-concept") === rawLabel ||
          el.getAttribute("data-heading") === rawLabel ||
          text.includes(rawLabel)
        );
      });

      if (match) {
        match.scrollIntoView({ behavior: "smooth", block: "center" });
        match.classList.add(
          "ring-4",
          "ring-cyan-400",
          "bg-cyan-500/20",
          "rounded-xl",
          "transition-all",
          "duration-500"
        );
        setTimeout(() => {
          match.classList.remove("ring-4", "ring-cyan-400", "bg-cyan-500/20");
        }, 3500);
      }
    };

    if (currentPath.includes(notePath)) {
      setTimeout(scrollToMatch, 100);
    } else if (note.slug) {
      window.location.href = `${notePath}#${encodeURIComponent(rawLabel)}`;
    }
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setNodeCustomPos({});
  };

  if (!isOpen || !note) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-fadeIn font-sans select-none"
      onClick={onClose}
    >
      {/* Obsidian Desktop Window Modal Container - 100% Centered */}
      <div
        className="w-full max-w-5xl h-[85vh] rounded-2xl border border-[#333336] shadow-2xl bg-[#1e1e20] flex flex-col overflow-hidden text-left relative mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Obsidian Window Title Bar / Tabs */}
        <div className="h-10 bg-[#18181a] border-b border-[#2a2a2d] flex items-center justify-between px-3 text-xs shrink-0 z-20">
          <div className="flex items-center gap-1 overflow-x-auto min-w-0">
            <div className="flex items-center gap-1.5 mr-3 text-gray-500 text-[11px]">
              <span>←</span>
              <span>→</span>
            </div>
            {/* Graph View Tab */}
            <div className="flex items-center gap-2 px-3.5 py-1 bg-[#202023] text-gray-200 border-t-2 border-purple-400 rounded-t-md font-mono text-[11px] shrink-0">
              <svg className="w-3.5 h-3.5 stroke-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Graph view</span>
              <button onClick={onClose} className="hover:text-white ml-1.5 text-gray-400">✕</button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-gray-400">
            <span className="text-gray-400 text-xs font-medium truncate max-w-[350px] hidden md:inline">
              {note.title}
            </span>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-gray-300 font-bold" title="Close Graph View">
              ✕
            </button>
          </div>
        </div>

        {/* Main Canvas Area - Perfectly Centered */}
        <div
          className="flex-1 relative overflow-hidden bg-[#202020] cursor-grab active:cursor-grabbing flex items-center justify-center"
          onWheel={handleWheel}
          onMouseDown={handleMouseDownCanvas}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
        >
          <svg
            viewBox="0 0 1200 800"
            className="w-full h-full select-none"
            style={{ cursor: isPanning ? "grabbing" : "grab" }}
          >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="16"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255, 255, 255, 0.4)" />
            </marker>
          </defs>

          {/* Zoom & Pan Container Group */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Connecting Edges */}
            {edges.map((edge, idx) => {
              const src = nodePosMap.get(edge.source);
              const tgt = nodePosMap.get(edge.target);
              if (!src || !tgt) return null;

              return (
                <line
                  key={`edge_${idx}`}
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke="rgba(255, 255, 255, 0.18)"
                  strokeWidth={1.2}
                  markerEnd="url(#arrow)"
                />
              );
            })}

            {/* Movable Obsidian Graph Nodes */}
            {currentNodes.map((node, idx) => {
              const isRoot = node.type === "ROOT_NOTE";
              const radius = isRoot ? 16 : node.type === "CONCEPT" ? 10 : 8;

              let fillBg = "#cccccc";
              if (isRoot) fillBg = "#ffffff";
              else if (node.type === "CONCEPT") fillBg = "#e2e8f0";
              else if (node.type === "SECTION") fillBg = "#a1a1aa";
              else if (node.type === "TIMESTAMP") fillBg = "#d4d4d8";

              return (
                <g
                  key={`node_${node.id}_${idx}`}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-move group"
                  onMouseDown={(e) => handleMouseDownNode(e, node)}
                  onClick={() => handleNodeClick(node)}
                >
                  {/* Node Dot */}
                  <circle
                    r={radius}
                    fill={fillBg}
                    stroke="rgba(255, 255, 255, 0.5)"
                    strokeWidth={1.5}
                    className="transition-transform duration-75 group-hover:scale-125"
                  />

                  {/* Obsidian Typography Label */}
                  <text
                    x={radius + 8}
                    y={4}
                    fill="#d1d5db"
                    className="text-[12px] font-sans tracking-tight select-none opacity-90 group-hover:opacity-100 group-hover:fill-white font-medium"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Zoom & Pan Controls on Bottom Right */}
        <div className="absolute bottom-6 right-6 z-30 flex items-center gap-1.5 bg-[#18181a]/90 border border-[#333336] p-1.5 rounded-xl shadow-2xl backdrop-blur-md text-xs text-gray-300 font-mono">
          <button
            onClick={() => setZoom((z) => Math.min(4, z * 1.2))}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center font-bold text-base hover:text-white"
            title="Zoom In"
          >
            +
          </button>
          <span className="text-[11px] px-1 text-gray-400">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.max(0.3, z * 0.8))}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center font-bold text-base hover:text-white"
            title="Zoom Out"
          >
            -
          </button>
          <div className="w-[1px] h-4 bg-white/10 mx-1" />
          <button
            onClick={handleResetZoom}
            className="px-2.5 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-[11px] hover:text-white"
            title="Reset View & Node Positions"
          >
            ↺ Reset
          </button>
        </div>

        {/* Top Hint Bar */}
        <div className="absolute top-4 left-4 z-30 bg-[#18181a]/80 border border-[#333336] px-3 py-1.5 rounded-lg backdrop-blur-md text-[11px] text-gray-400 font-mono flex items-center gap-3">
          <span>💡 Scroll to Zoom</span>
          <span>·</span>
          <span>Drag background to Pan</span>
          <span>·</span>
          <span>Drag nodes to Reposition</span>
        </div>
      </div>
    </div>
  </div>
);
}
