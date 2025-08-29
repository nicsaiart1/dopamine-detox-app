import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { 
  UserSettings, 
  DayLog, 
  ActivityEntry, 
  WeekSummary, 
  ViewType, 
  AppState,
  TimeSeriesPoint,
  CategoryBreakdown,
  Notification,
  MonthlyData,
  StatsData,
  WeeklyProgress
} from '../types/index.ts';
import { repository } from '../data/repository.ts';
import { format } from 'date-fns';

interface AppStore extends AppState {
  // Data
  settings: UserSettings | null;
  currentDay: DayLog | null;
  currentWeek: WeekSummary | null;
  monthlyData: MonthlyData;
  statsData: StatsData;
  weeklyProgress: WeeklyProgress;
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
  saveSettings: (settings: Partial<UserSettings>) => Promise<void>;
  
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
  loadWeekData: (weekId: string) => Promise<void>;
  
  // Month actions
  loadMonthData: (monthId: string) => Promise<void>;
  
  // Stats actions
  loadStatsData: (timeRange: string) => Promise<void>;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  
  // Computed/derived data
  getTimeSeriesData: (days: number) => TimeSeriesPoint[];
  getCategoryBreakdown: () => CategoryBreakdown[];
  getCurrentStreak: () => number;
  getCapUsageToday: () => number;
  getWeeklyProgress: () => { used: number; cap: number; percentage: number };
  fastDopamineSettings: any; // Will be derived from settings
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
      monthlyData: {
        days: [],
        totalMinutes: 0,
        topCategories: [],
        commonTriggers: []
      },
      statsData: {
        timeSeries: [],
        totalDays: 0,
        totalMinutes: 0,
        averageChecklist: 0,
        categoryBreakdown: [],
        topTriggers: [],
        replacementUsage: [],
        weeklyPattern: []
      },
      weeklyProgress: {
        days: [],
        completedDays: 0,
        totalMinutes: 0,
        avgChecklistCompletion: 0
      },
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

