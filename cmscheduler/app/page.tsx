"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getEmployees,
  getSchedules,
  saveSchedule,
  deleteSchedule,
  EmployeeData,
  ScheduleData,
} from "@/utils/localStorageHelpers";

const carmaxBlue = "#003366";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getNextMonday(): string {
  const today = new Date();
  const daysUntilMonday = today.getDay() === 0 ? 1 : 8 - today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysUntilMonday);
  return monday.toISOString().split("T")[0];
}

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setEmployees(getEmployees());
    setSchedules(getSchedules());
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
      const scheduleCopy = JSON.parse(JSON.stringify(mod.finalSchedule));
      saveSchedule({
        weekOf,
        generatedOn: new Date().toISOString(),
        schedule: scheduleCopy,
        warnings,
      });
      refresh();
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
    refresh();
  };

  return (
    <div className="relative min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-10">

        {/* ── Header ── */}
        <div className="mb-10 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-800">ScheduleMax</h1>
          <button
            onClick={() => router.push("/employees")}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: carmaxBlue, cursor: "pointer" }}
          >
            Edit Associates
          </button>
        </div>

        {/* ── Associates ── */}
        <section className="mb-10">
          <h2 className="mb-3 text-base font-semibold text-slate-600 uppercase tracking-wide">
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
        <section className="mb-10">
          <h2 className="mb-3 text-base font-semibold text-slate-600 uppercase tracking-wide">
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
                disabled={generating || employees.length === 0}
                className="rounded-full px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: carmaxBlue }}
              >
                {generating ? "Generating…" : "Generate Schedule"}
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
          </div>
        </section>

        {/* ── Schedules ── */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-600 uppercase tracking-wide">
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
                const weekDate = new Date(sched.weekOf + "T00:00:00").toLocaleDateString("en-US", {
                  month: "long", day: "numeric", year: "numeric",
                });
                return (
                  <div key={sched.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
                    {/* Card header */}
                    <div className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="font-semibold text-slate-800">Week of {weekDate}</p>
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
                          onClick={() => setExpandedId(isExpanded ? null : sched.id)}
                          className="rounded-full bg-slate-100 px-4 py-1 text-sm text-slate-700 hover:bg-slate-200"
                        >
                          {isExpanded ? "Collapse" : "View"}
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

                    {/* Expanded day-by-day view */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 px-5 py-4">
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
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
