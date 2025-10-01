// components/EventsSection/EventsSection.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { Eye, EyeOff, Undo } from 'lucide-react';
import { eventsData } from '../../utils/eventsData';
import { useEvents } from '../../hooks/useEvents';
import { useItemPrices } from '../../hooks/useItemPrices';
import EventCard from './EventCard';
import CompletedEventTypeCard from './CompletedEventTypeCard';
import EventsFilter from '../EventsFilter/EventsFilter';

const EventsSection = ({ completedEventTypes, onEventToggle, currentTime, eventFilters, onEventFilterChange }) => {
  const [showCompleted, setShowCompleted] = useState(false);
  
  const safeCurrentTime = currentTime || new Date();
  
  // Usar eventsData com filtros
  const { allEvents, eventsData: filteredEvents } = useEvents(eventsData, safeCurrentTime, eventFilters);
  const itemPrices = useItemPrices(allEvents);

  // Filtrar eventos não concluídos para mostrar na seção principal
  const filteredEventsData = useMemo(() => {
    if (!filteredEvents || !Array.isArray(filteredEvents)) {
      return [];
    }
    
    const result = filteredEvents.filter(event => {
      if (!event || typeof event !== 'object' || !event.eventKey || !event.id) {
        return false;
      }
      
      const isCompleted = completedEventTypes[event.eventKey];
      return !isCompleted;
    });
    
    return result;
  }, [filteredEvents, completedEventTypes]);

  // Obter eventos concluídos
  const completedEventsByType = useMemo(() => {
    if (!allEvents || !Array.isArray(allEvents)) {
      return [];
    }
    
    const eventsByType = {};
    
    allEvents.forEach(event => {
      if (!event || typeof event !== 'object' || !event.eventKey || !event.id) {
        return;
      }
      
      const isCompleted = completedEventTypes[event.eventKey];
      
      if (isCompleted) {
        if (!eventsByType[event.eventKey]) {
          eventsByType[event.eventKey] = {
            eventKey: event.eventKey,
            name: event.name || 'Unknown Event',
            instances: []
          };
        }
        
        eventsByType[event.eventKey].instances.push(event);
      }
    });
    
    return Object.values(eventsByType);
  }, [allEvents, completedEventTypes]);

  const handleEventToggle = useCallback((eventId, eventKey) => {
    onEventToggle(eventId, eventKey);
  }, [onEventToggle]);

  // Renderização mais segura
  const hasEventsData = filteredEvents && Array.isArray(filteredEvents);
  const hasAllEvents = allEvents && Array.isArray(allEvents);

  if (!hasEventsData || !hasAllEvents) {
    return (
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Events & World Bosses</h2>
          <EventsFilter 
            onFilterChange={onEventFilterChange}
            currentFilters={eventFilters}
          />
        </div>
        <div className="text-center py-8 text-gray-400">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/4 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/3 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Events & World Bosses</h2>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400 italic">
            Showing events within the next 2 hours
          </div>
          
          <EventsFilter 
            onFilterChange={onEventFilterChange}
            currentFilters={eventFilters}
          />
          
          {completedEventsByType.length > 0 ? (
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 bg-gray-700 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {showCompleted ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Hide Completed
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Show Completed ({completedEventsByType.length})
                </>
              )}
            </button>
          ) : (
            <div className="text-sm text-gray-500">
              No completed events
            </div>
          )}
        </div>
      </div>
      
      {/* SEÇÃO DE EVENTOS ATIVOS/UPCOMING */}
      {filteredEventsData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEventsData.map(event => {
            if (!event || !event.id) {
              return null;
            }
            
            return (
              <EventCard 
                key={`${event.id}_${event.startTime?.getTime()}`} 
                event={event} 
                isCompleted={false}
                onToggle={handleEventToggle}
                itemPrices={itemPrices}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>No events in the next 2 hours.</p>
          {allEvents.length > 0 && filteredEvents.length === 0 && (
            <p className="text-sm mt-4 text-amber-400">
              All events are outside the 2-hour window or filtered by time.
            </p>
          )}
          {allEvents.length > 0 && filteredEvents.length > 0 && filteredEventsData.length === 0 && (
            <p className="text-sm mt-4 text-amber-400">
              All upcoming events have been marked as completed.
            </p>
          )}
          {allEvents.length === 0 && (
            <div className="text-sm mt-4 text-amber-400">
              <p>No events match your current filters.</p>
              <p>Try adjusting your filter settings.</p>
              <button 
                onClick={() => {
                  localStorage.removeItem('tyriaTracker_eventFilters');
                  window.location.reload();
                }}
                className="mt-2 px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700"
              >
                Reset Filters to Default
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* SEÇÃO DE EVENTOS COMPLETOS */}
      {showCompleted && completedEventsByType.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-2xl font-bold text-emerald-400">Completed Events</h3>
            <button
              onClick={() => setShowCompleted(false)}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded"
            >
              <Undo className="w-4 h-4" />
              Hide
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedEventsByType.map(eventType => {
              if (!eventType || !eventType.eventKey) {
                return null;
              }
              
              return (
                <CompletedEventTypeCard 
                  key={eventType.eventKey} 
                  eventType={eventType}
                  onToggle={handleEventToggle}
                  itemPrices={itemPrices}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(EventsSection);