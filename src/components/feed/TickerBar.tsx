"use client";

export default function TickerBar() {
  const items = [
    { label: "⚡ RECENT INGEST", val: "Quantum AI Breakthroughs" },
    { label: "🔥 CAPITAL BURNED", val: "$42.5 Billion" },
    { label: "💀 TOPIC OF THE DAY", val: "Autonomous Agents & LLMs" },
    { label: "📊 TOTAL NOTES", val: "1,209 Indexed" },
    { label: "🔬 GRAPH NODES", val: "3,480 Linked" },
    { label: "💡 REBUILD PLAN", val: "Open Source AI Search Engine" },
  ];

  return (
    <div className="w-full bg-[#0d091a] border-y border-white/15 py-3 overflow-hidden select-none font-mono text-xs">
      <div className="animate-marquee flex items-center gap-8">
        {[...items, ...items, ...items].map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-[--color-accent-pink] font-bold">{item.label}:</span>
            <span className="text-white font-semibold">{item.val}</span>
            <span className="text-gray-600 ml-4">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}
