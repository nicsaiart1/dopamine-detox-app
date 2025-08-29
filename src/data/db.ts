import Dexie, { Table } from 'dexie';
import { UserSettings, DayLog, ActivityEntry, WeekSummary } from '@/types';

export class DB extends Dexie {
  settings!: Table<UserSettings, string>;
  days!: Table<DayLog, string>;
  entries!: Table<ActivityEntry, string>;
  weeks!: Table<WeekSummary, string>;

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
