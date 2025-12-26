import React, { useState, useEffect, useCallback } from 'react';
import useStore from '../store/useStore';
import { fetchMapChests, fetchDailyCrafting, fetchWorldBosses, fetchFractals } from '../services/api';
import { Loader2, ChevronRight, ChevronDown, Key, AlertCircle, Check, X, Clock } from 'lucide-react';
import { Button } from './ui/button';
import LoadingSpinner from './LoadingSpinner';
import { eventsData } from '../utils/eventsData';

// Complete list of all map chests with friendly names and icon URLs
const ALL_MAP_CHESTS = [
  { id: 'verdant_brink_heros_choice_chest', name: 'Verdant Brink', region: 'Heart of Maguuma', icon: 'https://render.guildwars2.com/file/08DC26975002D02B68BEF2A46EF2A89E7243FD63/1424065.png', eventRegion: 'Heart of Thorns', eventMap: 'Verdant Brink', eventDataKey: 'Night Bosses' },
  { id: 'auric_basin_heros_choice_chest', name: 'Auric Basin', region: 'Heart of Maguuma', icon: 'https://render.guildwars2.com/file/6FD4060277D5E7CF024DF43872B7D1095C10F8D8/1424066.png', eventRegion: 'Heart of Thorns', eventMap: 'Auric Basin', eventDataKey: 'Octovine' },
  { id: 'tangled_depths_heros_choice_chest', name: 'Tangled Depths', region: 'Heart of Maguuma', icon: 'https://render.guildwars2.com/file/2127D47C74BCCC26AA2DB5DFA75DBF7B4D42D43F/1424067.png', eventRegion: 'Heart of Thorns', eventMap: 'Tangled Depths', eventDataKey: 'Chak Gerent' },
  { id: 'dragons_stand_heros_choice_chest', name: "Dragon's Stand", region: 'Heart of Maguuma', icon: 'https://render.guildwars2.com/file/E0ED00A7EF9EE56AD09EF2CE00B25CD2D26B024B/1424064.png', eventRegion: 'Heart of Thorns', eventMap: "Dragon's Stand", eventDataKey: 'Start advancing on the Blighting Towers' },
  { id: 'crystal_oasis_heros_choice_chest', name: 'Crystal Oasis', region: 'Crystal Desert', icon: 'https://render.guildwars2.com/file/C8246DDA51367909C74D2F68FFE6502B587607C8/1748126.png', eventRegion: 'Path of Fire', eventMap: 'Crystal Oasis', eventDataKey: 'Pinata/Reset' },
  { id: 'elon_riverlands_heros_choice_chest', name: 'Elon Riverlands', region: 'Crystal Desert', icon: 'https://render.guildwars2.com/file/0B1BA898B3242C5CA5FA7A6F214521AADE01A125/1766453.png', eventRegion: 'Path of Fire', eventMap: 'Elon Riverlands', eventDataKey: 'Doppelganger' },
  { id: 'the_desolation_heros_choice_chest', name: 'The Desolation', region: 'Crystal Desert', icon: 'https://render.guildwars2.com/file/80B59B2CCCF7599D11FA0FD2C32B012A5C0410D2/1766459.png', eventRegion: 'Path of Fire', eventMap: 'The Desolation', events: [{ eventDataKey: 'Maws of Torment' }, { eventDataKey: 'Junundu Rising' }] },
  { id: 'domain_of_vabbi_heros_choice_chest', name: 'Domain of Vabbi', region: 'Crystal Desert', icon: 'https://render.guildwars2.com/file/7C1475BFB76AAEE22C5FBBF8C4C57EB6CFB10197/1766452.png', eventRegion: 'Path of Fire', eventMap: 'Domain of Vabbi', eventDataKey: "Serpents' Ire" },
  { id: 'dragons_end_heros_choice_chest', name: "Dragon's End", region: 'Cantha', icon: 'https://render.guildwars2.com/file/FDF5B9F3AE45086BE55CF4CF7C79F313D6A01E61/2594264.png', eventRegion: 'End of Dragons', eventMap: "Dragon's End", eventDataKey: 'The Battle for the Jade Sea' },
  { id: 'seitung_province_heros_choice_chest', name: 'Seitung Province', region: 'Cantha', icon: 'https://render.guildwars2.com/file/FDF5B9F3AE45086BE55CF4CF7C79F313D6A01E61/2594264.png', eventRegion: 'End of Dragons', eventMap: 'Seitung Province', eventDataKey: 'Aetherblade Assault' },
  { id: 'new_kaineng_city_heros_choice_chest', name: 'New Kaineng City', region: 'Cantha', icon: 'https://render.guildwars2.com/file/FDF5B9F3AE45086BE55CF4CF7C79F313D6A01E61/2594264.png', eventRegion: 'End of Dragons', eventMap: 'New Kaineng City', eventDataKey: 'Kaineng Blackout' },
  { id: 'echovald_wilds_heros_choice_chest', name: 'Echovald Wilds', region: 'Cantha', icon: 'https://render.guildwars2.com/file/FDF5B9F3AE45086BE55CF4CF7C79F313D6A01E61/2594264.png', eventRegion: 'End of Dragons', eventMap: 'The Echovald Wilds', eventDataKey: 'Gang War' },
  { id: 'gyala_delve_heros_choice_chest', name: 'Gyala Delve', region: 'Cantha', icon: 'https://render.guildwars2.com/file/FDF5B9F3AE45086BE55CF4CF7C79F313D6A01E61/2594264.png' },
  { id: 'skywatch_archipelago_heros_choice_chest', name: 'Skywatch Archipelago', region: 'Secrets of the Obscure', icon: 'https://render.guildwars2.com/file/DE1D62A95F57470D61E15D47D20159D8E2BB18FB/3122157.png', eventRegion: 'Secrets of the Obscure', eventMap: 'Skywatch Archipelago', eventDataKey: 'Unlocking the Wizard\'s Tower' },
  { id: 'amnytas_heros_choice_chest', name: 'Amnytas', region: 'Secrets of the Obscure', icon: 'https://render.guildwars2.com/file/F1100DBF0DF2BE50F609EE0F92E0043BE8C35F9D/3122155.png', eventRegion: 'Secrets of the Obscure', eventMap: 'Amnytas', eventDataKey: 'Defense of Amnytas' },
  { id: 'convergence_heros_choice_chest', name: 'Convergence', region: 'Secrets of the Obscure', icon: 'https://render.guildwars2.com/file/46EC231103323FB5EEBBC1AEF74AE015050F013E/3122156.png', eventRegion: 'Secrets of the Obscure', eventMap: 'Conv.: Outer Nayos', eventDataKey: 'Convergence: Outer Nayos' },
  { id: 'inner_nayos_heros_choice_chest', name: 'Inner Nayos', region: 'Secrets of the Obscure', icon: 'https://render.guildwars2.com/file/6C0CDA94EC94FA906493E2050DDECDD5965877FD/3199530.png' },
  { id: 'citadel_of_zakiros_heros_choice_chest', name: 'Citadel of Zakiros', region: 'Janthir Wilds', icon: 'https://render.guildwars2.com/file/6C0CDA94EC94FA906493E2050DDECDD5965877FD/3199530.png', eventRegion: 'Janthir Wilds', eventMap: 'Janthir Syntri', eventDataKey: 'Of Mists and Monsters' },
  { id: 'wild_island_heros_choice_chest', name: 'Lowland Shore', region: 'Janthir Wilds', icon: 'https://render.guildwars2.com/file/00AABCE916B695E81295E92D2A42ECC37E9039D5/3374827.png', eventRegion: 'Janthir Wilds', eventMap: 'Bava Nisos', eventDataKey: 'A Titanic Voyage' },
  { id: 'castora_heros_choice_chest', name: 'Castora', region: 'Visions of Eternity', icon: 'https://render.guildwars2.com/file/2098DC55D139B2A209D3E50FA14BA09BC20DB6EB/3708799.png', manual: true },
];

