import { useState } from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Badge from './ui/Badge';
import { ActivityEntry, ActivityFormData } from '@/types';
import useAppStore from '@/store';
import { clsx } from 'clsx';
import { format } from 'date-fns';

interface FastLogPanelProps {
  dayId: string;
  entries: ActivityEntry[];
}

export default function FastLogPanel({ dayId, entries }: FastLogPanelProps) {
  const { 
    settings, 
    addEntry, 
    updateEntry, 
    deleteEntry,
    getCapUsageToday 
  } = useAppStore();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ActivityEntry | null>(null);
  const [formData, setFormData] = useState<ActivityFormData>({
    minutes: 5,
    category: '',
    triggers: [],
    note: '',
    replacement: '',
  });

  const capUsageToday = getCapUsageToday();
  const totalMinutesToday = entries.reduce((sum, entry) => sum + entry.minutes, 0);
  const dailyCap = settings ? settings.weeklyAllowanceMinutes / 7 : 0;

  const resetForm = () => {
    setFormData({
      minutes: 5,
      category: '',
      triggers: [],
      note: '',
      replacement: '',
    });
    setEditingEntry(null);
    setIsFormOpen(false);
  };

  const handleQuickAdd = async (minutes: number) => {
    if (!settings?.categories.length) return;
    
    await addEntry(dayId, {
      minutes,
      category: settings.categories[0], // Default to first category
      triggers: [],
      note: `Quick add ${minutes}m`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category) return;

    try {
      if (editingEntry) {
        await updateEntry(editingEntry.id, formData);
      } else {
        await addEntry(dayId, formData);
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save entry:', error);
    }
  };

  const handleEdit = (entry: ActivityEntry) => {
    setEditingEntry(entry);
    setFormData({
      minutes: entry.minutes,
      category: entry.category,
      triggers: entry.triggers,
      note: entry.note || '',
      replacement: entry.replacement || '',
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (entryId: string) => {
    if (window.confirm('Delete this entry?')) {
      await deleteEntry(entryId);
    }
  };

  const toggleTrigger = (trigger: string) => {
    setFormData(prev => ({
      ...prev,
      triggers: prev.triggers.includes(trigger)
        ? prev.triggers.filter(t => t !== trigger)
        : [...prev.triggers, trigger]
    }));
  };

  return (
    <Card variant="outlined">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Fast-Dopamine Log
          </h2>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {totalMinutesToday}m / {dailyCap}m
            </div>
            <div className={clsx(
              'h-2 w-16 rounded-full',
              capUsageToday <= 100 ? 'bg-green-200' : 'bg-red-200'
            )}>
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-300',
                  capUsageToday <= 100 ? 'bg-green-500' : 'bg-red-500'
                )}
                style={{ width: `${Math.min(capUsageToday, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Add Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuickAdd(5)}
          >
            +5m
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuickAdd(10)}
          >
            +10m
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuickAdd(15)}
          >
            +15m
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsFormOpen(true)}
          >
            + Custom
          </Button>
        </div>

        {/* Entry Form */}
        {isFormOpen && (
          <form onSubmit={handleSubmit} className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Minutes"
                type="number"
                min="1"
                max="1440"
                value={formData.minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, minutes: parseInt(e.target.value) || 1 }))}
                required
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 dark:border-gray-600 dark:bg-gray-800"
                  required
                >
                  <option value="">Select category</option>
                  {settings?.categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Note (optional)"
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              placeholder="What triggered this?"
            />

            {/* Trigger Tags */}
            {settings?.triggerPresets && settings.triggerPresets.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Triggers
                </label>
                <div className="flex flex-wrap gap-2">
                  {settings.triggerPresets.map(trigger => (
                    <button
                      key={trigger}
                      type="button"
                      onClick={() => toggleTrigger(trigger)}
                      className={clsx(
                        'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                        formData.triggers.includes(trigger)
                          ? 'bg-accent text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      )}
                    >
                      {trigger}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Replacement */}
            {settings?.replacementCategories && settings.replacementCategories.length > 0 && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Replacement Used
                </label>
                <select
                  value={formData.replacement}
                  onChange={(e) => setFormData(prev => ({ ...prev, replacement: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 dark:border-gray-600 dark:bg-gray-800"
                >
                  <option value="">None</option>
                  {settings.replacementCategories.map(replacement => (
                    <option key={replacement} value={replacement}>{replacement}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" size="sm">
                {editingEntry ? 'Update' : 'Add'} Entry
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Entries List */}
        {entries.length > 0 && (
          <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Today's Entries
            </h3>
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {entry.minutes}m
                      </span>
                      <Badge variant="default" size="sm">
                        {entry.category}
                      </Badge>
                      {entry.replacement && (
                        <Badge variant="success" size="sm">
                          → {entry.replacement}
                        </Badge>
                      )}
                    </div>
                    {entry.note && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {entry.note}
                      </p>
                    )}
                    {entry.triggers.length > 0 && (
                      <div className="mt-1 flex gap-1">
                        {entry.triggers.map(trigger => (
                          <Badge key={trigger} variant="warning" size="sm">
                            {trigger}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(entry.createdAt), 'h:mm a')}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