      saveSettings: async (settingsUpdate) => {
        try {
          await repository.saveSettings(settingsUpdate);
          await get().loadSettings();
        } catch (error) {
          console.error('Failed to save settings:', error);
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

      loadWeekData: async (weekId) => {
        try {
          // Parse week ID to get date range
          const weekStart = new Date(weekId);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          
          const startDate = format(weekStart, 'yyyy-MM-dd');
          const endDate = format(weekEnd, 'yyyy-MM-dd');
          
          // Get all days and entries for the week
          const days = await repository.getDaysInRange(startDate, endDate);
          const entries = await repository.listEntriesInRange(startDate, endDate);
          
          // Build weekly progress data
          const weekDays = days.map(day => {
            const dayEntries = entries.filter(entry => entry.dayId === day.id);
            
            // Calculate category breakdown for this day
            const categoryMap = dayEntries.reduce((acc, entry) => {
              acc[entry.category] = (acc[entry.category] || 0) + entry.minutes;
              return acc;
            }, {} as Record<string, number>);
            
            const categoryBreakdown = Object.entries(categoryMap)
              .map(([category, minutes]) => ({
                category,
                minutes,
                percentage: day.totalFastMinutes > 0 ? (minutes / day.totalFastMinutes) * 100 : 0
              }))
              .sort((a, b) => b.minutes - a.minutes);
            
            return {
              dayId: day.id,
              totalMinutes: day.totalFastMinutes,
              checklistCompletion: day.checklistCompletion,
              categoryBreakdown
            };
          });
          
          // Calculate week totals
          const completedDays = weekDays.filter(day => day.checklistCompletion >= 80).length;
          const totalMinutes = weekDays.reduce((sum, day) => sum + day.totalMinutes, 0);
          const avgChecklistCompletion = weekDays.length > 0 
            ? weekDays.reduce((sum, day) => sum + day.checklistCompletion, 0) / weekDays.length
            : 0;
          
          const weeklyProgress: WeeklyProgress = {
            days: weekDays,
            completedDays,
            totalMinutes,
            avgChecklistCompletion
          };
          
          set({ weeklyProgress });
        } catch (error) {
          console.error('Failed to load week data:', error);
          // Reset to empty state on error
          set({ 
            weeklyProgress: {
              days: [],
              completedDays: 0,
              totalMinutes: 0,
              avgChecklistCompletion: 0
            }
          });
        }
      },

      // Month management
      loadMonthData: async (monthId) => {
        try {
          // Parse month ID (YYYY-MM) to get start and end dates
          const [year, month] = monthId.split('-');
          const startDate = `${year}-${month}-01`;
          const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
          const endDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;
          
          // Get all days in the month
          const days = await repository.getDaysInRange(startDate, endDate);
          const entries = await repository.listEntriesInRange(startDate, endDate);
          
          // Calculate monthly stats
          const totalMinutes = entries.reduce((sum, entry) => sum + entry.minutes, 0);
          
          // Group entries by category
          const categoryMap = entries.reduce((acc, entry) => {
            acc[entry.category] = (acc[entry.category] || 0) + entry.minutes;
            return acc;
          }, {} as Record<string, number>);
          
          const topCategories = Object.entries(categoryMap)
            .map(([category, minutes]) => ({
              category,
              minutes,
              percentage: totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0
            }))
            .sort((a, b) => b.minutes - a.minutes)
            .slice(0, 10);
          
          // Get common triggers
          const allTriggers = entries.flatMap(entry => entry.triggers);
          const triggerCounts = allTriggers.reduce((acc, trigger) => {
            acc[trigger] = (acc[trigger] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const commonTriggers = Object.entries(triggerCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([trigger]) => trigger);
          
          // Format days data for calendar
          const monthDays = days.map(day => ({
            dayId: day.id,
            totalMinutes: day.totalFastMinutes,
            checklistCompletion: day.checklistCompletion
          }));
          
          const monthlyData: MonthlyData = {
            days: monthDays,
            totalMinutes,
            topCategories,
            commonTriggers
          };
          
          set({ monthlyData, selectedMonth: monthId });
        } catch (error) {
          console.error('Failed to load month data:', error);
          // Reset to empty state on error
          set({ 
            monthlyData: {
              days: [],
              totalMinutes: 0,
              topCategories: [],
              commonTriggers: []
            }
          });
        }
      },

      // Stats management
      loadStatsData: async (timeRange) => {
        try {
          const now = new Date();
          let startDate: string;
          
          // Calculate date range based on timeRange
          switch (timeRange) {
            case '7d':
              startDate = format(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
              break;
            case '30d':
              startDate = format(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
              break;
            case '90d':
              startDate = format(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
              break;
            case '1y':
              startDate = format(new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
              break;
            default:
              startDate = format(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
          }
          
          const endDate = format(now, 'yyyy-MM-dd');
          
          // Get data
          const days = await repository.getDaysInRange(startDate, endDate);
          const entries = await repository.listEntriesInRange(startDate, endDate);
          
          // Build time series
          const timeSeries: TimeSeriesPoint[] = days.map(day => ({
            date: day.id,
            minutes: day.totalFastMinutes,
            checklistCompletion: day.checklistCompletion
          }));
          
          // Calculate totals
          const totalMinutes = entries.reduce((sum, entry) => sum + entry.minutes, 0);
          const totalDays = days.length;
          const averageChecklist = totalDays > 0 
            ? days.reduce((sum, day) => sum + day.checklistCompletion, 0) / totalDays 
            : 0;
          
          // Category breakdown
          const categoryMap = entries.reduce((acc, entry) => {
            acc[entry.category] = (acc[entry.category] || 0) + entry.minutes;
            return acc;
          }, {} as Record<string, number>);
          
          const categoryBreakdown = Object.entries(categoryMap)
            .map(([category, minutes]) => ({
              category,
              minutes,
              percentage: totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0
            }))
            .sort((a, b) => b.minutes - a.minutes);
          
          // Top triggers
          const allTriggers = entries.flatMap(entry => entry.triggers);
          const triggerCounts = allTriggers.reduce((acc, trigger) => {
            acc[trigger] = (acc[trigger] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const topTriggers = Object.entries(triggerCounts)
            .map(([trigger, count]) => ({ trigger, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);
          
          // Replacement usage
          const replacementCounts = entries
            .filter(entry => entry.replacement)
            .reduce((acc, entry) => {
              acc[entry.replacement!] = (acc[entry.replacement!] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
          
          const replacementUsage = Object.entries(replacementCounts)
            .map(([replacement, count]) => ({
              replacement,
              count,
              trend: 'stable' as const
            }))
            .sort((a, b) => b.count - a.count);
          
          // Weekly pattern
          const dayGroups = entries.reduce((acc, entry) => {
            const date = new Date(entry.dayId);
            const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
            acc[dayOfWeek] = acc[dayOfWeek] || [];
            acc[dayOfWeek].push(entry.minutes);
            return acc;
          }, {} as Record<string, number[]>);
          
          const weeklyPattern = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            .map(dayOfWeek => ({
              dayOfWeek,
              averageMinutes: dayGroups[dayOfWeek] 
                ? dayGroups[dayOfWeek].reduce((sum, min) => sum + min, 0) / dayGroups[dayOfWeek].length
                : 0
            }));
          
          const statsData: StatsData = {
            timeSeries,
            totalDays,
            totalMinutes,
            averageChecklist,
            categoryBreakdown,
            topTriggers,
            replacementUsage,
            weeklyPattern
          };
          
          set({ statsData });
        } catch (error) {
          console.error('Failed to load stats data:', error);
          // Reset to empty state on error
          set({ 
            statsData: {
              timeSeries: [],
              totalDays: 0,
              totalMinutes: 0,
              averageChecklist: 0,
              categoryBreakdown: [],
              topTriggers: [],
              replacementUsage: [],
              weeklyPattern: []
            }
          });
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

      // Computed property for fast dopamine settings
      get fastDopamineSettings() {
        const { settings } = get();
        return settings?.fastDopamineSettings || {
          categories: ['Social Media', 'Gaming', 'Video Streaming', 'Shopping'],
          replacements: ['Reading', 'Exercise', 'Meditation', 'Journaling'],
          dailyCaps: []
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
