// hooks/useEventFilters.js1
import { useState, useEffect } from 'react';
import { eventsData } from '../utils/eventsData';

// Função para normalizar chaves
const normalizeKey = (key) => {
  if (!key) return '';
  return key.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

// Função para construir a estrutura completa de filtros
const buildCompleteFilterStructure = (eventsData) => {
  const filters = {
    expansions: {},
    selectedCount: 0,
    totalCount: 0
  };

  let totalEvents = 0;

  Object.entries(eventsData).forEach(([expansion, zones]) => {
    const normalizedExpansion = normalizeKey(expansion);
    
    filters.expansions[normalizedExpansion] = {
      enabled: true,
      originalName: expansion, // Guardar o nome original para display
      zones: {},
      eventCount: 0
    };

    Object.entries(zones).forEach(([zone, events]) => {
      const normalizedZone = normalizeKey(zone);
      
      filters.expansions[normalizedExpansion].zones[normalizedZone] = {
        enabled: true,
        originalName: zone, // Guardar o nome original para display
        events: {},
        eventCount: 0
      };

      Object.keys(events).forEach(eventName => {
        const normalizedEvent = normalizeKey(eventName);
        
        // Guardar apenas o estado booleano para eventos, não objetos complexos
        filters.expansions[normalizedExpansion].zones[normalizedZone].events[normalizedEvent] = {
          enabled: true,
          originalName: eventName // Guardar o nome original para display
        };
        
        filters.expansions[normalizedExpansion].zones[normalizedZone].eventCount++;
        filters.expansions[normalizedExpansion].eventCount++;
        totalEvents++;
      });
    });
  });

  filters.totalCount = totalEvents;
  filters.selectedCount = totalEvents;

  return filters;
};

// Função para contar eventos selecionados
const countSelectedEvents = (filters) => {
  let selected = 0;
  let total = 0;

  Object.values(filters.expansions).forEach(expansion => {
    Object.values(expansion.zones).forEach(zone => {
      Object.values(zone.events).forEach(event => {
        total++;
        if (event.enabled) selected++;
      });
    });
  });

  return { selected, total };
};

export const useEventFilters = () => {
  const [eventFilters, setEventFilters] = useState({ 
    expansions: {}, 
    selectedCount: 0, 
    totalCount: 0 
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeFilters = () => {
      try {
        const savedFilters = localStorage.getItem('tyriaTracker_eventFilters');
        
        if (savedFilters) {
          const parsedFilters = JSON.parse(savedFilters);
          
          // Verificar se a estrutura salva é válida e no formato correto
          const isValidFormat = (filters) => {
            if (!filters || !filters.expansions) return false;
            
            // Verificar se todos os eventos estão no formato correto (objeto com enabled)
            for (const expansion of Object.values(filters.expansions)) {
              if (!expansion.zones) return false;
              
              for (const zone of Object.values(expansion.zones)) {
                if (!zone.events) return false;
                
                for (const event of Object.values(zone.events)) {
                  // Se o evento não é um objeto ou não tem a propriedade enabled, formato antigo
                  if (typeof event !== 'object' || !('enabled' in event)) {
                    return false;
                  }
                }
              }
            }
            return true;
          };
          
          // Se o formato for válido, use os filtros salvos, caso contrário, reconstrua
          if (isValidFormat(parsedFilters)) {
            setEventFilters(parsedFilters);
            setIsLoading(false);
            return;
          } else {
            localStorage.removeItem('tyriaTracker_eventFilters'); // Limpar filtros antigos
          }
          if (parsedFilters.expansions && Object.keys(parsedFilters.expansions).length > 0) {
            setEventFilters(parsedFilters);
          } else {
            initializeDefaultFilters();
          }
        } else {
          initializeDefaultFilters();
        }
      } catch (error) {
        initializeDefaultFilters();
      }
      
      setIsLoading(false);
    };

    const initializeDefaultFilters = () => {
      const defaultFilters = buildCompleteFilterStructure(eventsData);
      setEventFilters(defaultFilters);
      localStorage.setItem('tyriaTracker_eventFilters', JSON.stringify(defaultFilters));
    };

    initializeFilters();
  }, []);

  const updateEventFilters = (newFilters) => {
    const counts = countSelectedEvents(newFilters);
    newFilters.selectedCount = counts.selected;
    newFilters.totalCount = counts.total;
    
    setEventFilters(newFilters);
    localStorage.setItem('tyriaTracker_eventFilters', JSON.stringify(newFilters));
  };

  return { eventFilters, updateEventFilters, isLoading };
};