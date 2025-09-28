import axios from 'axios';

// Sempre usar rota relativa /api (mesmo domínio)
const API = '/api';
const APP_DATA_KEY = 'tyriaTracker_appData';

// Configurar axios
const axiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

const defaultTasks = {
  gathering: { vine_bridge: false, prosperity: false, destinys_gorge: false },
  crafting: { mithrillium: false, elonian_cord: false, spirit_residue: false, gossamer: false },
  specials: { psna: false, home_instance: false },
};

const initialData = {
  profiles: ['Default'],
  activeProfile: 'Default',
  profileData: {
    Default: {
      dailyTasks: defaultTasks,
      completedEventTypes: {},
    },
  },
};

// User session management (can be deprecated if not used elsewhere)
const getUserId = () => {
  let userId = localStorage.getItem('tyriaTracker_userId');
  if (!userId) {
    userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    localStorage.setItem('tyriaTracker_userId', userId);
  }
  return userId;
};

// API service class (mostly for backend interaction, not localStorage)
class TyriaTrackerAPI {
  constructor() {
    this.userId = getUserId();
  }

  async healthCheck() {
    try {
      const response = await axiosInstance.get(`${API}/`);
      return response.data;
    } catch (error) {
      return null;
    }
  }
}

// New simplified localStorage API for multi-profile support
export const localStorageAPI = {
  getAppData: () => {
    const saved = localStorage.getItem(APP_DATA_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Basic validation to ensure it has the expected structure
        if (parsed.profiles && parsed.activeProfile && parsed.profileData) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse app data from localStorage", e);
        return initialData; // Return default on error
      }
    }
    return initialData; // Return default if nothing is saved
  },

  saveAppData: (data) => {
    try {
      const stringifiedData = JSON.stringify(data);
      localStorage.setItem(APP_DATA_KEY, stringifiedData);
    } catch (e) {
      console.error("Failed to save app data to localStorage", e);
    }
  },
};

// Export singleton instance
export const api = new TyriaTrackerAPI();

// --- Remote progress functions (Mongo backend) ---
export async function fetchProgress(userName) {
  try {
    const res = await axiosInstance.get(`${API}/progress/${encodeURIComponent(userName)}`);
    if (res.data && res.data.success) {
      return res.data.data.progressByDate || res.data.data;
    }
    return {};
  } catch (e) {
    console.warn('Erro ao carregar progresso:', e?.message);
    return {};
  }
}

export async function saveProgress({ userName, date, dailyTasks, completedEvents = {}, completedEventTypes = {} }) {
  try {
    // Tentar primeiro com POST, se falhar tenta PUT
    try {
      const response = await axiosInstance.post(`${API}/progress`, {
        userName,
        date,
        dailyTasks,
        completedEvents,
        completedEventTypes,
      });
      if (response.data?.success) {
        return response.data;
      }
    } catch (postError) {
      console.warn('POST falhou, tentando PUT:', postError?.message);
    }

    // Se POST falhou, tenta PUT
    const response = await axiosInstance.put(`${API}/progress`, {
      userName,
      date,
      dailyTasks,
      completedEvents,
      completedEventTypes,
    });
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Falha ao salvar');
    }
    return response.data;
  } catch (e) {
    console.warn('Falha ao sincronizar progresso remoto:', e?.message);
    throw e; // propaga erro para retry
  }
}

export default api;