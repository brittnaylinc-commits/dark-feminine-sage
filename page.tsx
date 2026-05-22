"use client";

import { useState } from "react";
import { DashboardProvider } from "@/lib/context";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { WeekView } from "@/components/dashboard/WeekView";
import { BrandView } from "@/components/dashboard/BrandView";
import { QuarterView } from "@/components/dashboard/QuarterView";
import { AstroView } from "@/components/dashboard/AstroView";
import { SettingsView } from "@/components/dashboard/SettingsView";

type Tab = "week" | "brand" | "quarter" | "astro" | "settings";

function Dashboard() {
  const [tab, setTab] = useState<Tab>("week");

  return (
    <div className="grain-overlay min-h-screen flex">
      <Sidebar active={tab} onChange={setTab} />

      {/* Main content */}
      <main
        className="flex-1 min-h-screen overflow-y-auto"
        style={{ marginLeft: "224px", padding: "40px 40px 80px" }}
      >
        <div className="max-w-5xl mx-auto">
          {tab === "week" && <WeekView />}
          {tab === "brand" && <BrandView />}
          {tab === "quarter" && <QuarterView />}
          {tab === "astro" && <AstroView />}
          {tab === "settings" && <SettingsView />}
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardProvider>
      <Dashboard />
    </DashboardProvider>
  );
}
