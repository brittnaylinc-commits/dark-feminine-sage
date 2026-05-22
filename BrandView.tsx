"use client";

import { useState } from "react";
import { useDashboard } from "@/lib/context";
import { uid, STATUS_COLORS, PLATFORM_ICONS } from "@/lib/utils";
import type { ContentItem, BrandMilestone } from "@/types";

const PLATFORMS = ["Instagram", "TikTok", "YouTube", "Substack", "Podcast", "Other"] as const;
const STATUSES = ["idea", "drafting", "filming", "editing", "scheduled", "published"] as const;

export function BrandView() {
  const { data, update } = useDashboard();
  const [tab, setTab] = useState<"content" | "milestones">("content");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Partial<ContentItem>>({ platform: "Instagram", status: "idea" });

  if (!data) return null;

  const items = data.contentItems ?? [];
  const milestones = data.brandMilestones ?? [];

  function addContent() {
    if (!form.title?.trim()) return;
    update(d => ({
      ...d,
      contentItems: [...(d.contentItems ?? []), {
        id: uid(), title: form.title!, platform: form.platform ?? "Instagram",
        status: form.status ?? "idea", dueDate: form.dueDate, notes: form.notes,
      }],
    }));
    setForm({ platform: "Instagram", status: "idea" });
    setShowAdd(false);
  }

  function updateItem(id: string, patch: Partial<ContentItem>) {
    update(d => ({
      ...d,
      contentItems: d.contentItems.map(c => c.id === id ? { ...c, ...patch } : c),
    }));
  }

  function deleteItem(id: string) {
    update(d => ({ ...d, contentItems: d.contentItems.filter(c => c.id !== id) }));
  }

  function toggleMilestone(id: string) {
    update(d => ({
      ...d,
      brandMilestones: d.brandMilestones.map(m =>
        m.id === id ? { ...m, completed: !m.completed } : m
      ),
    }));
  }

  // Group content by status
  const pipeline: Record<string, ContentItem[]> = {
    idea: [], drafting: [], filming: [], editing: [], scheduled: [], published: [],
  };
  items.forEach(item => { pipeline[item.status]?.push(item); });

  const completedMilestones = milestones.filter(m => m.completed).length;

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-light italic" style={{ color: "#e8dff0" }}>Brand HQ</h1>
          <p className="text-sm mt-1" style={{ color: "#6b5f7a" }}>Content pipeline · Launch milestones</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="text-right mr-2">
            <div className="text-xs" style={{ color: "#6b5f7a" }}>Milestones</div>
            <div className="font-display text-lg" style={{ color: "#c9a96e" }}>{completedMilestones}/{milestones.length}</div>
          </div>
          <button className="btn-gold" onClick={() => setShowAdd(!showAdd)}>+ Content</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b" style={{ borderColor: "#2e2535" }}>
        {(["content", "milestones"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium transition-all capitalize ${tab === t ? "tab-active" : "tab-inactive"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showAdd && tab === "content" && (
        <div className="card p-5 fade-up">
          <h3 className="font-display text-base font-medium mb-4" style={{ color: "#c9a96e" }}>New Content Piece</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <input className="input-dark" placeholder="Title / concept…" value={form.title ?? ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "#6b5f7a" }}>Platform</label>
              <select className="input-dark" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value as any }))}>
                {PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_ICONS[p]} {p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "#6b5f7a" }}>Status</label>
              <select className="input-dark" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "#6b5f7a" }}>Due date (optional)</label>
              <input type="date" className="input-dark" value={form.dueDate ?? ""} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "#6b5f7a" }}>Notes</label>
              <input className="input-dark" placeholder="Hook, angle, notes…" value={form.notes ?? ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn-gold flex-1" onClick={addContent}>Add to Pipeline</button>
            <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Content Pipeline */}
      {tab === "content" && (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {STATUSES.map(s => {
              const count = pipeline[s].length;
              const sc = STATUS_COLORS[s];
              return (
                <div key={s} className="card p-3 text-center">
                  <div className="text-xl font-display font-light" style={{ color: sc.text }}>{count}</div>
                  <div className="text-xs capitalize mt-0.5" style={{ color: "#6b5f7a" }}>{s}</div>
                </div>
              );
            })}
          </div>

          {/* Kanban-style list grouped by status */}
          {STATUSES.filter(s => pipeline[s].length > 0).map(s => (
            <div key={s}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase tracking-widest" style={{ color: "#6b5f7a" }}>{s}</span>
                <div className="flex-1 gold-line" />
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: STATUS_COLORS[s].bg, color: STATUS_COLORS[s].text }}>
                  {pipeline[s].length}
                </span>
              </div>
              <div className="space-y-2">
                {pipeline[s].map(item => (
                  <ContentCard key={item.id} item={item} onUpdate={updateItem} onDelete={deleteItem} />
                ))}
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="card p-10 text-center">
              <div className="font-display text-4xl mb-3" style={{ color: "#2e2535" }}>✦</div>
              <p className="text-sm" style={{ color: "#4a3f58" }}>Your content pipeline is empty. Add your first piece above.</p>
            </div>
          )}
        </div>
      )}

      {/* Milestones */}
      {tab === "milestones" && (
        <div className="space-y-4">
          {/* Jupiter callout */}
          <div className="card p-4" style={{ border: "1px solid rgba(201,169,110,0.3)", background: "rgba(201,169,110,0.05)" }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">♃</span>
              <div>
                <div className="text-sm font-medium" style={{ color: "#c9a96e" }}>Jupiter enters Leo · July 25, 2026</div>
                <div className="text-xs" style={{ color: "#9e8fb0" }}>Your major emergence window — 12 years of Leo-rising visibility begins. Build toward this.</div>
              </div>
            </div>
          </div>

          {/* Milestone cards */}
          <div className="space-y-3">
            {milestones.map((m, i) => (
              <MilestoneCard key={m.id} milestone={m} index={i} onToggle={toggleMilestone} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ContentCard({ item, onUpdate, onDelete }: {
  item: ContentItem;
  onUpdate: (id: string, patch: Partial<ContentItem>) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const sc = STATUS_COLORS[item.status];

  return (
    <div className="card p-4 card-hover">
      <div className="flex items-start gap-3">
        <span className="text-lg mt-0.5">{PLATFORM_ICONS[item.platform]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium" style={{ color: "#e8dff0" }}>{item.title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.text }}>{item.status}</span>
            {item.dueDate && (
              <span className="text-xs" style={{ color: "#6b5f7a" }}>
                due {new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
          {item.notes && !expanded && (
            <p className="text-xs mt-1 truncate" style={{ color: "#6b5f7a" }}>{item.notes}</p>
          )}
          {expanded && (
            <div className="mt-3 space-y-2">
              <div>
                <label className="text-xs mb-1 block" style={{ color: "#6b5f7a" }}>Move to</label>
                <select
                  className="input-dark text-xs"
                  value={item.status}
                  onChange={e => onUpdate(item.id, { status: e.target.value as any })}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {item.notes && <p className="text-xs" style={{ color: "#9e8fb0" }}>{item.notes}</p>}
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="text-xs" style={{ color: "#4a3f58" }} onClick={() => setExpanded(!expanded)}>
            {expanded ? "↑" : "↓"}
          </button>
          <button className="text-xs" style={{ color: "#4a3f58" }} onClick={() => onDelete(item.id)}>✕</button>
        </div>
      </div>
    </div>
  );
}

function MilestoneCard({ milestone, index, onToggle }: {
  milestone: BrandMilestone;
  index: number;
  onToggle: (id: string) => void;
}) {
  const targetDate = new Date(milestone.targetDate);
  const isPast = targetDate < new Date();
  const daysAway = Math.ceil((targetDate.getTime() - Date.now()) / 86400000);

  return (
    <div
      className="card p-5 transition-all duration-300"
      style={{
        border: milestone.completed
          ? "1px solid rgba(142,158,122,0.3)"
          : "1px solid #2e2535",
        background: milestone.completed
          ? "rgba(142,158,122,0.05)"
          : "#211b27",
        opacity: milestone.completed ? 0.8 : 1,
      }}
    >
      <div className="flex items-start gap-4">
        {/* Phase indicator */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-display font-medium"
          style={{
            background: milestone.completed ? "rgba(142,158,122,0.2)" : "rgba(201,169,110,0.1)",
            color: milestone.completed ? "#8e9e7a" : "#c9a96e",
            border: `1px solid ${milestone.completed ? "rgba(142,158,122,0.3)" : "rgba(201,169,110,0.2)"}`,
            fontSize: "13px",
          }}
        >
          {milestone.completed ? "✓" : milestone.phase}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-display text-base"
              style={{
                color: milestone.completed ? "#8e9e7a" : "#e8dff0",
                textDecoration: milestone.completed ? "line-through" : "none",
              }}
            >
              {milestone.title}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                background: milestone.completed
                  ? "rgba(142,158,122,0.15)"
                  : isPast ? "rgba(184,124,138,0.15)" : "rgba(201,169,110,0.1)",
                color: milestone.completed ? "#8e9e7a" : isPast ? "#b87c8a" : "#c9a96e",
              }}
            >
              {milestone.completed ? "Complete" : isPast ? "Overdue" : `${daysAway}d away`}
            </span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: "#6b5f7a" }}>
            {targetDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
          {milestone.notes && (
            <p className="text-xs mt-2" style={{ color: "#9e8fb0" }}>{milestone.notes}</p>
          )}
        </div>
        <button
          className="btn-ghost text-xs shrink-0"
          onClick={() => onToggle(milestone.id)}
        >
          {milestone.completed ? "Undo" : "Complete"}
        </button>
      </div>
    </div>
  );
}
