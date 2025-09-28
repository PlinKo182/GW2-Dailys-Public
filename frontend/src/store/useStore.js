import { create } from 'zustand';
import { localStorageAPI, fetchProgress, saveProgress } from '../services/api';
import { eventsData } from '../utils/eventsData';

const defaultTasks = {
  gathering: { vine_bridge: false, prosperity: false, destinys_gorge: false },
  crafting: { mithrillium: false, elonian_cord: false, spirit_residue: false, gossamer: false },
  specials: { psna: false, home_instance: false },
};

const SYNC_DEBOUNCE = 800;
let syncTimer = null;

// Limpa qualquer dado salvo anteriormente
localStorage.removeItem('tyriaTracker_appData');

const useStore = create((set, get) => ({
  // --- STATE ---
  profiles: [],
  activeProfile: null,
  profileData: {},
  notification: null,
  lastResetDate: 0,

  // --- ACTIONS ---

  // Helper to save the entire state to localStorage
  _saveState: () => {
    const { profiles, activeProfile, profileData, lastResetDate } = get();
    localStorageAPI.saveAppData({ profiles, activeProfile, profileData, lastResetDate });
  },

  // Load initial data from localStorage
  loadInitialData: () => {
    // Sempre começa com estado limpo
    set({
      profiles: [],
      activeProfile: null,
      profileData: {},
      lastResetDate: 0
    });
  },

  loadFromBackend: async () => {
    const { activeProfile, profiles } = get();
  const data = await fetchProgress(activeProfile);
    const today = new Date().toISOString().slice(0,10);
  const todayEntry = data[today];
    if (!todayEntry) return; // nada para aplicar
    if (profiles.length === 0) {
      set({
        profiles: ['Default'],
        activeProfile: 'Default',
        profileData: {
          Default: {
            dailyTasks: todayEntry.dailyTasks || defaultTasks,
            completedEventTypes: todayEntry.completedEventTypes || {},
          }
        }
      });
      get()._saveState();
    } else if (activeProfile) {
      set(state => ({
        profileData: {
          ...state.profileData,
          [activeProfile]: {
            ...state.profileData[activeProfile],
            dailyTasks: todayEntry.dailyTasks || state.profileData[activeProfile].dailyTasks,
            completedEventTypes: todayEntry.completedEventTypes || state.profileData[activeProfile].completedEventTypes,
          }
        }
      }));
      get()._saveState();
    }
  },

    _scheduleSync: () => {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      const { activeProfile, profileData, lastAction } = get();
      if (!activeProfile) return;
      const today = new Date().toISOString().slice(0,10);
  const p = profileData[activeProfile];
      const payload = {
        userName: activeProfile,
        date: today,
        dailyTasks: p.dailyTasks,
      };

      // Se houver completedEventTypes salvos anteriormente ou se for uma ação de evento
      if (Object.keys(p.completedEventTypes || {}).length > 0) {
        payload.completedEventTypes = p.completedEventTypes;
      } else {
        payload.completedEventTypes = {};
      }

      saveProgress(payload);
    }, SYNC_DEBOUNCE);
  },

  // Add a new profile
  addProfile: (profileName) => {
    if (!profileName || get().profiles.includes(profileName)) {
      get().setNotification({ type: 'error', message: 'Profile name already exists or is invalid.' });
      setTimeout(() => get().setNotification(null), 4000);
      return;
    }
    set((state) => ({
      profiles: [...state.profiles, profileName],
      activeProfile: profileName,  // Define activeProfile imediatamente
      profileData: {
        ...state.profileData,
        [profileName]: {
          dailyTasks: defaultTasks,
          completedEventTypes: {},
        },
      },
    }));
    get()._saveState();  // Salva o estado atualizado
  },

  // Switch the active profile
  switchProfile: (profileName) => {
    if (get().profiles.includes(profileName)) {
      set({ activeProfile: profileName });
      get()._saveState();
    }
  },

  // Delete a profile
  deleteProfile: (profileName) => {
    if (get().profiles.length <= 1) {
      get().setNotification({ type: 'error', message: 'Cannot delete the last profile.' });
      setTimeout(() => get().setNotification(null), 4000);
      return;
    }
    set((state) => {
      const newProfiles = state.profiles.filter(p => p !== profileName);
      const newProfileData = { ...state.profileData };
      delete newProfileData[profileName];

      return {
        profiles: newProfiles,
        profileData: newProfileData,
        // If deleting the active profile, switch to the first available one
        activeProfile: state.activeProfile === profileName ? newProfiles[0] : state.activeProfile,
      };
    });
    get()._saveState();
  },

  // Update task progress for the active profile
  handleTaskToggle: (category, task) => {
    const { activeProfile } = get();
    if (!activeProfile) return;

    set((state) => {
      const newProfileData = { ...state.profileData };
      const currentProfileTasks = newProfileData[activeProfile].dailyTasks;
      
      // Atualiza apenas as tarefas diárias
      newProfileData[activeProfile].dailyTasks = {
        ...currentProfileTasks,
        [category]: {
          ...currentProfileTasks[category],
          [task]: !currentProfileTasks[category][task],
        },
      };

      // Reset completedEventTypes to ensure it's not affected by daily tasks
      if (!newProfileData[activeProfile].completedEventTypes) {
        newProfileData[activeProfile].completedEventTypes = {};
      }

      return { profileData: newProfileData };
    });
    get()._saveState();
    get()._scheduleSync();
  },

  // Update event completion for the active profile
  handleEventToggle: (eventId, eventKey) => {
    const { activeProfile } = get();
    if (!activeProfile || !eventKey) return;

    // Assegura que eventKey é uma string válida e não começa com "daily" para evitar interferência com tarefas diárias
    if (typeof eventKey !== 'string' || eventKey.startsWith('daily')) return;

    set((state) => {
        const newProfileData = { ...state.profileData };
        const currentEventTypes = newProfileData[activeProfile].completedEventTypes || {};
        const newCompletedEventTypes = { ...currentEventTypes };

        // Função para converter eventKey em caminho completo usando eventsData
        const getFullEventPath = (key) => {
          for (const [expansion, expansionData] of Object.entries(eventsData)) {
            for (const [zone, zoneData] of Object.entries(expansionData)) {
              for (const [event] of Object.entries(zoneData)) {
                // Converter para formato de chave: expansao_zona_evento
                const eventNormalized = event.toLowerCase().replace(/[^a-z0-9]/g, '_');
                if (key.includes(eventNormalized)) {
                  const expansionKey = expansion.toLowerCase().replace(/[^a-z0-9]/g, '_');
                  const zoneKey = zone.toLowerCase().replace(/[^a-z0-9]/g, '_');
                  return `${expansionKey}_${zoneKey}_${eventNormalized}`;
                }
              }
            }
          }
          return key; // retorna a key original se não encontrar
        };

        const fullEventPath = getFullEventPath(eventKey);

        if (newCompletedEventTypes[fullEventPath]) {
            delete newCompletedEventTypes[fullEventPath];
        } else {
            // Remove quaisquer versões antigas do mesmo evento
            Object.keys(newCompletedEventTypes).forEach(key => {
                const eventName = key.split('_').pop();
                if (fullEventPath.includes(eventName)) {
                    delete newCompletedEventTypes[key];
                }
            });
            // Adiciona o evento com o caminho completo
            newCompletedEventTypes[fullEventPath] = true;
        }
        
        newProfileData[activeProfile].completedEventTypes = newCompletedEventTypes;
        return { profileData: newProfileData };
    });
    get()._saveState();
    get()._scheduleSync();
  },

  setNotification: (notification) => set({ notification }),

  // Reset progress for ALL profiles
  checkAndResetDailyProgress: () => {
    const now = new Date();
    const currentUTCDate = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    if (currentUTCDate !== get().lastResetDate) {
      set((state) => {
        const resetProfileData = {};
        state.profiles.forEach(profileName => {
          resetProfileData[profileName] = {
            dailyTasks: defaultTasks,
            completedEventTypes: {},
          };
        });
        return { profileData: resetProfileData, lastResetDate: currentUTCDate };
      });
      get()._saveState();
    }
  },

}));

// Initialize the store with data from localStorage
useStore.getState().loadInitialData();
useStore.getState().loadFromBackend();

export default useStore;