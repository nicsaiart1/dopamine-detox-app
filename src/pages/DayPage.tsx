import { useEffect } from 'react';
import useAppStore from '@/store';
import DayChecklist from '@/components/DayChecklist';
import FastLogPanel from '@/components/FastLogPanel';
import { Card, CardContent } from '@/components/ui/Card';
import { getRelativeDateLabel } from '@/utils/dates';

export default function DayPage() {
  const {
    selectedDate,
    currentDay,
    recentEntries,
    settings,
    isLoading,
    loadDay,
    loadRecentEntries,
  } = useAppStore();

  useEffect(() => {
    if (selectedDate) {
      loadDay(selectedDate);
      loadRecentEntries(selectedDate);
    }
  }, [selectedDate, loadDay, loadRecentEntries]);

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Loading day...</p>
        </div>
      </div>
    );
  }

  const dateLabel = getRelativeDateLabel(selectedDate);
  const totalMinutes = currentDay?.totalFastMinutes || 0;
  const dailyCap = settings.weeklyAllowanceMinutes / 7;
  const capUsage = dailyCap > 0 ? (totalMinutes / dailyCap) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {dateLabel}
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Focus on your dopamine detox goals
        </p>
      </div>

      {/* Daily Stats */}
      <Card variant="outlined">
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalMinutes}m
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Fast-dopamine used
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.round(dailyCap)}m
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Daily allowance
              </div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                capUsage <= 100 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {Math.round(capUsage)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Cap usage
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className={`h-full transition-all duration-300 ${
                  capUsage <= 100 ? 'bg-accent' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(capUsage, 100)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>0m</span>
              <span>{Math.round(dailyCap)}m</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Checklist */}
        <DayChecklist
          day={currentDay}
          template={settings.checklistTemplate}
          dayId={selectedDate}
        />

        {/* Fast-Dopamine Log */}
        <FastLogPanel
          dayId={selectedDate}
          entries={recentEntries}
        />
      </div>

      {/* Motivational Message */}
      {capUsage <= 100 && (
        <Card variant="outlined" className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
          <CardContent className="py-4 text-center">
            <p className="text-green-700 dark:text-green-300">
              {capUsage <= 50 
                ? "🎉 Great job staying within your limits!" 
                : capUsage <= 80
                ? "💪 You're doing well - stay mindful!"
                : "⚠️ Approaching your daily cap - stay strong!"
              }
            </p>
          </CardContent>
        </Card>
      )}

      {capUsage > 100 && (
        <Card variant="outlined" className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
          <CardContent className="py-4 text-center">
            <p className="text-red-700 dark:text-red-300">
              You've exceeded your daily cap. That's okay - tomorrow is a fresh start! 🌅
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
