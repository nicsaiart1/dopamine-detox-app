import Dexie from 'dexie';
import type { UserSettings, DayLog, ActivityEntry, WeekSummary } from '../types/index.ts';

export class DB extends Dexie {
  settings!: Dexie.Table<UserSettings, string>;
  days!: Dexie.Table<DayLog, string>;
  entries!: Dexie.Table<ActivityEntry, string>;
  weeks!: Dexie.Table<WeekSummary, string>;

  constructor() {
    super('dopamine_detox');
    
    this.version(1).stores({
      settings: 'id',
      days: 'id',
      entries: '++id, dayId, createdAt',
      weeks: 'id, startDate'
    });
  }
}

export const db = new DB();
