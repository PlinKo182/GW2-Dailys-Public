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

export async function saveUserFilters(userName, filters) {
  try {
    await axiosInstance.post(`${API}/user/filters`, { userName, filters });
  } catch (e) {
    console.warn('Falha ao salvar filtros do utilizador:', e?.message);
    // Não propaga o erro para não interromper a experiência do utilizador
  }
}

export async function saveCustomTasks(userName, customTasks) {
  try {
    await axiosInstance.post(`${API}/user/tasks`, { userName, customTasks });
  } catch (e) {
    console.warn('Falha ao salvar tarefas personalizadas:', e?.message);
    // Não propaga o erro
  }
}

export async function fetchProgress(userName) {
  try {
    const res = await axiosInstance.get(`${API}/progress/${encodeURIComponent(userName)}`);
    if (res.data && res.data.success) {
      // The backend now returns { progress: {}, filters: {}, customTasks: [] }
      return res.data.data;
    }
    if (res.data && !res.data.success) {
        throw new Error(res.data.error);
    }
    return { progress: {}, filters: null, customTasks: null }; // Return default shape on failure
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

// --- GW2 API Key Functions ---
export async function saveGW2ApiKey(userName, apiKey) {
  try {
    const response = await axiosInstance.post(`${API}/user/gw2-api-key`, { userName, apiKey });
    if (response.data && response.data.success) {
      return response.data;
    }
    throw new Error(response.data?.error || 'Failed to save GW2 API key.');
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
}

export async function deleteGW2ApiKey(userName) {
  try {
    const response = await axiosInstance.delete(`${API}/user/gw2-api-key/${encodeURIComponent(userName)}`);
    if (response.data && response.data.success) {
      return response.data;
    }
    throw new Error(response.data?.error || 'Failed to delete GW2 API key.');
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
}

export async function fetchMapChests(userName) {
  try {
    const response = await axiosInstance.get(`${API}/user/mapchests/${encodeURIComponent(userName)}`);
    if (response.data && response.data.success) {
      return response.data;
    }
    // If needsApiKey is true, return that info
    if (response.data && response.data.needsApiKey) {
      return { needsApiKey: true, error: response.data.error };
    }
    throw new Error(response.data?.error || 'Failed to fetch map chests.');
  } catch (error) {
    if (error.response && error.response.data) {
      if (error.response.data.needsApiKey) {
        return { needsApiKey: true, error: error.response.data.error };
      }
      throw new Error(error.response.data.error);
    }
    throw error;
  }
}

export async function fetchDailyCrafting(userName) {
  try {
    const response = await axiosInstance.get(`${API}/user/dailycrafting/${encodeURIComponent(userName)}`);
    if (response.data && response.data.success) {
      return response.data;
    }
    if (response.data && response.data.needsApiKey) {
      return { needsApiKey: true, error: response.data.error };
    }
    throw new Error(response.data?.error || 'Failed to fetch daily crafting.');
  } catch (error) {
    if (error.response && error.response.data) {
      if (error.response.data.needsApiKey) {
        return { needsApiKey: true, error: error.response.data.error };
      }
      throw new Error(error.response.data.error);
    }
    throw error;
  }
}

export async function fetchWorldBosses(userName) {
  try {
    const response = await axiosInstance.get(`${API}/user/worldbosses/${encodeURIComponent(userName)}`);
    if (response.data && response.data.success) {
      return response.data;
    }
    if (response.data && response.data.needsApiKey) {
      return { needsApiKey: true, error: response.data.error };
    }
    throw new Error(response.data?.error || 'Failed to fetch world bosses.');
  } catch (error) {
    if (error.response && error.response.data) {
      if (error.response.data.needsApiKey) {
        return { needsApiKey: true, error: error.response.data.error };
      }
      throw new Error(error.response.data.error);
    }
    throw error;
  }
}

export async function fetchFractals(userName) {
  try {
    const response = await axiosInstance.get(`${API}/user/fractals/${encodeURIComponent(userName)}`);
    if (response.data && response.data.success) {
      return response.data;
    }
    if (response.data && response.data.needsApiKey) {
      return { needsApiKey: true, error: response.data.error };
    }
    throw new Error(response.data?.error || 'Failed to fetch fractals.');
  } catch (error) {
    if (error.response && error.response.data) {
      if (error.response.data.needsApiKey) {
        return { needsApiKey: true, error: error.response.data.error };
      }
      throw new Error(error.response.data.error);
    }
    throw error;
  }
}