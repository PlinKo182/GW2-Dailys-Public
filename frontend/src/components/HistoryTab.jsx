import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import useStore from '../store/useStore';
import { eventsData } from '../utils/eventsData';
import { useEventMap } from '../utils/eventUtils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

const API_BASE = '/api';

const fetchUserProgress = async (userName) => {
  const { data } = await axios.get(`${API_BASE}/progress/${encodeURIComponent(userName)}`);
  if (!data.success) {
    throw new Error(data.error || 'User not found');
  }
  return data.data.progressByDate || data.data;
};

const HistoryTab = () => {
  const activeProfile = useStore((state) => state.activeProfile);
  const eventMap = useEventMap(eventsData);

  const { data: progressData, isLoading, error, isError, refetch } = useQuery({
    queryKey: ['userProgress', activeProfile],
    queryFn: () => fetchUserProgress(activeProfile),
    enabled: !!activeProfile,
    staleTime: 0, // Desabilita o cache
  });

  // Recarrega os dados quando o componente é montado
  React.useEffect(() => {
    refetch();
  }, [refetch]);

  const getEventsByCategory = (dayData) => {
    const eventsByCategory = {};
    if (!dayData || !dayData.completedEventTypes) {
      return eventsByCategory;
    }

    for (const evKey of Object.keys(dayData.completedEventTypes)) {
      const eventInfo = eventMap.get(evKey);
      if (eventInfo) {
        if (!eventsByCategory[eventInfo.category]) {
          eventsByCategory[eventInfo.category] = [];
        }
        eventsByCategory[eventInfo.category].push(eventInfo);
      }
    }

    for (const category in eventsByCategory) {
      eventsByCategory[category].sort((a, b) => a.name.localeCompare(b.name));
    }
    return eventsByCategory;
  };

  const getDailyTasksByCategory = (dayData) => {
    const tasksByCategory = {};
    if (!dayData || !dayData.dailyTasks) {
      return tasksByCategory;
    }

    // Mapear as categorias de tarefas diárias
    const categoryNames = {
      gathering: "Gathering Tasks",
      crafting: "Crafting Tasks",
      specials: "Special Tasks"
    };

    for (const [category, tasks] of Object.entries(dayData.dailyTasks)) {
      const completedTasks = Object.entries(tasks)
        .filter(([_, isCompleted]) => isCompleted)
        .map(([taskId]) => {
          // Tornar o nome mais amigável
          return taskId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        });

      if (completedTasks.length > 0) {
        tasksByCategory[categoryNames[category] || category] = completedTasks;
      }
    }

    return tasksByCategory;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading history...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-10 text-destructive">
        <p>Error loading history: {error.message}</p>
      </div>
    );
  }

  const sortedDates = progressData ? Object.keys(progressData).sort((a, b) => new Date(b) - new Date(a)) : [];

  return (
    <Accordion type="single" collapsible className="space-y-4">
      {sortedDates.map((date) => {
  const dayData = progressData[date];
        const eventsByCategory = getEventsByCategory(dayData);
        const tasksByCategory = getDailyTasksByCategory(dayData);

        if (Object.keys(eventsByCategory).length === 0 && Object.keys(tasksByCategory).length === 0) {
          return null;
        }

        return (
          <AccordionItem 
            key={date} 
            value={date}
            className="bg-card border border-border rounded-lg shadow-sm data-[state=open]:shadow-md transition-all"
          >
            <AccordionTrigger className="px-4 py-2 hover:no-underline">
              <span className="font-bold text-lg">
                {formatDate(date)}
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="flex flex-col gap-4">
                {/* Daily Tasks Section */}
                {Object.keys(tasksByCategory).length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-md mb-3 text-primary">Daily Tasks Completed</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(tasksByCategory).map(([category, tasks]) => (
                        <div key={category} className="bg-background rounded p-3 border border-border">
                          <h5 className="font-medium mb-2">{category}</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {tasks.map((task, index) => (
                              <div
                                key={`${task}_${index}`}
                                className="text-sm text-muted-foreground bg-card rounded px-2 py-1"
                              >
                                {task}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Events Section */}
                {Object.keys(eventsByCategory).length > 0 && (
                  <div>
                    <h4 className="font-semibold text-md mb-3 text-primary">Events Completed</h4>
                    {Object.entries(eventsByCategory).map(([category, events]) => (
                      <div key={category} className="mb-3">
                        <h5 className="font-medium mb-2">{category}</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {events.map((event, index) => (
                            <div
                              key={`${event.name}_${index}`}
                              className="text-sm bg-background rounded p-2 border border-border"
                            >
                              {event.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default HistoryTab;