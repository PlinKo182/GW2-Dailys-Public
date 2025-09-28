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
  profiles: [],
  activeProfile: null,
  profileData: {},
  lastResetDate: 0,
};

// New simplified localStorage API for multi-profile support
export const localStorageAPI = {
  getAppData: () => {
    const saved = localStorage.getItem(APP_DATA_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Basic validation to ensure it has the expected structure
        if (parsed.profiles && parsed.profileData) {
          return { ...initialData, ...parsed }; // Merge with defaults
        }
      } catch (e) {
        console.error("Failed to parse app data from localStorage", e);
        return initialData;
      }
    }
    return initialData;
  },

  saveAppData: (data) => {
    try {
      const stringifiedData = JSON.stringify(data);
      localStorage.setItem(APP_DATA_KEY, stringifiedData);
    } catch (e) {
      console.error("Failed to save app data to localStorage", e);
    }
  },

  clearAppData: () => {
    localStorage.removeItem(APP_DATA_KEY);
  }
};

// --- Remote API Functions ---
export async function createUser(userName) {
  try {
    const response = await axiosInstance.post(`${API}/user`, { userName });
    if (response.data && response.data.success) {
      return response.data;
    }
    throw new Error(response.data?.error || 'Failed to create user.');
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error);
    }
    throw error;
  }
}

export async function fetchProgress(userName) {
  try {
    const res = await axiosInstance.get(`${API}/progress/${encodeURIComponent(userName)}`);
    if (res.data && res.data.success) {
      return res.data.data;
    }
    if (res.data && !res.data.success) {
        throw new Error(res.data.error);
    }
    return {};
  } catch (e) {
    console.warn('Error fetching progress:', e?.message);
    throw e;
  }
}

export async function saveProgress({ userName, date, dailyTasks, completedEventTypes = {} }) {
  try {
    const response = await axiosInstance.post(`${API}/progress`, {
      userName,
      date,
      dailyTasks,
      completedEventTypes,
    });
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Falha ao salvar');
    }
    return response.data;
  } catch (e) {
    console.warn('Falha ao sincronizar progresso remoto:', e?.message);
    throw e;
  }
}