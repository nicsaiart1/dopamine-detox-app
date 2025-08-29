import { useEffect, useState } from 'react';
import useAppStore from '../store/index.ts';
import { Card, CardHeader, CardContent } from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import { clsx } from 'clsx';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format, subDays, subWeeks, subMonths } from 'date-fns';

type TimeRange = '7d' | '30d' | '90d' | '1y';

export default function StatsPage() {
  const {
    statsData,
    loadStatsData
  } = useAppStore();

  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [activeChart, setActiveChart] = useState<'timeline' | 'categories' | 'patterns'>('timeline');

  useEffect(() => {
    loadStatsData(timeRange);
  }, [timeRange, loadStatsData]);

  const getDateRange = (range: TimeRange) => {
    const now = new Date();
    switch (range) {
      case '7d': return { start: subDays(now, 7), end: now };
      case '30d': return { start: subDays(now, 30), end: now };
      case '90d': return { start: subDays(now, 90), end: now };
      case '1y': return { start: subDays(now, 365), end: now };
    }
  };

  const formatDateForChart = (dateStr: string) => {
    const date = new Date(dateStr);
    switch (timeRange) {
      case '7d': return format(date, 'EEE');
      case '30d': return format(date, 'MM/dd');
      case '90d': return format(date, 'MM/dd');
      case '1y': return format(date, 'MMM');
    }
  };

  const pieColors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1',
    '#d084d0', '#ffb347', '#87ceeb', '#98fb98', '#f0e68c'
  ];

  const getInsights = () => {
    if (!statsData.timeSeries.length) return [];

    const insights = [];
    const totalDays = statsData.timeSeries.length;
    const avgMinutes = statsData.totalMinutes / totalDays;
    const avgChecklist = statsData.timeSeries.reduce((sum, day) => sum + day.checklistCompletion, 0) / totalDays;

    // Trend analysis
    const recentDays = statsData.timeSeries.slice(-7);
    const earlierDays = statsData.timeSeries.slice(0, 7);
    
    if (recentDays.length && earlierDays.length) {
      const recentAvg = recentDays.reduce((sum, day) => sum + day.minutes, 0) / recentDays.length;
      const earlierAvg = earlierDays.reduce((sum, day) => sum + day.minutes, 0) / earlierDays.length;
      const improvement = ((earlierAvg - recentAvg) / earlierAvg) * 100;

      if (improvement > 10) {
        insights.push({
          type: 'positive',
          title: 'Great Progress!',
          description: `Your daily average has improved by ${improvement.toFixed(0)}% recently.`
        });
      } else if (improvement < -10) {
        insights.push({
          type: 'warning',
          title: 'Trend Alert',
          description: `Daily usage has increased by ${Math.abs(improvement).toFixed(0)}% recently.`
        });
      }
    }

    // Streak analysis
    let currentStreak = 0;
    for (let i = statsData.timeSeries.length - 1; i >= 0; i--) {
      if (statsData.timeSeries[i].checklistCompletion >= 80) {
        currentStreak++;
      } else {
        break;
      }
    }

    if (currentStreak >= 7) {
      insights.push({
        type: 'positive',
        title: 'Strong Streak!',
        description: `You've maintained good habits for ${currentStreak} days in a row.`
      });
    }

    // Category insights
    const topCategory = statsData.categoryBreakdown[0];
    if (topCategory && topCategory.percentage > 40) {
      insights.push({
        type: 'info',
        title: 'Focus Area',
        description: `${topCategory.category} accounts for ${topCategory.percentage.toFixed(0)}% of your time.`
      });
    }

    return insights;
  };

  const insights = getInsights();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Analytics & Insights</h2>
            
            <div className="flex gap-2">
              {(['7d', '30d', '90d', '1y'] as TimeRange[]).map(range => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'primary' : 'outline'}
                  onClick={() => setTimeRange(range)}
                  className="text-sm"
                >
                  {range.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {statsData.totalDays}
              </div>
              <div className="text-sm text-gray-600">Days Tracked</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {statsData.totalMinutes}
              </div>
              <div className="text-sm text-gray-600">Total Minutes</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {statsData.totalDays > 0 ? (statsData.totalMinutes / statsData.totalDays).toFixed(1) : '0'}
              </div>
              <div className="text-sm text-gray-600">Avg/Day</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {statsData.averageChecklist.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Avg Checklist</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Toggle */}
      <Card>
        <CardHeader>
          <div className="flex gap-2">
            {[
              { key: 'timeline', label: 'Timeline' },
              { key: 'categories', label: 'Categories' },
              { key: 'patterns', label: 'Patterns' }
            ].map(chart => (
              <Button
                key={chart.key}
                variant={activeChart === chart.key ? 'primary' : 'outline'}
                onClick={() => setActiveChart(chart.key as any)}
              >
                {chart.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {activeChart === 'timeline' && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={statsData.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDateForChart}
                  />
                  <YAxis yAxisId="minutes" orientation="left" />
                  <YAxis yAxisId="checklist" orientation="right" />
                  <Tooltip 
                    labelFormatter={(value: any) => format(new Date(value), 'MMM d, yyyy')}
                    formatter={(value: any, name: string) => [
                      name === 'minutes' ? `${value}m` : `${value}%`,
                      name === 'minutes' ? 'Fast Dopamine' : 'Checklist'
                    ]}
                  />
                  <Line 
                    yAxisId="minutes"
                    type="monotone" 
                    dataKey="minutes" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line 
                    yAxisId="checklist"
                    type="monotone" 
                    dataKey="checklistCompletion" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeChart === 'categories' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statsData.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category}: ${percentage.toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="minutes"
                    >
                      {statsData.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value}m`, 'Minutes']} />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Category Breakdown</h4>
                  {statsData.categoryBreakdown.map((category, index) => (
                    <div key={category.category} className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: pieColors[index % pieColors.length] }}
                      />
                      <span className="flex-1 text-sm">{category.category}</span>
                      <span className="text-sm font-medium">{category.minutes}m</span>
                      <span className="text-sm text-gray-600">({category.percentage.toFixed(0)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeChart === 'patterns' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsData.weeklyPattern}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dayOfWeek" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`${value}m`, 'Average Minutes']} />
                  <Bar dataKey="averageMinutes" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Insights & Recommendations</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div 
                  key={index}
                  className={clsx(
                    'p-4 rounded-lg border-l-4',
                    {
                      'border-green-500 bg-green-50': insight.type === 'positive',
                      'border-yellow-500 bg-yellow-50': insight.type === 'warning',
                      'border-blue-500 bg-blue-50': insight.type === 'info'
                    }
                  )}
                >
                  <h4 className="font-semibold mb-1">{insight.title}</h4>
                  <p className="text-sm text-gray-700">{insight.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Top Triggers</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statsData.topTriggers.slice(0, 10).map((trigger, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{trigger.trigger}</span>
                  <span className="text-sm font-medium text-gray-600">{trigger.count}x</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Replacement Activities</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statsData.replacementUsage.slice(0, 10).map((replacement, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{replacement.category}</span>
                    <span className="text-sm text-gray-600">{replacement.count}x</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ 
                        width: `${(replacement.count / Math.max(...statsData.replacementUsage.map(r => r.count))) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Over Time */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Progress Summary</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-3">Best Performing Days</h4>
              <div className="space-y-2">
                {statsData.timeSeries
                  .filter(day => day.checklistCompletion >= 90)
                  .sort((a, b) => b.checklistCompletion - a.checklistCompletion)
                  .slice(0, 5)
                  .map(day => (
                    <div key={day.date} className="flex justify-between text-sm">
                      <span>{format(new Date(day.date), 'MMM d')}</span>
                      <span className="text-green-600 font-medium">{day.checklistCompletion}%</span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Lowest Activity Days</h4>
              <div className="space-y-2">
                {statsData.timeSeries
                  .filter(day => day.minutes <= 15)
                  .sort((a, b) => a.minutes - b.minutes)
                  .slice(0, 5)
                  .map(day => (
                    <div key={day.date} className="flex justify-between text-sm">
                      <span>{format(new Date(day.date), 'MMM d')}</span>
                      <span className="text-green-600 font-medium">{day.minutes}m</span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Weekly Averages</h4>
              <div className="space-y-2">
                {statsData.weeklyPattern.map(pattern => (
                  <div key={pattern.dayOfWeek} className="flex justify-between text-sm">
                    <span>{pattern.dayOfWeek}</span>
                    <span className="font-medium">{pattern.averageMinutes.toFixed(1)}m</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}