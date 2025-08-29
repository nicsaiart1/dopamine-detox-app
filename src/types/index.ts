// Core entities
export type UUID = string;

export interface UserSettings {
  id: 'singleton';
  createdAt: string; // ISO
  updatedAt: string; // ISO
  weeklyAllowanceMinutes: number; // e.g., 240
  allowanceMode: 'absolute' | 'percentOfLeisure';
  weeklyLeisureMinutes?: number; // used if allowanceMode === 'percentOfLeisure'
  checklistTemplate: ChecklistTemplate; // default daily checklist
  categories: string[]; // fast-dopamine categories
  replacementCategories: string[];
  triggerPresets: string[];
  theme: 'light' | 'dark' | 'auto';
  accentHue: number; // 90=green, 48=gold
  encryptionEnabled: boolean;
}

export interface ChecklistTemplateSection {
  id: UUID;
  title: 'Morning' | 'Daytime' | 'Evening' | string;
  items: { id: UUID; label: string; defaultChecked?: boolean }[];
}
export type ChecklistTemplate = ChecklistTemplateSection[];

export interface DayLog {
  id: string; // YYYY-MM-DD
  checklist: { itemId: UUID; checked: boolean }[];
  reflections?: string;
  // denormalized totals for fast display
  totalFastMinutes: number;
  replacementUsage: Record<string, number>; // counts per replacement category
}

export interface ActivityEntry {
  id: UUID;
  dayId: string; // YYYY-MM-DD
  minutes: number;
  category: string; // fast-dopamine category
  triggers: string[];
  note?: string;
  replacement?: string; // replacement category used
  createdAt: string;
}

export interface WeekSummary {
  id: string; // ISO week, e.g., 2025-W35
  startDate: string; // Monday
  endDate: string;   // Sunday
  totalMinutes: number;
  capMinutes: number;
  capUsagePct: number; // 0..100
  overCap: boolean;
  categoriesBreakdown: Record<string, number>;
  replacementBreakdown: Record<string, number>;
  streakActive: boolean;
}

// View types
export type ViewType = 'day' | 'week' | 'month' | 'stats' | 'settings';

// Chart data types
export interface TimeSeriesPoint {
  date: string;
  minutes: number;
  ma7?: number; // 7-day moving average
}

export interface CategoryBreakdown {
  category: string;
  minutes: number;
  percentage: number;
  color: string;
}

export interface ReplacementUsage {
  replacement: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

// Navigation and state types
export interface AppState {
  currentView: ViewType;
  selectedDate: string; // YYYY-MM-DD
  selectedWeek: string; // YYYY-Www
  selectedMonth: string; // YYYY-MM
}

// Form types
export interface ActivityFormData {
  minutes: number;
  category: string;
  triggers: string[];
  note?: string;
  replacement?: string;
}

export type SettingsFormData = Partial<Omit<UserSettings, 'id' | 'createdAt' | 'updatedAt'>>;

// Export types
export interface ExportData {
  schemaVersion: number;
  exportedAt: string;
  settings: UserSettings;
  days: DayLog[];
  entries: ActivityEntry[];
  weeks: WeekSummary[];
}

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // ms, undefined for persistent
}
