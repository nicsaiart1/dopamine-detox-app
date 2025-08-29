import { useEffect, useState } from 'react';
import useAppStore from '../store/index.ts';
import { Card, CardHeader, CardContent } from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import { clsx } from 'clsx';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth,
  addMonths, 
  subMonths,
  getDay,
  startOfWeek
} from 'date-fns';

export default function MonthPage() {
  const {
    selectedDate,
    setSelectedDate,
    monthlyData,
    loadMonthData
  } = useAppStore();

  const [currentMonth, setCurrentMonth] = useState(() => 
    startOfMonth(new Date(selectedDate))
  );

  useEffect(() => {
    const monthId = format(currentMonth, 'yyyy-MM');
    loadMonthData(monthId);
  }, [currentMonth, loadMonthData]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = direction === 'prev' 
      ? subMonths(currentMonth, 1)
      : addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
  };

  // Generate calendar grid (6 weeks to show full calendar)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfMonth(addMonths(calendarStart, 1));
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  }).slice(0, 42); // Ensure we have exactly 6 weeks

  const getDayData = (date: Date) => {
    const dayId = format(date, 'yyyy-MM-dd');
    return monthlyData.days.find(d => d.dayId === dayId);
  };

  const getMonthStats = () => {
    const daysWithData = monthlyData.days.length;
    const totalMinutes = monthlyData.days.reduce((sum, day) => sum + day.totalMinutes, 0);
    const avgChecklist = daysWithData > 0 
      ? monthlyData.days.reduce((sum, day) => sum + day.checklistCompletion, 0) / daysWithData
      : 0;
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd }).length;
    const completionRate = (daysWithData / daysInMonth) * 100;

    return {
      daysTracked: daysWithData,
      totalDays: daysInMonth,
      completionRate,
      totalMinutes,
      avgChecklist
    };
  };

  const stats = getMonthStats();

  const getDayIntensity = (dayData: any) => {
    if (!dayData) return 0;
    // Calculate intensity based on fast-dopamine minutes (0-4 scale)
    const minutes = dayData.totalMinutes;
    if (minutes === 0) return 0;
    if (minutes <= 30) return 1;
    if (minutes <= 60) return 2;
    if (minutes <= 120) return 3;
    return 4;
  };

  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0: return 'bg-gray-100';
      case 1: return 'bg-green-200';
      case 2: return 'bg-yellow-200';
      case 3: return 'bg-orange-300';
      case 4: return 'bg-red-400';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => navigateMonth('prev')}
              className="flex items-center gap-2"
            >
              ← Previous Month
            </Button>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
            </div>
            
            <Button
              variant="outline"
              onClick={() => navigateMonth('next')}
              className="flex items-center gap-2"
            >
              Next Month →
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Monthly Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.daysTracked}/{stats.totalDays}
              </div>
              <div className="text-sm text-gray-600">Days Tracked</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.completionRate.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalMinutes}
              </div>
              <div className="text-sm text-gray-600">Total Minutes</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.avgChecklist.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Avg Checklist</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Monthly Overview</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 rounded"></div>
                <span>No data</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-200 rounded"></div>
                <span>Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-200 rounded"></div>
                <span>Moderate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-300 rounded"></div>
                <span>High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-400 rounded"></div>
                <span>Very High</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(date => {
              const dayData = getDayData(date);
              const isToday = isSameDay(date, new Date());
              const isSelected = isSameDay(date, new Date(selectedDate));
              const isCurrentMonth = isSameMonth(date, currentMonth);
              const intensity = getDayIntensity(dayData);
              
              return (
                <div
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(format(date, 'yyyy-MM-dd'))}
                  className={clsx(
                    'relative aspect-square p-1 border rounded-lg cursor-pointer transition-all hover:scale-105',
                    {
                      'border-accent-500 ring-2 ring-accent-500': isSelected,
                      'border-blue-300': isToday && !isSelected,
                      'border-gray-200': !isSelected && !isToday,
                      'opacity-50': !isCurrentMonth
                    },
                    getIntensityColor(intensity)
                  )}
                >
                  <div className="h-full flex flex-col">
                    <div className={clsx(
                      'text-sm font-medium text-center',
                      {
                        'text-gray-400': !isCurrentMonth,
                        'text-blue-600 font-bold': isToday,
                        'text-gray-900': isCurrentMonth && !isToday
                      }
                    )}>
                      {format(date, 'd')}
                    </div>
                    
                    {dayData && isCurrentMonth && (
                      <div className="flex-1 flex flex-col justify-center items-center text-xs">
                        <div className="w-full bg-white bg-opacity-70 rounded px-1 py-0.5 text-center">
                          <div className="font-medium">{dayData.totalMinutes}m</div>
                          <div className="text-xs text-gray-600">
                            {dayData.checklistCompletion}%
                          </div>
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

      {/* Monthly Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Top Categories</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyData.topCategories.slice(0, 8).map((category, index) => {
                const percentage = monthlyData.totalMinutes > 0 
                  ? (category.minutes / monthlyData.totalMinutes) * 100 
                  : 0;
                
                return (
                  <div key={category.category} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{category.category}</span>
                      <span className="text-sm text-gray-600">{category.minutes}m</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-accent-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Patterns & Trends</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Best Days</h4>
                <div className="space-y-1">
                  {monthlyData.days
                    .filter(day => day.checklistCompletion >= 80)
                    .sort((a, b) => b.checklistCompletion - a.checklistCompletion)
                    .slice(0, 3)
                    .map(day => (
                      <div key={day.dayId} className="flex justify-between text-sm">
                        <span>{format(new Date(day.dayId), 'MMM d')}</span>
                        <span className="text-green-600">{day.checklistCompletion}%</span>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">Challenging Days</h4>
                <div className="space-y-1">
                  {monthlyData.days
                    .filter(day => day.totalMinutes > 60)
                    .sort((a, b) => b.totalMinutes - a.totalMinutes)
                    .slice(0, 3)
                    .map(day => (
                      <div key={day.dayId} className="flex justify-between text-sm">
                        <span>{format(new Date(day.dayId), 'MMM d')}</span>
                        <span className="text-red-600">{day.totalMinutes}m</span>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">Common Triggers</h4>
                <div className="space-y-1">
                  {monthlyData.commonTriggers.slice(0, 5).map((trigger, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      • {trigger}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}