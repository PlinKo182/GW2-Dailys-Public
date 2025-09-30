// components/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import DailyProgress from './DailyProgress';
import DailyTasks from './DailyTasks';
import EventsSection from './EventsSection/EventsSection';
import Footer from './Footer';
import { useEventFilters } from '../hooks/useEventFilters';
import * as Tabs from '@radix-ui/react-tabs';
import useStore from '../store/useStore';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import HistoryTab from './HistoryTab';

const Dashboard = () => {
  // Local state for UI that doesn't need to be global
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState('tasks');

  // Get state and actions from the Zustand store using selectors
  const notification = useStore(state => state.notification);
  const checkAndResetDailyProgress = useStore(state => state.checkAndResetDailyProgress);
  const handleEventToggle = useStore(state => state.handleEventToggle);
  const { taskCompletion, completedEventTypes } = useStore(state => state.userData);
  const customTasks = useStore(state => state.customTasks);

  const { eventFilters, updateEventFilters, isLoading } = useEventFilters();

  // React Query for checking API status
  const { data: apiStatus } = useQuery({
    queryKey: ['apiStatus'],
    queryFn: async () => {
      if (!isOnline) return 'offline';
      try {
        const response = await axios.get('https://api.guildwars2.com/v2/build');
        return response.data && response.data.id ? 'online' : 'unavailable';
      } catch (error) {
        return 'unavailable';
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Effect for initial data load, timers, and online status
  useEffect(() => {
    checkAndResetDailyProgress();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
      // The daily reset check is now handled inside the store, but we still need to trigger it
      checkAndResetDailyProgress();
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timeInterval);
    };
  }, [checkAndResetDailyProgress]);

  const { showPactSupplyCard, showFractalsCard, fractalTasks } = useStore(state => ({
    showPactSupplyCard: state.showPactSupplyCard,
    showFractalsCard: state.showFractalsCard,
    fractalTasks: state.fractalTasks,
  }));

  // New progress calculation logic for custom tasks
  const calculateOverallProgress = useCallback(() => {
    let allTasks = customTasks.flatMap(card => card.tasks);

    if (showPactSupplyCard) {
      const PACT_AGENTS = ["Mehem", "Fox", "Yana", "Derwena", "Katelyn", "Verma"];
      const pactSupplyTasks = PACT_AGENTS.map(agent => ({ id: `pact_supply_${agent.toLowerCase()}` }));
      allTasks = [...allTasks, ...pactSupplyTasks];
    }

    // Include fractal tasks in progress if the card is visible
    if (showFractalsCard) {
      const allFractalTasks = [
        ...(fractalTasks.recommended || []),
        ...(fractalTasks.dailies || []),
        ...(fractalTasks.cms || [])
      ];
      allTasks = [...allTasks, ...allFractalTasks];
    }

    const totalTasks = allTasks.length;
    if (totalTasks === 0) return 0;

    const completedTasks = allTasks.filter(task => taskCompletion[task.id]).length;
    return Math.round((completedTasks / totalTasks) * 100);
  }, [customTasks, taskCompletion, showPactSupplyCard, showFractalsCard, fractalTasks]);

  // Removido botão de salvar manual - agora é automático via useStore

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading event filters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header currentTime={currentTime} apiStatus={apiStatus} isOnline={isOnline} />

      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 min-w-[220px] shadow-lg px-4 py-2 rounded text-sm font-semibold ${
            notification.type === 'success'
              ? 'bg-primary text-primary-foreground'
              : 'bg-destructive text-destructive-foreground'
          }`}
        >
          {notification.message}
        </div>
      )}

      <main className="max-w-7xl mx-auto py-8 px-6">
        <DailyProgress overallProgress={calculateOverallProgress()} />

        <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <Tabs.List className="border-b border-border flex items-center gap-4">
            <Tabs.Trigger
              value="tasks"
              className="px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Daily Tasks
            </Tabs.Trigger>
            <Tabs.Trigger
              value="events"
              className="px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Live Events
            </Tabs.Trigger>
            <Tabs.Trigger
              value="history"
              className="px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              History
            </Tabs.Trigger>
          </Tabs.List>

          {/* Conditionally render tab content to prevent focus on hidden elements */}
          <div className="py-6 focus:outline-none">
            {activeTab === 'tasks' && (
              <DailyTasks currentTime={currentTime} />
            )}
            {activeTab === 'events' && (
              <EventsSection
                completedEventTypes={completedEventTypes}
                onEventToggle={handleEventToggle}
                currentTime={currentTime}
                eventFilters={eventFilters}
                onEventFilterChange={updateEventFilters}
              />
            )}
            {activeTab === 'history' && <HistoryTab />}
          </div>
        </Tabs.Root>
      </main>

      <Footer />
    </div>
  );
};

export default React.memo(Dashboard);