// Daily crafting recipes
const DAILY_CRAFTING = [
  { id: 'charged_quartz_crystal', name: 'Charged Quartz Crystal', icon: 'https://render.guildwars2.com/file/10ABB44B459640C30CB8BFAEA9DFEAE19C6ECD67/603251.png' },
  { id: 'glob_of_elder_spirit_residue', name: 'Glob of Elder Spirit Residue', icon: 'https://render.guildwars2.com/file/131F51B9177E2AEB75326901021C42CB3169452D/631492.png' },
  { id: 'lump_of_mithrilium', name: 'Lump of Mithrillium', icon: 'https://render.guildwars2.com/file/BAF140ED460135E04101146CC8CE9EFB5698F077/631490.png' },
  { id: 'spool_of_silk_weaving_thread', name: 'Spool of Silk Weaving Thread', icon: 'https://render.guildwars2.com/file/45C6FC08BE801CFC31C455A8684A963B51A73759/631488.png' },
  { id: 'spool_of_thick_elonian_cord', name: 'Spool of Thick Elonian Cord', icon: 'https://render.guildwars2.com/file/643E2343E5B573664DD8010ACBD9B5BD970E305C/631493.png' },
];

// World bosses with names matching eventsData
const WORLD_BOSSES = [
  { id: 'admiral_taidha_covington', name: 'Admiral Taidha Covington', eventDataKey: 'Admiral Taidha Covington' },
  { id: 'svanir_shaman_chief', name: 'Svanir Shaman Chief', eventDataKey: 'Svanir Shaman Chief' },
  { id: 'megadestroyer', name: 'Megadestroyer', eventDataKey: 'Megadestroyer' },
  { id: 'fire_elemental', name: 'Fire Elemental', eventDataKey: 'Fire Elemental' },
  { id: 'the_shatterer', name: 'The Shatterer', eventDataKey: 'The Shatterer' },
  { id: 'great_jungle_wurm', name: 'Great Jungle Wurm', eventDataKey: 'Great Jungle Wurm' },
  { id: 'modniir_ulgoth', name: 'Modniir Ulgoth', eventDataKey: 'Modniir Ulgoth' },
  { id: 'shadow_behemoth', name: 'Shadow Behemoth', eventDataKey: 'Shadow Behemoth' },
  { id: 'inquest_golem_mark_ii', name: 'Inquest Golem Mark II', eventDataKey: 'Golem Mark II' },
  { id: 'claw_of_jormag', name: 'Claw of Jormag', eventDataKey: 'Claw of Jormag' },
  { id: 'tequatl_the_sunless', name: 'Tequatl the Sunless', eventDataKey: 'Tequatl the Sunless' },
  { id: 'triple_trouble_wurm', name: 'Triple Trouble', eventDataKey: 'Triple Trouble' },
  { id: 'karka_queen', name: 'Karka Queen', eventDataKey: 'Karka Queen' },
  { id: 'drakkar', name: 'Drakkar', eventDataKey: 'Drakkar and Spirits of the Wild' },
  { id: 'mists_and_monsters_titans', name: 'Mists and Monsters: Titans', eventDataKey: 'Of Mists and Monsters' },
];

