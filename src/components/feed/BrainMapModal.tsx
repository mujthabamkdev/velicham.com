"use client";

import React, { useState, useMemo } from "react";
import { extractBrainNodesAndLinks, BrainNode } from "@/lib/utils";

interface BrainMapModalProps {
  note: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function BrainMapModal({ note, isOpen, onClose }: BrainMapModalProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showArrows, setShowArrows] = useState<boolean>(true);
  const [nodeScale, setNodeScale] = useState<number>(1.2);
  const [linkThickness, setLinkThickness] = useState<number>(1);
  const [textFadeThreshold, setTextFadeThreshold] = useState<number>(50);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Filter Toggles State
  const [toggleTags, setToggleTags] = useState<boolean>(true);
  const [toggleAttachments, setToggleAttachments] = useState<boolean>(false);
  const [toggleExistingOnly, setToggleExistingOnly] = useState<boolean>(true);
  const [toggleOrphans, setToggleOrphans] = useState<boolean>(true);

  // Accordion Sections State
  const [openSection, setOpenSection] = useState<"FILTERS" | "DISPLAY" | "FORCES">("DISPLAY");

  const { nodes, edges } = useMemo(() => {
    if (!note) return { nodes: [], edges: [] };
    return extractBrainNodesAndLinks(note);
  }, [note]);

  // Filter nodes based on search & toggles
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (n.type === "ROOT_NOTE") return true;
      if (!toggleTags && n.type === "CONCEPT") return false;
      if (selectedFilter !== "ALL" && n.type !== selectedFilter) return false;
      if (searchQuery.trim() !== "") {
        return n.label.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [nodes, selectedFilter, searchQuery, toggleTags]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);
  const filteredEdges = useMemo(
    () => edges.filter((e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)),
    [edges, filteredNodeIds]
  );

  // Position nodes organically matching Obsidian force graph focused in the center of full-screen view
  const positionedNodes = useMemo(() => {
    const width = 1200;
    const height = 750;
    const centerX = width / 2;
    const centerY = height / 2;

    const rootNode = filteredNodes.find((n) => n.type === "ROOT_NOTE");
    const otherNodes = filteredNodes.filter((n) => n.type !== "ROOT_NOTE");
    const totalOthers = otherNodes.length;

    const radius = Math.min(width, height) * 0.35;

    const result: Array<BrainNode & { x: number; y: number }> = [];

    if (rootNode) {
      result.push({ ...rootNode, x: centerX, y: centerY });
    }

    otherNodes.forEach((node, idx) => {
      const angle = (2 * Math.PI * idx) / (totalOthers || 1) - Math.PI / 2;
      const r = radius + (idx % 2 === 0 ? 0 : 45) + (isAnimating ? Math.sin(idx + Date.now() * 0.005) * 10 : 0);
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      result.push({ ...node, x, y });
    });

    return result;
  }, [filteredNodes, isAnimating]);

