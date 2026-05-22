"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { DashboardData } from "@/types";
import { DEFAULT_HABITS, DEFAULT_BRAND_MILESTONES } from "@/types";

interface DashboardCtx {
  data: DashboardData | null;
  loading: boolean;
  saving: boolean;
  update: (updater: (d: DashboardData) => DashboardData) => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<DashboardCtx | null>(null);

const EMPTY: DashboardData = {
  tasks: [], habitLogs: [], habits: DEFAULT_HABITS, weeklyFocus: [], gymSessions: [],
  quarterlyGoals: [], achievements: [], finances: [],
  astroReadings: [], contentItems: [], brandMilestones: DEFAULT_BRAND_MILESTONES,
  lastUpdated: new Date().toISOString(),
};

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/data");
      const d = await res.json();
      setData(d);
    } catch {
      setData(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const update = useCallback(async (updater: (d: DashboardData) => DashboardData) => {
    setData(prev => {
      const next = updater(prev ?? EMPTY);
      setSaving(true);
      fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).finally(() => setSaving(false));
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ data, loading, saving, update, refresh }}>{children}</Ctx.Provider>;
}

export function useDashboard() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
