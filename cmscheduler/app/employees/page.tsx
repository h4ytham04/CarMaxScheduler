"use client";

import { useState, useEffect, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  EmployeeData,
} from "@/utils/localStorageHelpers";

function CarIcon({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 640 512" fill="white" className={className} style={style}>
      <path d="M171.3 96H224v96H111.3l30.4-75.9C146.5 102 158.2 96 171.3 96zM272 192V96h81.2c9.7 0 18.9 4.4 25 12l67.2 84H272zm256.2 1L428.2 68c-18.2-22.8-45.8-36-75-36H171.3c-39.3 0-74.6 23.9-89.1 60.3L40.6 196.4C16.8 205.8 0 228.9 0 256V368c0 17.7 14.3 32 32 32H65.3c7.6 45.4 47.1 80 94.7 80s87.1-34.6 94.7-80H385.3c7.6 45.4 47.1 80 94.7 80s87.1-34.6 94.7-80H608c17.7 0 32-14.3 32-32V320c0-65.2-48.8-119-111.8-127zM160 368a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm256 0a48 48 0 1 1 96 0 48 48 0 1 1 -96 0z" />
    </svg>
  );
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

const carmaxBlue = "#003366";

const animationStyles = `
  @keyframes floatA {
    0%, 100% { transform: translateY(0px) rotate(12deg); }
    50% { transform: translateY(-18px) rotate(14deg); }
  }
  @keyframes floatB {
    0%, 100% { transform: scaleX(-1) rotate(-12deg) translateX(48px) translateY(-48px); }
    50% { transform: scaleX(-1) rotate(-10deg) translateX(48px) translateY(-66px); }
  }
  @keyframes floatC {
    0%, 100% { transform: translateY(0px) rotate(-6deg); }
    50% { transform: translateY(-12px) rotate(-8deg); }
  }
  @keyframes floatD {
    0%, 100% { transform: scaleX(-1) rotate(6deg) translateX(32px) translateY(40px); }
    50% { transform: scaleX(-1) rotate(8deg) translateX(32px) translateY(28px); }
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
  .anim-fade-up-2 { animation: fadeUp 0.5s ease-out 0.12s both; }
  .anim-fade-up-3 { animation: fadeUp 0.5s ease-out 0.24s both; }
  .anim-fade-up-4 { animation: fadeUp 0.5s ease-out 0.36s both; }
  .anim-fade-up-5 { animation: fadeUp 0.5s ease-out 0.48s both; }
`;

const defaultPTAvailability = (): Record<string, [number, number] | null> => ({
  Monday: [10, 21],
  Tuesday: [10, 21],
  Wednesday: [10, 21],
  Thursday: [10, 21],
  Friday: [10, 21],
  Saturday: [9, 21],
});

type FormState = Omit<EmployeeData, "id">;

function emptyForm(): FormState {
  return {
    name: "",
    role: "",
    isFullTime: true,
    hoursPerWeek: 40,
    isLead: false,
    preferredDayOff: "Monday",
    preferClosing: false,
    availability: null,
    isOffSaturday: false,
  };
}

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>("all");
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const toggleAvail = (id: string) =>
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  useEffect(() => {
    setEmployees(getEmployees());
  }, []);

  const refresh = () => setEmployees(getEmployees());

  const openAdd = () => {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (emp: EmployeeData) => {
    setForm({
      name: emp.name,
      role: emp.role,
      isFullTime: emp.isFullTime,
      hoursPerWeek: emp.hoursPerWeek,
      isLead: emp.isLead,
      preferredDayOff: emp.preferredDayOff,
      preferClosing: emp.preferClosing,
      availability: emp.availability,
      isOffSaturday: emp.isOffSaturday,
    });
    setEditingId(emp.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    const payload: FormState = {
      ...form,
      availability: form.isFullTime ? null : (form.availability ?? defaultPTAvailability()),
    };
    if (editingId) {
      updateEmployee(editingId, payload);
    } else {
      addEmployee(payload);
    }
    setShowForm(false);
    setEditingId(null);
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteEmployee(id);
    setConfirmDeleteId(null);
    refresh();
  };

  const setAvailDay = (day: string, available: boolean) => {
    const current = (form.availability as Record<string, [number, number] | null>) ?? defaultPTAvailability();
    setForm((f) => ({
      ...f,
      availability: { ...current, [day]: available ? [10, 21] : null },
    }));
  };

  const setAvailTime = (day: string, index: 0 | 1, value: number) => {
    const current = (form.availability as Record<string, [number, number] | null>) ?? defaultPTAvailability();
    const existing = (current[day] as [number, number]) ?? [10, 21];
    const updated: [number, number] = index === 0 ? [value, existing[1]] : [existing[0], value];
    setForm((f) => ({ ...f, availability: { ...current, [day]: updated } }));
  };

  const ptAvail = (form.availability as Record<string, [number, number] | null>) ?? defaultPTAvailability();

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #001a33 0%, #003366 55%, #00244d 85%, #1a1200 100%)" }}
    >
      <style>{animationStyles}</style>
      {/* Yellow glow orbs */}
      <div className="anim-orb-1 pointer-events-none fixed top-[-120px] right-[-80px] w-[420px] h-[420px] rounded-full" style={{ background: "radial-gradient(circle, #f5c400 0%, transparent 70%)" }} />
      <div className="anim-orb-2 pointer-events-none fixed bottom-[-100px] left-[-60px] w-[320px] h-[320px] rounded-full" style={{ background: "radial-gradient(circle, #e6a800 0%, transparent 70%)" }} />
      <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] opacity-[0.05]" style={{ background: "radial-gradient(ellipse, #ffd000 0%, transparent 70%)" }} />
      {/* ── Background flair ── */}
      <CarIcon className="anim-float-a pointer-events-none fixed top-0 left-0 w-72 -translate-x-12 -translate-y-12 opacity-[0.07]" />
      <CarIcon className="anim-float-b pointer-events-none fixed top-0 right-0 w-72 opacity-[0.07]" style={{ transform: "scaleX(-1) rotate(-12deg) translateX(48px) translateY(-48px)" }} />
      <CarIcon className="anim-float-c pointer-events-none fixed bottom-0 left-0 w-52 -translate-x-8 translate-y-10 opacity-[0.05]" />
      <CarIcon className="anim-float-d pointer-events-none fixed bottom-0 right-0 w-52 opacity-[0.05]" style={{ transform: "scaleX(-1) rotate(6deg) translateX(32px) translateY(40px)" }} />
      <CarIcon className="pointer-events-none fixed top-1/2 left-0 w-36 -translate-x-10 -translate-y-1/2 rotate-6 opacity-[0.04]" />
      <CarIcon className="pointer-events-none fixed top-1/3 right-0 w-28 translate-x-8 opacity-[0.04]" style={{ transform: "scaleX(-1) rotate(-8deg) translateX(32px)" }} />
      {/* subtle dot-grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-4 py-10">
        {/* Header */}
        <div className="anim-fade-up-1 mb-8 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-white/70 hover:text-white flex items-center border border-white/20 rounded-full px-3 py-1 bg-white/10 hover:bg-white/20 transition"
          >
            ← Scheduler
          </button>
          <img src="/SCHEDULE_MAX.png" alt="ScheduleMax" className="h-10 w-auto object-contain rounded" />
          <button
            onClick={openAdd}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: carmaxBlue }}
          >
            + Add
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="anim-fade-up-2 mb-8 rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-5 text-xl font-semibold text-slate-800">
              {editingId ? "Edit Associate" : "New Associate"}
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="e.g. Sales, Finance, BOA"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Employment Type</label>
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={form.isFullTime ? "ft" : "pt"}
                  onChange={(e) => {
                    const isFT = e.target.value === "ft";
                    setForm((f) => ({
                      ...f,
                      isFullTime: isFT,
                      hoursPerWeek: isFT ? 40 : 20,
                      availability: isFT ? null : defaultPTAvailability(),
                    }));
                  }}
                >
                  <option value="ft">Full-Time</option>
                  <option value="pt">Part-Time</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Hours / Week</label>
                <input
                  type="number"
                  min={1}
                  max={45}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={form.hoursPerWeek}
                  onChange={(e) => setForm((f) => ({ ...f, hoursPerWeek: Number(e.target.value) }))}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Preferred Day Off</label>
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={form.preferredDayOff}
                  onChange={(e) => setForm((f) => ({ ...f, preferredDayOff: e.target.value }))}
                >
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-center gap-2 pt-2">
                {[
                  { key: "isLead", label: "Lead / MOD Eligible" },
                  { key: "preferClosing", label: "Prefers Closing Shift" },
                  { key: "isOffSaturday", label: "Off This Saturday" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form[key as keyof FormState] as boolean}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                      className="h-4 w-4 rounded"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* PT Availability */}
            {!form.isFullTime && (
              <div className="mt-5 rounded-xl border border-slate-200 p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">Availability Windows</h3>
                <div className="space-y-2">
                  {DAYS.map((day) => {
                    const window = ptAvail[day];
                    const isAvail = window !== null;
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <label className="flex w-28 cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={isAvail}
                            onChange={(e) => setAvailDay(day, e.target.checked)}
                            className="h-4 w-4 rounded"
                          />
                          {day}
                        </label>
                        {isAvail && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <input
                              type="number"
                              min={7}
                              max={22}
                              className="w-16 rounded border border-slate-300 px-2 py-1 text-center text-sm text-slate-900"
                              value={(window as [number, number])[0]}
                              onChange={(e) => setAvailTime(day, 0, Number(e.target.value))}
                            />
                            <span>–</span>
                            <input
                              type="number"
                              min={7}
                              max={22}
                              className="w-16 rounded border border-slate-300 px-2 py-1 text-center text-sm text-slate-900"
                              value={(window as [number, number])[1]}
                              onChange={(e) => setAvailTime(day, 1, Number(e.target.value))}
                            />
                            <span className="text-slate-400">(24h)</span>
                          </div>
                        )}
                        {!isAvail && <span className="text-sm text-slate-400">Unavailable</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={!form.name.trim()}
                className="rounded-full px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: carmaxBlue }}
              >
                {editingId ? "Save Changes" : "Add Associate"}
              </button>
              <button
                onClick={handleCancel}
                className="rounded-full bg-slate-200 px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Employee List */}
        {employees.length === 0 && !showForm ? (
          <div className="anim-fade-up-3 mt-20 text-center text-slate-400">
            <p className="text-lg font-medium">No associates yet.</p>
            <p className="text-sm mt-1">Click &quot;+ Add&quot; to get started.</p>
          </div>
        ) : (
          <div className="anim-fade-up-3 space-y-3">
            {employees.map((emp) => {
              const isExpanded = !collapsedIds.has(emp.id);
              const avail = emp.availability as Record<string, [number, number] | null> | null;
              return (
              <div key={emp.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-semibold text-slate-800">{emp.name}</p>
                  <p className="text-sm text-slate-500">
                    {emp.role || "No role"} &middot;{" "}
                    {emp.isFullTime ? "Full-Time" : "Part-Time"} &middot;{" "}
                    {emp.hoursPerWeek}h/wk
                    {emp.isLead && <span className="ml-1 text-blue-600 font-medium">&middot; Lead</span>}
                    {emp.isOffSaturday && <span className="ml-1 text-orange-500">&middot; Off Sat</span>}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {confirmDeleteId === emp.id ? (
                    <>
                      <span className="text-sm text-slate-500">Confirm?</span>
                      <button
                        onClick={() => handleDelete(emp.id)}
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
                    <>
                      <button
                        onClick={() => openEdit(emp)}
                        className="rounded-full bg-slate-100 px-4 py-1 text-sm text-slate-700 hover:bg-slate-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(emp.id)}
                        className="rounded-full bg-red-50 px-4 py-1 text-sm text-red-600 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Availability panel */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-5 py-4">
                  <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>Preferred day off: <strong className="text-slate-700">{emp.preferredDayOff}</strong></span>
                    <span>Closing pref: <strong className="text-slate-700">{emp.preferClosing ? "Yes" : "No"}</strong></span>
                  </div>
                  {emp.isFullTime ? (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {DAYS.map((day) => (
                        <div key={day} className={`rounded-lg border p-2 text-center text-xs ${
                          emp.preferredDayOff === day
                            ? "border-orange-200 bg-orange-50 text-orange-600"
                            : "border-slate-100 bg-slate-50 text-slate-600"
                        }`}>
                          <p className="font-semibold">{day.slice(0, 3)}</p>
                          <p className="mt-0.5">{emp.preferredDayOff === day ? "Day off" : "Available"}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {DAYS.map((day) => {
                        const window = avail?.[day] ?? null;
                        const isOff = window === null;
                        const isPrefOff = emp.preferredDayOff === day;
                        return (
                          <div key={day} className={`rounded-lg border p-2 text-center text-xs ${
                            isOff
                              ? "border-slate-200 bg-slate-50 text-slate-400"
                              : isPrefOff
                              ? "border-orange-200 bg-orange-50 text-orange-600"
                              : "border-blue-100 bg-blue-50 text-blue-700"
                          }`}>
                            <p className="font-semibold">{day.slice(0, 3)}</p>
                            {isOff ? (
                              <p className="mt-0.5">N/A</p>
                            ) : (
                              <p className="mt-0.5">
                                {(window as [number,number])[0]}:00–{(window as [number,number])[1]}:00
                                {isPrefOff && <span className="block text-orange-500">Pref. off</span>}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="mt-3 text-center">
                    <button
                      onClick={() => toggleAvail(emp.id)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Hide
                    </button>
                  </div>
                </div>
              )}
              {!isExpanded && (
                <div className="border-t border-slate-100 py-1 text-center">
                  <button
                    onClick={() => toggleAvail(emp.id)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Show Availability
                  </button>
                </div>
              )}
            </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}
