import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export default function WeekPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Week View
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Weekly progress and insights
        </p>
      </div>

      <Card variant="outlined">
        <CardHeader>
          <h2 className="text-lg font-semibold">Coming Soon</h2>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
            Week view with calendar grid and cap tracking is under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
