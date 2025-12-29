import React, { useState, useMemo, useEffect } from 'react';
import { useCurrentTime } from '../hooks/useCurrentTime';
import useStore from '../store/useStore';
import { eventsData } from '../utils/eventsData';
import { EVENT_ICONS, getEventIcon } from '../utils/eventIcons';

// Helper function to normalize keys
const normalizeKey = (key) => {
  if (!key) return '';
  return key.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

// Helper to format time
const formatTime = (minutes) => {
  if (minutes === 0) return 'Now';
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

// Get event timing information
const getEventTiming = (eventData) => {
  if (!eventData || !eventData.utc_times || eventData.utc_times.length === 0) {
    return null;
  }

  const now = new Date();
  const currentUTC = now.getUTCHours() * 60 + now.getUTCMinutes();

  const times = eventData.utc_times.map(t => {
    const [hours, minutes] = t.split(':').map(Number);
    return hours * 60 + minutes;
  });

  const duration = eventData.duration_minutes || 0;

  // Check if event is currently active
  for (const time of times) {
    const endTime = time + duration;
    if (currentUTC >= time && currentUTC < endTime) {
      const minutesRemaining = endTime - currentUTC;
      const minutesElapsed = currentUTC - time;
      return {
        minutesUntil: -minutesElapsed,
        isActive: true,
        duration: duration,
        minutesRemaining: minutesRemaining,
        waypoint: eventData.waypoint
      };
    }
  }

  // Find next occurrence
  let nextTime = times.find(t => t > currentUTC);
  let minutesUntil;

  if (nextTime !== undefined) {
    minutesUntil = nextTime - currentUTC;
  } else {
    nextTime = times[0];
    minutesUntil = (24 * 60 - currentUTC) + nextTime;
  }

  return {
    minutesUntil: minutesUntil,
    isActive: false,
    duration: duration,
    waypoint: eventData.waypoint
  };
};

// Get expansion color
const getExpansionColor = (expansion) => {
  const colors = {
    'Heart of Thorns': 'text-emerald-400',
    'Path of Fire': 'text-amber-400',
    'End of Dragons': 'text-cyan-400',
    'Secrets of the Obscure': 'text-purple-400',
    'Janthir Wilds': 'text-green-400',
    'Core Tyria': 'text-blue-400'
  };
  return colors[expansion] || 'text-gray-400';
};

const LiveEventsTimeline = () => {
  const currentTime = useCurrentTime(60000); // Update every 60 seconds
  const currentUser = useStore((state) => state.currentUser);
  const eventFilters = useStore((state) => state.eventFilters);
  const completedEventTypes = useStore((state) => state.userData.completedEventTypes);

  // Function to check if an event should be included based on filters
  const shouldIncludeEvent = (expansion, zone, eventName) => {
    const normalizedExpansion = normalizeKey(expansion);
    const normalizedZone = normalizeKey(zone);
    const normalizedEvent = normalizeKey(eventName);

    // If no filters defined, include everything
    if (!eventFilters.expansions || Object.keys(eventFilters.expansions).length === 0) {
      return true;
    }

    // Check if expansion exists in filters
    if (!eventFilters.expansions[normalizedExpansion]) {
      return false;
    }

    // Check if the specific event is enabled
    const eventConfig = eventFilters.expansions[normalizedExpansion]?.zones?.[normalizedZone]?.events?.[normalizedEvent];
    if (eventConfig && typeof eventConfig === 'object' && eventConfig.enabled === true) {
      return true;
    }

    // If event not specifically enabled, check if zone is enabled
    if (eventFilters.expansions[normalizedExpansion]?.zones?.[normalizedZone]?.enabled === true) {
      return true;
    }

    // If neither event nor zone enabled, check if expansion is enabled
    if (eventFilters.expansions[normalizedExpansion].enabled === true) {
      return true;
    }

    return false;
  };

  // Get all upcoming events based on user filters
  const allUpcomingEvents = useMemo(() => {
    const events = [];
    const hoursAhead = 2; // Show events in next 2 hours

    Object.entries(eventsData).forEach(([expansion, zones]) => {
      Object.entries(zones).forEach(([zone, eventsGroup]) => {
        Object.entries(eventsGroup).forEach(([eventName, eventData]) => {
          // Apply user filters
          if (!shouldIncludeEvent(expansion, zone, eventName)) {
            return;
          }

          const timing = getEventTiming(eventData);
          if (!timing || timing.minutesUntil > hoursAhead * 60) {
            return;
          }

          // Create event key for completion check
          const eventKey = `${normalizeKey(expansion)}_${normalizeKey(zone)}_${normalizeKey(eventName)}`;

          events.push({
            ...timing,
            expansion,
            zone,
            eventName,
            eventKey,
            isCompleted: !!completedEventTypes[eventKey]
          });
        });
      });
    });

    // Sort by time
    return events.sort((a, b) => a.minutesUntil - b.minutesUntil);
  }, [currentTime, eventFilters, completedEventTypes]);

  // Apply timeline window filter
  const filteredEvents = useMemo(() => {
    // Filter to show only events within timeline window (-30 to +90 minutes)
    return allUpcomingEvents.filter(event => {
      const startMinutes = event.minutesUntil;
      const endMinutes = event.isActive ? event.minutesRemaining : event.minutesUntil + event.duration;
      return endMinutes >= -30 && startMinutes <= 90;
    });
  }, [allUpcomingEvents]);

  // Timeline configuration
  const timelineData = {
    minutesBefore: 30,
    minutesAfter: 90,
    totalMinutes: 120,
  };

  // Copy waypoint to clipboard
  const copyWaypoint = (waypoint) => {
    if (!waypoint) return;
    navigator.clipboard.writeText(waypoint).then(() => {
      console.log('Waypoint copied:', waypoint);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  // Calculate time until daily reset
  const resetTime = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0
    ));
    const diff = tomorrow - now;
    return Math.floor(diff / 1000 / 60);
  }, [currentTime]);

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Live Events Timeline</h2>
          <p className="text-muted-foreground text-sm">
            Meta events from your selected filters (-30m to +90m)
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Reset in: {formatTime(resetTime)}
        </div>
      </div>

      {/* Events Timeline */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="relative">
          {/* Time markers */}
          <div className="relative border-b border-border pb-2 mb-4 text-sm text-muted-foreground">
            <div className="absolute left-0">-30m</div>
            <div className="absolute font-bold text-primary" style={{ left: '25%', transform: 'translateX(-50%)' }}>NOW</div>
            <div className="absolute" style={{ left: '45.83%', transform: 'translateX(-50%)' }}>+30m</div>
            <div className="absolute" style={{ left: '70.83%', transform: 'translateX(-50%)' }}>+60m</div>
            <div className="absolute right-0">+90m</div>
          </div>

          {/* Timeline container */}
          <div className="relative min-h-[400px]">
            {/* Vertical time markers */}
            <div className="absolute inset-0 flex">
              <div className="border-r border-border/30" style={{ width: '25%' }} />
              <div className="border-r border-border/30" style={{ width: '25%' }} />
              <div className="border-r border-border/30" style={{ width: '25%' }} />
              <div className="border-r border-border/30" style={{ width: '25%' }} />
            </div>

            {/* NOW line */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-primary z-10" style={{ left: '25%' }}>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full shadow-lg" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full shadow-lg" />
            </div>

            {/* Event bars */}
            <div className="relative space-y-2 py-2">
              {filteredEvents.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  {allUpcomingEvents.length === 0 ? (
                    <div className="text-center">
                      <p>No events selected in your filters</p>
                      <p className="text-xs mt-2">Go to "Live Events" tab to select events</p>
                    </div>
                  ) : (
                    'No events in current timeline window'
                  )}
                </div>
              ) : (
                filteredEvents.map((event, index) => {
                  const eventStartMinutes = event.minutesUntil;
                  
                  // Convert minutes to percentage
                  const startPercentage = ((eventStartMinutes + timelineData.minutesBefore) / timelineData.totalMinutes) * 100;
                  const durationPercentage = (event.duration / timelineData.totalMinutes) * 100;

                  // Clamp to visible range
                  const clampedStart = Math.max(0, Math.min(100, startPercentage));
                  const eventEndPercentage = startPercentage + durationPercentage;
                  const clampedEnd = Math.max(0, Math.min(100, eventEndPercentage));
                  const clampedWidth = clampedEnd - clampedStart;

                  return (
                    <div
                      key={`live-timeline-${event.eventKey}-${index}`}
                      className="relative h-12"
                    >
                      <div
                        className={`absolute h-full rounded-lg border-2 ${
                          event.isActive
                            ? 'bg-emerald-500/30 border-emerald-500'
                            : event.isCompleted
                            ? 'bg-muted/50 border-muted-foreground/30'
                            : 'bg-accent border-border'
                        } hover:border-primary cursor-pointer group`}
                        style={{
                          left: `${clampedStart}%`,
                          width: `${clampedWidth}%`,
                          transition: 'left 60s linear, width 60s linear'
                        }}
                        onClick={() => event.waypoint && copyWaypoint(event.waypoint)}
                      >
                        <div className="flex items-center h-full px-2 gap-2 overflow-hidden">
                          {/* Event icon */}
                          {EVENT_ICONS[event.eventName] ? (
                            <img
                              src={EVENT_ICONS[event.eventName]}
                              alt={event.eventName}
                              className="w-6 h-6 rounded flex-shrink-0"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded flex-shrink-0 bg-muted flex items-center justify-center text-xs">
                              ?
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-semibold truncate ${getExpansionColor(event.expansion)}`}>
                              {event.eventName}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {event.zone} • {event.isActive ? `Ends in ${formatTime(event.minutesRemaining)}` : `In ${formatTime(event.minutesUntil)}`}
                            </div>
                          </div>
                        </div>

                        {/* Tooltip on hover */}
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-20 bg-popover border border-border rounded-lg p-3 shadow-lg min-w-[200px]">
                          <div className="font-semibold">{event.eventName}</div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {event.expansion} - {event.zone}
                          </div>
                          <div className="text-xs">
                            {event.isActive ? (
                              <span className="text-emerald-400">Active - Ends in {formatTime(event.minutesRemaining)}</span>
                            ) : (
                              <span>Starts in {formatTime(event.minutesUntil)}</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Duration: {event.duration}m
                          </div>
                          {event.waypoint && (
                            <div className="mt-2 text-xs text-primary">
                              Click to copy waypoint
                            </div>
                          )}
                          {event.isCompleted && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              ✓ Completed
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveEventsTimeline;
