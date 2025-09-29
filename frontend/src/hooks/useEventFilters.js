import { useEffect } from 'react';
import useStore from '../store/useStore';
import { eventsData } from '../utils/eventsData';

// Helper function to build the initial filter structure
const buildCompleteFilterStructure = (eventsData) => {
  const filters = {
    expansions: {},
    selectedCount: 0,
    totalCount: 0
  };
  let totalEvents = 0;

  Object.entries(eventsData).forEach(([expansion, zones]) => {
    const normalizedExpansion = expansion.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    filters.expansions[normalizedExpansion] = {
      enabled: true,
      originalName: expansion,
      zones: {},
      eventCount: 0
    };
    Object.entries(zones).forEach(([zone, events]) => {
      const normalizedZone = zone.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      filters.expansions[normalizedExpansion].zones[normalizedZone] = {
        enabled: true,
        originalName: zone,
        events: {},
        eventCount: 0
      };
      Object.keys(events).forEach(eventName => {
        const normalizedEvent = eventName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        filters.expansions[normalizedExpansion].zones[normalizedZone].events[normalizedEvent] = {
          enabled: true,
          originalName: eventName
        };
        filters.expansions[normalizedExpansion].zones[normalizedZone].eventCount++;
        filters.expansions[normalizedExpansion].eventCount++;
        totalEvents++;
      });
    });
  });

  filters.totalCount = totalEvents;
  filters.selectedCount = totalEvents;
  return filters;
};

// Helper function to count selected events after an update
const countSelectedEvents = (filters) => {
  let selected = 0;
  let total = 0;
  Object.values(filters.expansions).forEach(expansion => {
    Object.values(expansion.zones).forEach(zone => {
      Object.values(zone.events).forEach(event => {
        total++;
        if (event.enabled) selected++;
      });
    });
  });
  return { selected, total };
};

export const useEventFilters = () => {
  // Get filters and the update action from the central store
  const eventFilters = useStore((state) => state.eventFilters);
  const updateStoreFilters = useStore((state) => state.updateEventFilters);

  // If filters are not yet populated (e.g., for a new user), initialize them.
  useEffect(() => {
    if (!eventFilters || Object.keys(eventFilters).length === 0) {
      const defaultFilters = buildCompleteFilterStructure(eventsData);
      updateStoreFilters(defaultFilters);
    }
  }, [eventFilters, updateStoreFilters]);

  // Wrap the store's update function to also handle counting
  const updateEventFilters = (newFilters) => {
    const counts = countSelectedEvents(newFilters);
    newFilters.selectedCount = counts.selected;
    newFilters.totalCount = counts.total;
    updateStoreFilters(newFilters);
  };

  // The component is "loading" if the filters haven't been populated yet.
  const isLoading = !eventFilters || Object.keys(eventFilters).length === 0;

  return { eventFilters, updateEventFilters, isLoading };
};