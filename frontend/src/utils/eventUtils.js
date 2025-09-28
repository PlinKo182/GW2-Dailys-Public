import { useMemo } from 'react';

const normalizeKey = (key) => {
  if (!key) return '';
  return key.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

// This function is now a pure data transformation and does not use React hooks.
export const createEventMap = (eventsData) => {
  const eventMap = new Map();
  if (!eventsData) {
    return eventMap;
  }

  for (const [expansion, zones] of Object.entries(eventsData)) {
    for (const [zone, events] of Object.entries(zones)) {
      for (const eventName of Object.keys(events)) {
        const eventKey = normalizeKey(`${expansion}_${zone}_${eventName}`);
        eventMap.set(eventKey, {
          name: eventName,
          category: expansion,
          zone: zone,
        });
      }
    }
  }
  return eventMap;
};

// We create a memoized version to be used in React components.
// This prevents re-computing the map on every render.
export const useEventMap = (eventsData) => {
  return useMemo(() => createEventMap(eventsData), [eventsData]);
};