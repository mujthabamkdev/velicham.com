"use client";

import Link from "next/link";
import uiData from "@/data/uiData.json";

export default function HeroSection({
  totalNotes = 1209,
}: {
  totalNotes?: number;
}) {
  const heroItems = uiData.heroItems;

  return (
    <section className="relative w-full bg-transparent pt-8 pb-12 px-6 lg:px-8">
      <div className="max-w-5xl mx-auto text-center space-y-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-input text-xs font-mono font-medium tracking-wider text-gray-300 shadow-sm mb-6">
          <span>✨</span> {totalNotes} AI KNOWLEDGE NOTES INDEXED
        </div>

        {/* 4-Tile Feature Grid (4-Column Layout with Gap-6 and P-6 Internal Padding) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 text-left">
          {heroItems.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className={`p-6 glass-card flex flex-col justify-between space-y-4 group ${item.accent}`}
            >
              <div>
                <span className="text-[11px] font-mono tracking-wider font-semibold text-gray-400 group-hover:text-white transition-colors block">
                  {item.title}
                </span>
                <span className="text-xs font-bold text-white uppercase block mt-1.5">
                  {item.sub}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs font-mono font-bold tracking-wider">
                <span>{item.cta}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
