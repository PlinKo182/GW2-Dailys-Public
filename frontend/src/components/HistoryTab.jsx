import React from 'react';
import useStore from '../store/useStore';
import { eventsData } from '../utils/eventsData';
import { useEventMap } from '../utils/eventUtils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

const HistoryTab = () => {
  const userHistory = useStore((state) => state.userHistory);
  const eventMap = useEventMap(eventsData);

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

    // Check if dailyTasks is a nested object (old format) or flat (new format)
    const firstKey = Object.keys(dayData.dailyTasks)[0];
    const isNested = firstKey && typeof dayData.dailyTasks[firstKey] === 'object' && !Array.isArray(dayData.dailyTasks[firstKey]);

    if (isNested) {
      // Old format: { gathering: { vine_bridge: true }, crafting: { ... } }
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
    } else {
      // New format: { pact_supply_mehem: true, fractal_daily_...: true }
      const pactSupply = [];
      const fractals = [];
      const challengeModes = [];
      const strikes = [];
      const other = [];

      for (const [taskId, isCompleted] of Object.entries(dayData.dailyTasks)) {
        if (isCompleted) {
          const friendlyName = taskId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          
          if (taskId.startsWith('pact_supply_')) {
            pactSupply.push(friendlyName.replace('Pact Supply ', ''));
          } else if (taskId.startsWith('fractal_daily_')) {
            fractals.push(friendlyName.replace('Fractal Daily ', ''));
          } else if (taskId.startsWith('fractal_cm_')) {
            challengeModes.push(friendlyName.replace('Fractal Cm ', ''));
          } else if (taskId.startsWith('strike_')) {
            strikes.push(friendlyName.replace('Strike ', ''));
          } else {
            other.push(friendlyName);
          }
        }
      }

      if (pactSupply.length > 0) tasksByCategory['Pact Supply'] = pactSupply;
      if (fractals.length > 0) tasksByCategory['Daily Fractals'] = fractals;
      if (challengeModes.length > 0) tasksByCategory['Challenge Modes'] = challengeModes;
      if (strikes.length > 0) tasksByCategory['Strikes'] = strikes;
      if (other.length > 0) tasksByCategory['Other Tasks'] = other;
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

  const sortedDates = userHistory ? Object.keys(userHistory).sort((a, b) => new Date(b) - new Date(a)) : [];

  if (sortedDates.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <p>No history found. Complete some tasks to see your progress here!</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="space-y-4">
      {sortedDates.map((date) => {
        const dayData = userHistory[date];
        const eventsByCategory = getEventsByCategory(dayData);
        const tasksByCategory = getDailyTasksByCategory(dayData);
        const mapChests = dayData?.completedMapChests || [];
        const worldBosses = dayData?.completedWorldBosses || [];

        if (Object.keys(eventsByCategory).length === 0 && 
            Object.keys(tasksByCategory).length === 0 && 
            mapChests.length === 0 && 
            worldBosses.length === 0) {
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

                {/* GW2 API Verified - Map Chests */}
                {mapChests.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-md mb-3 text-emerald-400">Map Chests (API Verified)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {mapChests.map((chest, index) => (
                        <div
                          key={`${chest}_${index}`}
                          className="text-sm text-muted-foreground bg-emerald-900/20 border border-emerald-700/50 rounded px-2 py-1"
                        >
                          {chest}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* GW2 API Verified - World Bosses */}
                {worldBosses.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-md mb-3 text-red-400">World Bosses (API Verified)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {worldBosses.map((boss, index) => (
                        <div
                          key={`${boss}_${index}`}
                          className="text-sm text-muted-foreground bg-red-900/20 border border-red-700/50 rounded px-2 py-1"
                        >
                          {boss}
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