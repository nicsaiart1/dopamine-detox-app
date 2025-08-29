import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  UserSettings, 
  DayLog, 
  ActivityEntry, 
  WeekSummary, 
  ViewType, 
  AppState,
  TimeSeriesPoint,
  CategoryBreakdown,
  Notification
} from '@/types';
import { repository } from '@/data/repository';
import { format } from 'date-fns';

interface AppStore extends AppState {
  // Data
  settings: UserSettings | null;
  currentDay: DayLog | null;
  currentWeek: WeekSummary | null;
  recentEntries: ActivityEntry[];
  notifications: Notification[];

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  init: () => Promise<void>;
  setCurrentView: (view: ViewType) => void;
  setSelectedDate: (date: string) => void;
  
  // Settings actions
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  
  // Day actions
  loadDay: (dayId: string) => Promise<void>;
  updateDayChecklist: (dayId: string, itemId: string, checked: boolean) => Promise<void>;
  updateDayReflections: (dayId: string, reflections: string) => Promise<void>;
  
  // Entry actions
  addEntry: (dayId: string, entryData: Omit<ActivityEntry, 'id' | 'createdAt' | 'dayId'>) => Promise<void>;
  updateEntry: (id: string, patch: Partial<ActivityEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  loadRecentEntries: (dayId: string) => Promise<void>;
  
  // Week actions
  loadWeek: (weekId: string) => Promise<void>;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  
  // Computed/derived data
  getTimeSeriesData: (days: number) => TimeSeriesPoint[];
  getCategoryBreakdown: () => CategoryBreakdown[];
  getCurrentStreak: () => number;
  getCapUsageToday: () => number;
  getWeeklyProgress: () => { used: number; cap: number; percentage: number };
}

const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentView: 'day',
      selectedDate: format(new Date(), 'yyyy-MM-dd'),
      selectedWeek: '',
      selectedMonth: format(new Date(), 'yyyy-MM'),
      settings: null,
      currentDay: null,
      currentWeek: null,
      recentEntries: [],
      notifications: [],
      isLoading: false,
      isInitialized: false,

      // Initialize the app
      init: async () => {
        set({ isLoading: true });
        try {
          await get().loadSettings();
          const today = format(new Date(), 'yyyy-MM-dd');
          await get().loadDay(today);
          await get().loadRecentEntries(today);
          set({ isInitialized: true });
        } catch (error) {
          console.error('Failed to initialize app:', error);
          get().addNotification({
            type: 'error',
            title: 'Initialization Error',
            message: 'Failed to load app data',
          });
        } finally {
          set({ isLoading: false });
        }
      },

      setCurrentView: (view) => set({ currentView: view }),
      
      setSelectedDate: (date) => {
        set({ selectedDate: date });
        // Auto-load the selected day
        get().loadDay(date);
      },

      // Settings
      loadSettings: async () => {
        try {
          const settings = await repository.getSettings();
          set({ settings });
        } catch (error) {
          console.error('Failed to load settings:', error);
          throw error;
        }
      },

      updateSettings: async (settingsUpdate) => {
        try {
          await repository.saveSettings(settingsUpdate);
          await get().loadSettings();
          get().addNotification({
            type: 'success',
            title: 'Settings Updated',
            duration: 3000,
          });
        } catch (error) {
          console.error('Failed to update settings:', error);
          get().addNotification({
            type: 'error',
            title: 'Update Failed',
            message: 'Could not save settings',
          });
        }
      },

      // Day management
      loadDay: async (dayId) => {
        try {
          const day = await repository.getDay(dayId);
          set({ currentDay: day || null });
          
          // Load corresponding week
          const weekId = getWeekIdFromDate(dayId);
          await get().loadWeek(weekId);
        } catch (error) {
          console.error('Failed to load day:', error);
        }
      },

      updateDayChecklist: async (dayId, itemId, checked) => {
        try {
          const currentDay = get().currentDay;
          const existingChecklist = currentDay?.checklist || [];
          
          // Update or add the checklist item
          const updatedChecklist = existingChecklist.filter(item => item.itemId !== itemId);
          updatedChecklist.push({ itemId, checked });

          const updatedDay: DayLog = {
            id: dayId,
            checklist: updatedChecklist,
            reflections: currentDay?.reflections,
            totalFastMinutes: currentDay?.totalFastMinutes || 0,
            replacementUsage: currentDay?.replacementUsage || {},
          };

          await repository.upsertDay(updatedDay);
          set({ currentDay: updatedDay });
        } catch (error) {
          console.error('Failed to update checklist:', error);
          get().addNotification({
            type: 'error',
            title: 'Update Failed',
            message: 'Could not update checklist',
          });
        }
      },

