import { create } from 'zustand';
import { localStorageAPI, fetchProgress, saveProgress, createUser } from '../services/api';
import { eventsData } from '../utils/eventsData';

const defaultTasks = {
  gathering: { vine_bridge: false, prosperity: false, destinys_gorge: false },
  crafting: { mithrillium: false, elonian_cord: false, spirit_residue: false, gossamer: false },
  specials: { psna: false, home_instance: false },
};

const SYNC_DEBOUNCE = 800;
let syncTimer = null;

const useStore = create((set, get) => ({
  // --- NEW, SIMPLIFIED STATE ---
  currentUser: null,
  userData: { // For today's progress
    dailyTasks: defaultTasks,
    completedEventTypes: {},
  },
  userHistory: {}, // For all historical progress data
  notification: null,
  lastResetDate: 0,

  // --- ACTIONS ---

  _saveState: () => {
    const { currentUser, lastResetDate } = get();
    // Only save the currentUser and lastResetDate to localStorage for session persistence
    localStorageAPI.saveAppData({ currentUser, lastResetDate });
  },

  loadInitialData: () => {
    const appData = localStorageAPI.getAppData();
    if (appData.currentUser) {
      set({ currentUser: appData.currentUser, lastResetDate: appData.lastResetDate });
      get().loginUser(appData.currentUser); // Log in and fetch data
    }
  },

  _scheduleSync: () => {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      const { currentUser, userData } = get();
      if (!currentUser) return;

      const today = new Date().toISOString().slice(0, 10);
      const payload = {
        userName: currentUser,
        date: today,
        dailyTasks: userData.dailyTasks,
        completedEventTypes: userData.completedEventTypes || {},
      };
      saveProgress(payload);
    }, SYNC_DEBOUNCE);
  },

  // Creates a new user and logs them in
  addUser: async (userName) => {
    try {
      await createUser(userName);
      // After creating the user, immediately log them in to fetch their (empty) data
      await get().loginUser(userName);
      get().setNotification({ type: 'success', message: `User ${userName} created!` });
      setTimeout(() => get().setNotification(null), 4000);
    } catch (error) {
      // The loginUser action will handle its own error notifications if it fails
      // But we still throw the error for the component to handle loading state
      throw error;
    }
  },

  // Logs in an existing user
  loginUser: async (userName) => {
    try {
      const historyData = await fetchProgress(userName);
      const today = new Date().toISOString().slice(0, 10);
      const todayEntry = historyData ? historyData[today] : null;

      set({
        currentUser: userName,
        userHistory: historyData || {},
        userData: {
          dailyTasks: todayEntry?.dailyTasks || defaultTasks,
          completedEventTypes: todayEntry?.completedEventTypes || {},
        },
      });
      get()._saveState();
    } catch (error) {
      get().setNotification({ type: 'error', message: `Login failed: ${error.message}` });
      setTimeout(() => get().setNotification(null), 4000);
      throw error;
    }
  },

  logout: () => {
    localStorageAPI.clearAppData();
    set({
        currentUser: null,
        userData: { dailyTasks: defaultTasks, completedEventTypes: {} },
        userHistory: {}
    });
  },

  handleTaskToggle: (category, task) => {
    if (!get().currentUser) return;

    set((state) => ({
      userData: {
        ...state.userData,
        dailyTasks: {
          ...state.userData.dailyTasks,
          [category]: {
            ...state.userData.dailyTasks[category],
            [task]: !state.userData.dailyTasks[category][task],
          },
        },
      },
    }));
    // No local save here, sync will handle it
    get()._scheduleSync();
  },

  handleEventToggle: (eventId, eventKey) => {
    if (!get().currentUser || typeof eventKey !== 'string' || eventKey.startsWith('daily')) return;

    set((state) => {
        const newCompletedEventTypes = { ...(state.userData.completedEventTypes || {}) };

        // This logic seems overly complex, but we'll retain it for now.
        const getFullEventPath = (key) => {
          for (const [expansion, expansionData] of Object.entries(eventsData)) {
            for (const [zone, zoneData] of Object.entries(expansionData)) {
              for (const [event] of Object.entries(zoneData)) {
                const eventNormalized = event.toLowerCase().replace(/[^a-z0-9]/g, '_');
                if (key.includes(eventNormalized)) {
                  const expansionKey = expansion.toLowerCase().replace(/[^a-z0-9]/g, '_');
                  const zoneKey = zone.toLowerCase().replace(/[^a-z0-9]/g, '_');
                  return `${expansionKey}_${zoneKey}_${eventNormalized}`;
                }
              }
            }
          }
          return key;
        };

        const fullEventPath = getFullEventPath(eventKey);

        if (newCompletedEventTypes[fullEventPath]) {
            delete newCompletedEventTypes[fullEventPath];
        } else {
            Object.keys(newCompletedEventTypes).forEach(key => {
                const eventName = key.split('_').pop();
                if (fullEventPath.includes(eventName)) {
                    delete newCompletedEventTypes[key];
                }
            });
            newCompletedEventTypes[fullEventPath] = true;
        }
        
        return {
            userData: {
                ...state.userData,
                completedEventTypes: newCompletedEventTypes
            }
        };
    });
    get()._scheduleSync();
  },

  setNotification: (notification) => set({ notification }),

  checkAndResetDailyProgress: () => {
    const now = new Date();
    const currentUTCDate = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    if (currentUTCDate !== get().lastResetDate) {
      set({
        userData: {
            dailyTasks: defaultTasks,
            completedEventTypes: {},
        },
        lastResetDate: currentUTCDate
      });
      get()._saveState(); // Save the new reset date
    }
  },
}));

useStore.getState().loadInitialData();

export default useStore;