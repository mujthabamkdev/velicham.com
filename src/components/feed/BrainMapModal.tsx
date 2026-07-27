"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { extractBrainNodesAndLinks, BrainNode, BrainEdge } from "@/lib/utils";

interface BrainMapModalProps {
  note: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function BrainMapModal({ note, isOpen, onClose }: BrainMapModalProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  const { nodes, edges } = useMemo(() => {
    if (!note) return { nodes: [], edges: [] };
    return extractBrainNodesAndLinks(note);
  }, [note]);

  // Filter nodes based on selected type pill
  const filteredNodes = useMemo(() => {
    if (selectedFilter === "ALL") return nodes;
    if (selectedFilter === "CONCEPT") return nodes.filter((n) => n.type === "CONCEPT" || n.type === "ROOT_NOTE");
    if (selectedFilter === "SECTION") return nodes.filter((n) => n.type === "SECTION" || n.type === "ROOT_NOTE");
    if (selectedFilter === "TIMESTAMP") return nodes.filter((n) => n.type === "TIMESTAMP" || n.type === "ROOT_NOTE");
    if (selectedFilter === "LINKED_NOTE") return nodes.filter((n) => n.type === "LINKED_NOTE" || n.type === "ROOT_NOTE");
    return nodes;
  }, [nodes, selectedFilter]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);
  const filteredEdges = useMemo(
    () => edges.filter((e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)),
    [edges, filteredNodeIds]
  );

  // Position nodes radially around the center root note
  const positionedNodes = useMemo(() => {
    const width = 800;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;

    const rootNode = filteredNodes.find((n) => n.type === "ROOT_NOTE");
    const otherNodes = filteredNodes.filter((n) => n.type !== "ROOT_NOTE");
    const totalOthers = otherNodes.length;

    const radius = Math.min(width, height) * 0.36;

    const result: Array<BrainNode & { x: number; y: number }> = [];

    if (rootNode) {
      result.push({ ...rootNode, x: centerX, y: centerY });
    }

    otherNodes.forEach((node, idx) => {
      const angle = (2 * Math.PI * idx) / (totalOthers || 1) - Math.PI / 2;
      // Stagger radius slightly for dense node groups
      const r = radius + (idx % 2 === 0 ? 0 : 35);
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      result.push({ ...node, x, y });
    });

    return result;
  }, [filteredNodes]);

  const nodePosMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    positionedNodes.forEach((n) => map.set(n.id, { x: n.x, y: n.y }));
    return map;
  }, [positionedNodes]);

  if (!isOpen || !note) return null;

  const rootNode = positionedNodes.find((n) => n.type === "ROOT_NOTE");

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl glass-card rounded-3xl border border-white/20 shadow-2xl bg-[#070514]/95 flex flex-col max-h-[92vh] overflow-hidden text-left relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between gap-4 bg-white/5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-cyan-500 to-emerald-400 flex items-center justify-center text-xl shadow-lg shrink-0">
              🧠
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2 truncate">
                Obsidian Brain Knowledge Graph
              </h2>
              <p className="text-xs text-gray-400 truncate">
                Section mapping, wikilink concepts (`[[Concept]]`), & connected notes for &ldquo;{note.title}&rdquo;
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition shrink-0"
            title="Close Brain Map"
          >
            ✕
          </button>
        </div>

        {/* Filter Pills Bar */}
        <div className="px-5 py-3 border-b border-white/10 bg-black/40 flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <span className="text-gray-400 uppercase tracking-wider text-[10px] mr-1 shrink-0">
            Filter View:
          </span>
          {[
            { id: "ALL", label: `All Nodes (${nodes.length})` },
            { id: "CONCEPT", label: `🧠 Wikilinks (${nodes.filter((n) => n.type === "CONCEPT").length})` },
            { id: "SECTION", label: `📌 Sections (${nodes.filter((n) => n.type === "SECTION").length})` },
            { id: "TIMESTAMP", label: `⏱️ Timestamps (${nodes.filter((n) => n.type === "TIMESTAMP").length})` },
            { id: "LINKED_NOTE", label: `🔗 Connected Notes (${nodes.filter((n) => n.type === "LINKED_NOTE").length})` },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setSelectedFilter(pill.id)}
              className={`px-3 py-1 rounded-full border transition whitespace-nowrap ${
                selectedFilter === pill.id
                  ? "bg-white text-black font-bold border-white shadow-md"
                  : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Brain Graph Interactive Area */}
        <div className="relative flex-1 bg-gradient-to-b from-[#0a071d] to-[#04020a] p-4 flex items-center justify-center overflow-auto min-h-[420px]">
          <svg viewBox="0 0 800 500" className="w-full h-full max-h-[480px] overflow-visible select-none">
            {/* Background Grid Accent Lines */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
              </pattern>
              <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
              </linearGradient>
              <filter id="glowPurple" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Connecting Edges */}
            {filteredEdges.map((edge, idx) => {
              const src = nodePosMap.get(edge.source);
              const tgt = nodePosMap.get(edge.target);
              if (!src || !tgt) return null;

              const isHighlighted =
                activeNodeId === edge.source || activeNodeId === edge.target || activeNodeId === null;

              return (
                <g key={`edge_${idx}`}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={isHighlighted ? "url(#edgeGrad)" : "rgba(255, 255, 255, 0.08)"}
                    strokeWidth={isHighlighted ? 2 : 1}
                    strokeDasharray={edge.label === "timestamp" ? "4 4" : undefined}
                    className="transition-all duration-300"
                  />
                  {/* Pulse dot along line */}
                  {isHighlighted && (
                    <circle r="2.5" fill="#06b6d4" className="animate-ping opacity-75">
                      <animateMotion
                        path={`M ${src.x} ${src.y} L ${tgt.x} ${tgt.y}`}
                        dur={`${3 + (idx % 3)}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {positionedNodes.map((node) => {
              const isRoot = node.type === "ROOT_NOTE";
              const isSelected = activeNodeId === node.id;

              let nodeRadius = 14;
              let fillBg = node.color || "#06b6d4";

              if (isRoot) {
                nodeRadius = 24;
                fillBg = "#a855f7";
              } else if (node.type === "CONCEPT") {
                nodeRadius = 16;
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer group"
                  onClick={() => setActiveNodeId(isSelected ? null : node.id)}
                >
                  {/* Outer Glow Circle */}
                  <circle
                    r={nodeRadius + (isSelected ? 8 : 4)}
                    fill={fillBg}
                    opacity={isSelected ? 0.4 : isRoot ? 0.25 : 0.15}
                    className="transition-all duration-300 group-hover:scale-125"
                  />

                  {/* Main Node Circle */}
                  <circle
                    r={nodeRadius}
                    fill={fillBg}
                    stroke="#ffffff"
                    strokeWidth={isRoot ? 3 : 1.5}
                    filter={isRoot ? "url(#glowPurple)" : undefined}
                    className="transition-all duration-300 group-hover:r-6"
                  />

                  {/* Node Label Text */}
                  <text
                    y={nodeRadius + 14}
                    textAnchor="middle"
                    fill="#ffffff"
                    className={`text-[10px] font-mono tracking-tight select-none transition-all ${
                      isRoot ? "font-bold text-[12px] fill-purple-200" : "opacity-90 group-hover:opacity-100"
                    }`}
                  >
                    {node.label.length > 24 ? `${node.label.slice(0, 22)}...` : node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Footer Details Bar */}
        <div className="p-4 border-t border-white/10 bg-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-gray-300 font-mono text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
              <span>Root Note</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>[[Wikilinks]]</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" />
              <span>Sections</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
              <span>Timestamps</span>
            </div>
          </div>

          {note.slug && (
            <Link
              href={`/notes/${note.slug}`}
              onClick={onClose}
              style={{ color: "#000000" }}
              className="px-4 py-1.5 rounded-full bg-white !text-black font-bold text-xs hover:bg-gray-200 transition shadow cursor-pointer"
            >
              Open Full Note →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