      updateDayReflections: async (dayId, reflections) => {
        try {
          const currentDay = get().currentDay;
          const updatedDay: DayLog = {
            id: dayId,
            checklist: currentDay?.checklist || [],
            reflections,
            totalFastMinutes: currentDay?.totalFastMinutes || 0,
            replacementUsage: currentDay?.replacementUsage || {},
          };

          await repository.upsertDay(updatedDay);
          set({ currentDay: updatedDay });
        } catch (error) {
          console.error('Failed to update reflections:', error);
          get().addNotification({
            type: 'error',
            title: 'Update Failed',
            message: 'Could not save reflections',
          });
        }
      },

      // Entry management
      addEntry: async (dayId, entryData) => {
        try {
          await repository.addEntry({
            ...entryData,
            dayId,
          });
          
          // Reload current day and recent entries
          await get().loadDay(dayId);
          await get().loadRecentEntries(dayId);
          
          get().addNotification({
            type: 'success',
            title: 'Entry Added',
            message: `Logged ${entryData.minutes} minutes`,
            duration: 3000,
          });
        } catch (error) {
          console.error('Failed to add entry:', error);
          get().addNotification({
            type: 'error',
            title: 'Add Failed',
            message: 'Could not log entry',
          });
        }
      },

      updateEntry: async (id, patch) => {
        try {
          await repository.updateEntry(id, patch);
          
          // Reload affected day(s)
          const currentDate = get().selectedDate;
          await get().loadDay(currentDate);
          await get().loadRecentEntries(currentDate);
          
          get().addNotification({
            type: 'success',
            title: 'Entry Updated',
            duration: 3000,
          });
        } catch (error) {
          console.error('Failed to update entry:', error);
          get().addNotification({
            type: 'error',
            title: 'Update Failed',
            message: 'Could not update entry',
          });
        }
      },

      deleteEntry: async (id) => {
        try {
          await repository.deleteEntry(id);
          
          // Reload current day and recent entries
          const currentDate = get().selectedDate;
          await get().loadDay(currentDate);
          await get().loadRecentEntries(currentDate);
          
          get().addNotification({
            type: 'success',
            title: 'Entry Deleted',
            duration: 3000,
          });
        } catch (error) {
          console.error('Failed to delete entry:', error);
          get().addNotification({
            type: 'error',
            title: 'Delete Failed',
            message: 'Could not delete entry',
          });
        }
      },

      loadRecentEntries: async (dayId) => {
        try {
          const entries = await repository.listEntriesByDay(dayId);
          set({ recentEntries: entries });
        } catch (error) {
          console.error('Failed to load recent entries:', error);
        }
      },

      // Week management
      loadWeek: async (weekId) => {
        try {
          const week = await repository.getWeekSummary(weekId);
          set({ currentWeek: week, selectedWeek: weekId });
        } catch (error) {
          console.error('Failed to load week:', error);
        }
      },

      // Notifications
      addNotification: (notification) => {
        const id = Date.now().toString();
        const newNotification = { ...notification, id };
        
        set(state => ({ 
          notifications: [...state.notifications, newNotification] 
        }));

        // Auto-remove notification after duration
        if (notification.duration) {
          setTimeout(() => {
            get().removeNotification(id);
          }, notification.duration);
        }
      },

      removeNotification: (id) => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },

      // Computed properties
      getTimeSeriesData: () => {
        // This would be implemented with actual data fetching
        // For now, return empty array
        return [];
      },

      getCategoryBreakdown: () => {
        const { recentEntries, settings } = get();
        if (!recentEntries.length || !settings) return [];

        const breakdown: Record<string, number> = {};
        const total = recentEntries.reduce((sum, entry) => {
          breakdown[entry.category] = (breakdown[entry.category] || 0) + entry.minutes;
          return sum + entry.minutes;
        }, 0);

        return Object.entries(breakdown).map(([category, minutes], index) => ({
          category,
          minutes,
          percentage: total > 0 ? (minutes / total) * 100 : 0,
          color: `hsl(${(index * 45) % 360}, 70%, 50%)`,
        }));
      },

      getCurrentStreak: () => {
        // Implementation would calculate streak based on historical week data
        return 0;
      },

      getCapUsageToday: () => {
        const { currentDay, settings } = get();
        if (!currentDay || !settings) return 0;

        const dailyCap = settings.weeklyAllowanceMinutes / 7;
        return dailyCap > 0 ? (currentDay.totalFastMinutes / dailyCap) * 100 : 0;
      },

      getWeeklyProgress: () => {
        const { currentWeek } = get();
        if (!currentWeek) return { used: 0, cap: 0, percentage: 0 };

        return {
          used: currentWeek.totalMinutes,
          cap: currentWeek.capMinutes,
          percentage: currentWeek.capUsagePct,
        };
      },
    }),
    { name: 'dopamine-detox-store' }
  )
);

// Helper function
function getWeekIdFromDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

function getWeekNumber(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + start.getDay() + 1) / 7);
}

export default useAppStore;
