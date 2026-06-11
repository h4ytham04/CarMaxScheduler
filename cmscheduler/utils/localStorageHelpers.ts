// Matches the Employee constructor in schedulerAlgorithm.js
export interface EmployeeData {
  id: string;
  name: string;
  role: string;
  isFullTime: boolean;
  hoursPerWeek: number;
  isLead: boolean;
  preferredDayOff: string;
  preferClosing: boolean;
  /** null for FT employees; per-day [startHour, endHour] or null for unavailable for PT */
  availability: Record<string, [number, number] | null> | null;
  isOffSaturday: boolean;
}

export interface ShiftEntry {
  name: string;
  shift: string;
  isMOD: boolean;
  warning?: string;
}

export interface ScheduleData {
  id: string;
  weekOf: string;       // "YYYY-MM-DD" of the Monday
  generatedOn: string;  // ISO timestamp
  schedule: Record<string, ShiftEntry[]>;
  warnings: string[];
}

const EMPLOYEES_KEY = "schedulemax_employees";
const SCHEDULES_KEY = "schedulemax_schedules";

// ── Employees ────────────────────────────────────────────────────────────────

export function getEmployees(): EmployeeData[] {
  try {
    const raw = localStorage.getItem(EMPLOYEES_KEY);
    return raw ? (JSON.parse(raw) as EmployeeData[]) : [];
  } catch {
    return [];
  }
}

export function saveEmployees(employees: EmployeeData[]): void {
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
}

export function addEmployee(employee: Omit<EmployeeData, "id">): EmployeeData {
  const employees = getEmployees();
  const newEmployee: EmployeeData = { ...employee, id: crypto.randomUUID() };
  employees.push(newEmployee);
  saveEmployees(employees);
  return newEmployee;
}

export function updateEmployee(id: string, updates: Partial<Omit<EmployeeData, "id">>): void {
  const employees = getEmployees();
  const idx = employees.findIndex((e) => e.id === id);
  if (idx !== -1) {
    employees[idx] = { ...employees[idx], ...updates };
    saveEmployees(employees);
  }
}

export function deleteEmployee(id: string): void {
  saveEmployees(getEmployees().filter((e) => e.id !== id));
}

// ── Schedules ────────────────────────────────────────────────────────────────

export function getSchedules(): ScheduleData[] {
  try {
    const raw = localStorage.getItem(SCHEDULES_KEY);
    return raw ? (JSON.parse(raw) as ScheduleData[]) : [];
  } catch {
    return [];
  }
}

export function saveSchedule(schedule: Omit<ScheduleData, "id">): ScheduleData {
  const schedules = getSchedules();
  const newSchedule: ScheduleData = { ...schedule, id: crypto.randomUUID() };
  schedules.push(newSchedule);
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
  return newSchedule;
}

export function updateSchedule(id: string, updates: Partial<Omit<ScheduleData, "id">>): void {
  const schedules = getSchedules();
  const idx = schedules.findIndex((s) => s.id === id);
  if (idx !== -1) {
    schedules[idx] = { ...schedules[idx], ...updates };
    localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
  }
}

export function getMostRecentSchedule(): ScheduleData | null {
  const schedules = getSchedules();
  return schedules.length > 0 ? schedules[schedules.length - 1] : null;
}

export function deleteSchedule(id: string): void {
  const schedules = getSchedules().filter((s) => s.id !== id);
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
}

// ── AI Settings ──────────────────────────────────────────────────────────────

export interface AISettings {
  enabled: boolean;
  contextPrompt: string;
}

const AI_SETTINGS_KEY = "schedulemax_ai_settings";

const defaultAISettings: AISettings = {
  enabled: false,
  contextPrompt: "",
};

export function getAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(AI_SETTINGS_KEY);
    return raw ? { ...defaultAISettings, ...(JSON.parse(raw) as Partial<AISettings>) } : defaultAISettings;
  } catch {
    return defaultAISettings;
  }
}

export function saveAISettings(settings: AISettings): void {
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
}
