import React, { useState, useMemo, useEffect } from 'react';
import { Clock, Sword } from 'lucide-react';
import { eventsData } from '../utils/eventsData';
import { useCurrentTime } from '../hooks/useCurrentTime';
import useStore from '../store/useStore';

// Import hero chest and world boss data from DailyActivitiesTab
const ALL_MAP_CHESTS = [
  { id: 'verdant_brink_heros_choice_chest', name: 'Verdant Brink', region: 'Heart of Maguuma', icon: 'https://render.guildwars2.com/file/08DC26975002D02B68BEF2A46EF2A89E7243FD63/1424065.png', eventRegion: 'Heart of Thorns', eventMap: 'Verdant Brink', eventDataKey: 'Night Bosses' },
  { id: 'auric_basin_heros_choice_chest', name: 'Auric Basin', region: 'Heart of Maguuma', icon: 'https://render.guildwars2.com/file/6FD4060277D5E7CF024DF43872B7D1095C10F8D8/1424066.png', eventRegion: 'Heart of Thorns', eventMap: 'Auric Basin', eventDataKey: 'Octovine' },
  { id: 'tangled_depths_heros_choice_chest', name: 'Tangled Depths', region: 'Heart of Maguuma', icon: 'https://render.guildwars2.com/file/2127D47C74BCCC26AA2DB5DFA75DBF7B4D42D43F/1424067.png', eventRegion: 'Heart of Thorns', eventMap: 'Tangled Depths', eventDataKey: 'Chak Gerent' },
  { id: 'dragons_stand_heros_choice_chest', name: "Dragon's Stand", region: 'Heart of Maguuma', icon: 'https://render.guildwars2.com/file/E0ED00A7EF9EE56AD09EF2CE00B25CD2D26B024B/1424064.png', eventRegion: 'Heart of Thorns', eventMap: "Dragon's Stand", eventDataKey: 'Start advancing on the Blighting Towers' },
  { id: 'crystal_oasis_heros_choice_chest', name: 'Crystal Oasis', region: 'Crystal Desert', icon: 'https://render.guildwars2.com/file/C8246DDA51367909C74D2F68FFE6502B587607C8/1748126.png', eventRegion: 'Path of Fire', eventMap: 'Crystal Oasis', events: [{ eventDataKey: 'Rounds 1 to 3' }, { eventDataKey: 'Pinata/Reset' }] },
  { id: 'elon_riverlands_heros_choice_chest', name: 'Elon Riverlands', region: 'Crystal Desert', icon: 'https://render.guildwars2.com/file/0B1BA898B3242C5CA5FA7A6F214521AADE01A125/1766453.png', eventRegion: 'Path of Fire', eventMap: 'Elon Riverlands', events: [{ eventDataKey: 'The Path to Ascension: Augury Rock' }, { eventDataKey: 'Doppelganger' }] },
  { id: 'the_desolation_heros_choice_chest', name: 'The Desolation', region: 'Crystal Desert', icon: 'https://render.guildwars2.com/file/80B59B2CCCF7599D11FA0FD2C32B012A5C0410D2/1766459.png', eventRegion: 'Path of Fire', eventMap: 'The Desolation', events: [{ eventDataKey: 'Maws of Torment' }, { eventDataKey: 'Junundu Rising' }] },
  { id: 'domain_of_vabbi_heros_choice_chest', name: 'Domain of Vabbi', region: 'Crystal Desert', icon: 'https://render.guildwars2.com/file/7C1475BFB76AAEE22C5FBBF8C4C57EB6CFB10197/1766452.png', eventRegion: 'Path of Fire', eventMap: 'Domain of Vabbi', events: [{ eventDataKey: "Serpents' Ire" }, { eventDataKey: 'Forged with Fire' }] },
  { id: 'dragons_end_heros_choice_chest', name: "Dragon's End", region: 'Cantha', icon: 'https://render.guildwars2.com/file/FDF5B9F3AE45086BE55CF4CF7C79F313D6A01E61/2594264.png', eventRegion: 'End of Dragons', eventMap: "Dragon's End", eventDataKey: 'The Battle for the Jade Sea' },
  { id: 'seitung_province_heros_choice_chest', name: 'Seitung Province', region: 'Cantha', icon: 'https://render.guildwars2.com/file/FDF5B9F3AE45086BE55CF4CF7C79F313D6A01E61/2594264.png', eventRegion: 'End of Dragons', eventMap: 'Seitung Province', eventDataKey: 'Aetherblade Assault' },
  { id: 'new_kaineng_city_heros_choice_chest', name: 'New Kaineng City', region: 'Cantha', icon: 'https://render.guildwars2.com/file/FDF5B9F3AE45086BE55CF4CF7C79F313D6A01E61/2594264.png', eventRegion: 'End of Dragons', eventMap: 'New Kaineng City', eventDataKey: 'Kaineng Blackout' },
  { id: 'echovald_wilds_heros_choice_chest', name: 'Echovald Wilds', region: 'Cantha', icon: 'https://render.guildwars2.com/file/FDF5B9F3AE45086BE55CF4CF7C79F313D6A01E61/2594264.png', eventRegion: 'End of Dragons', eventMap: 'The Echovald Wilds', events: [{ eventDataKey: 'Gang War' }, { eventDataKey: 'Aspenwood' }] },
  { id: 'gyala_delve_heros_choice_chest', name: 'Gyala Delve', region: 'Cantha', icon: 'https://render.guildwars2.com/file/FDF5B9F3AE45086BE55CF4CF7C79F313D6A01E61/2594264.png' },
  { id: 'skywatch_archipelago_heros_choice_chest', name: 'Skywatch Archipelago', region: 'Secrets of the Obscure', icon: 'https://render.guildwars2.com/file/DE1D62A95F57470D61E15D47D20159D8E2BB18FB/3122157.png', eventRegion: 'Secrets of the Obscure', eventMap: 'Skywatch Archipelago', eventDataKey: 'Unlocking the Wizard\'s Tower' },
  { id: 'amnytas_heros_choice_chest', name: 'Amnytas', region: 'Secrets of the Obscure', icon: 'https://render.guildwars2.com/file/F1100DBF0DF2BE50F609EE0F92E0043BE8C35F9D/3122155.png', eventRegion: 'Secrets of the Obscure', eventMap: 'Amnytas', eventDataKey: 'Defense of Amnytas' },
  { id: 'convergence_heros_choice_chest', name: 'Convergence', region: 'Secrets of the Obscure', icon: 'https://render.guildwars2.com/file/46EC231103323FB5EEBBC1AEF74AE015050F013E/3122156.png', eventRegion: 'Secrets of the Obscure', eventMap: 'Conv.: Outer Nayos', eventDataKey: 'Convergence: Outer Nayos' },
  { id: 'inner_nayos_heros_choice_chest', name: 'Inner Nayos', region: 'Secrets of the Obscure', icon: 'https://render.guildwars2.com/file/6C0CDA94EC94FA906493E2050DDECDD5965877FD/3199530.png' },
  { id: 'citadel_of_zakiros_heros_choice_chest', name: 'Citadel of Zakiros', region: 'Janthir Wilds', icon: 'https://render.guildwars2.com/file/6C0CDA94EC94FA906493E2050DDECDD5965877FD/3199530.png', eventRegion: 'Janthir Wilds', eventMap: 'Janthir Syntri', eventDataKey: 'Of Mists and Monsters' },
  { id: 'wild_island_heros_choice_chest', name: 'Lowland Shore', region: 'Janthir Wilds', icon: 'https://render.guildwars2.com/file/00AABCE916B695E81295E92D2A42ECC37E9039D5/3374827.png', eventRegion: 'Janthir Wilds', eventMap: 'Bava Nisos', eventDataKey: 'A Titanic Voyage' },
];

