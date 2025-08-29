import type { 
  UserSettings, 
  DayLog, 
  ActivityEntry, 
  WeekSummary, 
  UUID,
  ChecklistTemplate 
} from '../types/index.ts';
import { db } from './db.ts';
import { v4 as uuidv4 } from 'uuid';
import { format, startOfWeek, endOfWeek, getISOWeek, getYear } from 'date-fns';

export interface Repository {
  // Settings
  getSettings(): Promise<UserSettings>;
  saveSettings(settings: Partial<UserSettings>): Promise<void>;

  // Days
  upsertDay(day: DayLog): Promise<void>;
  getDay(id: string): Promise<DayLog | undefined>;
  getDaysInRange(startDate: string, endDate: string): Promise<DayLog[]>;

  // Entries
  addEntry(entry: Omit<ActivityEntry, 'id' | 'createdAt'>): Promise<ActivityEntry>;
  updateEntry(id: UUID, patch: Partial<ActivityEntry>): Promise<void>;
  deleteEntry(id: UUID): Promise<void>;
  listEntriesByDay(dayId: string): Promise<ActivityEntry[]>;
  listEntriesInRange(startDate: string, endDate: string): Promise<ActivityEntry[]>;

  // Weeks
  getWeekSummary(weekId: string): Promise<WeekSummary>;
  recomputeWeek(weekId: string): Promise<WeekSummary>;
  getWeeksInRange(startWeek: string, endWeek: string): Promise<WeekSummary[]>;
}

// Default settings and templates
export const DEFAULT_CHECKLIST_TEMPLATE: ChecklistTemplate = [
  {
    id: 's1',
    title: 'Morning',
    items: [
      { id: 'i1', label: 'No phone on wake', defaultChecked: false },
      { id: 'i2', label: '5-10m journal', defaultChecked: false }
    ]
  },
  {
    id: 's2',
    title: 'Daytime',
    items: [
      { id: 'i3', label: 'Deep work block', defaultChecked: false },
      { id: 'i4', label: 'Walk/Exercise', defaultChecked: false }
    ]
  },
  {
    id: 's3',
    title: 'Evening',
    items: [
      { id: 'i5', label: 'Digital sunset 1h', defaultChecked: false },
      { id: 'i6', label: 'Reflection note', defaultChecked: false }
    ]
  }
];

export const DEFAULT_SETTINGS: UserSettings = {
  id: 'singleton',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  weeklyAllowanceMinutes: 240, // 4 hours
  allowanceMode: 'absolute',
  checklistTemplate: DEFAULT_CHECKLIST_TEMPLATE,
  categories: ['scrolling', 'gaming', 'junk food', 'binge shows'],
  replacementCategories: ['reading', 'journaling', 'walk', 'workout', 'meditation'],
  triggerPresets: ['boredom', 'stress', 'fatigue', 'social'],
  theme: 'auto',
  accentHue: 90, // green
  encryptionEnabled: false,
};

