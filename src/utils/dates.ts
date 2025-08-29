import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  getISOWeek, 
  getYear,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isYesterday,
  isTomorrow
} from 'date-fns';

export const DATE_FORMAT = 'yyyy-MM-dd';
export const WEEK_FORMAT = 'yyyy-\\WWW';
export const MONTH_FORMAT = 'yyyy-MM';

export function formatDate(date: Date | string, formatStr: string = DATE_FORMAT): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr);
}

export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

export function getToday(): string {
  return formatDate(new Date());
}

export function getYesterday(): string {
  return formatDate(subDays(new Date(), 1));
}

export function getTomorrow(): string {
  return formatDate(addDays(new Date(), 1));
}

export function getWeekId(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = getYear(d);
  const week = getISOWeek(d);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

export function getWeekRange(weekId: string): { start: string; end: string } {
  const [year, weekNum] = weekId.split('-W');
  const yearNum = parseInt(year);
  const weekNumInt = parseInt(weekNum);
  
  // Create date for first day of year, then add weeks
  const jan1 = new Date(yearNum, 0, 1);
  const firstMonday = startOfWeek(jan1, { weekStartsOn: 1 });
  
  // If Jan 1 is after Thursday, the first week is the next week
  const weekStart = addDays(firstMonday, (weekNumInt - 1) * 7);
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  
  return {
    start: formatDate(weekStart),
    end: formatDate(weekEnd)
  };
}

export function getMonthRange(monthStr: string): { start: string; end: string } {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  
  return {
    start: formatDate(startOfMonth(date)),
    end: formatDate(endOfMonth(date))
  };
}

export function getDaysInMonth(monthStr: string): string[] {
  const { start, end } = getMonthRange(monthStr);
  const days = eachDayOfInterval({
    start: parseDate(start),
    end: parseDate(end)
  });
  
  return days.map(day => formatDate(day));
}

export function getDaysInWeek(weekId: string): string[] {
  const { start, end } = getWeekRange(weekId);
  const days = eachDayOfInterval({
    start: parseDate(start),
    end: parseDate(end)
  });
  
  return days.map(day => formatDate(day));
}

export function getRelativeDateLabel(dateStr: string): string {
  const date = parseDate(dateStr);
  
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isTomorrow(date)) return 'Tomorrow';
  
  return format(date, 'MMM d, yyyy');
}

export function getWeekLabel(weekId: string): string {
  const { start, end } = getWeekRange(weekId);
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  
  return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
}

export function getMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return format(date, 'MMMM yyyy');
}

export function isDateInCurrentWeek(dateStr: string): boolean {
  const date = parseDate(dateStr);
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  
  return date >= weekStart && date <= weekEnd;
}

export function isDateInCurrentMonth(dateStr: string): boolean {
  const date = parseDate(dateStr);
  const now = new Date();
  
  return date.getMonth() === now.getMonth() && 
         date.getFullYear() === now.getFullYear();
}

export function calculateMovingAverage(
  data: Array<{ date: string; value: number }>, 
  windowSize: number = 7
): Array<{ date: string; value: number; ma: number }> {
  return data.map((item, index) => {
    const startIndex = Math.max(0, index - windowSize + 1);
    const window = data.slice(startIndex, index + 1);
    const ma = window.reduce((sum, w) => sum + w.value, 0) / window.length;
    
    return {
      date: item.date,
      value: item.value,
      ma: Number(ma.toFixed(1))
    };
  });
}