const WORLD_BOSSES = [
  { id: 'admiral_taidha_covington', name: 'Admiral Taidha Covington', eventDataKey: 'Admiral Taidha Covington' },
  { id: 'svanir_shaman_chief', name: 'Svanir Shaman Chief', eventDataKey: 'Svanir Shaman Chief' },
  { id: 'megadestroyer', name: 'Megadestroyer', eventDataKey: 'Megadestroyer' },
  { id: 'fire_elemental', name: 'Fire Elemental', eventDataKey: 'Fire Elemental' },
  { id: 'the_shatterer', name: 'The Shatterer', eventDataKey: 'The Shatterer' },
  { id: 'great_jungle_wurm', name: 'Great Jungle Wurm', eventDataKey: 'Great Jungle Wurm' },
  { id: 'modniir_ulgoth', name: 'Modniir Ulgoth', eventDataKey: 'Modniir Ulgoth' },
  { id: 'shadow_behemoth', name: 'Shadow Behemoth', eventDataKey: 'Shadow Behemoth' },
  { id: 'golem_mark_ii', name: 'Golem Mark II', eventDataKey: 'Golem Mark II' },
  { id: 'claw_of_jormag', name: 'Claw of Jormag', eventDataKey: 'Claw of Jormag' },
  { id: 'tequatl_the_sunless', name: 'Tequatl the Sunless', eventDataKey: 'Tequatl the Sunless' },
  { id: 'triple_trouble', name: 'Triple Trouble', eventDataKey: 'Triple Trouble' },
  { id: 'karka_queen', name: 'Karka Queen', eventDataKey: 'Karka Queen' },
];