// Daily fractals are now fetched from API

// Helper function to get next world boss spawn time
const getNextBossTime = (eventDataKey) => {
  if (!eventDataKey) return null;

  // Search through all regions and all subcategories to find the boss
  for (const region in eventsData) {
    for (const category in eventsData[region]) {
      if (eventsData[region][category][eventDataKey]) {
        const bossData = eventsData[region][category][eventDataKey];
        const now = new Date();
        const currentUTC = now.getUTCHours() * 60 + now.getUTCMinutes();

        // Parse UTC times and find next occurrence
        const times = bossData.utc_times.map(timeStr => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + minutes;
        });

        // Find next spawn
        const nextTime = times.find(t => t > currentUTC) || times[0];
        const minutesUntil = nextTime > currentUTC
          ? nextTime - currentUTC
          : (24 * 60 - currentUTC) + nextTime;

        const hours = Math.floor(minutesUntil / 60);
        const minutes = minutesUntil % 60;

        return {
          timeStr: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
          waypoint: bossData.waypoint,
          minutesUntil: minutesUntil,
        };
      }
    }
  }

  return null;
};

// Helper function to get next chest event time
const getNextChestEventTime = (eventRegion, eventMap, eventDataKey) => {
  if (!eventRegion || !eventMap || !eventDataKey) return null;

  // Access event data using the region, map, and event key
  const eventData = eventsData[eventRegion]?.[eventMap]?.[eventDataKey];

  if (!eventData) return null;

  const now = new Date();
  const currentUTC = now.getUTCHours() * 60 + now.getUTCMinutes();
  const duration = eventData.duration_minutes || 0;

  // Parse UTC times
  const times = eventData.utc_times.map(timeStr => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  });

  // Check if any event is currently running
  for (const startTime of times) {
    const endTime = startTime + duration;

    // Check if current time is within event window
    if (currentUTC >= startTime && currentUTC < endTime) {
      const minutesRemaining = endTime - currentUTC;
      const hours = Math.floor(minutesRemaining / 60);
      const minutes = minutesRemaining % 60;

      return {
        eventName: eventDataKey,
        timeStr: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
        waypoint: eventData.waypoint,
        minutesUntil: 0, // 0 means it's happening now
        isActive: true,
      };
    }
  }

  // No event running, find next spawn
  const nextTime = times.find(t => t > currentUTC) || times[0];
  const minutesUntil = nextTime > currentUTC
    ? nextTime - currentUTC
    : (24 * 60 - currentUTC) + nextTime;

  const hours = Math.floor(minutesUntil / 60);
  const minutes = minutesUntil % 60;

  return {
    eventName: eventDataKey,
    timeStr: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
    waypoint: eventData.waypoint,
    minutesUntil: minutesUntil,
    isActive: false,
  };
};

