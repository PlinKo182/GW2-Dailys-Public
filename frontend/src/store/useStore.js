import { create } from 'zustand';
import { localStorageAPI, fetchProgress, saveProgress, createUser, saveUserFilters, saveCustomTasks } from '../services/api';
import { eventsData } from '../utils/eventsData';
import { tasksData } from '../utils/tasksData';
import { v4 as uuidv4 } from 'uuid';

const defaultTasks = {
  gathering: { vine_bridge: false, prosperity: false, destinys_gorge: false },
  crafting: { mithrillium: false, elonian_cord: false, spirit_residue: false, gossamer: false },
  specials: { psna: false, home_instance: false },
};

const SYNC_DEBOUNCE = 800;
const FILTER_SYNC_DEBOUNCE = 1000;
const TASKS_SYNC_DEBOUNCE = 1500;
let syncTimer = null;
let filterSyncTimer = null;
let tasksSyncTimer = null;

// Helper to migrate old task structure to new section-based structure
const migrateCustomTasks = (tasks) => {
    return tasks.map(card => {
        // If a card already has sections, it's the new format.
        if (card.sections && Array.isArray(card.sections)) {
            return card;
        }
        // If it's an old card with a `tasks` array, convert it.
        if (card.tasks && Array.isArray(card.tasks)) {
            return {
                ...card,
                sections: [{ id: uuidv4(), title: 'Default Section', tasks: card.tasks }],
                tasks: undefined, // Remove old tasks array
            };
        }
        // If it's a new or malformed card, initialize with an empty section
        return {
            ...card,
            sections: [{ id: uuidv4(), title: 'Default Section', tasks: [] }],
        };
    });
};

// Helper to create default tasks for new users
const createDefaultTaskCards = () => {
    const mapTasks = (tasks) => tasks.map(task => ({
        id: task.id,
        name: task.name,
        waypoint: task.waypoint || '',
        hasTimer: !!task.availability,
        availability: task.availability || null,
    }));

    const createSection = (title, tasks) => ({
        id: uuidv4(),
        title,
        tasks: mapTasks(tasks),
    });

    return [
        {
            id: uuidv4(),
            title: 'Daily Gathering',
            sections: [createSection('Default Section', tasksData.gatheringTasks)],
        },
        {
            id: uuidv4(),
            title: 'Daily Crafting',
            sections: [createSection('Default Section', tasksData.craftingTasks)],
        },
        {
            id: uuidv4(),
            title: 'Daily Specials',
            sections: [createSection('Default Section', tasksData.specialTasks)],
        },
    ];
};

