"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import uiData from "@/data/uiData.json";

const IconMap = {
  home: (
    <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  explore: (
    <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  ),
  admin: (
    <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  )
};

export default function LeftSidebar() {
  const pathname = usePathname();

  const navItems = uiData.navItems.map(item => ({
    ...item,
    icon: IconMap[item.icon as keyof typeof IconMap]
  }));

  return (
    <aside className="w-16 md:w-20 lg:w-64 flex-col justify-between sticky top-20 hidden md:flex py-4 px-2 lg:px-4 border-r border-white/10 shrink-0 self-start">
      <div className="space-y-6">
        {/* Navigation Items */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 px-3 lg:px-4 py-3.5 rounded-full text-base font-semibold transition-colors justify-center lg:justify-start ${
                  isActive
                    ? "text-white font-bold bg-white/10"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
                title={item.name}
              >
                {item.icon}
                <span className="hidden lg:inline">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile Pill */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center justify-between p-2 lg:p-3 rounded-full hover:bg-white/5 cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <Avatar
              label="V"
              shape="circle"
              className="bg-gradient-to-tr from-[--color-accent-purple] to-[--color-accent-cyan] text-white font-bold shadow text-sm shrink-0 w-10 h-10"
            />
            <div className="min-w-0 hidden lg:block">
              <div className="text-sm font-bold text-white truncate">Velicham Explorer</div>
              <div className="text-xs text-gray-400 font-mono truncate">@velicham</div>
            </div>
          </div>
          <span className="text-gray-400 font-bold text-base px-2 hidden lg:inline">···</span>
        </div>
      </div>
    </aside>
  );
}
