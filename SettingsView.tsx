"use client";

import { useState } from "react";
import { useDashboard } from "@/lib/context";
import type { BirthData } from "@/types";

export function SettingsView() {
  const { data, update } = useDashboard();
  const [saved, setSaved] = useState(false);
  const [birthForm, setBirthForm] = useState<BirthData>(
    data?.birthData ?? { date: "1993-01-07", time: "00:00", location: "Chicago, IL" }
  );
  const [testingBriefing, setTestingBriefing] = useState(false);
  const [briefingResult, setBriefingResult] = useState("");

  if (!data) return null;

  function saveBirthData() {
    update(d => ({ ...d, birthData: birthForm }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function testBriefing() {
    setTestingBriefing(true);
    setBriefingResult("");
    try {
      const res = await fetch("/api/briefing", {
        headers: { "x-cron-secret": "" }, // dev mode — no secret needed in preview
      });
      const data = await res.json();
      if (data.message) {
        setBriefingResult(data.message);
      } else {
        setBriefingResult("Error: " + (data.error ?? "Unknown"));
      }
    } catch {
      setBriefingResult("Failed to reach briefing API.");
    } finally {
      setTestingBriefing(false);
    }
  }

  function connectGoogle() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      alert("Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables first.");
      return;
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${window.location.origin}/api/auth/google/callback`,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      access_type: "offline",
      prompt: "consent",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  return (
    <div className="space-y-6 fade-up max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-light italic" style={{ color: "#e8dff0" }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: "#6b5f7a" }}>Personalize your dashboard</p>
      </div>

      {/* Birth Data */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-medium mb-1" style={{ color: "#c9a96e" }}>Birth Data</h2>
        <p className="text-xs mb-4" style={{ color: "#6b5f7a" }}>
          Used for AI astrology readings. Already pre-set based on your chart.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: "#6b5f7a" }}>Birth Date</label>
            <input
              type="date"
              className="input-dark"
              value={birthForm.date}
              onChange={e => setBirthForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "#6b5f7a" }}>Birth Time</label>
            <input
              type="time"
              className="input-dark"
              value={birthForm.time}
              onChange={e => setBirthForm(f => ({ ...f, time: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "#6b5f7a" }}>Birth Location</label>
            <input
              className="input-dark"
              placeholder="City, State"
              value={birthForm.location}
              onChange={e => setBirthForm(f => ({ ...f, location: e.target.value }))}
            />
          </div>
        </div>
        <button className="btn-gold mt-4" onClick={saveBirthData}>
          {saved ? "✓ Saved" : "Save Birth Data"}
        </button>
      </div>

      {/* Morning Briefing */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-medium mb-1" style={{ color: "#c9a96e" }}>Morning Briefing</h2>
        <p className="text-xs mb-4" style={{ color: "#6b5f7a" }}>
          Delivered via Cowork → iMessage at 6:00 AM daily. Includes: intention, calendar, tasks, habits, astro note.
        </p>

        <div className="space-y-4">
          {/* Cowork setup steps */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium" style={{ color: "#e8dff0" }}>Setup with Cowork (Mac + iPhone)</h3>
            <ol className="space-y-2">
              {[
                "Download Cowork from coworkapp.ai",
                "In Cowork, create a new automation → Scheduled → Daily → 6:00 AM",
                `Set Action: HTTP Request → GET → ${typeof window !== "undefined" ? window.location.origin : "https://your-app.vercel.app"}/api/briefing`,
                "Add header: x-cron-secret → [your CRON_SECRET from .env]",
                "Add follow-up action: Send iMessage → paste response body → to your number",
                "To check off tasks by text: add a second automation triggered by incoming iMessage reply starting with 'done'",
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-xs" style={{ color: "#9e8fb0" }}>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-medium"
                    style={{ background: "rgba(201,169,110,0.1)", color: "#c9a96e" }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="gold-line" />

          {/* Test briefing */}
          <div>
            <button
              className="btn-ghost text-xs"
              onClick={testBriefing}
              disabled={testingBriefing}
            >
              {testingBriefing ? "Generating preview…" : "Preview today's briefing"}
            </button>
          </div>

          {briefingResult && (
            <div className="p-4 rounded-lg" style={{ background: "#1a1520", border: "1px solid #2e2535" }}>
              <p className="text-xs font-medium mb-2" style={{ color: "#c9a96e" }}>Preview:</p>
              <pre className="text-xs whitespace-pre-wrap" style={{ color: "#e8dff0", fontFamily: "inherit" }}>
                {briefingResult}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Google Calendar */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-medium mb-1" style={{ color: "#c9a96e" }}>Google Calendar</h2>
        <p className="text-xs mb-4" style={{ color: "#6b5f7a" }}>
          Connect to include today's events in your morning briefing.
        </p>
        <div className="space-y-3">
          <div className="p-3 rounded-lg text-xs" style={{ background: "#1a1520", border: "1px solid #2e2535" }}>
            <p className="font-medium mb-1" style={{ color: "#e8dff0" }}>Before connecting:</p>
            <ol className="space-y-1" style={{ color: "#9e8fb0" }}>
              <li>1. Create a Google Cloud project at console.cloud.google.com</li>
              <li>2. Enable the Google Calendar API</li>
              <li>3. Create OAuth 2.0 credentials (Web application)</li>
              <li>4. Add your Vercel URL + /api/auth/google/callback as redirect URI</li>
              <li>5. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to Vercel env vars</li>
            </ol>
          </div>
          <button className="btn-ghost" onClick={connectGoogle}>
            Connect Google Calendar →
          </button>
        </div>
      </div>

      {/* Vercel Deployment */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-medium mb-1" style={{ color: "#c9a96e" }}>Deployment</h2>
        <p className="text-xs mb-4" style={{ color: "#6b5f7a" }}>
          Required environment variables for your Vercel deployment.
        </p>
        <div className="space-y-2">
          {[
            { key: "DATABASE_URL", desc: "Neon Postgres connection string", required: true },
            { key: "ANTHROPIC_API_KEY", desc: "For AI astrology readings", required: true },
            { key: "CRON_SECRET", desc: "Random string to secure briefing endpoint", required: true },
            { key: "GOOGLE_CLIENT_ID", desc: "Google OAuth — for calendar", required: false },
            { key: "GOOGLE_CLIENT_SECRET", desc: "Google OAuth — for calendar", required: false },
            { key: "GOOGLE_REDIRECT_URI", desc: "Your Vercel URL + /api/auth/google/callback", required: false },
          ].map(v => (
            <div key={v.key} className="flex items-start gap-3 py-2" style={{ borderBottom: "1px solid #1e1a25" }}>
              <code className="text-xs px-2 py-0.5 rounded font-mono shrink-0" style={{ background: "#1a1520", color: "#c9a96e" }}>
                {v.key}
              </code>
              <span className="text-xs" style={{ color: "#9e8fb0" }}>{v.desc}</span>
              <span
                className="text-xs ml-auto shrink-0"
                style={{ color: v.required ? "#b87c8a" : "#4a3f58" }}
              >
                {v.required ? "required" : "optional"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-medium mb-3" style={{ color: "#c9a96e" }}>About This Dashboard</h2>
        <div className="space-y-1 text-xs" style={{ color: "#6b5f7a" }}>
          <p>Dark Feminine Sage Dashboard · Built for Bri</p>
          <p>Stack: Next.js 14 · Neon Postgres · Anthropic Claude · Vercel</p>
          <p>Last data sync: {new Date(data.lastUpdated).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
