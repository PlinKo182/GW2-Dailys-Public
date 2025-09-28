// components/EventsFilter/EventsFilter.js
import React, { useState, useEffect } from 'react';
import { Filter, X, Save, Loader, ChevronRight, ChevronDown, Home, Folder, File } from 'lucide-react';

// Função para normalizar chaves
const normalizeKey = (key) => {
  if (!key) return '';
  return key.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

const EventsFilter = ({ onFilterChange, currentFilters }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState(currentFilters);
  const [isSaving, setIsSaving] = useState(false);
  const [currentView, setCurrentView] = useState('expansions');
  const [navigationStack, setNavigationStack] = useState([]);
  const [selectedExpansion, setSelectedExpansion] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);

  // Função para contar eventos selecionados
  const countSelectedEvents = (filters) => {
    let selected = 0;
    let total = 0;
    
    if (!filters?.expansions) return { selected: 0, total: 0 };

    Object.values(filters.expansions).forEach(expansion => {
      Object.values(expansion.zones).forEach(zone => {
        Object.values(zone.events).forEach(event => {
          total++;
          if (typeof event === 'object' ? event.enabled : event) {
            selected++;
          }
        });
      });
    });
    
    return { selected, total };
  };

  // Inicializar quando currentFilters mudar
  useEffect(() => {
    if (currentFilters && currentFilters.expansions) {
      const newFilters = JSON.parse(JSON.stringify(currentFilters));
      const counts = countSelectedEvents(newFilters);
      newFilters.selectedCount = counts.selected;
      newFilters.totalCount = counts.total;
      setFilters(newFilters);
    }
  }, [currentFilters]);

  // Função auxiliar para obter nomes originais de forma segura
  const getOriginalName = (item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      if (item.originalName) return item.originalName;
      // Se não tem originalName mas tem enabled, pode ser um evento
      if ('enabled' in item) return item.eventKey || 'Unknown Event';
    }
    return 'Unknown';
  };

  // Navegar para uma expansão
  const navigateToExpansion = (expansionKey) => {
    const normalizedKey = normalizeKey(expansionKey);
    setSelectedExpansion(normalizedKey);
    setCurrentView('zones');
    setNavigationStack([{ 
      type: 'expansion', 
      key: normalizedKey, 
      name: getOriginalName(filters.expansions[normalizedKey]) 
    }]);
  };

  // Navegar para uma zona
  const navigateToZone = (expansionKey, zoneKey) => {
    const normalizedExpansionKey = normalizeKey(expansionKey);
    const normalizedZoneKey = normalizeKey(zoneKey);
    setSelectedExpansion(normalizedExpansionKey);
    setSelectedZone(normalizedZoneKey);
    setCurrentView('events');
    setNavigationStack([
      { 
        type: 'expansion', 
        key: normalizedExpansionKey, 
        name: getOriginalName(filters.expansions[normalizedExpansionKey]) 
      },
      { 
        type: 'zone', 
        key: normalizedZoneKey, 
        name: getOriginalName(filters.expansions[normalizedExpansionKey]?.zones[normalizedZoneKey]) 
      }
    ]);
  };

  // Voltar na navegação
  const navigateBack = () => {
    if (navigationStack.length === 1) {
      setCurrentView('expansions');
      setSelectedExpansion(null);
      setNavigationStack([]);
    } else if (navigationStack.length === 2) {
      setCurrentView('zones');
      setSelectedZone(null);
      setNavigationStack([navigationStack[0]]);
    }
  };

  // Voltar para a visão principal
  const navigateToRoot = () => {
    setCurrentView('expansions');
    setSelectedExpansion(null);
    setSelectedZone(null);
    setNavigationStack([]);
  };

  // Manipular seleção de expansão
  const handleExpansionToggle = (expansionKey, enabled) => {
    const normalizedKey = normalizeKey(expansionKey);
    const newFilters = JSON.parse(JSON.stringify(filters));
    
    if (!newFilters.expansions[normalizedKey]) return;

    newFilters.expansions[normalizedKey].enabled = enabled;
    
    // Aplicar a todos os eventos da expansão
    Object.keys(newFilters.expansions[normalizedKey].zones).forEach(zoneKey => {
      newFilters.expansions[normalizedKey].zones[zoneKey].enabled = enabled;
      Object.keys(newFilters.expansions[normalizedKey].zones[zoneKey].events).forEach(eventKey => {
        const event = newFilters.expansions[normalizedKey].zones[zoneKey].events[eventKey];
        if (typeof event === 'object') {
          event.enabled = enabled;
        } else {
          newFilters.expansions[normalizedKey].zones[zoneKey].events[eventKey] = {
            enabled: enabled,
            originalName: eventKey
          };
        }
      });
    });
    
    const counts = countSelectedEvents(newFilters);
    newFilters.selectedCount = counts.selected;
    newFilters.totalCount = counts.total;
    setFilters(newFilters);
  };

  // Manipular seleção de zona
  const handleZoneToggle = (expansionKey, zoneKey, enabled) => {
    const normalizedExpansionKey = normalizeKey(expansionKey);
    const normalizedZoneKey = normalizeKey(zoneKey);
    const newFilters = JSON.parse(JSON.stringify(filters));
    
    if (!newFilters.expansions[normalizedExpansionKey]?.zones[normalizedZoneKey]) return;

    newFilters.expansions[normalizedExpansionKey].zones[normalizedZoneKey].enabled = enabled;
    
    // Aplicar a todos os eventos da zona
    Object.keys(newFilters.expansions[normalizedExpansionKey].zones[normalizedZoneKey].events).forEach(eventKey => {
      const event = newFilters.expansions[normalizedExpansionKey].zones[normalizedZoneKey].events[eventKey];
      if (typeof event === 'object') {
        event.enabled = enabled;
      } else {
        newFilters.expansions[normalizedExpansionKey].zones[normalizedZoneKey].events[eventKey] = {
          enabled: enabled,
          originalName: eventKey
        };
      }
    });
    
    // Atualizar estado da expansão baseado nas zonas
    const expansionZones = Object.values(newFilters.expansions[normalizedExpansionKey].zones);
    const allZonesEnabled = expansionZones.every(zone => zone.enabled);
    newFilters.expansions[normalizedExpansionKey].enabled = allZonesEnabled;
    
    const counts = countSelectedEvents(newFilters);
    newFilters.selectedCount = counts.selected;
    newFilters.totalCount = counts.total;
    setFilters(newFilters);
  };

  // Manipular seleção de evento individual
  const handleEventToggle = (expansionKey, zoneKey, eventKey, enabled) => {
    const normalizedExpansionKey = normalizeKey(expansionKey);
    const normalizedZoneKey = normalizeKey(zoneKey);
    const normalizedEventKey = normalizeKey(eventKey);
    const newFilters = JSON.parse(JSON.stringify(filters));
    
    if (!newFilters.expansions[normalizedExpansionKey]?.zones[normalizedZoneKey]) return;

    const event = newFilters.expansions[normalizedExpansionKey].zones[normalizedZoneKey].events[normalizedEventKey];
    if (typeof event === 'object') {
      event.enabled = enabled;
    } else {
      newFilters.expansions[normalizedExpansionKey].zones[normalizedZoneKey].events[normalizedEventKey] = {
        enabled: enabled,
        originalName: eventKey
      };
    }
    
    // Atualizar estado da zona baseado nos eventos
    const zoneEvents = Object.values(newFilters.expansions[normalizedExpansionKey].zones[normalizedZoneKey].events);
    const allEventsEnabled = zoneEvents.every(event => 
      typeof event === 'object' ? event.enabled : event
    );
    newFilters.expansions[normalizedExpansionKey].zones[normalizedZoneKey].enabled = allEventsEnabled;
    
    // Atualizar estado da expansão baseado nas zonas
    const expansionZones = Object.values(newFilters.expansions[normalizedExpansionKey].zones);
    const allZonesEnabled = expansionZones.every(zone => zone.enabled);
    newFilters.expansions[normalizedExpansionKey].enabled = allZonesEnabled;
    
    const counts = countSelectedEvents(newFilters);
    newFilters.selectedCount = counts.selected;
    newFilters.totalCount = counts.total;
    setFilters(newFilters);
  };

  // Selecionar todos
  const selectAll = () => {
    const newFilters = JSON.parse(JSON.stringify(filters));
    
    Object.keys(newFilters.expansions).forEach(expansionKey => {
      newFilters.expansions[expansionKey].enabled = true;
      Object.keys(newFilters.expansions[expansionKey].zones).forEach(zoneKey => {
        newFilters.expansions[expansionKey].zones[zoneKey].enabled = true;
        Object.keys(newFilters.expansions[expansionKey].zones[zoneKey].events).forEach(eventKey => {
          const event = newFilters.expansions[expansionKey].zones[zoneKey].events[eventKey];
          if (typeof event === 'object') {
            event.enabled = true;
          } else {
            newFilters.expansions[expansionKey].zones[zoneKey].events[eventKey] = {
              enabled: true,
              originalName: eventKey
            };
          }
        });
      });
    });
    
    const counts = countSelectedEvents(newFilters);
    newFilters.selectedCount = counts.selected;
    newFilters.totalCount = counts.total;
    setFilters(newFilters);
  };

  // Desmarcar todos
  const selectNone = () => {
    const newFilters = JSON.parse(JSON.stringify(filters));
    
    Object.keys(newFilters.expansions).forEach(expansionKey => {
      newFilters.expansions[expansionKey].enabled = false;
      Object.keys(newFilters.expansions[expansionKey].zones).forEach(zoneKey => {
        newFilters.expansions[expansionKey].zones[zoneKey].enabled = false;
        Object.keys(newFilters.expansions[expansionKey].zones[zoneKey].events).forEach(eventKey => {
          const event = newFilters.expansions[expansionKey].zones[zoneKey].events[eventKey];
          if (typeof event === 'object') {
            event.enabled = false;
          } else {
            newFilters.expansions[expansionKey].zones[zoneKey].events[eventKey] = {
              enabled: false,
              originalName: eventKey
            };
          }
        });
      });
    });
    
    const counts = countSelectedEvents(newFilters);
    newFilters.selectedCount = counts.selected;
    newFilters.totalCount = counts.total;
    setFilters(newFilters);
  };

  const saveFilters = () => {
    setIsSaving(true);
    
    // Garantir que os contadores estejam atualizados
    const newFilters = JSON.parse(JSON.stringify(filters));
    const counts = countSelectedEvents(newFilters);
    newFilters.selectedCount = counts.selected;
    newFilters.totalCount = counts.total;
    
    setTimeout(() => {
      setIsSaving(false);
      setIsOpen(false);
      onFilterChange(newFilters);
    }, 500);
  };

  // Renderizar visão de expansões
  const renderExpansionsView = () => {
    if (!filters.expansions) {
      return <div className="text-center py-4 text-gray-400">Loading...</div>;
    }

    return (
      <div className="space-y-2">
        {Object.entries(filters.expansions).map(([expansionKey, expansionData]) => (
          <div key={expansionKey} className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => navigateToExpansion(expansionKey)}
                  className="flex items-center gap-2 text-gray-200 hover:text-white transition-colors flex-1 text-left"
                >
                  <ChevronRight className="w-4 h-4" />
                  <Folder className="w-5 h-5 text-blue-400" />
                  <span className="font-medium">{getOriginalName(expansionData)}</span>
                </button>
                <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                  {expansionData.eventCount} events
                </span>
              </div>
              <input
                type="checkbox"
                checked={!!expansionData.enabled}
                onChange={(e) => handleExpansionToggle(expansionKey, e.target.checked)}
                className="rounded bg-gray-600 border-gray-500 text-emerald-400 focus:ring-emerald-400 ml-2"
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Renderizar visão de zonas
  const renderZonesView = () => {
    if (!selectedExpansion || !filters.expansions[selectedExpansion]) {
      return <div className="text-center py-4 text-gray-400">Invalid expansion selected.</div>;
    }
    
    const expansion = filters.expansions[selectedExpansion];
    
    return (
      <div className="space-y-2">
        <div className="mb-4 p-3 bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span>Expansion:</span>
            <span className="font-medium text-emerald-400">{getOriginalName(expansion)}</span>
          </div>
        </div>
        
        {Object.entries(expansion.zones).map(([zoneKey, zoneData]) => (
          <div key={zoneKey} className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => navigateToZone(selectedExpansion, zoneKey)}
                  className="flex items-center gap-2 text-gray-200 hover:text-white transition-colors flex-1 text-left"
                >
                  <ChevronRight className="w-4 h-4" />
                  <Folder className="w-5 h-5 text-green-400" />
                  <span>{getOriginalName(zoneData)}</span>
                </button>
                <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                  {zoneData.eventCount} events
                </span>
              </div>
              <input
                type="checkbox"
                checked={!!zoneData.enabled}
                onChange={(e) => handleZoneToggle(selectedExpansion, zoneKey, e.target.checked)}
                className="rounded bg-gray-600 border-gray-500 text-emerald-400 focus:ring-emerald-400 ml-2"
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Renderizar visão de eventos
  const renderEventsView = () => {
    if (!selectedExpansion || !selectedZone || !filters.expansions[selectedExpansion]?.zones[selectedZone]) {
      return <div className="text-center py-4 text-gray-400">Invalid zone selected.</div>;
    }
    
    const zone = filters.expansions[selectedExpansion].zones[selectedZone];
    
    return (
      <div className="space-y-2">
        <div className="mb-4 p-3 bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span>Expansion:</span>
            <span className="font-medium text-emerald-400">{getOriginalName(filters.expansions[selectedExpansion])}</span>
            <span className="mx-1">→</span>
            <span>Zone:</span>
            <span className="font-medium text-green-400">{getOriginalName(zone)}</span>
          </div>
        </div>
        
        {Object.entries(zone.events).map(([eventKey, event]) => (
          <label key={eventKey} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <File className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-200">{getOriginalName(event)}</span>
            </div>
            <input
              type="checkbox"
              checked={typeof event === 'object' ? !!event.enabled : !!event}
              onChange={(e) => handleEventToggle(selectedExpansion, selectedZone, eventKey, e.target.checked)}
              className="rounded bg-gray-600 border-gray-500 text-emerald-400 focus:ring-emerald-400"
            />
          </label>
        ))}
      </div>
    );
  };

  // Renderizar conteúdo baseado na visão atual
  const renderCurrentView = () => {
    switch (currentView) {
      case 'zones':
        return renderZonesView();
      case 'events':
        return renderEventsView();
      default:
        return renderExpansionsView();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-gray-700 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
      >
        <Filter className="w-4 h-4" />
        Event Filters ({filters.selectedCount || 0}/{filters.totalCount || 0})
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={navigateToRoot}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Back to expansions"
                  >
                    <Home className="w-5 h-5" />
                  </button>
                  <h3 className="text-xl font-bold text-emerald-400">Event Filters</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Breadcrumb navigation */}
              {navigationStack.length > 0 && (
                <div className="flex items-center gap-1 text-sm text-gray-400 mb-3">
                  <button 
                    onClick={navigateToRoot}
                    className="hover:text-white transition-colors"
                  >
                    Expansions
                  </button>
                  {navigationStack.map((item, index) => (
                    <span key={index} className="flex items-center gap-1">
                      <span className="mx-1">→</span>
                      {index === navigationStack.length - 1 ? (
                        <span className="text-emerald-400">{item.name}</span>
                      ) : (
                        <button 
                          onClick={navigateBack}
                          className="hover:text-white transition-colors"
                        >
                          {item.name}
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
              
              <p className="text-gray-400 text-sm">
                {currentView === 'expansions' && 'Select expansion to view its zones'}
                {currentView === 'zones' && 'Select zone to view its events'}
                {currentView === 'events' && 'Select individual events to show/hide'}
              </p>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={selectAll}
                  className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={selectNone}
                  className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                >
                  Select None
                </button>
                {currentView !== 'expansions' && (
                  <button
                    onClick={navigateBack}
                    className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  >
                    Back
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {renderCurrentView()}
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Selected: {filters.selectedCount || 0} of {filters.totalCount || 0} events
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveFilters}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Filters
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EventsFilter;