"use client";

import { useState } from "react";
import { useDashboard } from "@/lib/context";
import { getMonthKey, formatMonthKey } from "@/lib/utils";
import type { MonthlyAstroReading } from "@/types";

export function AstroView() {
  const { data, update } = useDashboard();
  const [monthOffset, setMonthOffset] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [error, setError] = useState("");

  if (!data) return null;

  const base = new Date();
  base.setMonth(base.getMonth() + monthOffset);
  const monthKey = getMonthKey(base);
  const reading = data.astroReadings?.find(r => r.monthKey === monthKey);

  async function generateReading() {
    if (!data?.birthData) {
      setError("Please set your birth data in Settings first.");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/astrology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthData: data.birthData, monthKey }),
      });
      if (!res.ok) throw new Error("Failed");
      const newReading: MonthlyAstroReading = await res.json();
      update(d => ({
        ...d,
        astroReadings: [
          ...(d.astroReadings ?? []).filter(r => r.monthKey !== monthKey),
          newReading,
        ],
      }));
    } catch {
      setError("Reading generation failed. Check your Anthropic API key in settings.");
    } finally {
      setGenerating(false);
    }
  }

  function saveNotes() {
    update(d => ({
      ...d,
      astroReadings: d.astroReadings.map(r =>
        r.monthKey === monthKey ? { ...r, userNotes: notesText } : r
      ),
    }));
    setEditingNotes(false);
  }

  // Format the AI summary with markdown-like rendering
  function renderSummary(text: string) {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("## ") || line.startsWith("**") && line.endsWith("**")) {
        const clean = line.replace(/^#+\s*/, "").replace(/\*\*/g, "");
        return (
          <h3 key={i} className="font-display text-base font-medium mt-4 mb-1" style={{ color: "#c9a96e" }}>
            {clean}
          </h3>
        );
      }
      if (line.startsWith("**") || line.match(/^\d\./)) {
        const clean = line.replace(/\*\*/g, "");
        return (
          <p key={i} className="text-sm font-medium mt-2" style={{ color: "#e8dff0" }}>{clean}</p>
        );
      }
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return (
        <p key={i} className="text-sm leading-relaxed" style={{ color: "#c8bdd8" }}>{line}</p>
      );
    });
  }

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-light italic" style={{ color: "#e8dff0" }}>
            Astrology
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6b5f7a" }}>
            {formatMonthKey(monthKey)} · AI-generated transit reading
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost text-xs px-3 py-2" onClick={() => setMonthOffset(v => v - 1)}>← Prev</button>
          {monthOffset !== 0 && <button className="btn-ghost text-xs px-3 py-2" onClick={() => setMonthOffset(0)}>Current</button>}
          <button className="btn-ghost text-xs px-3 py-2" onClick={() => setMonthOffset(v => v + 1)}>Next →</button>
        </div>
      </div>

      {/* Chart identity card */}
      <div className="card p-4" style={{ border: "1px solid rgba(155,138,180,0.2)", background: "rgba(155,138,180,0.04)" }}>
        <div className="flex items-center gap-4 flex-wrap">
          <ChartPill label="☀ Sun" value="Capricorn" color="#c9a96e" />
          <ChartPill label="☽ Moon" value="Aries" color="#b87c8a" />
          <ChartPill label="↑ Rising" value="Leo" color="#e0c992" />
          <ChartPill label="HD" value="Projector · 1/3" color="#9b8ab4" />
          <div className="text-xs ml-auto" style={{ color: "#4a3f58" }}>
            Capricorn stellium · Splenic authority
          </div>
        </div>
      </div>

      {/* Main reading area */}
      {!reading ? (
        <div className="card p-10 text-center space-y-4">
          <div className="font-display text-5xl" style={{ color: "#2e2535" }}>🌙</div>
          <p className="font-display text-xl italic" style={{ color: "#9e8fb0" }}>
            No reading yet for {formatMonthKey(monthKey)}
          </p>
          <p className="text-sm" style={{ color: "#4a3f58" }}>
            Generate a personalized AI transit reading based on your natal chart.
          </p>
          {error && <p className="text-sm" style={{ color: "#b87c8a" }}>{error}</p>}
          <button
            className="btn-gold mx-auto"
            onClick={generateReading}
            disabled={generating}
            style={{ opacity: generating ? 0.6 : 1 }}
          >
            {generating ? "Consulting the stars…" : "✦ Generate Reading"}
          </button>
          {!data.birthData?.date && (
            <p className="text-xs" style={{ color: "#b87c8a" }}>
              ⚠ Set your birth data in Settings for a personalized reading
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Reading */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-medium" style={{ color: "#9b8ab4" }}>
                  {formatMonthKey(monthKey)} Reading
                </h2>
                <div className="flex gap-2">
                  <button
                    className="btn-ghost text-xs"
                    onClick={generateReading}
                    disabled={generating}
                  >
                    {generating ? "Generating…" : "↺ Regenerate"}
                  </button>
                </div>
              </div>
              <div className="space-y-0.5">
                {renderSummary(reading.aiSummary)}
              </div>
              <div className="mt-4 pt-4 text-xs" style={{ borderTop: "1px solid #2e2535", color: "#4a3f58" }}>
                Generated {new Date(reading.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>

            {/* Personal notes */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-base font-medium" style={{ color: "#c9a96e" }}>Your Notes</h3>
                <button
                  className="text-xs"
                  style={{ color: "#6b5f7a" }}
                  onClick={() => {
                    setNotesText(reading.userNotes ?? "");
                    setEditingNotes(!editingNotes);
                  }}
                >
                  {editingNotes ? "cancel" : "edit"}
                </button>
              </div>

              {editingNotes ? (
                <div className="space-y-2">
                  <textarea
                    className="input-dark"
                    rows={6}
                    placeholder="Your personal reflections, intentions, things you're noticing…"
                    value={notesText}
                    onChange={e => setNotesText(e.target.value)}
                  />
                  <button className="btn-gold w-full text-xs" onClick={saveNotes}>Save Notes</button>
                </div>
              ) : reading.userNotes ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#c8bdd8" }}>
                  {reading.userNotes}
                </p>
              ) : (
                <p className="text-sm" style={{ color: "#4a3f58" }}>
                  Add your own reflections, intentions, and observations for this month.
                </p>
              )}
            </div>
          </div>

          {/* Right: key dates */}
          <div className="space-y-4">
            {reading.keyDates && reading.keyDates.length > 0 && (
              <div className="card p-5">
                <h3 className="font-display text-base font-medium mb-4" style={{ color: "#c9a96e" }}>
                  Power Dates
                </h3>
                <div className="space-y-3">
                  {reading.keyDates.map((kd, i) => {
                    const d = new Date(kd.date + "T12:00:00");
                    const isToday = kd.date === todayStr;
                    const isPast = kd.date < todayStr;
                    return (
                      <div
                        key={i}
                        className="flex gap-3 p-3 rounded-lg"
                        style={{
                          background: isToday ? "rgba(201,169,110,0.08)" : "rgba(33,27,39,0.5)",
                          border: `1px solid ${isToday ? "rgba(201,169,110,0.2)" : "#2e2535"}`,
                          opacity: isPast && !isToday ? 0.5 : 1,
                        }}
                      >
                        <div className="text-center shrink-0 w-10">
                          <div className="text-xs" style={{ color: "#6b5f7a" }}>
                            {d.toLocaleDateString("en-US", { month: "short" })}
                          </div>
                          <div className="font-display text-lg font-light" style={{ color: isToday ? "#c9a96e" : "#9e8fb0" }}>
                            {d.getDate()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium" style={{ color: isToday ? "#c9a96e" : "#e8dff0" }}>
                            {kd.event}
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: "#6b5f7a" }}>{kd.energy}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Jupiter countdown */}
            <JupiterCountdown />
          </div>
        </div>
      )}
    </div>
  );
}

function ChartPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs" style={{ color: "#6b5f7a" }}>{label}</span>
      <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}>
        {value}
      </span>
    </div>
  );
}

function JupiterCountdown() {
  const target = new Date("2026-07-25");
  const now = new Date();
  const days = Math.ceil((target.getTime() - now.getTime()) / 86400000);
  const isPast = days < 0;

  return (
    <div className="card p-5" style={{ border: "1px solid rgba(224,201,146,0.2)", background: "rgba(224,201,146,0.04)" }}>
      <div className="text-2xl mb-2">♃</div>
      <div className="font-display text-base font-medium" style={{ color: "#e0c992" }}>Jupiter enters Leo</div>
      <div className="text-xs mt-0.5 mb-3" style={{ color: "#6b5f7a" }}>July 25, 2026 · Your emergence</div>
      <div
        className="font-display text-3xl font-light"
        style={{ color: isPast ? "#8e9e7a" : "#e0c992" }}
      >
        {isPast ? "Live ✦" : `${days}d`}
      </div>
      <div className="text-xs mt-1" style={{ color: "#4a3f58" }}>
        {isPast ? "The window is open" : "until your window opens"}
      </div>
    </div>
  );
}
