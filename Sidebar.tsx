"use client";

import { useDashboard } from "@/lib/context";

type Tab = "week" | "brand" | "quarter" | "astro" | "settings";

interface SidebarProps {
  active: Tab;
  onChange: (t: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: string; sub: string }[] = [
  { id: "week",     icon: "✦",  label: "This Week",   sub: "tasks · habits · focus" },
  { id: "brand",    icon: "👑", label: "Brand HQ",    sub: "content · milestones" },
  { id: "quarter",  icon: "◈",  label: "Quarter",     sub: "goals · finances · wins" },
  { id: "astro",    icon: "🌙", label: "Astrology",   sub: "transits · notes" },
  { id: "settings", icon: "⚙", label: "Settings",    sub: "briefing · profile" },
];

export function Sidebar({ active, onChange }: SidebarProps) {
  const { saving } = useDashboard();

  return (
    <aside
      className="fixed left-0 top-0 h-full w-56 flex flex-col"
      style={{
        background: "linear-gradient(180deg, #110d12 0%, #0d0a0e 100%)",
        borderRight: "1px solid #2e2535",
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div className="px-6 pt-8 pb-6">
        <div className="font-display text-xl font-light tracking-widest" style={{ color: "#c9a96e", letterSpacing: "0.12em" }}>
          DARK
        </div>
        <div className="font-display text-xl font-semibold italic" style={{ color: "#e8dff0", lineHeight: 1 }}>
          Feminine
        </div>
        <div className="font-display text-xs tracking-[0.3em] uppercase mt-0.5" style={{ color: "#6b5f7a" }}>
          Sage
        </div>
        <div className="gold-line mt-4" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="w-full text-left px-3 py-3 rounded-lg transition-all duration-200 group"
            style={{
              background: active === tab.id ? "rgba(201,169,110,0.08)" : "transparent",
              border: active === tab.id ? "1px solid rgba(201,169,110,0.2)" : "1px solid transparent",
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">{tab.icon}</span>
              <div>
                <div
                  className="text-sm font-medium"
                  style={{ color: active === tab.id ? "#c9a96e" : "#9e8fb0" }}
                >
                  {tab.label}
                </div>
                <div className="text-xs" style={{ color: "#4a3f58" }}>
                  {tab.sub}
                </div>
              </div>
            </div>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 pb-6 space-y-2">
        <div className="gold-line mb-3" />
        {saving && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full pulse-gold" style={{ background: "#c9a96e" }} />
            <span className="text-xs" style={{ color: "#6b5f7a" }}>Saving…</span>
          </div>
        )}
        <div className="text-xs font-display italic" style={{ color: "#4a3f58" }}>
          "She is both soft and unstoppable."
        </div>
      </div>
    </aside>
  );
}
