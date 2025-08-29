import { useEffect, useState } from 'react';
import useAppStore from '../store/index.ts';
import { Card, CardHeader, CardContent } from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import { clsx } from 'clsx';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from 'date-fns';

export default function WeekPage() {
  const {
    selectedDate,
    setSelectedDate,
    currentWeek,
    weeklyProgress,
    fastDopamineSettings,
    loadWeekData
  } = useAppStore();

  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(selectedDate), { weekStartsOn: 1 })
  );

  useEffect(() => {
    const weekId = format(currentWeekStart, 'yyyy-MM-dd');
    loadWeekData(weekId);
  }, [currentWeekStart, loadWeekData]);

  const weekDays = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart, { weekStartsOn: 1 })
  });

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'prev' 
      ? subWeeks(currentWeekStart, 1)
      : addWeeks(currentWeekStart, 1);
    setCurrentWeekStart(newWeek);
  };

  const getDayProgress = (date: Date) => {
    const dayId = format(date, 'yyyy-MM-dd');
    return weeklyProgress.days.find(d => d.dayId === dayId);
  };

  const getCapStatus = (usedMinutes: number, capMinutes: number) => {
    const percentage = (usedMinutes / capMinutes) * 100;
    if (percentage >= 100) return 'exceeded';
    if (percentage >= 80) return 'warning';
    if (percentage >= 50) return 'moderate';
    return 'good';
  };

  const getCapColor = (status: string) => {
    switch (status) {
      case 'exceeded': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'moderate': return 'bg-blue-500';
      case 'good': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => navigateWeek('prev')}
              className="flex items-center gap-2"
            >
              ← Previous Week
            </Button>
            
            <div className="text-center">
              <h2 className="text-xl font-semibold">
                {format(currentWeekStart, 'MMM d')} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}
              </h2>
              <p className="text-sm text-gray-600">
                Week {format(currentWeekStart, 'w')} of {format(currentWeekStart, 'yyyy')}
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={() => navigateWeek('next')}
              className="flex items-center gap-2"
            >
              Next Week →
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Week Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {weeklyProgress.completedDays}
              </div>
              <div className="text-sm text-gray-600">Days Completed</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {weeklyProgress.totalMinutes}
              </div>
              <div className="text-sm text-gray-600">Total Minutes</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {weeklyProgress.avgChecklistCompletion.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Avg Checklist</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Calendar Grid */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Daily Progress</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map(date => {
              const dayProgress = getDayProgress(date);
              const isToday = isSameDay(date, new Date());
              const isSelected = isSameDay(date, new Date(selectedDate));
              
              return (
                <div
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(format(date, 'yyyy-MM-dd'))}
                  className={clsx(
                    'relative p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50',
                    {
                      'border-accent-500 bg-accent-50': isSelected,
                      'border-blue-300 bg-blue-50': isToday && !isSelected,
                      'border-gray-200': !isSelected && !isToday
                    }
                  )}
                >
                  <div className="text-center">
                    <div className="text-lg font-medium">
                      {format(date, 'd')}
                    </div>
                    
                    {dayProgress && (
                      <div className="mt-2 space-y-1">
                        {/* Checklist Progress */}
                        <div className="flex items-center justify-center">
                          <div className="w-8 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 transition-all"
                              style={{ width: `${dayProgress.checklistCompletion}%` }}
                            />
                          </div>
                        </div>
                        
                        {/* Fast Dopamine Minutes */}
                        <div className="text-xs text-center">
                          {dayProgress.totalMinutes}m
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Daily Caps Tracking */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Daily Caps Status</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(fastDopamineSettings?.dailyCaps || []).map(cap => {
              const weekUsage = (weeklyProgress?.days || []).map(day => {
                const dayTotal = (day.categoryBreakdown || [])
                  .filter(cat => cap.categories.includes(cat.category))
                  .reduce((sum, cat) => sum + cat.minutes, 0);
                return {
                  dayId: day.dayId,
                  minutes: dayTotal,
                  status: getCapStatus(dayTotal, cap.maxMinutes)
                };
              });

              return (
                <div key={cap.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{cap.name}</h4>
                    <span className="text-sm text-gray-600">
                      {cap.maxMinutes} min/day
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {weekDays.map((date, index) => {
                      const usage = weekUsage[index];
                      const percentage = Math.min((usage?.minutes || 0) / cap.maxMinutes * 100, 100);
                      
                      return (
                        <div key={date.toISOString()} className="space-y-1">
                          <div className="text-xs text-center text-gray-600">
                            {format(date, 'd')}
                          </div>
                          <div className="h-8 bg-gray-200 rounded relative overflow-hidden">
                            <div 
                              className={clsx(
                                'absolute bottom-0 left-0 right-0 transition-all',
                                getCapColor(usage?.status || 'good')
                              )}
                              style={{ height: `${percentage}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                              {usage?.minutes || 0}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Week Summary */}
      {currentWeek && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Week Summary</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Most Used Categories</h4>
                <div className="space-y-2">
                  {(currentWeek?.categoryBreakdown || [])
                    .sort((a, b) => b.minutes - a.minutes)
                    .slice(0, 5)
                    .map(cat => (
                      <div key={cat.category} className="flex justify-between items-center">
                        <span className="text-sm">{cat.category}</span>
                        <span className="text-sm font-medium">{cat.minutes}m</span>
                      </div>
                    ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Common Triggers</h4>
                <div className="space-y-1">
                  {(currentWeek?.commonTriggers || []).slice(0, 5).map((trigger, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      • {trigger}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {currentWeek?.reflectionNotes && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">Week Reflection</h4>
                <p className="text-sm text-gray-700">{currentWeek.reflectionNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}