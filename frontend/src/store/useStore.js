import { create } from 'zustand';
import { localStorageAPI, fetchProgress, saveProgress, createUser, saveUserFilters, saveCustomTasks } from '../services/api';
import { eventsData } from '../utils/eventsData';
import { tasksData } from '../utils/tasksData';
import { v4 as uuidv4 } from 'uuid';

const SYNC_DEBOUNCE = 800;
const FILTER_SYNC_DEBOUNCE = 1000;
const TASKS_SYNC_DEBOUNCE = 1500;
let syncTimer = null;
let filterSyncTimer = null;
let tasksSyncTimer = null;

// Helper to create default cards for new users
const createDefaultTaskCards = () => {
    const mapTasks = (tasks) => tasks.map(task => ({
        id: task.id,
        name: task.name,
        waypoint: task.waypoint || '',
        hasTimer: !!task.availability,
        availability: task.availability || null,
    }));

    return [
        // Official cards
        { id: uuidv4(), type: 'pact_supply', title: 'Pact Supply Network' },
        { id: uuidv4(), type: 'fractals', title: 'Daily Fractals' },
        { id: uuidv4(), type: 'strikes', title: 'Daily Strikes' },
        { id: uuidv4(), type: 'cms', title: 'Fractal CMs' },
        // Custom cards
        { id: uuidv4(), type: 'custom', title: 'Daily Gathering', tasks: mapTasks(tasksData.gatheringTasks) },
        { id: uuidv4(), type: 'custom', title: 'Daily Crafting', tasks: mapTasks(tasksData.craftingTasks) },
        { id: uuidv4(), type: 'custom', title: 'Daily Specials', tasks: mapTasks(tasksData.specialTasks) },
    ];
};