class DexieRepository implements Repository {
  // Settings methods
  async getSettings(): Promise<UserSettings> {
    const settings = await db.settings.get('singleton');
    if (!settings) {
      await db.settings.put(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return settings;
  }

  async saveSettings(patch: Partial<UserSettings>): Promise<void> {
    const current = await this.getSettings();
    const updated = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await db.settings.put(updated);
  }

  // Day methods
  async upsertDay(day: DayLog): Promise<void> {
    await db.days.put(day);
  }

  async getDay(id: string): Promise<DayLog | undefined> {
    return await db.days.get(id);
  }

  async getDaysInRange(startDate: string, endDate: string): Promise<DayLog[]> {
    return await db.days
      .where('id')
      .between(startDate, endDate, true, true)
      .toArray();
  }

  // Entry methods
  async addEntry(entryData: Omit<ActivityEntry, 'id' | 'createdAt'>): Promise<ActivityEntry> {
    const entry: ActivityEntry = {
      ...entryData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    await db.entries.add(entry);

    // Update day totals
    await this.recomputeDayTotals(entry.dayId);
    
    // Update week summary
    const weekId = this.getWeekIdFromDate(entry.dayId);
    await this.recomputeWeek(weekId);

    return entry;
  }

  async updateEntry(id: UUID, patch: Partial<ActivityEntry>): Promise<void> {
    const existing = await db.entries.get(id);
    if (!existing) throw new Error(`Entry ${id} not found`);

    const updated = { ...existing, ...patch };
    await db.entries.put(updated);

    // Recompute affected days and weeks
    const affectedDays = new Set([existing.dayId]);
    if (patch.dayId && patch.dayId !== existing.dayId) {
      affectedDays.add(patch.dayId);
    }

    for (const dayId of affectedDays) {
      await this.recomputeDayTotals(dayId);
      const weekId = this.getWeekIdFromDate(dayId);
      await this.recomputeWeek(weekId);
    }
  }

  async deleteEntry(id: UUID): Promise<void> {
    const existing = await db.entries.get(id);
    if (!existing) return;

    await db.entries.delete(id);
    
    // Recompute day and week
    await this.recomputeDayTotals(existing.dayId);
    const weekId = this.getWeekIdFromDate(existing.dayId);
    await this.recomputeWeek(weekId);
  }

  async listEntriesByDay(dayId: string): Promise<ActivityEntry[]> {
    return await db.entries
      .where('dayId')
      .equals(dayId)
      .sortBy('createdAt');
  }

  async listEntriesInRange(startDate: string, endDate: string): Promise<ActivityEntry[]> {
    return await db.entries
      .where('dayId')
      .between(startDate, endDate, true, true)
      .sortBy('createdAt');
  }

  // Week methods
  async getWeekSummary(weekId: string): Promise<WeekSummary> {
    const existing = await db.weeks.get(weekId);
    if (existing) return existing;

    // Create new week summary
    return await this.recomputeWeek(weekId);
  }

  async recomputeWeek(weekId: string): Promise<WeekSummary> {
    const { startDate, endDate } = this.parseWeekId(weekId);
    const entries = await this.listEntriesInRange(startDate, endDate);
    const settings = await this.getSettings();

    const totalMinutes = entries.reduce((sum, entry) => sum + entry.minutes, 0);
    
    const capMinutes = settings.allowanceMode === 'absolute' 
      ? settings.weeklyAllowanceMinutes
      : Math.round((settings.weeklyLeisureMinutes || 2800) * (settings.weeklyAllowanceMinutes / 100));

    const capUsagePct = capMinutes > 0 ? (totalMinutes / capMinutes) * 100 : 0;

    const categoriesBreakdown: Record<string, number> = {};
    const replacementBreakdown: Record<string, number> = {};

    entries.forEach(entry => {
      categoriesBreakdown[entry.category] = (categoriesBreakdown[entry.category] || 0) + entry.minutes;
      if (entry.replacement) {
        replacementBreakdown[entry.replacement] = (replacementBreakdown[entry.replacement] || 0) + 1;
      }
    });

    const weekSummary: WeekSummary = {
      id: weekId,
      startDate,
      endDate,
      totalMinutes,
      capMinutes,
      capUsagePct,
      overCap: capUsagePct > 100,
      categoriesBreakdown,
      replacementBreakdown,
      streakActive: capUsagePct <= 100, // Will be computed properly with streak logic
    };

    await db.weeks.put(weekSummary);
    return weekSummary;
  }

  async getWeeksInRange(startWeek: string, endWeek: string): Promise<WeekSummary[]> {
    return await db.weeks
      .where('id')
      .between(startWeek, endWeek, true, true)
      .toArray();
  }

  // Helper methods
  private async recomputeDayTotals(dayId: string): Promise<void> {
    const entries = await this.listEntriesByDay(dayId);
    const totalFastMinutes = entries.reduce((sum, entry) => sum + entry.minutes, 0);
    
    const replacementUsage: Record<string, number> = {};
    entries.forEach(entry => {
      if (entry.replacement) {
        replacementUsage[entry.replacement] = (replacementUsage[entry.replacement] || 0) + 1;
      }
    });

    const existingDay = await this.getDay(dayId);
    const dayLog: DayLog = {
      id: dayId,
      checklist: existingDay?.checklist || [],
      reflections: existingDay?.reflections,
      totalFastMinutes,
      replacementUsage,
    };

    await this.upsertDay(dayLog);
  }

  private getWeekIdFromDate(dateStr: string): string {
    const date = new Date(dateStr);
    const year = getYear(date);
    const week = getISOWeek(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  private parseWeekId(weekId: string): { startDate: string; endDate: string } {
    const [year, weekNum] = weekId.split('-W');
    const date = new Date(parseInt(year), 0, 1 + (parseInt(weekNum) - 1) * 7);
    const monday = startOfWeek(date, { weekStartsOn: 1 });
    const sunday = endOfWeek(date, { weekStartsOn: 1 });
    
    return {
      startDate: format(monday, 'yyyy-MM-dd'),
      endDate: format(sunday, 'yyyy-MM-dd'),
    };
  }
}

export const repository = new DexieRepository();
