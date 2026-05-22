import { neon } from "@neondatabase/serverless";
import type { DashboardData } from "@/types";

const sql = neon(process.env.DATABASE_URL!);

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS dashboard (
      id TEXT PRIMARY KEY DEFAULT 'bri',
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function loadData(): Promise<DashboardData | null> {
  await initDB();
  const rows = await sql`SELECT data FROM dashboard WHERE id = 'bri' LIMIT 1`;
  if (rows.length === 0) return null;
  return rows[0].data as DashboardData;
}

export async function saveData(data: DashboardData): Promise<void> {
  await initDB();
  await sql`
    INSERT INTO dashboard (id, data, updated_at)
    VALUES ('bri', ${JSON.stringify(data)}, NOW())
    ON CONFLICT (id) DO UPDATE
    SET data = ${JSON.stringify(data)}, updated_at = NOW()
  `;
}

// ─── Week & Quarter Helpers ───────────────────────────────────────────────

export function getWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function getQuarterKey(date: Date = new Date()): string {
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-Q${q}`;
}

export function getMonthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getWeekDates(weekKey: string): Date[] {
  const [year, week] = weekKey.split("-W").map(Number);
  const jan1 = new Date(year, 0, 1);
  const daysToMonday = (1 - jan1.getDay() + 7) % 7;
  const monday = new Date(jan1);
  monday.setDate(jan1.getDate() + daysToMonday + (week - 1) * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}