const useStore = create((set, get) => ({
  // --- REFACTORED STATE ---
  currentUser: null,
  cards: [], // This is the single source of truth for all dashboard cards
  userData: {
    taskCompletion: {},
    completedEventTypes: {},
  },
  userHistory: {},
  eventFilters: {},
  notification: null,
  lastResetDate: 0,

  // State for API-fetched data that cards might need
  strikesTasks: [],
  fractalTasks: { recommended: [], dailies: [], cms: [] },

  // --- ACTIONS ---

  _saveState: () => {
    const { currentUser, lastResetDate } = get();
    // Save only essential app-level data
    localStorageAPI.saveAppData({ currentUser, lastResetDate });
  },

  loadInitialData: () => {
    const appData = localStorageAPI.getAppData();
    if (appData && appData.currentUser) {
        set({ currentUser: appData.currentUser, lastResetDate: appData.lastResetDate });
        get().loginUser(appData.currentUser);
    }
  },

  // Action to update the fractal tasks in the store
  setFractalTasks: (tasks) => {
    set({ fractalTasks: tasks });
  },

  setStrikesTasks: (tasks) => set({ strikesTasks: tasks }),

  _scheduleSync: () => {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      const { currentUser, userData } = get();
      if (!currentUser) return;

      const today = new Date().toISOString().slice(0, 10);
      const payload = {
        userName: currentUser,
        date: today,
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
      await get().loginUser(userName);
      get().setNotification({ type: 'success', message: `User ${userName} created!` });
      setTimeout(() => get().setNotification(null), 4000);
    } catch (error) {
      throw error;
    }
  },

  // Logs in an existing user
  loginUser: async (userName) => {
    try {
      // The backend returns `customTasks`. We alias it to `cards`.
      const { progress, filters, customTasks: cards } = await fetchProgress(userName);
      const today = new Date().toISOString().slice(0, 10);
      const todayEntry = progress ? progress[today] : null;

      let finalCards = cards;
      if (!Array.isArray(cards) || cards.length === 0) {
        finalCards = createDefaultTaskCards();
        saveCustomTasks(userName, finalCards);
      }

      const now = new Date();
      const currentUTCDate = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

      set({
        currentUser: userName,
        userHistory: progress || {},
        eventFilters: filters || {},
        cards: finalCards || [],
        userData: {
          taskCompletion: todayEntry?.dailyTasks || {},
          completedEventTypes: todayEntry?.completedEventTypes || {},
        },
        lastResetDate: currentUTCDate,
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

  setCards: (newCards) => {
    const { currentUser } = get();
    set({ cards: newCards });

    if (!currentUser) return; // Don't save if no user is logged in

    clearTimeout(tasksSyncTimer);
    tasksSyncTimer = setTimeout(() => {
      saveCustomTasks(currentUser, newCards);
    }, TASKS_SYNC_DEBOUNCE);
  },

  // --- Actions for managing cards and tasks ---
  addCard: (type, title = 'New Custom Card') => {
    let newCard;
    switch (type) {
        case 'pact_supply': newCard = { id: uuidv4(), type: 'pact_supply', title: 'Pact Supply Network' }; break;
        case 'fractals': newCard = { id: uuidv4(), type: 'fractals', title: 'Daily Fractals' }; break;
        case 'strikes': newCard = { id: uuidv4(), type: 'strikes', title: 'Daily Strikes' }; break;
        case 'cms': newCard = { id: uuidv4(), type: 'cms', title: 'Fractal CMs' }; break;
        default: newCard = { id: uuidv4(), type: 'custom', title, tasks: [] };
    }
    const newCards = [...get().cards, newCard];
    get().setCards(newCards);
  },

  moveCard: (activeId, overId) => {
    const oldCards = get().cards;
    const activeIndex = oldCards.findIndex((card) => card.id === activeId);
    const overIndex = oldCards.findIndex((card) => card.id === overId);

    if (activeIndex !== -1 && overIndex !== -1) {
      const newCards = [...oldCards];
      const [movedCard] = newCards.splice(activeIndex, 1);
      newCards.splice(overIndex, 0, movedCard);
      get().setCards(newCards);
    }
  },

  updateCardTitle: (cardId, newTitle) => {
    const newCards = get().cards.map(card =>
      card.id === cardId ? { ...card, title: newTitle } : card
    );
    get().setCards(newCards);
  },

  deleteCard: (cardId) => {
    const newCards = get().cards.filter(card => card.id !== cardId);
    get().setCards(newCards);
  },

  addTask: (cardId, taskName) => {
    const newTask = { id: uuidv4(), name: taskName, waypoint: '', hasTimer: false };
    const newCards = get().cards.map(card =>
      card.id === cardId && card.type === 'custom' ? { ...card, tasks: [...card.tasks, newTask] } : card
    );
    get().setCards(newCards);
  },

  updateTask: (cardId, taskId, updatedTask) => {
    const newCards = get().cards.map(card => {
      if (card.id === cardId && card.tasks) {
        const updatedTasks = card.tasks.map(task =>
          task.id === taskId ? { ...task, ...updatedTask } : task
        );
        return { ...card, tasks: updatedTasks };
      }
      return card;
    });
    get().setCards(newCards);
  },

  deleteTask: (cardId, taskId) => {
    const newCards = get().cards.map(card => {
      if (card.id === cardId && card.tasks) {
        const filteredTasks = card.tasks.filter(task => task.id !== taskId);
        return { ...card, tasks: filteredTasks };
      }
      return card;
    });
    get().setCards(newCards);
  },

  logout: () => {
    localStorageAPI.clearAppData();
    set({
        currentUser: null,
        cards: [],
        userData: { taskCompletion: {}, completedEventTypes: {} },
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
          newUserHistory[today] = { dailyTasks: state.userData.taskCompletion, completedEventTypes: {} };
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
            taskCompletion: {}, // Reset to empty object
            completedEventTypes: {},
        },
        lastResetDate: currentUTCDate
      });
      get()._saveState();
    }
  },
}));

useStore.getState().loadInitialData();

export default useStore;