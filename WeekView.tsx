"use client";

import { useState } from "react";
import { useDashboard } from "@/lib/context";
import { getWeekKey, getWeekDates, toISO, todayISO, uid, formatDate } from "@/lib/utils";
import type { Task } from "@/types";

export function WeekView() {
  const { data, update } = useDashboard();
  const [newTask, setNewTask] = useState("");
  const [intentionEdit, setIntentionEdit] = useState(false);
  const [intentionText, setIntentionText] = useState("");
  const [activeWeekOffset, setActiveWeekOffset] = useState(0);

  if (!data) return null;

  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + activeWeekOffset * 7);
  const weekKey = getWeekKey(targetDate);
  const weekDates = getWeekDates(weekKey);
  const todayStr = todayISO();

  const weekFocus = data.weeklyFocus.find(w => w.weekKey === weekKey);
  const tasks = data.tasks.filter(t => t.weekKey === weekKey);
  const openTasks = tasks.filter(t => !t.completed);
  const doneTasks = tasks.filter(t => t.completed);

  // Habit calculations
  const weekDateStrings = weekDates.map(toISO);

  function addTask() {
    if (!newTask.trim()) return;
    update(d => ({
      ...d,
      tasks: [...d.tasks, { id: uid(), text: newTask.trim(), completed: false, weekKey }],
    }));
    setNewTask("");
  }

  function toggleTask(id: string) {
    update(d => ({
      ...d,
      tasks: d.tasks.map(t =>
        t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined } : t
      ),
    }));
  }

  function deleteTask(id: string) {
    update(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) }));
  }

  function saveIntention() {
    update(d => ({
      ...d,
      weeklyFocus: [
        ...d.weeklyFocus.filter(w => w.weekKey !== weekKey),
        { ...(weekFocus ?? { weekKey, goals: [], reflection: "" }), weekKey, intention: intentionText },
      ],
    }));
    setIntentionEdit(false);
  }

  function toggleHabit(habitId: string, dateStr: string) {
    update(d => {
      const exists = d.habitLogs.some(l => l.habitId === habitId && l.date === dateStr);
      return {
        ...d,
        habitLogs: exists
          ? d.habitLogs.filter(l => !(l.habitId === habitId && l.date === dateStr))
          : [...d.habitLogs, { habitId, date: dateStr }],
      };
    });
  }

  const weekLabel = activeWeekOffset === 0
    ? "This Week"
    : activeWeekOffset === -1 ? "Last Week"
    : activeWeekOffset === 1 ? "Next Week"
    : `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-light italic" style={{ color: "#e8dff0" }}>
            {weekLabel}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6b5f7a" }}>
            {weekDates[0].toLocaleDateString("en-US", { month: "long", day: "numeric" })} — {weekDates[6].toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost text-xs px-3 py-2" onClick={() => setActiveWeekOffset(v => v - 1)}>← Prev</button>
          {activeWeekOffset !== 0 && (
            <button className="btn-ghost text-xs px-3 py-2" onClick={() => setActiveWeekOffset(0)}>Today</button>
          )}
          <button className="btn-ghost text-xs px-3 py-2" onClick={() => setActiveWeekOffset(v => v + 1)}>Next →</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Tasks ── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5 fade-up-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-medium" style={{ color: "#c9a96e" }}>
                Tasks
              </h2>
              <span className="text-xs" style={{ color: "#6b5f7a" }}>
                {doneTasks.length}/{tasks.length} done
              </span>
            </div>

            {/* Add task */}
            <div className="flex gap-2 mb-4">
              <input
                className="input-dark flex-1"
                placeholder="Add a task for this week…"
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTask()}
              />
              <button className="btn-gold px-4" onClick={addTask}>+</button>
            </div>

            {/* Open tasks */}
            <div className="space-y-2">
              {openTasks.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: "#4a3f58" }}>
                  No open tasks — you're either ahead or it's time to plan. ✦
                </p>
              )}
              {openTasks.map(task => (
                <TaskRow key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
              ))}
            </div>

            {/* Completed */}
            {doneTasks.length > 0 && (
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid #2e2535" }}>
                <p className="text-xs mb-2" style={{ color: "#4a3f58" }}>Completed</p>
                <div className="space-y-2">
                  {doneTasks.map(task => (
                    <TaskRow key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Habit Tracker ── */}
          <div className="card p-5 fade-up-2">
            <h2 className="font-display text-lg font-medium mb-4" style={{ color: "#c9a96e" }}>
              Habit Tracker
            </h2>

            {/* Day headers */}
            <div className="grid mb-3" style={{ gridTemplateColumns: "1fr repeat(7, 32px)", gap: "4px", alignItems: "center" }}>
              <div />
              {weekDates.map((d, i) => (
                <div
                  key={i}
                  className="text-center text-xs font-medium"
                  style={{
                    color: toISO(d) === todayStr ? "#c9a96e" : "#6b5f7a",
                  }}
                >
                  {dayLabels[i]}
                  <div className="text-xs mt-0.5" style={{ color: toISO(d) === todayStr ? "#c9a96e" : "#4a3f58", fontSize: "10px" }}>
                    {d.getDate()}
                  </div>
                </div>
              ))}
            </div>

            {/* Group by section */}
            {(["wellness", "brand", "spiritual", "learning"] as const).map(section => {
              const habits = data.habits.filter(h => h.section === section);
              if (!habits.length) return null;
              return (
                <div key={section} className="mb-4">
                  <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "#4a3f58" }}>{section}</div>
                  {habits.map(habit => {
                    const weekCount = weekDateStrings.filter(ds =>
                      data.habitLogs.some(l => l.habitId === habit.id && l.date === ds)
                    ).length;
                    return (
                      <div
                        key={habit.id}
                        className="grid mb-2 items-center"
                        style={{ gridTemplateColumns: "1fr repeat(7, 32px)", gap: "4px" }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span>{habit.icon}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-medium truncate" style={{ color: habit.color }}>{habit.label}</div>
                            <div className="text-xs" style={{ color: "#4a3f58", fontSize: "10px" }}>{weekCount}/{habit.goal}d</div>
                          </div>
                        </div>
                        {weekDates.map((d, i) => {
                          const ds = toISO(d);
                          const checked = data.habitLogs.some(l => l.habitId === habit.id && l.date === ds);
                          const isToday = ds === todayStr;
                          const isFuture = ds > todayStr;
                          return (
                            <button
                              key={i}
                              onClick={() => !isFuture && toggleHabit(habit.id, ds)}
                              className="w-8 h-8 rounded-md transition-all duration-150 flex items-center justify-center"
                              style={{
                                background: checked ? habit.bg : "transparent",
                                border: `1px solid ${checked ? habit.border : isToday ? "#2e2535" : "#1e1a25"}`,
                                cursor: isFuture ? "default" : "pointer",
                                opacity: isFuture ? 0.3 : 1,
                              }}
                            >
                              {checked && (
                                <div className="w-2 h-2 rounded-full" style={{ background: habit.color }} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
          {/* Weekly Intention */}
          <div className="card p-5 fade-up-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-medium" style={{ color: "#c9a96e" }}>Intention</h2>
              <button
                className="text-xs"
                style={{ color: "#6b5f7a" }}
                onClick={() => {
                  setIntentionText(weekFocus?.intention ?? "");
                  setIntentionEdit(!intentionEdit);
                }}
              >
                {intentionEdit ? "cancel" : "edit"}
              </button>
            </div>

            {intentionEdit ? (
              <div className="space-y-2">
                <textarea
                  className="input-dark"
                  rows={4}
                  placeholder="What is your intention for this week?"
                  value={intentionText}
                  onChange={e => setIntentionText(e.target.value)}
                />
                <button className="btn-gold w-full text-xs" onClick={saveIntention}>Save</button>
              </div>
            ) : weekFocus?.intention ? (
              <p className="font-display text-base italic leading-relaxed" style={{ color: "#e8dff0" }}>
                "{weekFocus.intention}"
              </p>
            ) : (
              <p className="text-sm" style={{ color: "#4a3f58" }}>
                No intention set yet. Click edit to add one.
              </p>
            )}
          </div>

          {/* Weekly Goals */}
          <WeeklyGoalsCard weekKey={weekKey} />

          {/* Gym Log */}
          <GymCard weekDates={weekDates} todayStr={todayStr} />
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task, onToggle, onDelete }: { task: Task; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-all"
      style={{ background: task.completed ? "rgba(46,37,53,0.3)" : "rgba(33,27,39,0.5)" }}
    >
      <input type="checkbox" className="custom-check" checked={task.completed} onChange={() => onToggle(task.id)} />
      <span
        className="flex-1 text-sm"
        style={{
          color: task.completed ? "#4a3f58" : "#e8dff0",
          textDecoration: task.completed ? "line-through" : "none",
        }}
      >
        {task.text}
      </span>
      <button
        className="opacity-0 group-hover:opacity-100 text-xs transition-opacity"
        style={{ color: "#4a3f58" }}
        onClick={() => onDelete(task.id)}
      >
        ✕
      </button>
    </div>
  );
}

function WeeklyGoalsCard({ weekKey }: { weekKey: string }) {
  const { data, update } = useDashboard();
  const [input, setInput] = useState("");
  if (!data) return null;

  const focus = data.weeklyFocus.find(w => w.weekKey === weekKey);
  const goals = focus?.goals ?? [];

  function addGoal() {
    if (!input.trim()) return;
    update(d => ({
      ...d,
      weeklyFocus: [
        ...d.weeklyFocus.filter(w => w.weekKey !== weekKey),
        { ...(focus ?? { weekKey, intention: "", reflection: "" }), weekKey, goals: [...goals, input.trim()] },
      ],
    }));
    setInput("");
  }

  function removeGoal(i: number) {
    update(d => ({
      ...d,
      weeklyFocus: [
        ...d.weeklyFocus.filter(w => w.weekKey !== weekKey),
        { ...(focus ?? { weekKey, intention: "", reflection: "" }), weekKey, goals: goals.filter((_, idx) => idx !== i) },
      ],
    }));
  }

  return (
    <div className="card p-5">
      <h2 className="font-display text-lg font-medium mb-3" style={{ color: "#c9a96e" }}>Weekly Goals</h2>
      <div className="space-y-2 mb-3">
        {goals.map((g, i) => (
          <div key={i} className="flex items-center gap-2 text-sm group">
            <span style={{ color: "#c9a96e" }}>✦</span>
            <span className="flex-1" style={{ color: "#e8dff0" }}>{g}</span>
            <button className="opacity-0 group-hover:opacity-100 text-xs" style={{ color: "#4a3f58" }} onClick={() => removeGoal(i)}>✕</button>
          </div>
        ))}
        {goals.length === 0 && <p className="text-xs" style={{ color: "#4a3f58" }}>No goals set yet.</p>}
      </div>
      <div className="flex gap-2">
        <input className="input-dark flex-1 text-xs" placeholder="Add goal…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addGoal()} />
        <button className="btn-gold px-3 text-xs" onClick={addGoal}>+</button>
      </div>
    </div>
  );
}

function GymCard({ weekDates, todayStr }: { weekDates: Date[]; todayStr: string }) {
  const { data, update } = useDashboard();
  const [adding, setAdding] = useState<string | null>(null);
  const [gymType, setGymType] = useState("Strength");
  const [gymNotes, setGymNotes] = useState("");
  if (!data) return null;

  const GYM_TYPES = ["Strength", "Cardio", "Yoga", "Pilates", "HIIT", "Rest", "Walk"];

  function saveSession(dateStr: string) {
    update(d => ({
      ...d,
      gymSessions: [
        ...d.gymSessions.filter(s => s.date !== dateStr),
        { date: dateStr, type: gymType, notes: gymNotes },
      ],
    }));
    setAdding(null);
    setGymNotes("");
  }

  return (
    <div className="card p-5">
      <h2 className="font-display text-lg font-medium mb-3" style={{ color: "#c9a96e" }}>Movement Log</h2>
      <div className="space-y-1">
        {weekDates.map(d => {
          const ds = toISO(d);
          const session = data.gymSessions.find(s => s.date === ds);
          const isToday = ds === todayStr;
          const isFuture = ds > todayStr;
          const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });

          return (
            <div key={ds}>
              <div
                className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all"
                style={{ background: isToday ? "rgba(201,169,110,0.05)" : "transparent" }}
                onClick={() => !isFuture && setAdding(adding === ds ? null : ds)}
              >
                <span className="text-xs w-8" style={{ color: isToday ? "#c9a96e" : "#4a3f58" }}>{dayLabel}</span>
                {session ? (
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(142,158,122,0.15)", color: "#8e9e7a" }}>
                    {session.type}
                  </span>
                ) : isFuture ? (
                  <span className="text-xs" style={{ color: "#2e2535" }}>—</span>
                ) : (
                  <span className="text-xs" style={{ color: "#4a3f58" }}>tap to log</span>
                )}
              </div>
              {adding === ds && (
                <div className="ml-10 mb-2 p-3 rounded-lg space-y-2" style={{ background: "#1a1520", border: "1px solid #2e2535" }}>
                  <div className="flex flex-wrap gap-1">
                    {GYM_TYPES.map(t => (
                      <button
                        key={t}
                        className="text-xs px-2 py-1 rounded transition-all"
                        style={{
                          background: gymType === t ? "rgba(201,169,110,0.2)" : "transparent",
                          color: gymType === t ? "#c9a96e" : "#6b5f7a",
                          border: `1px solid ${gymType === t ? "rgba(201,169,110,0.3)" : "#2e2535"}`,
                        }}
                        onClick={() => setGymType(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <input className="input-dark text-xs" placeholder="Notes (optional)…" value={gymNotes} onChange={e => setGymNotes(e.target.value)} />
                  <button className="btn-gold w-full text-xs py-1.5" onClick={() => saveSession(ds)}>Save</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
