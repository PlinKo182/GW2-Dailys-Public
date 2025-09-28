import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchProgress, saveProgress } from '../services/api';
import { eventsData } from '../utils/eventsData';

const defaultTasks = {
  gathering: { vine_bridge: false, prosperity: false, destinys_gorge: false },
  crafting: { mithrillium: false, elonian_cord: false, spirit_residue: false, gossamer: false },
  specials: { psna: false, home_instance: false },
};

const SYNC_DEBOUNCE = 800;
let syncTimer = null;

const useStore = create(
  persist(
    (set, get) => ({
      // --- STATE ---
      profiles: [],
      activeProfile: null,
      profileData: {},
      notification: null,
      lastResetDate: 0,

      // --- ACTIONS ---
      loadInitialData: async () => {
        // Carregar do backend após inicialização
        const { activeProfile } = get();
        if (!activeProfile) return;

        try {
          const data = await fetchProgress(activeProfile);
          if (!data) return;

          const today = new Date().toISOString().slice(0,10);
          const todayEntry = data[today];

          if (todayEntry) {
            set(state => ({
              profileData: {
                ...state.profileData,
                [activeProfile]: {
                  dailyTasks: todayEntry.dailyTasks || defaultTasks,
                  completedEventTypes: todayEntry.completedEventTypes || {},
                }
              }
            }));
          }
        } catch (error) {
          console.error('Erro ao carregar dados:', error);
        }
      },

      // Add a new profile
      addProfile: (profileName) => {
        if (!profileName) return;
        
        set(state => {
          if (state.profiles.includes(profileName)) return state;
          
          return {
            profiles: [...state.profiles, profileName],
            activeProfile: profileName,
            profileData: {
              ...state.profileData,
              [profileName]: {
                dailyTasks: defaultTasks,
                completedEventTypes: {},
              }
            }
          };
        });
      },

      // Switch active profile
      switchProfile: (profileName) => {
        set(state => {
          if (!state.profiles.includes(profileName)) return state;
          return { activeProfile: profileName };
        });
      },

      // Delete a profile
      deleteProfile: (profileName) => {
        set(state => {
          if (state.profiles.length <= 1) return state;

          const newProfiles = state.profiles.filter(p => p !== profileName);
          const newProfileData = { ...state.profileData };
          delete newProfileData[profileName];

          return {
            profiles: newProfiles,
            profileData: newProfileData,
            activeProfile: state.activeProfile === profileName ? newProfiles[0] : state.activeProfile
          };
        });
      },

      // Handle task toggle
      handleTaskToggle: (category, taskId) => {
        const { activeProfile } = get();
        if (!activeProfile) return;

        set(state => ({
          profileData: {
            ...state.profileData,
            [activeProfile]: {
              ...state.profileData[activeProfile],
              dailyTasks: {
                ...state.profileData[activeProfile].dailyTasks,
                [category]: {
                  ...state.profileData[activeProfile].dailyTasks[category],
                  [taskId]: !state.profileData[activeProfile].dailyTasks[category][taskId]
                }
              }
            }
          }
        }));

        // Schedule sync to backend
        clearTimeout(syncTimer);
        syncTimer = setTimeout(() => {
          const state = get();
          const today = new Date().toISOString().slice(0,10);
          
          saveProgress({
            userName: activeProfile,
            date: today,
            dailyTasks: state.profileData[activeProfile].dailyTasks,
            completedEventTypes: state.profileData[activeProfile].completedEventTypes || {},
          });
        }, SYNC_DEBOUNCE);
      },

      // Handle event toggle
      handleEventToggle: (eventKey) => {
        const { activeProfile } = get();
        if (!activeProfile) return;

        // Prevent interference with daily tasks
        if (typeof eventKey !== 'string' || eventKey.startsWith('daily')) return;

        set(state => {
          const currentEvents = state.profileData[activeProfile].completedEventTypes || {};
          
          // Convert event key to full path
          const getFullEventPath = (key) => {
            for (const [expansion, expansionData] of Object.entries(eventsData)) {
              for (const [zone, zoneData] of Object.entries(expansionData)) {
                for (const [event] of Object.entries(zoneData)) {
                  const eventNormalized = event.toLowerCase().replace(/[^a-z0-9]/g, '_');
                  if (key.includes(eventNormalized)) {
                    return `${expansion}_${zone}_${event}`;
                  }
                }
              }
            }
            return key;
          };

          const fullEventPath = getFullEventPath(eventKey);
          
          return {
            profileData: {
              ...state.profileData,
              [activeProfile]: {
                ...state.profileData[activeProfile],
                completedEventTypes: {
                  ...currentEvents,
                  [fullEventPath]: !currentEvents[fullEventPath]
                }
              }
            }
          };
        });

        // Schedule sync to backend
        clearTimeout(syncTimer);
        syncTimer = setTimeout(() => {
          const state = get();
          const today = new Date().toISOString().slice(0,10);
          
          saveProgress({
            userName: activeProfile,
            date: today,
            dailyTasks: state.profileData[activeProfile].dailyTasks,
            completedEventTypes: state.profileData[activeProfile].completedEventTypes,
          });
        }, SYNC_DEBOUNCE);
      },

      // Handle notifications
      setNotification: (notification) => set({ notification }),

      // Check and reset daily progress
      checkAndResetDailyProgress: () => {
        const now = new Date();
        const currentUTCDate = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

        if (currentUTCDate === get().lastResetDate) return;

        set(state => {
          const resetProfileData = {};
          state.profiles.forEach(profile => {
            resetProfileData[profile] = {
              dailyTasks: defaultTasks,
              completedEventTypes: {},
            };
          });
          return { 
            profileData: resetProfileData, 
            lastResetDate: currentUTCDate 
          };
        });
      }
    }),
    {
      name: 'tyria-tracker-storage',
      version: 1,
    }
  )
);

export default useStore;