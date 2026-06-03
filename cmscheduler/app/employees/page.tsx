"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  EmployeeData,
} from "@/utils/localStorageHelpers";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

const carmaxBlue = "#003366";

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
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-slate-800">Associates</h1>
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
          <div className="mb-8 rounded-2xl bg-white p-6 shadow-lg">
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
          <div className="mt-20 text-center text-slate-400">
            <p className="text-lg font-medium">No associates yet.</p>
            <p className="text-sm mt-1">Click &quot;+ Add&quot; to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between rounded-xl bg-white px-5 py-4 shadow-sm"
              >
                <div>
                  <p className="font-semibold text-slate-800">{emp.name}</p>
                  <p className="text-sm text-slate-500">
                    {emp.role || "No role"} &middot;{" "}
                    {emp.isFullTime ? "Full-Time" : "Part-Time"} &middot;{" "}
                    {emp.hoursPerWeek}h/wk
                    {emp.isLead && <span className="ml-1 text-blue-600 font-medium">· Lead</span>}
                    {emp.isOffSaturday && <span className="ml-1 text-orange-500">· Off Sat</span>}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
