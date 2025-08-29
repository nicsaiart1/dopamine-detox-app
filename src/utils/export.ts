import { ExportData, WeekSummary } from '@/types';
import { repository } from '@/data/repository';
import { getWeekRange, formatDate, getWeekLabel } from './dates';
import { format } from 'date-fns';

export const SCHEMA_VERSION = 1;

export async function exportToJSON(): Promise<string> {
  const settings = await repository.getSettings();
  
  // For now, export recent data (could be made configurable)
  const endDate = formatDate(new Date());
  const startDate = formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 days ago
  
  const days = await repository.getDaysInRange(startDate, endDate);
  const entries = await repository.listEntriesInRange(startDate, endDate);
  
  // Get weeks for this period
  const weekIds = new Set<string>();
  entries.forEach(entry => {
    const weekId = getWeekIdFromDate(entry.dayId);
    weekIds.add(weekId);
  });
  
  const weeks: WeekSummary[] = [];
  for (const weekId of weekIds) {
    const week = await repository.getWeekSummary(weekId);
    weeks.push(week);
  }
  
  const exportData: ExportData = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    days,
    entries,
    weeks,
  };
  
  return JSON.stringify(exportData, null, 2);
}

export async function exportToCSV(): Promise<{ dailyTotals: string; entries: string }> {
  const endDate = formatDate(new Date());
  const startDate = formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  
  const days = await repository.getDaysInRange(startDate, endDate);
  const entries = await repository.listEntriesInRange(startDate, endDate);
  
  // Daily totals CSV
  const dailyTotalsHeader = 'Date,Total Minutes,Top Categories,Replacements Used\n';
  const dailyTotalsRows = days.map(day => {
    const dayEntries = entries.filter(e => e.dayId === day.id);
    const categories = dayEntries.reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + entry.minutes;
      return acc;
    }, {} as Record<string, number>);
    
    const topCategories = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([cat, mins]) => `${cat}(${mins}m)`)
      .join(';');
    
    const replacements = Object.keys(day.replacementUsage).join(';');
    
    return `${day.id},${day.totalFastMinutes},"${topCategories}","${replacements}"`;
  }).join('\n');
  
  const dailyTotals = dailyTotalsHeader + dailyTotalsRows;
  
  // Entries CSV
  const entriesHeader = 'ID,Date,Minutes,Category,Triggers,Note,Replacement,Created At\n';
  const entriesRows = entries.map(entry => {
    const triggers = entry.triggers.join(';');
    const note = (entry.note || '').replace(/"/g, '""'); // Escape quotes
    return `${entry.id},${entry.dayId},${entry.minutes},${entry.category},"${triggers}","${note}",${entry.replacement || ''},${entry.createdAt}`;
  }).join('\n');
  
  const entriesCSV = entriesHeader + entriesRows;
  
  return { dailyTotals, entries: entriesCSV };
}

export async function exportWeeklyMarkdown(weekId: string): Promise<string> {
  const week = await repository.getWeekSummary(weekId);
  const { start, end } = getWeekRange(weekId);
  const days = await repository.getDaysInRange(start, end);
  const entries = await repository.listEntriesInRange(start, end);
  const settings = await repository.getSettings();
  
  // Calculate streak (simplified - would need proper implementation)
  const streakWeeks = week.streakActive ? 1 : 0;
  
  let markdown = `# Dopamine Detox – Week ${getWeekLabel(weekId)}\n`;
  markdown += `- Cap: ${week.capMinutes}m | Used: ${week.totalMinutes}m (${week.capUsagePct.toFixed(1)}%)\n`;
  markdown += `- Streak: ${streakWeeks} weeks\n\n`;
  
  markdown += `## Daily Totals\n`;
  markdown += `| Day | Fast Minutes | Main Replacements | Notes |\n`;
  markdown += `|---|---:|---|---|\n`;
  
  for (const day of days) {
    const topReplacements = Object.entries(day.replacementUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([replacement]) => replacement)
      .join(', ');
    
    const noteSummary = day.reflections 
      ? day.reflections.substring(0, 50) + (day.reflections.length > 50 ? '...' : '')
      : '';
    
    const dayLabel = format(new Date(day.id), 'EEE M/d');
    markdown += `| ${dayLabel} | ${day.totalFastMinutes} | ${topReplacements} | ${noteSummary} |\n`;
  }
  
  // Add checklist completion section
  if (settings) {
    markdown += `\n## Checklist Completion\n`;
    const totalItems = settings.checklistTemplate.reduce((sum, section) => sum + section.items.length, 0);
    
    for (const day of days) {
      const completedItems = day.checklist.filter(item => item.checked).length;
      const completionPct = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
      const dayLabel = format(new Date(day.id), 'EEE M/d');
      markdown += `- ${dayLabel}: ${completedItems}/${totalItems} (${completionPct.toFixed(0)}%)\n`;
    }
  }
  
  // Add categories breakdown
  if (Object.keys(week.categoriesBreakdown).length > 0) {
    markdown += `\n## Categories Breakdown\n`;
    const sortedCategories = Object.entries(week.categoriesBreakdown)
      .sort(([,a], [,b]) => b - a);
    
    for (const [category, minutes] of sortedCategories) {
      const percentage = week.totalMinutes > 0 ? (minutes / week.totalMinutes) * 100 : 0;
      markdown += `- ${category}: ${minutes}m (${percentage.toFixed(1)}%)\n`;
    }
  }
  
  return markdown;
}

export async function importFromJSON(jsonStr: string): Promise<void> {
  const data: ExportData = JSON.parse(jsonStr);
  
  if (data.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`Unsupported schema version: ${data.schemaVersion}`);
  }
  
  // Import settings (merge with existing)
  await repository.saveSettings({
    ...data.settings,
    updatedAt: new Date().toISOString(),
  });
  
  // Import days
  for (const day of data.days) {
    await repository.upsertDay(day);
  }
  
  // Import entries
  for (const entry of data.entries) {
    // Check if entry already exists to avoid duplicates
    try {
      await repository.addEntry(entry);
    } catch {
      // Entry might already exist, skip
    }
  }
  
  // Recompute affected weeks
  const weekIds = new Set(data.weeks.map(w => w.id));
  for (const weekId of weekIds) {
    await repository.recomputeWeek(weekId);
  }
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function formatFilename(prefix: string, extension: string): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
  return `${prefix}_${timestamp}.${extension}`;
}

// Helper function (duplicate from store, should be centralized)
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