const useStore = create((set, get) => ({
  // --- NEW, SIMPLIFIED STATE ---
  currentUser: null,
  customTasks: [], // The user's list of custom task cards
  userData: { // For today's progress
    taskCompletion: {}, // Replaces dailyTasks with a flat map of { taskId: boolean }
    completedEventTypes: {},
  },
  userHistory: {}, // For all historical progress data
  eventFilters: {}, // For user-specific event filters
  notification: null,
  lastResetDate: 0,
  showOfficialDailies: false,
  showPactSupply: true,
  showFractals: true,
  showChallengeModes: true,
  fractalTasks: { recommended: [], dailies: [], cms: [] },

  // --- ACTIONS ---

  _saveState: () => {
    const { currentUser, lastResetDate, showOfficialDailies, showPactSupply, showFractals, showChallengeModes } = get();
    // Save app-level data like session and UI preferences
    localStorageAPI.saveAppData({ currentUser, lastResetDate, showOfficialDailies, showPactSupply, showFractals, showChallengeModes });
  },

  loadInitialData: () => {
    const appData = localStorageAPI.getAppData();
    if (appData) {
        // Set UI preferences immediately
        set({
          showOfficialDailies: appData.showOfficialDailies === true,
          showPactSupply: appData.showPactSupply !== false,
          showFractals: appData.showFractals !== false,
          showChallengeModes: appData.showChallengeModes !== false,
        });

        // If a user session exists, log them in
        if (appData.currentUser) {
            set({ currentUser: appData.currentUser, lastResetDate: appData.lastResetDate });
            get().loginUser(appData.currentUser);
        }
    }
  },

  // Action to toggle the visibility of the official dailies section
  toggleOfficialDailies: () => {
    set(state => ({ showOfficialDailies: !state.showOfficialDailies }));
    get()._saveState(); // Persist the change
  },

  togglePactSupply: () => {
    set(state => ({ showPactSupply: !state.showPactSupply }));
    get()._saveState();
  },
  toggleFractals: () => {
    set(state => ({ showFractals: !state.showFractals }));
    get()._saveState();
  },
  toggleChallengeModes: () => {
    set(state => ({ showChallengeModes: !state.showChallengeModes }));
    get()._saveState();
  },

  // Action to update the fractal tasks in the store
  setFractalTasks: (tasks) => {
    set({ fractalTasks: tasks });
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
        // The backend expects the completion map under the key 'dailyTasks'
        dailyTasks: userData.taskCompletion,
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
      const { progress, filters, customTasks } = await fetchProgress(userName);
      const today = new Date().toISOString().slice(0, 10);
      const todayEntry = progress ? progress[today] : null;

      let finalCustomTasks;
      if (Array.isArray(customTasks) && customTasks.length > 0) {
        // If we have tasks, migrate them to ensure they have the new section structure
        finalCustomTasks = migrateCustomTasks(customTasks);
      } else {
        // If there are no tasks or the value is null/undefined, create default ones
        finalCustomTasks = createDefaultTaskCards();
        // Save these new default tasks to the backend for the user
        saveCustomTasks(userName, finalCustomTasks);
      }

      // Get the current UTC date to prevent the daily reset from firing incorrectly
      const now = new Date();
      const currentUTCDate = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

      set({
        currentUser: userName,
        userHistory: progress || {},
        eventFilters: filters || {},
        customTasks: finalCustomTasks || [],
        userData: {
          taskCompletion: todayEntry?.dailyTasks || {}, // Backend's dailyTasks is now our taskCompletion
          completedEventTypes: todayEntry?.completedEventTypes || {},
        },
        lastResetDate: currentUTCDate, // Update the reset date to prevent race condition
      });
      get()._saveState();
    } catch (error) {
      get().setNotification({ type: 'error', message: `Login failed: ${error.message}` });
      setTimeout(() => get().setNotification(null), 4000);
      throw error;
    }
  },

  updateEventFilters: (newFilters) => {
    const { currentUser } = get();
    if (!currentUser) return;

    set({ eventFilters: newFilters });

    clearTimeout(filterSyncTimer);
    filterSyncTimer = setTimeout(() => {
      saveUserFilters(currentUser, newFilters);
    }, FILTER_SYNC_DEBOUNCE);
  },

  setCustomTasks: (newTasks) => {
    const { currentUser } = get();
    if (!currentUser) return;

    set({ customTasks: newTasks });

    clearTimeout(tasksSyncTimer);
    tasksSyncTimer = setTimeout(() => {
      saveCustomTasks(currentUser, newTasks);
    }, TASKS_SYNC_DEBOUNCE);
  },

  // --- Actions for managing custom tasks ---
  addCard: (title) => {
    const newCard = {
      id: uuidv4(),
      title: title || 'New Card',
      sections: [{ id: uuidv4(), title: 'Default Section', tasks: [] }],
    };
    const newTasks = [...get().customTasks, newCard];
    get().setCustomTasks(newTasks);
  },

  updateCardTitle: (cardId, newTitle) => {
    const newTasks = get().customTasks.map(card =>
      card.id === cardId ? { ...card, title: newTitle } : card
    );
    get().setCustomTasks(newTasks);
  },

  deleteCard: (cardId) => {
    const newTasks = get().customTasks.filter(card => card.id !== cardId);
    get().setCustomTasks(newTasks);
  },

  addSection: (cardId, sectionTitle) => {
    const newSection = { id: uuidv4(), title: sectionTitle || 'New Section', tasks: [] };
    const newTasks = get().customTasks.map(card =>
      card.id === cardId ? { ...card, sections: [...card.sections, newSection] } : card
    );
    get().setCustomTasks(newTasks);
  },

  updateSectionTitle: (cardId, sectionId, newTitle) => {
    const newTasks = get().customTasks.map(card => {
      if (card.id === cardId) {
        const updatedSections = card.sections.map(section =>
          section.id === sectionId ? { ...section, title: newTitle } : section
        );
        return { ...card, sections: updatedSections };
      }
      return card;
    });
    get().setCustomTasks(newTasks);
  },

  deleteSection: (cardId, sectionId) => {
    const newTasks = get().customTasks.map(card => {
      if (card.id === cardId) {
        // Prevent deleting the last section
        if (card.sections.length <= 1) return card;
        const filteredSections = card.sections.filter(section => section.id !== sectionId);
        return { ...card, sections: filteredSections };
      }
      return card;
    });
    get().setCustomTasks(newTasks);
  },

  addTask: (cardId, sectionId, taskData) => {
    const newTask = { ...taskData, id: uuidv4() };
    const newTasks = get().customTasks.map(card => {
      if (card.id === cardId) {
        const updatedSections = card.sections.map(section => {
          if (section.id === sectionId) {
            return { ...section, tasks: [...section.tasks, newTask] };
          }
          return section;
        });
        return { ...card, sections: updatedSections };
      }
      return card;
    });
    get().setCustomTasks(newTasks);
  },

  updateTask: (cardId, sectionId, taskId, updatedTask) => {
    const newTasks = get().customTasks.map(card => {
      if (card.id === cardId) {
        const updatedSections = card.sections.map(section => {
          if (section.id === sectionId) {
            const updatedTasks = section.tasks.map(task =>
              task.id === taskId ? { ...task, ...updatedTask } : task
            );
            return { ...section, tasks: updatedTasks };
          }
          return section;
        });
        return { ...card, sections: updatedSections };
      }
      return card;
    });
    get().setCustomTasks(newTasks);
  },

  deleteTask: (cardId, sectionId, taskId) => {
    const newTasks = get().customTasks.map(card => {
      if (card.id === cardId) {
        const updatedSections = card.sections.map(section => {
          if (section.id === sectionId) {
            const filteredTasks = section.tasks.filter(task => task.id !== taskId);
            return { ...section, tasks: filteredTasks };
          }
          return section;
        });
        return { ...card, sections: updatedSections };
      }
      return card;
    });
    get().setCustomTasks(newTasks);
  },

  logout: () => {
    localStorageAPI.clearAppData();
    set({
        currentUser: null,
        customTasks: [],
        userData: { dailyTasks: defaultTasks, completedEventTypes: {} },
        userHistory: {},
        eventFilters: {}
    });
  },

  handleTaskToggle: (taskId) => {
    if (!get().currentUser) return;

    set((state) => {
      const today = new Date().toISOString().slice(0, 10);

      const newTaskCompletion = {
        ...state.userData.taskCompletion,
        [taskId]: !state.userData.taskCompletion[taskId],
      };

      const newUserHistory = { ...state.userHistory };
      if (!newUserHistory[today]) {
        newUserHistory[today] = { dailyTasks: {}, completedEventTypes: state.userData.completedEventTypes };
      }
      // The backend expects this field to be named 'dailyTasks'
      newUserHistory[today].dailyTasks = newTaskCompletion;

      return {
        userData: {
          ...state.userData,
          taskCompletion: newTaskCompletion,
        },
        userHistory: newUserHistory,
      };
    });
    get()._scheduleSync();
  },

  handleEventToggle: (eventId, eventKey) => {
    if (!get().currentUser || typeof eventKey !== 'string' || eventKey.startsWith('daily')) return;

    set((state) => {
        const today = new Date().toISOString().slice(0, 10);
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

        const newUserHistory = { ...state.userHistory };
        if (!newUserHistory[today]) {
          newUserHistory[today] = { dailyTasks: state.userData.dailyTasks, completedEventTypes: {} };
        }
        newUserHistory[today].completedEventTypes = newCompletedEventTypes;
        
        return {
            userData: {
                ...state.userData,
                completedEventTypes: newCompletedEventTypes
            },
            userHistory: newUserHistory
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