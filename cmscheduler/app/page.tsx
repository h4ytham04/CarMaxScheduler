"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  getEmployees,
  getSchedules,
  saveSchedule,
  deleteSchedule,
  updateSchedule,
  getAISettings,
  EmployeeData,
  ScheduleData,
  ShiftEntry,
} from "@/utils/localStorageHelpers";

const carmaxBlue = "#003366";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function CarIcon({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 640 512" fill="white" className={className} style={style}>
      <path d="M171.3 96H224v96H111.3l30.4-75.9C146.5 102 158.2 96 171.3 96zM272 192V96h81.2c9.7 0 18.9 4.4 25 12l67.2 84H272zm256.2 1L428.2 68c-18.2-22.8-45.8-36-75-36H171.3c-39.3 0-74.6 23.9-89.1 60.3L40.6 196.4C16.8 205.8 0 228.9 0 256V368c0 17.7 14.3 32 32 32H65.3c7.6 45.4 47.1 80 94.7 80s87.1-34.6 94.7-80H385.3c7.6 45.4 47.1 80 94.7 80s87.1-34.6 94.7-80H608c17.7 0 32-14.3 32-32V320c0-65.2-48.8-119-111.8-127zM160 368a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm256 0a48 48 0 1 1 96 0 48 48 0 1 1 -96 0z" />
    </svg>
  );
}

function getNextMonday(): string {
  const today = new Date();
  const daysUntilMonday = today.getDay() === 0 ? 1 : 8 - today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysUntilMonday);
  return monday.toISOString().split("T")[0];
}

const animationStyles = `
  @keyframes floatA {
    0%, 100% { transform: translateY(0px) rotate(12deg); }
    50% { transform: translateY(-18px) rotate(14deg); }
  }
  @keyframes floatB {
    0%, 100% { transform: scaleX(-1) rotate(-12deg) translateX(40px) translateY(-40px); }
    50% { transform: scaleX(-1) rotate(-10deg) translateX(40px) translateY(-58px); }
  }
  @keyframes floatC {
    0%, 100% { transform: translateY(0px) rotate(-6deg); }
    50% { transform: translateY(-12px) rotate(-8deg); }
  }
  @keyframes floatD {
    0%, 100% { transform: scaleX(-1) rotate(6deg) translateX(24px) translateY(32px); }
    50% { transform: scaleX(-1) rotate(8deg) translateX(24px) translateY(20px); }
  }
  @keyframes orbPulse {
    0%, 100% { opacity: 0.12; transform: scale(1); }
    50% { opacity: 0.18; transform: scale(1.08); }
  }
  @keyframes orbPulse2 {
    0%, 100% { opacity: 0.10; transform: scale(1); }
    50% { opacity: 0.15; transform: scale(1.06); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .anim-float-a { animation: floatA 7s ease-in-out infinite; }
  .anim-float-b { animation: floatB 8s ease-in-out infinite; }
  .anim-float-c { animation: floatC 9s ease-in-out infinite 1s; }
  .anim-float-d { animation: floatD 10s ease-in-out infinite 0.5s; }
  .anim-orb-1   { animation: orbPulse 6s ease-in-out infinite; }
  .anim-orb-2   { animation: orbPulse2 8s ease-in-out infinite 2s; }
  .anim-fade-up-1 { animation: fadeUp 0.5s ease-out both; }
  .anim-fade-up-2 { animation: fadeUp 0.5s ease-out 0.15s both; }
  .anim-fade-up-3 { animation: fadeUp 0.5s ease-out 0.3s both; }
  .anim-fade-up-4 { animation: fadeUp 0.5s ease-out 0.45s both; }
`;

