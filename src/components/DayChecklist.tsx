import { useState } from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import type { ChecklistTemplate, DayLog } from '../types/index.ts';
import useAppStore from '../store/index.ts';
import { clsx } from 'clsx';

interface DayChecklistProps {
  day: DayLog | null;
  template: ChecklistTemplate;
  dayId: string;
}

export default function DayChecklist({ day, template, dayId }: DayChecklistProps) {
  const { updateDayChecklist, updateDayReflections } = useAppStore();
  const [reflections, setReflections] = useState(day?.reflections || '');

  // Calculate completion percentage
  const totalItems = template.reduce((sum, section) => sum + section.items.length, 0);
  const completedItems = day?.checklist.filter(item => item.checked).length || 0;
  const completion = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const isItemChecked = (itemId: string): boolean => {
    const checklistItem = day?.checklist.find(item => item.itemId === itemId);
    if (checklistItem) {
      return checklistItem.checked;
    }
    // Fall back to default checked state
    for (const section of template) {
      const item = section.items.find(i => i.id === itemId);
      if (item) {
        return item.defaultChecked || false;
      }
    }
    return false;
  };

  const handleItemToggle = async (itemId: string) => {
    const currentChecked = isItemChecked(itemId);
    await updateDayChecklist(dayId, itemId, !currentChecked);
  };

  const handleReflectionsBlur = async () => {
    if (reflections !== (day?.reflections || '')) {
      await updateDayReflections(dayId, reflections);
    }
  };

  return (
    <Card variant="outlined" className="h-fit">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Daily Checklist
          </h2>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {completedItems}/{totalItems}
            </div>
            <div className="relative h-12 w-12">
              {/* Progress ring */}
              <svg className="h-12 w-12 -rotate-90 transform" viewBox="0 0 36 36">
                <path
                  className="stroke-gray-200 dark:stroke-gray-700"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="stroke-accent transition-all duration-300"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${completion}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  {completion}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {template.map((section) => (
          <div key={section.id} className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-1">
              {section.title}
            </h3>
            <div className="space-y-2">
              {section.items.map((item) => {
                const checked = isItemChecked(item.id);
                return (
                  <label
                    key={item.id}
                    className={clsx(
                      'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                      'hover:bg-gray-50 dark:hover:bg-gray-800',
                      checked && 'bg-accent-50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleItemToggle(item.id)}
                      className={clsx(
                        'h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent focus:ring-offset-0',
                        'dark:border-gray-600 dark:bg-gray-800'
                      )}
                    />
                    <span
                      className={clsx(
                        'text-sm transition-all',
                        checked
                          ? 'text-gray-600 dark:text-gray-400 line-through'
                          : 'text-gray-900 dark:text-gray-100'
                      )}
                    >
                      {item.label}
                    </span>
                    {checked && (
                      <span className="ml-auto text-accent">✓</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {/* Reflections section */}
        <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Reflections
          </h3>
          <textarea
            value={reflections}
            onChange={(e) => setReflections(e.target.value)}
            onBlur={handleReflectionsBlur}
            placeholder="How did today go? What did you learn?"
            className={clsx(
              'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm',
              'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent',
              'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500',
              'min-h-[80px] resize-none'
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