// Helper function to get next event time (copied from DailyActivitiesTab)
const getNextEventTime = (eventRegion, eventMap, eventDataKey) => {
  try {
    const eventData = eventsData[eventRegion]?.[eventMap]?.[eventDataKey];
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
        const minutesElapsed = currentUTC - time; // How long ago the event started
        return {
          eventName: eventDataKey,
          timeStr: formatTime(minutesRemaining),
          waypoint: eventData.waypoint,
          minutesUntil: -minutesElapsed, // Negative value = started in the past
          isActive: true,
          duration: duration, // Full duration to show complete event bar
          minutesRemaining: minutesRemaining, // Time left until it ends
          endTime: endTime
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
      eventName: eventDataKey,
      timeStr: formatTime(minutesUntil),
      waypoint: eventData.waypoint,
      minutesUntil: minutesUntil,
      isActive: false,
      duration: duration,
      startTime: nextTime
    };
  } catch (error) {
    console.error('Error getting event time:', error);
    return null;
  }
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

// Get all upcoming events (hero chests + world bosses) in next X hours
const getAllUpcomingEvents = (hoursAhead = 6) => {
  const events = [];
  const eventKeys = new Set(); // Prevent duplicates

  // Add hero chest events
  ALL_MAP_CHESTS.forEach(chest => {
    if (chest.manual || !chest.eventDataKey && !chest.events) return;

    const eventDataKeys = chest.events
      ? chest.events.map(e => e.eventDataKey)
      : [chest.eventDataKey];

    eventDataKeys.forEach(key => {
      const eventInfo = getNextEventTime(chest.eventRegion, chest.eventMap, key);

      if (eventInfo && eventInfo.minutesUntil <= hoursAhead * 60) {
        const uniqueKey = `${chest.eventRegion}-${chest.eventMap}-${key}-${eventInfo.minutesUntil}`;

        if (!eventKeys.has(uniqueKey)) {
          eventKeys.add(uniqueKey);
          events.push({
            ...eventInfo,
            type: 'hero_chest',
            mapName: chest.name,
            region: chest.region,
            icon: chest.icon,
            eventRegion: chest.eventRegion,
            eventMap: chest.eventMap
          });
        }
      }
    });
  });

  // Add world boss events
  WORLD_BOSSES.forEach(boss => {
    const eventInfo = getNextEventTime('Core Tyria', 'World bosses', boss.eventDataKey);

    if (eventInfo && eventInfo.minutesUntil <= hoursAhead * 60) {
      const uniqueKey = `Core-WorldBosses-${boss.eventDataKey}-${eventInfo.minutesUntil}`;

      if (!eventKeys.has(uniqueKey)) {
        eventKeys.add(uniqueKey);
        events.push({
          ...eventInfo,
          type: 'world_boss',
          mapName: boss.name,
          region: 'Core Tyria',
          eventRegion: 'Core Tyria',
          eventMap: 'World Bosses'
        });
      }
    }
  });

  return events.sort((a, b) => a.minutesUntil - b.minutesUntil);
};

// Get expansion color
const getExpansionColor = (region) => {
  const colors = {
    'Heart of Maguuma': 'text-emerald-400',
    'Crystal Desert': 'text-amber-400',
    'Cantha': 'text-cyan-400',
    'Secrets of the Obscure': 'text-purple-400',
    'Janthir Wilds': 'text-green-400',
    'Core Tyria': 'text-blue-400'
  };
  return colors[region] || 'text-gray-400';
};

const EventPlannerTab = () => {
  const currentTime = useCurrentTime(60000); // Update every 60 seconds
  const currentUser = useStore((state) => state.currentUser);
  const hasGW2ApiKey = useStore((state) => state.hasGW2ApiKey);

  // Get completed data from store (cached)
  const mapChests = useStore((state) => state.completedMapChests);
  const worldBosses = useStore((state) => state.completedWorldBosses);

  // Filter toggles
  const [hideCompleted, setHideCompleted] = useState(false);
  const [showWorldBosses, setShowWorldBosses] = useState(true);

  // Manual chests from localStorage
  const [manualChests, setManualChests] = useState([]);

  // Load manual chests from localStorage when user changes
  useEffect(() => {
    if (currentUser) {
      const saved = localStorage.getItem(`manualChests_${currentUser}`);
      setManualChests(saved ? JSON.parse(saved) : []);
    }
  }, [currentUser]);

  // Calculate all events within the timeline window (-60min to +60min)
  const allUpcomingEvents = useMemo(() => {
    const allEvents = getAllUpcomingEvents(2); // Get events in next 2h

    // Filter to only show events within our timeline window
    return allEvents.filter(event => {
      const startMinutes = event.minutesUntil;
      const endMinutes = event.isActive ? event.minutesRemaining : event.minutesUntil + event.duration;

      // Show event if it overlaps with our timeline (-30 to +90)
      return endMinutes >= -30 && startMinutes <= 90;
    });
  }, [currentTime]);

  // Apply filters
  const upcomingEvents = useMemo(() => {
    let filtered = allUpcomingEvents;

    // Filter out world bosses if toggle is off
    if (!showWorldBosses) {
      filtered = filtered.filter(event => event.type !== 'world_boss');
    }

    // Filter out completed events if toggle is on
    if (hideCompleted) {
      filtered = filtered.filter(event => {
        if (event.type === 'hero_chest') {
          // Check if hero chest is completed via API or manual
          const chestId = ALL_MAP_CHESTS.find(c => c.name === event.mapName)?.id;
          return !mapChests.includes(chestId) && !manualChests.includes(chestId);
        } else if (event.type === 'world_boss') {
          // Check if world boss is completed via API
          const bossId = WORLD_BOSSES.find(b => b.name === event.mapName)?.id;
          return !worldBosses.includes(bossId);
        }
        return true;
      });
    }

    return filtered;
  }, [allUpcomingEvents, showWorldBosses, hideCompleted, mapChests, worldBosses, manualChests]);


  // Fixed timeline: 30min before "now", 90min after "now"
  // "Now" is at 25% (30min / 120min total)
  const timelineData = useMemo(() => {
    return {
      minutesBefore: 30,  // Show 30min in the past
      minutesAfter: 90,   // Show 1h30min in the future
      totalMinutes: 120,  // Total 2h span
    };
  }, []);

  // Copy waypoint to clipboard
  const copyWaypoint = (waypoint) => {
    if (!waypoint) return;

    navigator.clipboard.writeText(waypoint).then(() => {
      console.log('Waypoint copied:', waypoint);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  // Calculate time until daily reset (UTC midnight)
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
          <h2 className="text-2xl font-bold">Timeline</h2>
          <p className="text-muted-foreground text-sm">
            Hero Chests and World Bosses (-30m to +90m)
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Reset in: {formatTime(resetTime)}
        </div>
      </div>

      {/* Filter toggles */}
      <div className="flex items-center justify-end gap-4 pb-2 border-b mb-6">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
          <input
            type="checkbox"
            checked={hideCompleted}
            onChange={(e) => setHideCompleted(e.target.checked)}
            className="w-4 h-4 rounded border-2 cursor-pointer"
          />
          Hide Completed
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
          <input
            type="checkbox"
            checked={!showWorldBosses}
            onChange={(e) => setShowWorldBosses(!e.target.checked)}
            className="w-4 h-4 rounded border-2 cursor-pointer"
          />
          Hide World Bosses
        </label>
      </div>

      {/* Events Timeline */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="relative">
          {/* Time markers: -30min, NOW, +30min, +60min, +90min */}
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

            {/* NOW line - fixed at 25% (30min from start) */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-primary z-10" style={{ left: '25%' }}>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full shadow-lg" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full shadow-lg" />
            </div>

            {/* Event bars */}
            <div className="relative space-y-2 py-2">
              {upcomingEvents.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  No events in current timeline window
                </div>
              ) : (
                upcomingEvents.map((event, index) => {
                // Calculate position relative to "now" (which is at 25%)
                // Timeline spans from -30min (0%) to +90min (100%)
                // "Now" is at 25% (30min / 120min total)

                let eventStartMinutes;
                if (event.isActive) {
                  // Active event started in the past (minutesUntil is negative)
                  eventStartMinutes = event.minutesUntil;
                } else {
                  // Future event
                  eventStartMinutes = event.minutesUntil;
                }

                // Convert minutes to percentage
                // -30min = 0%, 0min (NOW) = 25%, +90min = 100%
                const startPercentage = ((eventStartMinutes + timelineData.minutesBefore) / timelineData.totalMinutes) * 100;
                const durationPercentage = (event.duration / timelineData.totalMinutes) * 100;

                // Only show events that are visible in the timeline (-30 to +90 minutes)
                if (eventStartMinutes < -30 || eventStartMinutes > 90) {
                  return null;
                }

                // Clamp to visible range
                const clampedStart = Math.max(0, Math.min(100, startPercentage));
                const eventEndPercentage = startPercentage + durationPercentage;
                const clampedEnd = Math.max(0, Math.min(100, eventEndPercentage));
                const clampedWidth = clampedEnd - clampedStart;

                  return (
                    <div
                      key={`timeline-${event.eventRegion}-${event.eventMap}-${event.eventName}-${index}`}
                      className="relative h-12"
                    >
                      <div
                        className={`absolute h-full rounded-lg border-2 ${
                          event.isActive
                            ? 'bg-emerald-500/30 border-emerald-500'
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
                          {/* Icon */}
                          {event.type === 'hero_chest' && event.icon ? (
                            <img
                              src={event.icon}
                              alt={event.mapName}
                              className="w-6 h-6 rounded flex-shrink-0"
                            />
                          ) : (
                            <Sword className="w-5 h-5 text-red-400 flex-shrink-0" />
                          )}

                          {/* Event name */}
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-semibold truncate ${getExpansionColor(event.region)}`}>
                              {event.mapName}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {event.isActive ? `Ends in ${event.timeStr}` : `In ${event.timeStr}`}
                            </div>
                          </div>
                        </div>

                        {/* Tooltip on hover */}
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-20 bg-popover border border-border rounded-lg p-3 shadow-lg min-w-[200px]">
                          <div className="font-semibold">{event.mapName}</div>
                          <div className="text-sm text-muted-foreground mb-2">{event.eventName}</div>
                          <div className="text-xs">
                            {event.isActive ? (
                              <span className="text-emerald-400">Active - Ends in {event.timeStr}</span>
                            ) : (
                              <span>Starts in {event.timeStr}</span>
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

export default EventPlannerTab;
