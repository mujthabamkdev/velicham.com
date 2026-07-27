"use client";

export default function MiniDashboard({
  totalCount = 1209,
}: {
  totalCount?: number;
}) {
  return (
    <div className="my-6 p-6 rounded-2xl bg-[#080812] border-2 border-white/15 space-y-4 font-mono text-xs shadow-xl animate-slide-up">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <span className="font-bold text-white text-sm tracking-wider flex items-center gap-2">
          <span>📊</span> KNOWLEDGE DATA FEED & METRICS
        </span>
        <span className="text-emerald-400 text-[11px] font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          ● REAL-TIME METRICS
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1 */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-gray-400 text-[10px] tracking-wider block">RESULTS</span>
          <span className="text-lg font-bold text-cyan-400 block">{totalCount}</span>
        </div>

        {/* KPI 2 */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-gray-400 text-[10px] tracking-wider block">CAPITAL BURNED</span>
          <span className="text-lg font-bold text-yellow-400 block">$42.5B</span>
        </div>

        {/* KPI 3 */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-gray-400 text-[10px] tracking-wider block">AVG READING TIME</span>
          <span className="text-lg font-bold text-purple-400 block">3.2m</span>
        </div>

        {/* KPI 4 */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-gray-400 text-[10px] tracking-wider block">TOP TOPIC</span>
          <span className="text-sm font-bold text-pink-400 truncate block">AI & LLMs</span>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
            <div className="w-[78%] h-full bg-pink-500 rounded-full" />
          </div>
        </div>

        {/* KPI 5 */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-gray-400 text-[10px] tracking-wider block">CHANNELS</span>
          <span className="text-lg font-bold text-emerald-400 block">142</span>
        </div>

        {/* KPI 6 */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-gray-400 text-[10px] tracking-wider block">BIGGEST INGEST</span>
          <span className="text-sm font-bold text-yellow-300 truncate block">Gemini 2.0 Flash</span>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
            <div className="w-[92%] h-full bg-yellow-400 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