  const nodePosMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    positionedNodes.forEach((n) => map.set(n.id, { x: n.x, y: n.y }));
    return map;
  }, [positionedNodes]);

  const handleNodeClick = (node: BrainNode) => {
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

  const handleAnimate = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 2000);
  };

  if (!isOpen || !note) return null;

  return (
    <div className="fixed inset-0 z-[200] w-screen h-screen bg-[#1e1e20] flex flex-col font-sans overflow-hidden animate-fadeIn">
      {/* Obsidian Window Title Bar / Tabs */}
      <div className="h-10 bg-[#18181a] border-b border-[#2a2a2d] flex items-center justify-between px-3 text-xs select-none shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto min-w-0">
          {/* Left window control icons */}
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

      {/* Main Obsidian Window Body */}
      <div className="flex-1 flex overflow-hidden relative bg-[#202020]">
        {/* Left Vertical Icon Strip */}
        <div className="w-10 bg-[#18181a] border-r border-[#2a2a2d] flex flex-col items-center py-3 gap-4 text-gray-400 text-xs shrink-0 select-none">
          <span className="cursor-pointer hover:text-white" title="Files">📄</span>
          <span className="cursor-pointer hover:text-white" title="Search">🔍</span>
          <span className="cursor-pointer hover:text-white" title="Bookmarks">🔖</span>
          <span className="cursor-pointer text-white bg-white/10 p-1.5 rounded" title="Graph View">🌐</span>
          <span className="cursor-pointer hover:text-white mt-auto" title="Settings">⚙️</span>
        </div>

        {/* Center Full-Width Canvas Graph Area */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[#202020]">
          <svg viewBox="0 0 1200 750" className="w-full h-full select-none">
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

            {/* Connecting Edges */}
            {filteredEdges.map((edge, idx) => {
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
                  stroke="rgba(255, 255, 255, 0.16)"
                  strokeWidth={linkThickness}
                  markerEnd={showArrows ? "url(#arrow)" : undefined}
                />
              );
            })}

            {/* Obsidian Graph Nodes */}
            {positionedNodes.map((node, idx) => {
              const isRoot = node.type === "ROOT_NOTE";
              const baseRadius = isRoot ? 16 : node.type === "CONCEPT" ? 10 : 8;
              const radius = baseRadius * nodeScale;

              let fillBg = "#cccccc";
              if (isRoot) fillBg = "#ffffff";
              else if (node.type === "CONCEPT") fillBg = "#e2e8f0";
              else if (node.type === "SECTION") fillBg = "#a1a1aa";
              else if (node.type === "TIMESTAMP") fillBg = "#d4d4d8";

              return (
                <g
                  key={`node_${node.id}_${idx}`}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer group"
                  onClick={() => handleNodeClick(node)}
                >
                  {/* Node Dot */}
                  <circle
                    r={radius}
                    fill={fillBg}
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeWidth={1}
                    className="transition-all duration-200 group-hover:scale-125"
                  />

                  {/* Obsidian Typography Label */}
                  <text
                    x={radius + 8}
                    y={4}
                    fill="#d1d5db"
                    className="text-[12px] font-sans tracking-tight select-none opacity-85 group-hover:opacity-100 group-hover:fill-white font-medium"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating Expand Controls Button when Sidebar is Collapsed */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="absolute top-4 right-4 z-10 px-3.5 py-2 rounded-lg bg-[#252528] border border-[#3a3a3e] text-gray-300 hover:text-white hover:bg-[#333336] transition-all shadow-2xl flex items-center gap-2 text-xs font-sans font-medium"
              title="Expand Graph Controls"
            >
              <span>⚙️ Filters & Display</span>
              <span className="font-mono text-gray-400">‹</span>
            </button>
          )}
        </div>

        {/* Right Collapsible Control Panel Sidebar ("Filters", "Display", "Forces") */}
        {isSidebarOpen && (
          <div className="w-72 bg-[#252528]/95 border-l border-[#333336] p-4 flex flex-col gap-4 text-xs font-sans overflow-y-auto text-gray-300 shrink-0 transition-all duration-300 relative">
            {/* Sidebar Header with Collapse Button */}
            <div className="flex items-center justify-between border-b border-[#3a3a3e] pb-2 text-gray-200">
              <span className="font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                <span>⚙️ Controls</span>
              </span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="px-2 py-0.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition text-xs font-mono"
                title="Collapse controls sidebar"
              >
                Collapse ›
              </button>
            </div>

            {/* Filters Accordion Section */}
            <div className="border-b border-[#3a3a3e] pb-3">
              <button
                onClick={() => setOpenSection(openSection === "FILTERS" ? "DISPLAY" : "FILTERS")}
                className="w-full flex items-center justify-between font-bold text-gray-200 text-xs mb-2 hover:text-white"
              >
                <span className="flex items-center gap-1.5">
                  <span>{openSection === "FILTERS" ? "∨" : "›"}</span>
                  <span>Filters</span>
                </span>
                <span className="text-[10px] text-gray-500 font-mono">🔍</span>
              </button>

              {openSection === "FILTERS" && (
                <div className="space-y-3 pt-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#18181a] border border-[#3a3a3e] rounded px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Tags</span>
                      <input
                        type="checkbox"
                        checked={toggleTags}
                        onChange={(e) => setToggleTags(e.target.checked)}
                        className="rounded accent-blue-500"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Attachments</span>
                      <input
                        type="checkbox"
                        checked={toggleAttachments}
                        onChange={(e) => setToggleAttachments(e.target.checked)}
                        className="rounded accent-blue-500"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Existing files only</span>
                      <input
                        type="checkbox"
                        checked={toggleExistingOnly}
                        onChange={(e) => setToggleExistingOnly(e.target.checked)}
                        className="rounded accent-blue-500"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Orphans</span>
                      <input
                        type="checkbox"
                        checked={toggleOrphans}
                        onChange={(e) => setToggleOrphans(e.target.checked)}
                        className="rounded accent-blue-500"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Display Accordion Section */}
            <div className="border-b border-[#3a3a3e] pb-3">
              <button
                onClick={() => setOpenSection(openSection === "DISPLAY" ? "FORCES" : "DISPLAY")}
                className="w-full flex items-center justify-between font-bold text-gray-200 text-xs mb-2 hover:text-white"
              >
                <span className="flex items-center gap-1.5">
                  <span>{openSection === "DISPLAY" ? "∨" : "›"}</span>
                  <span>Display</span>
                </span>
              </button>

              {openSection === "DISPLAY" && (
                <div className="space-y-3.5 pt-2">
                  <label className="flex items-center justify-between text-[11px] cursor-pointer">
                    <span>Arrows</span>
                    <input
                      type="checkbox"
                      checked={showArrows}
                      onChange={(e) => setShowArrows(e.target.checked)}
                      className="rounded accent-blue-500"
                    />
                  </label>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>Text fade threshold</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={textFadeThreshold}
                      onChange={(e) => setTextFadeThreshold(Number(e.target.value))}
                      className="w-full accent-blue-500 bg-[#18181a] h-1 rounded"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>Node size</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.1"
                      value={nodeScale}
                      onChange={(e) => setNodeScale(Number(e.target.value))}
                      className="w-full accent-blue-500 bg-[#18181a] h-1 rounded"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>Link thickness</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={linkThickness}
                      onChange={(e) => setLinkThickness(Number(e.target.value))}
                      className="w-full accent-blue-500 bg-[#18181a] h-1 rounded"
                    />
                  </div>

                  <button
                    onClick={handleAnimate}
                    className="w-full py-1.5 rounded bg-[#4b6584] hover:bg-[#385373] text-white font-medium text-xs transition shadow-sm"
                  >
                    Animate
                  </button>
                </div>
              )}
            </div>

            {/* Forces Accordion Section */}
            <div>
              <button
                onClick={() => setOpenSection(openSection === "FORCES" ? "DISPLAY" : "FORCES")}
                className="w-full flex items-center justify-between font-bold text-gray-200 text-xs mb-2 hover:text-white"
              >
                <span className="flex items-center gap-1.5">
                  <span>{openSection === "FORCES" ? "∨" : "›"}</span>
                  <span>Forces</span>
                </span>
              </button>

              {openSection === "FORCES" && (
                <div className="space-y-3 pt-2 text-[11px] text-gray-400">
                  <div className="space-y-1">
                    <span>Center force</span>
                    <input type="range" className="w-full accent-blue-500 bg-[#18181a] h-1 rounded" />
                  </div>
                  <div className="space-y-1">
                    <span>Repel force</span>
                    <input type="range" className="w-full accent-blue-500 bg-[#18181a] h-1 rounded" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
