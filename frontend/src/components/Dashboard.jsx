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
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ProfileSwitcher } from './ui/ProfileSwitcher';
import HistoryTab from './HistoryTab';
import UserNameModal from './UserNameModal';

const Dashboard = () => {
  // Local state for UI that doesn't need to be global
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showUserModal, setShowUserModal] = useState(false);

  // Get state and actions from the Zustand store
  const {
    notification,
    loadInitialData,
    handleTaskToggle,
    handleEventToggle,
    setNotification,
    checkAndResetDailyProgress,
    activeProfile,
    addProfile,
  } = useStore();

  // Get active profile data using REACTIVE selectors
  const dailyTasks = useStore(state => state.profileData[state.activeProfile]?.dailyTasks || {});
  const completedEventTypes = useStore(state => state.profileData[state.activeProfile]?.completedEventTypes || {});

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
    loadInitialData();
    checkAndResetDailyProgress();

    // Se não houver perfil ativo, mostrar modal
    if (!activeProfile) setShowUserModal(true);

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
  }, [loadInitialData, checkAndResetDailyProgress]);

  // Progress calculation logic (now depends on store state)
  const calculateOverallProgress = useCallback(() => {
    let totalTasks = 0;
    let completedTasks = 0;
    Object.values(dailyTasks).forEach((category) => {
      Object.values(category).forEach((task) => {
        totalTasks++;
        if (task) completedTasks++;
      });
    });
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }, [dailyTasks]);

  const calculateCategoryProgress = useCallback(
    (category) => {
      const tasks = dailyTasks[category];
      if (!tasks) return { completed: 0, total: 0, percentage: 0 };
      const totalTasks = Object.keys(tasks).length;
      const completedTasks = Object.values(tasks).filter(Boolean).length;
      return {
        completed: completedTasks,
        total: totalTasks,
        percentage: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      };
    },
    [dailyTasks]
  );

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
        <div className="mb-10">
          <h2 className="text-3xl font-bold mb-2">Daily Dashboard</h2>
          <p className="text-muted-foreground">Track your daily progress in Guild Wars 2</p>
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <ProfileSwitcher />
          </div>
        </div>

        <DailyProgress overallProgress={calculateOverallProgress()} />

        <Tabs.Root defaultValue="tasks" className="mt-8">
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
          <Tabs.Content value="tasks" className="py-6 focus:outline-none">
            <DailyTasks
              dailyTasks={dailyTasks}
              onTaskToggle={handleTaskToggle}
              calculateCategoryProgress={calculateCategoryProgress}
              currentTime={currentTime}
            />
          </Tabs.Content>
          <Tabs.Content value="events" className="py-6 focus:outline-none">
            <EventsSection
              completedEventTypes={completedEventTypes}
              onEventToggle={handleEventToggle}
              currentTime={currentTime}
              eventFilters={eventFilters}
              onEventFilterChange={updateEventFilters}
            />
          </Tabs.Content>
          <Tabs.Content value="history" className="py-6 focus:outline-none">
            <HistoryTab />
          </Tabs.Content>
        </Tabs.Root>
      </main>

      <Footer />
      {showUserModal && (
        <UserNameModal
          onSuccess={name => {
            addProfile(name);
            setShowUserModal(false);
          }}
        />
      )}
    </div>
  );
}

export default React.memo(Dashboard);