const DailyActivitiesTab = () => {
  const currentUser = useStore((state) => state.currentUser);
  const hasGW2ApiKey = useStore((state) => state.hasGW2ApiKey);
  const gw2AccountName = useStore((state) => state.gw2AccountName);
  const saveUserGW2ApiKey = useStore((state) => state.saveUserGW2ApiKey);

  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapChests, setMapChests] = useState([]);
  const [dailyCrafting, setDailyCrafting] = useState([]);
  const [worldBosses, setWorldBosses] = useState([]);
  const [fractals, setFractals] = useState([]);
  const [error, setError] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [manualChests, setManualChests] = useState(() => {
    // Load manual chests from localStorage
    const saved = localStorage.getItem(`manualChests_${currentUser}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Section visibility states
  const [showDailyCrafting, setShowDailyCrafting] = useState(true);
  const [showWorldBosses, setShowWorldBosses] = useState(true);
  const [showFractals, setShowFractals] = useState(true);
  const [showMapChests, setShowMapChests] = useState(true);

  const handleCopyWaypoint = (waypoint) => {
    navigator.clipboard.writeText(waypoint).then(() => {
      // Optional: Add a toast notification here
      console.log('Waypoint copied:', waypoint);
    }).catch(err => {
      console.error('Failed to copy waypoint:', err);
    });
  };

  const loadAllData = useCallback(async () => {
    if (!currentUser) {
      console.log('[DailyActivities] loadAllData: no currentUser');
      return;
    }

    console.log('[DailyActivities] === LOADING DATA FOR USER:', currentUser, '===');
    setLoadingData(true);
    setError(null);

    try {
      // Fetch all data in parallel - using Promise.allSettled to handle partial failures
      const [mapChestsResult, craftingResult, worldBossesResult, fractalsResult] = await Promise.allSettled([
        fetchMapChests(currentUser),
        fetchDailyCrafting(currentUser),
        fetchWorldBosses(currentUser),
        fetchFractals(currentUser),
      ]);

      console.log('[DailyActivities] API Results:', {
        mapChests: mapChestsResult.status === 'fulfilled' ? mapChestsResult.value : mapChestsResult.reason,
        crafting: craftingResult.status === 'fulfilled' ? craftingResult.value : craftingResult.reason,
        worldBosses: worldBossesResult.status === 'fulfilled' ? worldBossesResult.value : worldBossesResult.reason,
        fractals: fractalsResult.status === 'fulfilled' ? fractalsResult.value : fractalsResult.reason
      });

      // Handle map chests
      if (mapChestsResult.status === 'fulfilled' && !mapChestsResult.value.needsApiKey) {
        console.log('[DailyActivities] Setting map chests:', mapChestsResult.value.data);
        setMapChests(mapChestsResult.value.data || []);
      } else {
        console.log('[DailyActivities] Map chests failed or needs API key');
        setMapChests([]);
      }

      // Handle daily crafting
      if (craftingResult.status === 'fulfilled' && !craftingResult.value.needsApiKey) {
        console.log('[DailyActivities] Setting daily crafting:', craftingResult.value.data);
        setDailyCrafting(craftingResult.value.data || []);
      } else {
        console.log('[DailyActivities] Daily crafting failed or needs API key');
        setDailyCrafting([]);
      }

      // Handle world bosses
      if (worldBossesResult.status === 'fulfilled' && !worldBossesResult.value.needsApiKey) {
        console.log('[DailyActivities] Setting world bosses:', worldBossesResult.value.data);
        setWorldBosses(worldBossesResult.value.data || []);
      } else {
        console.log('[DailyActivities] World bosses failed or needs API key');
        setWorldBosses([]);
      }

      // Handle fractals - allow graceful failure
      if (fractalsResult.status === 'fulfilled' && !fractalsResult.value.needsApiKey && fractalsResult.value.success) {
        console.log('[DailyActivities] Setting fractals:', fractalsResult.value.data);
        setFractals(fractalsResult.value.data || []);
      } else {
        console.log('[DailyActivities] Fractals failed or needs API key:', fractalsResult.status === 'fulfilled' ? fractalsResult.value : fractalsResult.reason);
        setFractals([]);
        // Set a non-blocking error message if fractals specifically failed
        if (fractalsResult.status === 'fulfilled' && fractalsResult.value.error && !fractalsResult.value.needsApiKey) {
          setError(`Fractals data unavailable: ${fractalsResult.value.error}`);
        }
      }
    } catch (err) {
      console.error('[DailyActivities] Error loading data:', err);
      setError(err.message);
      setMapChests([]);
      setDailyCrafting([]);
      setWorldBosses([]);
      setFractals([]);
    } finally {
      setLoadingData(false);
    }
  }, [currentUser]);

  // Load all data when user has API key
  useEffect(() => {
    console.log('[DailyActivities] ========== useEffect TRIGGERED ==========');
    console.log('[DailyActivities] hasGW2ApiKey:', hasGW2ApiKey);
    console.log('[DailyActivities] currentUser:', currentUser);
    console.log('[DailyActivities] loadAllData type:', typeof loadAllData);
    
    if (hasGW2ApiKey && currentUser) {
      console.log('[DailyActivities] ✓ Conditions met - calling loadAllData');
      loadAllData();
    } else {
      console.log('[DailyActivities] ✗ Conditions NOT met');
      console.log('[DailyActivities]   - hasGW2ApiKey:', hasGW2ApiKey);
      console.log('[DailyActivities]   - currentUser:', currentUser);
    }
  }, [hasGW2ApiKey, currentUser, loadAllData]);

  const toggleManualChest = (chestId) => {
    setManualChests((prev) => {
      const newManualChests = prev.includes(chestId)
        ? prev.filter((id) => id !== chestId)
        : [...prev, chestId];

      // Save to localStorage
      localStorage.setItem(`manualChests_${currentUser}`, JSON.stringify(newManualChests));
      return newManualChests;
    });
  };

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await saveUserGW2ApiKey(apiKey.trim());
      setApiKey('');
      // All data will load automatically via useEffect when hasGW2ApiKey becomes true
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <p>Please log in to view daily activities.</p>
      </div>
    );
  }

  // Show API key input form if user doesn't have one
  if (!hasGW2ApiKey) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Key className="w-6 h-6 text-primary mt-1" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">GW2 API Key Required</h2>
              <p className="text-muted-foreground mb-4">
                To view your daily activities (map chests, crafting, world bosses), you need to add your Guild Wars 2 API key.
              </p>

              <div className="bg-muted/50 rounded-md p-4 mb-4 space-y-2 text-sm">
                <p className="font-medium">How to get your API key:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Visit <a href="https://account.arena.net/applications" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ArenaNet Applications</a></li>
                  <li>Click "New Key"</li>
                  <li>Give it a name (e.g., "Tyria Tracker")</li>
                  <li>Check the "account" permission</li>
                  <li>Copy the generated key</li>
                </ol>
              </div>

              <form onSubmit={handleSaveApiKey} className="space-y-4">
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium mb-2">
                    API Key
                  </label>
                  <input
                    id="apiKey"
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXXXXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                    className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" disabled={loading || !apiKey.trim()}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save API Key
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show all activities if user has API key
  const completedMapChests = mapChests.length + manualChests.length;
  const completedCrafting = dailyCrafting.length;
  const completedWorldBosses = worldBosses.length;
  const completedFractals = fractals.filter(f => f.completed).length;

  const totalMapChests = ALL_MAP_CHESTS.length;
  const totalCrafting = DAILY_CRAFTING.length;
  const totalWorldBosses = WORLD_BOSSES.length;
  const totalFractals = fractals.length;

  const totalCompleted = completedMapChests + completedCrafting + completedWorldBosses + completedFractals;
  const totalActivities = totalMapChests + totalCrafting + totalWorldBosses + totalFractals;
  const completionPercentage = totalActivities > 0 ? Math.round((totalCompleted / totalActivities) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Daily Activities</h2>
          <Button
            onClick={loadAllData}
            disabled={loadingData}
            variant="outline"
            size="sm"
          >
            {loadingData && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Refresh
          </Button>
        </div>
        {gw2AccountName && (
          <p className="text-sm text-muted-foreground">
            Account: <span className="font-medium">{gw2AccountName}</span>
          </p>
        )}

        {/* Progress Summary */}
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Today's Progress</span>
            <span className="text-sm font-bold text-primary">
              {totalCompleted} / {totalActivities} ({completionPercentage}%)
            </span>
          </div>
          <div className="w-full bg-background rounded-full h-2 overflow-hidden mb-3">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          {/* Category breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-background/50 rounded p-2">
              <div className="text-muted-foreground mb-1">Hero Chests</div>
              <div className="font-semibold">{completedMapChests}/{totalMapChests}</div>
            </div>
            <div className="bg-background/50 rounded p-2">
              <div className="text-muted-foreground mb-1">Crafting</div>
              <div className="font-semibold">{completedCrafting}/{totalCrafting}</div>
            </div>
            <div className="bg-background/50 rounded p-2">
              <div className="text-muted-foreground mb-1">World Bosses</div>
              <div className="font-semibold">{completedWorldBosses}/{totalWorldBosses}</div>
            </div>
            <div className="bg-background/50 rounded p-2">
              <div className="text-muted-foreground mb-1">Fractals</div>
              <div className="font-semibold">{completedFractals}/{totalFractals}</div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 mb-6 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error loading daily activities</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {loadingData ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Daily Crafting Section */}
          <div>
            <h3
              className="text-xl font-bold mb-4 border-b pb-2 flex items-center justify-between cursor-pointer hover:text-primary transition-colors"
              onClick={() => setShowDailyCrafting(!showDailyCrafting)}
            >
              <span>Daily Crafting</span>
              {showDailyCrafting ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </h3>
            {showDailyCrafting && (
            <div className="grid gap-2">
              {DAILY_CRAFTING.map((craft) => {
                const isCompleted = dailyCrafting.includes(craft.id);

                return (
                  <div
                    key={craft.id}
                    className={`bg-card border rounded-lg p-4 transition-all ${
                      isCompleted
                        ? 'border-green-500/30 bg-green-500/5'
                        : 'border-border hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isCompleted ? (
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        )}
                        <img
                          src={craft.icon}
                          alt={craft.name}
                          className="w-10 h-10 rounded flex-shrink-0"
                          loading="lazy"
                        />
                        <span
                          className={`font-medium ${
                            isCompleted
                              ? 'line-through text-muted-foreground'
                              : 'text-foreground'
                          }`}
                        >
                          {craft.name}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          isCompleted
                            ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isCompleted ? 'Completed' : 'Available'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>

          {/* World Bosses Section */}
          <div>
            <h3
              className="text-xl font-bold mb-4 border-b pb-2 flex items-center justify-between cursor-pointer hover:text-primary transition-colors"
              onClick={() => setShowWorldBosses(!showWorldBosses)}
            >
              <span>World Bosses</span>
              {showWorldBosses ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </h3>
            {showWorldBosses && (
            <div className="grid gap-2">
              {WORLD_BOSSES
                .map((boss) => ({
                  ...boss,
                  isCompleted: worldBosses.includes(boss.id),
                  nextBossInfo: getNextBossTime(boss.eventDataKey),
                }))
                .sort((a, b) => {
                  // Completed bosses go to the end
                  if (a.isCompleted && !b.isCompleted) return 1;
                  if (!a.isCompleted && b.isCompleted) return -1;

                  // Both completed or both not completed - sort by time
                  if (!a.isCompleted && !b.isCompleted) {
                    // If both have timer info, sort by minutes until spawn
                    if (a.nextBossInfo && b.nextBossInfo) {
                      return a.nextBossInfo.minutesUntil - b.nextBossInfo.minutesUntil;
                    }
                    // Bosses without timer info go to the end
                    if (a.nextBossInfo && !b.nextBossInfo) return -1;
                    if (!a.nextBossInfo && b.nextBossInfo) return 1;
                  }

                  return 0;
                })
                .map((boss) => {
                return (
                  <div
                    key={boss.id}
                    className={`bg-card border rounded-lg p-4 transition-all ${
                      boss.isCompleted
                        ? 'border-green-500/30 bg-green-500/5'
                        : 'border-border hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {boss.isCompleted ? (
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        )}
                        <div>
                          <span
                            className={`font-medium ${
                              boss.isCompleted
                                ? 'line-through text-muted-foreground'
                                : 'text-foreground'
                            }`}
                          >
                            {boss.name}
                          </span>
                          {boss.nextBossInfo && !boss.isCompleted && (
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>Next in {boss.nextBossInfo.timeStr}</span>
                              {boss.nextBossInfo.waypoint && (
                                <span
                                  className="text-primary cursor-pointer hover:underline"
                                  onClick={() => handleCopyWaypoint(boss.nextBossInfo.waypoint)}
                                  title="Click to copy waypoint"
                                >
                                  {boss.nextBossInfo.waypoint}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          boss.isCompleted
                            ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {boss.isCompleted ? 'Defeated' : 'Available'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>

          {/* Daily Fractals Section */}
          <div>
            <h3
              className="text-xl font-bold mb-4 border-b pb-2 flex items-center justify-between cursor-pointer hover:text-primary transition-colors"
              onClick={() => setShowFractals(!showFractals)}
            >
              <span>Daily Fractals</span>
              {showFractals ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </h3>
            {showFractals && (
            <div className="grid gap-2">
              {fractals.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No daily fractals available
                </div>
              ) : (
                fractals
                  .sort((a, b) => {
                    // First: Recommended fractals (no tier), sorted by scale (low to high)
                    // Then: Tier 1, Tier 2, Tier 3, Tier 4, each sorted by fractal name

                    const isRecommendedA = !a.tier;
                    const isRecommendedB = !b.tier;

                    // Recommended fractals come first
                    if (isRecommendedA && !isRecommendedB) return -1;
                    if (!isRecommendedA && isRecommendedB) return 1;

                    // Both are recommended - sort by scale (numeric)
                    if (isRecommendedA && isRecommendedB) {
                      return a.scale - b.scale;
                    }

                    // Both are tier fractals - sort by tier first, then by scale_range (low to high)
                    const tierOrder = { "Tier 1": 1, "Tier 2": 2, "Tier 3": 3, "Tier 4": 4 };
                    const tierA = tierOrder[a.tier] || 99;
                    const tierB = tierOrder[b.tier] || 99;

                    if (tierA !== tierB) {
                      return tierA - tierB;
                    }

                    // Same tier - sort by scale_range (lowest to highest scale)
                    const scaleRangeOrder = { "1-25": 1, "26-50": 26, "51-75": 51, "76-100": 76 };
                    const scaleA = scaleRangeOrder[a.scale_range] || 0;
                    const scaleB = scaleRangeOrder[b.scale_range] || 0;

                    return scaleA - scaleB;
                  })
                  .map((fractal) => {
                    const isCompleted = fractal.completed;

                    return (
                      <div
                        key={fractal.id}
                        className={`bg-card border rounded-lg p-4 transition-all ${
                          isCompleted
                            ? 'border-green-500/30 bg-green-500/5'
                            : 'border-border hover:bg-accent/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isCompleted ? (
                              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            ) : (
                              <X className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            )}
                            {fractal.icon && (
                              <img
                                src={fractal.icon}
                                alt={fractal.name}
                                className="w-10 h-10 rounded flex-shrink-0"
                                loading="lazy"
                              />
                            )}
                            <div className="flex flex-col">
                              <span
                                className={`font-medium ${
                                  isCompleted
                                    ? 'line-through text-muted-foreground'
                                    : 'text-foreground'
                                }`}
                              >
                                {fractal.full_name || fractal.name}
                              </span>
                              {fractal.requirement && (
                                <span className="text-xs text-muted-foreground mt-0.5">
                                  {fractal.requirement}
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              isCompleted
                                ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {isCompleted ? 'Completed' : 'Available'}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
            )}
          </div>

          {/* Hero Chests Section */}
          <div>
            <h3
              className="text-xl font-bold mb-4 border-b pb-2 flex items-center justify-between cursor-pointer hover:text-primary transition-colors"
              onClick={() => setShowMapChests(!showMapChests)}
            >
              <span>Hero Chests</span>
              {showMapChests ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </h3>
            {showMapChests && (
            <div className="space-y-6">
              {/* Group by region */}
              {['Heart of Maguuma', 'Crystal Desert', 'Cantha', 'Secrets of the Obscure', 'Janthir Wilds', 'Visions of Eternity'].map((region) => {
                const chestsInRegion = ALL_MAP_CHESTS.filter((chest) => chest.region === region);

                return (
                  <div key={region}>
                    <h4 className="text-md font-semibold mb-3 text-primary">{region}</h4>
                    <div className="grid gap-2">
                      {chestsInRegion.map((chest) => {
                        const isCompleted = chest.manual
                          ? manualChests.includes(chest.id)
                          : mapChests.includes(chest.id);

                        // Get event info for this chest (support multiple events or single event)
                        let activeEventInfo = null;
                        let nextEventInfo = null;

                        if (chest.events) {
                          // Multiple events - separate active and upcoming
                          const eventInfos = chest.events
                            .map(evt => getNextChestEventTime(chest.eventRegion, chest.eventMap, evt.eventDataKey))
                            .filter(Boolean);

                          // Find active event
                          activeEventInfo = eventInfos.find(evt => evt.isActive);

                          // Find next upcoming event (not active)
                          const upcomingEvents = eventInfos.filter(evt => !evt.isActive);
                          if (upcomingEvents.length > 0) {
                            nextEventInfo = upcomingEvents.sort((a, b) => a.minutesUntil - b.minutesUntil)[0];
                          }
                        } else if (chest.eventDataKey) {
                          // Single event (legacy format)
                          const eventInfo = getNextChestEventTime(chest.eventRegion, chest.eventMap, chest.eventDataKey);
                          if (eventInfo) {
                            if (eventInfo.isActive) {
                              activeEventInfo = eventInfo;
                            } else {
                              nextEventInfo = eventInfo;
                            }
                          }
                        }

                        return (
                          <div
                            key={chest.id}
                            className={`bg-card border rounded-lg p-4 transition-all ${
                              isCompleted
                                ? 'border-green-500/30 bg-green-500/5'
                                : 'border-border hover:bg-accent/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {chest.manual ? (
                                  <input
                                    type="checkbox"
                                    checked={isCompleted}
                                    onChange={() => toggleManualChest(chest.id)}
                                    className="w-5 h-5 rounded border-2 cursor-pointer"
                                  />
                                ) : isCompleted ? (
                                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                ) : (
                                  <X className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                )}
                                <img
                                  src={chest.icon}
                                  alt={chest.name}
                                  className="w-10 h-10 rounded flex-shrink-0"
                                  loading="lazy"
                                />
                                <div className="flex flex-col">
                                  <span
                                    className={`font-medium ${
                                      isCompleted
                                        ? 'line-through text-muted-foreground'
                                        : 'text-foreground'
                                    }`}
                                  >
                                    {chest.name}
                                    {chest.manual && (
                                      <span className="ml-2 text-xs text-muted-foreground">(Manual)</span>
                                    )}
                                  </span>
                                  {(activeEventInfo || nextEventInfo) && (
                                    <div className="text-xs mt-1 flex flex-col gap-1">
                                      {activeEventInfo && (
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                                            <Clock className="w-3 h-3" />
                                            {activeEventInfo.eventName} - Active now! Ends in {activeEventInfo.timeStr}
                                          </span>
                                          {activeEventInfo.waypoint && (
                                            <span
                                              className="cursor-pointer hover:underline text-green-600 dark:text-green-400 font-semibold"
                                              onClick={() => handleCopyWaypoint(activeEventInfo.waypoint)}
                                              title="Click to copy waypoint"
                                            >
                                              {activeEventInfo.waypoint}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      {nextEventInfo && (
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="flex items-center gap-1 text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {nextEventInfo.eventName} - Next: {nextEventInfo.timeStr}
                                          </span>
                                          {nextEventInfo.waypoint && (
                                            <span
                                              className="cursor-pointer hover:underline text-primary"
                                              onClick={() => handleCopyWaypoint(nextEventInfo.waypoint)}
                                              title="Click to copy waypoint"
                                            >
                                              {nextEventInfo.waypoint}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  isCompleted
                                    ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {isCompleted ? 'Completed' : 'Available'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyActivitiesTab;
