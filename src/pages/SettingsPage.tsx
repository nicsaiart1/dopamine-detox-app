import { useState, useRef } from 'react';
import useAppStore from '../store/index.ts';
import { Card, CardHeader, CardContent } from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import Input from '../components/ui/Input.tsx';
import { clsx } from 'clsx';
import { 
  exportToJSON, 
  exportToCSV, 
  exportWeeklyMarkdown, 
  importFromJSON, 
  downloadFile, 
  formatFilename 
} from '../utils/export.ts';
import { format, startOfWeek } from 'date-fns';

export default function SettingsPage() {
  const {
    settings,
    saveSettings,
    addNotification
  } = useAppStore();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      const jsonData = await exportToJSON();
      const filename = formatFilename('dopamine-detox-export', 'json');
      downloadFile(jsonData, filename, 'application/json');
      addNotification({
        id: crypto.randomUUID(),
        type: 'success',
        title: 'Export Successful',
        message: 'Your data has been exported to JSON format.',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Export failed:', error);
      addNotification({
        id: crypto.randomUUID(),
        type: 'error',
        title: 'Export Failed',
        message: 'There was an error exporting your data.',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const csvData = await exportToCSV();
      
      // Download daily totals CSV
      const dailyFilename = formatFilename('dopamine-detox-daily', 'csv');
      downloadFile(csvData.dailyTotals, dailyFilename, 'text/csv');
      
      // Download entries CSV
      const entriesFilename = formatFilename('dopamine-detox-entries', 'csv');
      downloadFile(csvData.entries, entriesFilename, 'text/csv');
      
      addNotification({
        id: crypto.randomUUID(),
        type: 'success',
        title: 'CSV Export Successful',
        message: 'Two CSV files have been downloaded: daily totals and entries.',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('CSV export failed:', error);
      addNotification({
        id: crypto.randomUUID(),
        type: 'error',
        title: 'CSV Export Failed',
        message: 'There was an error exporting your data to CSV.',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWeeklyMarkdown = async () => {
    try {
      setIsExporting(true);
      const currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekId = format(currentWeek, 'yyyy-MM-dd');
      const markdown = await exportWeeklyMarkdown(weekId);
      const filename = formatFilename('weekly-summary', 'md');
      downloadFile(markdown, filename, 'text/markdown');
      
      addNotification({
        id: crypto.randomUUID(),
        type: 'success',
        title: 'Weekly Summary Exported',
        message: 'Your weekly summary has been exported as Markdown.',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Weekly export failed:', error);
      addNotification({
        id: crypto.randomUUID(),
        type: 'error',
        title: 'Weekly Export Failed',
        message: 'There was an error exporting your weekly summary.',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const content = await file.text();
      await importFromJSON(content);
      
      addNotification({
        id: crypto.randomUUID(),
        type: 'success',
        title: 'Import Successful',
        message: 'Your data has been imported successfully.',
        timestamp: new Date().toISOString()
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import failed:', error);
      addNotification({
        id: crypto.randomUUID(),
        type: 'error',
        title: 'Import Failed',
        message: 'There was an error importing your data. Please check the file format.',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleSettingsChange = (key: string, value: any) => {
    if (!settings) return;
    
    saveSettings({
      ...settings,
      [key]: value,
      updatedAt: new Date().toISOString()
    });
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-gray-600">Manage your preferences, data, and app settings</p>
        </CardHeader>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">General</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              label="Display Name"
              value={settings.displayName}
              onChange={(e) => handleSettingsChange('displayName', e.target.value)}
              hint="How you'd like to be addressed in the app"
            />
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Theme
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                value={settings.theme}
                onChange={(e) => handleSettingsChange('theme', e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fast Dopamine Settings */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Fast Dopamine Tracking</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Default Categories
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(settings.categories || []).map((category, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                      value={category}
                      onChange={(e) => {
                        const newCategories = [...(settings.categories || [])];
                        newCategories[index] = e.target.value;
                        handleSettingsChange('categories', newCategories);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Replacement Activities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(settings.replacementCategories || []).map((replacement, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                      value={replacement}
                      onChange={(e) => {
                        const newReplacements = [...(settings.replacementCategories || [])];
                        newReplacements[index] = e.target.value;
                        handleSettingsChange('replacementCategories', newReplacements);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Export Data</h3>
          <p className="text-sm text-gray-600">
            Download your data in various formats for backup or analysis
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={handleExportJSON}
                disabled={isExporting}
                className="w-full"
              >
                {isExporting ? 'Exporting...' : 'Export JSON'}
              </Button>
              
              <Button
                onClick={handleExportCSV}
                disabled={isExporting}
                variant="secondary"
                className="w-full"
              >
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </Button>
              
              <Button
                onClick={handleExportWeeklyMarkdown}
                disabled={isExporting}
                variant="outline"
                className="w-full"
              >
                {isExporting ? 'Exporting...' : 'Weekly Markdown'}
              </Button>
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <div>• <strong>JSON:</strong> Complete backup with all data and settings</div>
              <div>• <strong>CSV:</strong> Spreadsheet-friendly format for analysis</div>
              <div>• <strong>Markdown:</strong> Human-readable weekly summary</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Import */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Import Data</h3>
          <p className="text-sm text-gray-600">
            Restore data from a previous JSON export
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={handleImportFile}
              disabled={isImporting}
              variant="outline"
              className="w-full md:w-auto"
            >
              {isImporting ? 'Importing...' : 'Import JSON File'}
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm text-yellow-800">
                <strong>⚠️ Important:</strong> Importing will merge data with your existing entries. 
                Make sure to export a backup first if you want to preserve your current data.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Data */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Privacy & Data</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-800">
                <strong>🔒 Privacy First:</strong> All your data is stored locally in your browser. 
                Nothing is sent to external servers unless you explicitly export it.
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Data Storage</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• Data is stored in your browser's IndexedDB</div>
                <div>• No cloud sync or external storage</div>
                <div>• Data persists across browser sessions</div>
                <div>• Clearing browser data will remove all app data</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">About</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <div><strong>Version:</strong> 1.0.0</div>
            <div><strong>Build:</strong> {new Date().toISOString().split('T')[0]}</div>
            <div><strong>Framework:</strong> React + TypeScript + Vite</div>
            <div><strong>Database:</strong> IndexedDB (via Dexie)</div>
            <div><strong>License:</strong> MIT</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
