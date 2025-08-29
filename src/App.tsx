import { useEffect } from 'react';
import useAppStore from '@/store';
import Layout from '@/components/Layout';
import DayPage from '@/pages/DayPage';
import WeekPage from '@/pages/WeekPage';
import MonthPage from '@/pages/MonthPage';
import StatsPage from '@/pages/StatsPage';

function App() {
  const { currentView, isInitialized, init } = useAppStore();

  useEffect(() => {
    if (!isInitialized) {
      init();
    }
  }, [isInitialized, init]);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'day':
        return <DayPage />;
      case 'week':
        return <WeekPage />;
      case 'month':
        return <MonthPage />;
      case 'stats':
        return <StatsPage />;
      default:
        return <DayPage />;
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Initializing Dopamine Detox
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Setting up your tracking environment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      {renderCurrentView()}
    </Layout>
  );
}

export default App;
