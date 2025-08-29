import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { ViewType } from '@/types';
import useAppStore from '@/store';
import Button from './ui/Button';
import { Card } from './ui/Card';
import { format } from 'date-fns';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { 
    currentView, 
    setCurrentView, 
    selectedDate, 
    setSelectedDate,
    getWeeklyProgress,
    notifications,
    removeNotification
  } = useAppStore();

  const weeklyProgress = getWeeklyProgress();

  const navItems: Array<{ view: ViewType; label: string; icon: string }> = [
    { view: 'day', label: 'Day', icon: '📅' },
    { view: 'week', label: 'Week', icon: '📊' },
    { view: 'month', label: 'Month', icon: '🗓️' },
    { view: 'stats', label: 'Stats', icon: '📈' },
  ];

  const handleDateChange = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate);
    if (direction === 'prev') {
      date.setDate(date.getDate() - 1);
    } else {
      date.setDate(date.getDate() + 1);
    }
    setSelectedDate(format(date, 'yyyy-MM-dd'));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
              <span className="text-sm font-bold">DD</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Dopamine Detox
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={clsx(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  currentView === item.view
                    ? 'bg-accent/10 text-accent'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                )}
              >
                <span>{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Weekly Progress Indicator */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <span>Week:</span>
                <span className="font-medium">
                  {weeklyProgress.used}m/{weeklyProgress.cap}m
                </span>
              </div>
              <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={clsx(
                    'h-full transition-all duration-300',
                    weeklyProgress.percentage <= 100 ? 'bg-accent' : 'bg-red-500'
                  )}
                  style={{ width: `${Math.min(weeklyProgress.percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Date Navigation (for Day view) */}
        {currentView === 'day' && (
          <div className="border-t border-gray-200 bg-gray-50/50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="container mx-auto flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDateChange('prev')}
              >
                ←
              </Button>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {format(new Date(selectedDate), 'EEEE, MMM d')}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDateChange('next')}
              >
                →
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              variant="elevated"
              className={clsx(
                'w-80 animate-in p-4 transition-all duration-300',
                {
                  'border-l-4 border-green-500': notification.type === 'success',
                  'border-l-4 border-red-500': notification.type === 'error',
                  'border-l-4 border-yellow-500': notification.type === 'warning',
                  'border-l-4 border-blue-500': notification.type === 'info',
                }
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {notification.title}
                  </h4>
                  {notification.message && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {notification.message}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
