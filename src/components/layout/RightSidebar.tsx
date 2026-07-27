"use client";

import Link from "next/link";
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Avatar } from 'primereact/avatar';

export default function RightSidebar({
  topics = [],
  channels = [],
}: {
  topics?: any[];
  channels?: any[];
}) {
  return (
    <aside className="w-72 lg:w-80 flex-col sticky top-20 hidden lg:flex py-4 px-4 border-l border-white/10 shrink-0 space-y-5 self-start">
      {/* Search Widget */}
      <span className="p-input-icon-left w-full">
        <i className="pi pi-search text-gray-400" style={{ left: '1rem', marginTop: '-0.5rem' }} />
        <InputText
          placeholder="Search Knowledge Base..."
          className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-10 pr-4 text-xs text-white placeholder-gray-400 focus:border-[--color-accent-cyan] hover:border-white/20 transition-colors"
        />
      </span>


      {/* Featured Channels Widget */}
      <Card
        className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-2"
        pt={{ title: { className: 'text-base font-bold text-white pb-3' }, body: { className: 'p-3' }, content: { className: 'p-0 space-y-3.5' } }}
        title="Who to follow"
      >
        {channels && channels.length > 0 ? (
          channels.slice(0, 3).map((channel) => (
            <div key={channel.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  label={channel.name?.charAt(0).toUpperCase()}
                  className="bg-gradient-to-tr from-[--color-accent-purple] to-[--color-accent-pink] text-white font-bold"
                  shape="circle"
                />
                <div className="min-w-0">
                  <Link
                    href={`/channels/${channel.id}`}
                    className="text-xs font-bold text-white hover:underline truncate block"
                  >
                    {channel.name}
                  </Link>
                  <span className="text-[11px] text-gray-400 font-mono truncate block">
                    @{channel.name?.toLowerCase().replace(/\s+/g, "")}
                  </span>
                </div>
              </div>
              <Link href={`/channels/${channel.id}`}>
                <Button
                  label="Follow"
                  className="bg-white text-[#000000] font-bold text-xs px-4 py-1.5 rounded-full border-none hover:bg-gray-200"
                  size="small"
                />
              </Link>
            </div>
          ))
        ) : (
          <div className="text-xs text-gray-400 italic">No channels added yet.</div>
        )}
      </Card>

      {/* Trending Topics Widget */}
      <Card
        className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-2"
        pt={{ title: { className: 'text-base font-bold text-white pb-2' }, body: { className: 'p-3' }, content: { className: 'p-0 space-y-3' } }}
        title="Trending Topics"
      >
        {topics && topics.length > 0 ? (
          topics.slice(0, 4).map((topic, i) => (
            <Link
              key={topic.id}
              href={`/topics/${topic.slug}`}
              className="block hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors group"
            >
              <div className="text-[11px] text-gray-400 font-mono mb-0.5">
                {i + 1} · Trending in AI Knowledge
              </div>
              <div className="text-xs font-bold text-white group-hover:text-[--color-accent-cyan] transition-colors">
                #{topic.title}
              </div>
              <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                {topic.notes?.length || 1} note{topic.notes?.length === 1 ? "" : "s"}
              </div>
            </Link>
          ))
        ) : (
          <div className="text-xs text-gray-400 italic">No topics available yet.</div>
        )}
      </Card>
    </aside>
  );
}
