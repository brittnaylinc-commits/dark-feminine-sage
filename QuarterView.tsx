"use client";

import { useState } from "react";
import { useDashboard } from "@/lib/context";
import { getQuarterKey, formatQuarterKey, uid, CATEGORY_COLORS } from "@/lib/utils";
import type { QuarterlyGoal, GoalCategory, FinanceEntry } from "@/types";

const CATEGORIES: GoalCategory[] = ["Brand", "Wellness", "Finances", "Personal", "Spiritual"];

export function QuarterView() {
  const { data, update } = useDashboard();
  const [quarterOffset, setQuarterOffset] = useState(0);
  const [tab, setTab] = useState<"goals" | "finances" | "wins">("goals");
  const [newGoal, setNewGoal] = useState("");
  const [newCategory, setNewCategory] = useState<GoalCategory>("Brand");
  const [newWin, setNewWin] = useState("");
  const [editFinance, setEditFinance] = useState<string | null>(null);

  if (!data) return null;

  // Quarter key with offset
  const base = new Date();
  base.setMonth(base.getMonth() + quarterOffset * 3);
  const quarterKey = getQuarterKey(base);

  const goals = (data.quarterlyGoals ?? []).filter(g => g.quarterKey === quarterKey);
  const achievements = (data.achievements ?? []).filter(a => a.quarterKey === quarterKey);
  const finances = data.finances ?? [];

  const completedGoals = goals.filter(g => g.completed).length;
  const completionRate = goals.length ? Math.round((completedGoals / goals.length) * 100) : 0;

  function addGoal() {
    if (!newGoal.trim()) return;
    update(d => ({
      ...d,
      quarterlyGoals: [...(d.quarterlyGoals ?? []), {
        id: uid(), quarterKey, category: newCategory, text: newGoal.trim(), completed: false,
      }],
    }));
    setNewGoal("");
  }

  function toggleGoal(id: string) {
    update(d => ({
      ...d,
      quarterlyGoals: d.quarterlyGoals.map(g =>
        g.id === id ? { ...g, completed: !g.completed } : g
      ),
    }));
  }

  function deleteGoal(id: string) {
    update(d => ({ ...d, quarterlyGoals: d.quarterlyGoals.filter(g => g.id !== id) }));
  }

  function addWin() {
    if (!newWin.trim()) return;
    update(d => ({
      ...d,
      achievements: [...(d.achievements ?? []), {
        id: uid(), quarterKey, text: newWin.trim(), date: new Date().toISOString().split("T")[0],
      }],
    }));
    setNewWin("");
  }

  function deleteWin(id: string) {
    update(d => ({ ...d, achievements: d.achievements.filter(a => a.id !== id) }));
  }

  function updateFinance(id: string, patch: Partial<FinanceEntry>) {
    update(d => ({
      ...d,
      finances: d.finances.map(f => f.id === id ? { ...f, ...patch } : f),
    }));
  }

  function addFinanceRow() {
    const id = uid();
    update(d => ({
      ...d,
      finances: [...d.finances, { id, label: "New Goal", current: 0, target: 1000, type: "savings", color: "#c9a96e" }],
    }));
    setEditFinance(id);
  }

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-light italic" style={{ color: "#e8dff0" }}>
            {formatQuarterKey(quarterKey)}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6b5f7a" }}>Quarterly goals · Finances · Wins</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost text-xs px-3 py-2" onClick={() => setQuarterOffset(v => v - 1)}>← Prev</button>
          {quarterOffset !== 0 && <button className="btn-ghost text-xs px-3 py-2" onClick={() => setQuarterOffset(0)}>Current</button>}
          <button className="btn-ghost text-xs px-3 py-2" onClick={() => setQuarterOffset(v => v + 1)}>Next →</button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Goals" value={`${completedGoals}/${goals.length}`} sub={`${completionRate}% complete`} color="#c9a96e" />
        <StatCard label="Wins" value={String(achievements.length)} sub="logged this quarter" color="#8e9e7a" />
        <StatCard label="Finances" value={`${finances.filter(f => f.current >= f.target).length}/${finances.length}`} sub="targets hit" color="#9b8ab4" />
      </div>

      {/* Progress bar for goals */}
      {goals.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: "#6b5f7a" }}>Quarter progress</span>
            <span className="text-xs font-medium" style={{ color: "#c9a96e" }}>{completionRate}%</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${completionRate}%`, background: "linear-gradient(90deg, #7c2d3e, #c9a96e)" }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b" style={{ borderColor: "#2e2535" }}>
        {(["goals", "finances", "wins"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium transition-all capitalize ${tab === t ? "tab-active" : "tab-inactive"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Goals Tab */}
      {tab === "goals" && (
        <div className="space-y-5">
          {/* Add goal */}
          <div className="card p-4">
            <div className="flex gap-2">
              <select
                className="input-dark w-36 shrink-0 text-xs"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as GoalCategory)}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                className="input-dark flex-1"
                placeholder="Add a quarterly goal…"
                value={newGoal}
                onChange={e => setNewGoal(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addGoal()}
              />
              <button className="btn-gold px-4" onClick={addGoal}>+</button>
            </div>
          </div>

          {/* Goals by category */}
          {CATEGORIES.map(cat => {
            const catGoals = goals.filter(g => g.category === cat);
            if (!catGoals.length) return null;
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[cat] }} />
                  <span className="text-xs uppercase tracking-widest" style={{ color: CATEGORY_COLORS[cat] }}>{cat}</span>
                  <div className="flex-1" style={{ height: 1, background: `linear-gradient(90deg, ${CATEGORY_COLORS[cat]}44, transparent)` }} />
                </div>
                <div className="space-y-2">
                  {catGoals.map(goal => (
                    <div key={goal.id} className="card p-3 flex items-center gap-3 card-hover group">
                      <input
                        type="checkbox"
                        className="custom-check"
                        checked={goal.completed}
                        onChange={() => toggleGoal(goal.id)}
                      />
                      <span
                        className="flex-1 text-sm"
                        style={{
                          color: goal.completed ? "#4a3f58" : "#e8dff0",
                          textDecoration: goal.completed ? "line-through" : "none",
                        }}
                      >
                        {goal.text}
                      </span>
                      <button
                        className="opacity-0 group-hover:opacity-100 text-xs transition-opacity"
                        style={{ color: "#4a3f58" }}
                        onClick={() => deleteGoal(goal.id)}
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {goals.length === 0 && (
            <div className="card p-10 text-center">
              <p className="text-sm" style={{ color: "#4a3f58" }}>No goals set for this quarter yet. Add your first above.</p>
            </div>
          )}
        </div>
      )}

      {/* Finances Tab */}
      {tab === "finances" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-ghost text-xs" onClick={addFinanceRow}>+ Add Row</button>
          </div>
          {finances.map(f => (
            <FinanceCard
              key={f.id}
              entry={f}
              editing={editFinance === f.id}
              onEdit={() => setEditFinance(editFinance === f.id ? null : f.id)}
              onUpdate={patch => updateFinance(f.id, patch)}
              onDelete={() => update(d => ({ ...d, finances: d.finances.filter(x => x.id !== f.id) }))}
            />
          ))}
          {finances.length === 0 && (
            <div className="card p-10 text-center">
              <p className="text-sm" style={{ color: "#4a3f58" }}>No financial goals tracked yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Wins Tab */}
      {tab === "wins" && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex gap-2">
              <input
                className="input-dark flex-1"
                placeholder="Log a win — big or small ✦"
                value={newWin}
                onChange={e => setNewWin(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addWin()}
              />
              <button className="btn-gold px-4" onClick={addWin}>Log it</button>
            </div>
          </div>

          {achievements.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-sm" style={{ color: "#4a3f58" }}>No wins logged yet — you have them. Write them down.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...achievements].reverse().map(a => (
                <div key={a.id} className="card p-4 flex items-start gap-3 group card-hover">
                  <span style={{ color: "#c9a96e" }}>✦</span>
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: "#e8dff0" }}>{a.text}</p>
                    <p className="text-xs mt-1" style={{ color: "#4a3f58" }}>
                      {new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <button
                    className="opacity-0 group-hover:opacity-100 text-xs transition-opacity"
                    style={{ color: "#4a3f58" }}
                    onClick={() => deleteWin(a.id)}
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-widest mb-1" style={{ color: "#6b5f7a" }}>{label}</div>
      <div className="font-display text-2xl font-light" style={{ color }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: "#4a3f58" }}>{sub}</div>
    </div>
  );
}

function FinanceCard({ entry, editing, onEdit, onUpdate, onDelete }: {
  entry: FinanceEntry;
  editing: boolean;
  onEdit: () => void;
  onUpdate: (patch: Partial<FinanceEntry>) => void;
  onDelete: () => void;
}) {
  const pct = Math.min(100, entry.target > 0 ? Math.round((entry.current / entry.target) * 100) : 0);
  const hit = entry.current >= entry.target;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        {editing ? (
          <input
            className="input-dark text-sm font-medium w-48"
            value={entry.label}
            onChange={e => onUpdate({ label: e.target.value })}
          />
        ) : (
          <span className="font-display text-base" style={{ color: "#e8dff0" }}>{entry.label}</span>
        )}
        <div className="flex items-center gap-3">
          {hit && <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(142,158,122,0.15)", color: "#8e9e7a" }}>✓ Hit</span>}
          <button className="text-xs" style={{ color: "#6b5f7a" }} onClick={onEdit}>{editing ? "done" : "edit"}</button>
          <button className="text-xs" style={{ color: "#4a3f58" }} onClick={onDelete}>✕</button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3">
        {editing ? (
          <>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "#6b5f7a" }}>Current</label>
              <input
                type="number"
                className="input-dark w-28 text-sm"
                value={entry.current}
                onChange={e => onUpdate({ current: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "#6b5f7a" }}>Target</label>
              <input
                type="number"
                className="input-dark w-28 text-sm"
                value={entry.target}
                onChange={e => onUpdate({ target: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "#6b5f7a" }}>Type</label>
              <select className="input-dark w-32 text-sm" value={entry.type} onChange={e => onUpdate({ type: e.target.value as any })}>
                <option value="savings">Savings</option>
                <option value="debt">Debt payoff</option>
                <option value="investment">Investment</option>
              </select>
            </div>
          </>
        ) : (
          <>
            <span className="font-display text-xl" style={{ color: entry.color }}>${entry.current.toLocaleString()}</span>
            <span className="text-sm" style={{ color: "#4a3f58" }}>of</span>
            <span className="text-sm" style={{ color: "#9e8fb0" }}>${entry.target.toLocaleString()}</span>
            <span className="text-xs px-2 py-0.5 rounded capitalize" style={{ background: "rgba(155,138,180,0.1)", color: "#9b8ab4" }}>{entry.type}</span>
          </>
        )}
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: hit ? "#8e9e7a" : entry.color }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs" style={{ color: "#4a3f58" }}>{pct}%</span>
        <span className="text-xs" style={{ color: "#4a3f58" }}>${(entry.target - entry.current).toLocaleString()} remaining</span>
      </div>
    </div>
  );
}