export default function Home() {
  const router = useRouter();

  const [accepted, setAccepted] = useState(() =>
    sessionStorage.getItem("scheduleMaxAccepted") === "true"
  );
  const [closing, setClosing] = useState(false);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [schedules, setSchedules] = useState<ScheduleData[]>([]);
  const [weekOf, setWeekOf] = useState(getNextMonday());
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, ShiftEntry[]>>({});

  useEffect(() => {
    setEmployees(getEmployees());
    setSchedules(getSchedules());
    setAiEnabled(getAISettings().enabled);
  }, []);

  const refresh = () => {
    setEmployees(getEmployees());
    setSchedules(getSchedules());
  };

  const handleAgree = () => {
    setClosing(true);
    setTimeout(() => setAccepted(true), 200);
    sessionStorage.setItem("scheduleMaxAccepted", "true");
  };

  const handleGenerate = async () => {
    if (employees.length === 0) return;
    setGenerating(true);
    setGenerateError(null);
    setAiError(null);
    try {
      // Dynamic import keeps the mutable module state client-only
      const mod = await import("@/utils/schedulerAlgorithm");
      const empInstances = employees.map(
        (e) =>
          new mod.Employee(
            e.name, e.role, e.isFullTime, e.hoursPerWeek,
            e.isLead, e.preferredDayOff, e.preferClosing,
            e.availability, e.isOffSaturday
          )
      );
      mod.generateSchedule(empInstances);
      const warnings: string[] = mod.validateSchedule(empInstances);
      const scheduleCopy: Record<string, ShiftEntry[]> = JSON.parse(JSON.stringify(mod.finalSchedule));

      // Save the base (algorithm-only) schedule
      saveSchedule({
        weekOf,
        generatedOn: new Date().toISOString(),
        schedule: scheduleCopy,
        warnings,
      });
      refresh();

      // ── AI-assisted pass (optional) ─────────────────────────────────────────
      const aiSettings = getAISettings();
      if (aiSettings.enabled && aiSettings.contextPrompt.trim()) {
        setAiGenerating(true);
        try {
          const res = await fetch("/api/ai-schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contextPrompt: aiSettings.contextPrompt,
              weekOf,
              employees: employees.map((e) => ({
                name: e.name,
                role: e.role,
                isFullTime: e.isFullTime,
                hoursPerWeek: e.hoursPerWeek,
                isLead: e.isLead,
                preferredDayOff: e.preferredDayOff,
                preferClosing: e.preferClosing,
                isOffSaturday: e.isOffSaturday,
              })),
              baseSchedule: scheduleCopy,
            }),
          });
          const data = await res.json() as { schedule?: Record<string, ShiftEntry[]>; error?: string };
          if (!res.ok || data.error) {
            setAiError(data.error ?? "AI generation failed.");
          } else if (data.schedule) {
            saveSchedule({
              weekOf,
              generatedOn: new Date().toISOString(),
              schedule: data.schedule,
              warnings: ["AI-assisted schedule — review carefully before using."],
            });
            refresh();
          }
        } catch (aiErr) {
          setAiError("Could not reach the AI service. Check your connection.");
          console.error(aiErr);
        } finally {
          setAiGenerating(false);
        }
      }
    } catch (err) {
      setGenerateError("Failed to generate schedule. Check the console for details.");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteSchedule(id);
    setConfirmDeleteId(null);
    if (expandedId === id) setExpandedId(null);
    if (editingId === id) { setEditingId(null); setEditDraft({}); }
    refresh();
  };

  const startEdit = (sched: ScheduleData) => {
    setEditingId(sched.id);
    setEditDraft(JSON.parse(JSON.stringify(sched.schedule)));
    setExpandedId(sched.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({});
  };

  const saveEdit = (id: string) => {
    updateSchedule(id, { schedule: editDraft });
    setEditingId(null);
    setEditDraft({});
    refresh();
  };

  const updateDraftEntry = (day: string, idx: number, field: keyof ShiftEntry, value: string | boolean) => {
    setEditDraft((prev) => {
      const dayEntries = [...(prev[day] ?? [])];
      dayEntries[idx] = { ...dayEntries[idx], [field]: value };
      return { ...prev, [day]: dayEntries };
    });
  };

  const removeDraftEntry = (day: string, idx: number) => {
    setEditDraft((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).filter((_, i) => i !== idx),
    }));
  };

  const addDraftEntry = (day: string) => {
    setEditDraft((prev) => ({
      ...prev,
      [day]: [...(prev[day] ?? []), { name: "", shift: "", isMOD: false }],
    }));
  };

  return (
    <div
      className="relative min-h-screen flex flex-col text-slate-900 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #001a33 0%, #003366 55%, #00244d 85%, #1a1200 100%)" }}
    >
      <style>{animationStyles}</style>
      {/* Yellow glow orbs */}
      <div className="anim-orb-1 pointer-events-none fixed top-[-120px] right-[-80px] w-[420px] h-[420px] rounded-full" style={{ background: "radial-gradient(circle, #f5c400 0%, transparent 70%)" }} />
      <div className="anim-orb-2 pointer-events-none fixed bottom-[-100px] left-[-60px] w-[320px] h-[320px] rounded-full" style={{ background: "radial-gradient(circle, #e6a800 0%, transparent 70%)" }} />
      <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] opacity-[0.05]" style={{ background: "radial-gradient(ellipse, #ffd000 0%, transparent 70%)" }} />
      <CarIcon className="anim-float-a pointer-events-none fixed top-0 left-0 w-64 -translate-x-10 -translate-y-10 opacity-[0.08]" />
      <CarIcon className="anim-float-b pointer-events-none fixed top-0 right-0 w-64 opacity-[0.08]" style={{ transform: "scaleX(-1) rotate(-12deg) translateX(40px) translateY(-40px)" }} />
      <CarIcon className="anim-float-c pointer-events-none fixed bottom-0 left-0 w-48 -translate-x-6 translate-y-8 opacity-[0.06]" />
      <CarIcon className="anim-float-d pointer-events-none fixed bottom-0 right-0 w-48 opacity-[0.06]" style={{ transform: "scaleX(-1) rotate(6deg) translateX(24px) translateY(32px)" }} />
      <CarIcon className="pointer-events-none fixed top-1/2 left-0 w-36 -translate-x-10 -translate-y-1/2 rotate-6 opacity-[0.04]" />
      <CarIcon className="pointer-events-none fixed top-1/3 right-0 w-28 opacity-[0.04]" style={{ transform: "scaleX(-1) rotate(-8deg) translateX(28px)" }} />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="flex-1 mx-auto max-w-4xl px-4 py-10 flex flex-col">

        {/* ── Header ── */}
        <div className="anim-fade-up-1 mb-10 flex items-center justify-between">
          <img src="/SCHEDULE_MAX.png" alt="ScheduleMax" className="h-12 w-auto object-contain" />
          <button
            onClick={() => router.push("/employees")}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: carmaxBlue, cursor: "pointer" }}
          >
            Associates Information
          </button>
        </div>

        {/* ── Associates ── */}
        <section className="anim-fade-up-2 mb-10">
          <h2 className="mb-3 text-base font-semibold text-blue-200 uppercase tracking-wide">
            Associates ({employees.length})
          </h2>
          {employees.length === 0 ? (
            <div className="rounded-xl bg-white px-6 py-8 text-center text-slate-400 shadow-sm">
              <p>No associates yet.</p>
              <button
                onClick={() => router.push("/employees")}
                className="mt-3 rounded-full px-5 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: carmaxBlue, cursor: "pointer" }}>
                Add Associates
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{emp.name}</p>
                    <p className="text-xs text-slate-500">
                      {emp.role || "—"} &middot; {emp.isFullTime ? "Full-Time" : "Part-Time"} &middot; {emp.hoursPerWeek}h/wk
                      {emp.isLead && <span className="ml-1 font-medium text-blue-600">&middot; Lead</span>}
                      {emp.isOffSaturday && <span className="ml-1 text-orange-500">&middot; Off Sat</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/employees")}
                    className="text-xs text-slate-400 hover:text-slate-700"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Generate Schedule ── */}
        <section className="anim-fade-up-3 mb-10">
          <h2 className="mb-3 text-base font-semibold text-blue-200 uppercase tracking-wide">
            Generate Schedule
          </h2>
          <div className="rounded-xl bg-white px-6 py-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Week of <span className="text-slate-400">(select the Monday)</span>
                </label>
                <input
                  type="date"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={weekOf}
                  onChange={(e) => setWeekOf(e.target.value)}
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating || aiGenerating || employees.length === 0}
                className="rounded-full px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: carmaxBlue }}
              >
                {generating ? "Generating…" : aiGenerating ? "AI Adjusting…" : "Generate Schedule"}
              </button>
              <button
                onClick={() => { router.push("/context"); }}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  aiEnabled
                    ? "bg-green-50 text-green-700 hover:bg-green-100"
                    : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                }`}
              >
                {aiEnabled ? "✓ AI Enabled" : "AI Assistant (Beta)"}
              </button>

            </div>
            {employees.length === 0 && (
              <p className="mt-2 text-xs text-red-500">
                Add associates first before generating a schedule.
              </p>
            )}
            {generateError && (
              <p className="mt-2 text-xs text-red-500">{generateError}</p>
            )}
            {aiGenerating && (
              <p className="mt-2 text-xs text-blue-600">AI is reviewing the schedule…</p>
            )}
            {aiError && (
              <p className="mt-2 text-xs text-amber-600">AI adjustment failed: {aiError}</p>
            )}
          </div>
        </section>


        {/* ── Schedules ── */}
        <section className="anim-fade-up-4">
          <h2 className="mb-3 text-base font-semibold text-blue-200 uppercase tracking-wide">
            Schedules ({schedules.length})
          </h2>
          {schedules.length === 0 ? (
            <div className="rounded-xl bg-white px-6 py-8 text-center text-slate-400 shadow-sm">
              <p>No schedules generated yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...schedules].reverse().map((sched) => {
                const isExpanded = expandedId === sched.id;
                const isEditing = editingId === sched.id;
                const weekDate = new Date(sched.weekOf + "T00:00:00").toLocaleDateString("en-US", {
                  month: "long", day: "numeric", year: "numeric",
                });
                return (
                  <div key={sched.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
                    {/* Card header */}
                    <div className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="font-semibold text-slate-800">
                          Week of {weekDate}
                          {sched.warnings.some((w) => w.startsWith("AI-assisted")) && (
                            <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                              AI
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400">
                          Generated {new Date(sched.generatedOn).toLocaleString()}
                          {sched.warnings.length > 0 && (
                            <span className="ml-2 text-amber-500">
                              ⚠ {sched.warnings.length} warning{sched.warnings.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { if (isExpanded) { if (isEditing) cancelEdit(); setExpandedId(null); } else { setExpandedId(sched.id); } }}
                          className="rounded-full bg-slate-100 px-4 py-1 text-sm text-slate-700 hover:bg-slate-200"
                        >
                          {isExpanded ? "Collapse" : "View"}
                        </button>
                        <button
                          onClick={() => startEdit(sched)}
                          className="rounded-full bg-blue-50 px-4 py-1 text-sm text-blue-600 hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        {confirmDeleteId === sched.id ? (
                          <>
                            <span className="text-xs text-slate-500">Delete?</span>
                            <button
                              onClick={() => handleDelete(sched.id)}
                              className="rounded-full bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-full bg-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-300"
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(sched.id)}
                            className="rounded-full bg-red-50 px-4 py-1 text-sm text-red-600 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded view */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 px-5 py-4">
                        {isEditing ? (
                          <>
                            <div className="mb-4 flex items-center gap-2">
                              <button
                                onClick={() => saveEdit(sched.id)}
                                className="rounded-full px-5 py-1.5 text-sm font-semibold text-white"
                                style={{ backgroundColor: carmaxBlue }}
                              >
                                Save Changes
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="rounded-full bg-slate-100 px-5 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                              >
                                Cancel
                              </button>
                              <span className="ml-1 text-xs text-slate-400">≤ 9 hours per shift</span>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                              {DAYS.map((day) => {
                                const entries = editDraft[day] ?? [];
                                return (
                                  <div key={day} className="rounded-lg border border-blue-200 bg-blue-50/30 p-3">
                                    <p className="mb-2 font-semibold text-slate-700">{day}</p>
                                    {entries.map((entry, i) =>
                                      entry.warning ? (
                                        <p key={i} className="text-xs text-amber-500">{entry.warning}</p>
                                      ) : (
                                        <div key={i} className="mb-1.5 flex items-center gap-1">
                                          <input
                                            value={entry.name}
                                            onChange={(e) => updateDraftEntry(day, i, "name", e.target.value)}
                                            className="w-24 rounded border border-slate-300 px-1.5 py-0.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                            placeholder="Name"
                                          />
                                          <input
                                            value={entry.shift}
                                            onChange={(e) => updateDraftEntry(day, i, "shift", e.target.value)}
                                            className="w-14 rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                            placeholder="Shift"
                                          />
                                          <label className="flex cursor-pointer select-none items-center gap-0.5 text-xs text-slate-600">
                                            <input
                                              type="checkbox"
                                              checked={!!entry.isMOD}
                                              onChange={(e) => updateDraftEntry(day, i, "isMOD", e.target.checked)}
                                              className="accent-blue-600"
                                            />
                                            MOD
                                          </label>
                                          <button
                                            onClick={() => removeDraftEntry(day, i)}
                                            className="ml-auto text-xs text-red-400 hover:text-red-600"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      )
                                    )}
                                    <button
                                      onClick={() => addDraftEntry(day)}
                                      className="mt-1 text-xs text-blue-500 hover:text-blue-700"
                                    >
                                      + Add
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <>
                            {sched.warnings.length > 0 && (
                              <div className="mb-4 rounded-lg bg-amber-50 p-3">
                                <p className="mb-1 text-xs font-semibold text-amber-700">Warnings</p>
                                {sched.warnings.map((w, i) => (
                                  <p key={i} className="text-xs text-amber-600">{w}</p>
                                ))}
                              </div>
                            )}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                              {DAYS.map((day) => {
                                const entries = sched.schedule[day] ?? [];
                                return (
                                  <div key={day} className="rounded-lg border border-slate-100 p-3">
                                    <p className="mb-2 font-semibold text-slate-700">{day}</p>
                                    {entries.length === 0 ? (
                                      <p className="text-xs text-slate-400">No shifts</p>
                                    ) : (
                                      entries.map((entry, i) =>
                                        entry.warning ? (
                                          <p key={i} className="text-xs text-amber-500">{entry.warning}</p>
                                        ) : (
                                          <div key={i} className="flex items-center justify-between py-0.5">
                                            <span className="text-sm text-slate-800">{entry.name}</span>
                                            <span className="text-xs text-slate-500">
                                              {entry.shift}
                                              {entry.isMOD && (
                                                <span className="ml-1 font-medium text-blue-500">MOD</span>
                                              )}
                                            </span>
                                          </div>
                                        )
                                      )
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
        <footer className="mt-auto flex flex-col items-center">
          <p className="mt-10 text-center text-xs text-slate-500">
            Made by Haytham, an associate at CarMax store 6013. This is an unofficial tool to assist with scheduling and is not endorsed by CarMax. For issues or suggestions, contact Haytham directly.
          </p>
          <p className="text-center text-xs text-slate-400">
            Clearing browser cache will reset all data. Please export any important information before doing so.
          </p>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
            <a
              href="https://github.com/h4ytham04"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors duration-200"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.53 1.03 1.53 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              github.com/h4ytham04
            </a>
            <a href="https://haythamzaami.com" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white transition-colors duration-200">
              haythamzaami.com
            </a>
          </p>
        </footer>
      </div>

      {/* ── Terms popup ── */}
      {!accepted && (
        <>
          <div className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${closing ? "opacity-0" : "opacity-100"}`} />
          <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${closing ? "opacity-0" : "opacity-100"}`}>
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <img className="w-full rounded-2xl" src="/SCHEDULE_MAX.png" />
              <div className="mt-6 space-y-4 text-center">
                <h2 className="text-2xl font-semibold">Welcome to ScheduleMax!</h2>
                <p className="text-slate-600">
                  <strong>ScheduleMax is not affiliated with CarMax. This is a project by an associate from store 6013 to assist for internal scheduling. </strong>
                  This web app helps you manage employees and create weekly schedules. You can edit associate information, generate schedules based on availability and preferences,
                  and view the final schedule in an easy-to-read format. This is a tool for BOMs to create weekly schedules automatically rather than using Dimensions&apos; scheduling tool.{" "}
                  <strong>Clearing Cache from this site will reset all your data.</strong>{" "}
                  Please click &quot;I Agree&quot; to acknowledge that you understand this is an unofficial tool and not endorsed by CarMax.
                </p>
                <button
                  onClick={handleAgree}
                  className="w-full rounded-full bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700"
                >
                  I Agree
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
