import { create } from 'zustand';
import type {
  GameNetwork,
  Station,
  Track,
  Crossover,
  Tool,
  ToolSettings,
  Coordinates,
  MapRegion,
} from '../types';
import { api } from '../services/api';

// Cost calculation helpers
const calculateStationCost = (
  stationType: Station['stationType'], 
  platforms: number, 
  facilities: any
): number => {
  const baseCosts = {
    local: 1000000,
    regional: 2500000,
    intercity: 5000000,
    hub: 10000000
  };
  
  const platformCost = platforms * 500000;
  const facilitiesCost = Object.values(facilities).filter(Boolean).length * 250000;
  
  return baseCosts[stationType] + platformCost + facilitiesCost;
};

const calculateTrackCost = (
  trackType: Track['trackType'], 
  lengthKm: number, 
  isDoubleTrack: boolean
): number => {
  const costPerKm = {
    hst: 10000000,
    ic: 5000000,
    non_electrified: 2000000
  };
  
  const baseCost = costPerKm[trackType] * lengthKm;
  return isDoubleTrack ? baseCost * 1.6 : baseCost;
};

const calculateTrackLength = (waypoints: Coordinates[]): number => {
  // Simple distance calculation (in reality, use Haversine formula)
  let length = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const latDiff = waypoints[i].lat - waypoints[i-1].lat;
    const lonDiff = waypoints[i].lon - waypoints[i-1].lon;
    length += Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111; // Rough km conversion
  }
  return Math.round(length * 100) / 100;
};

const getSpeedLimit = (trackType: Track['trackType']): number => {
  const speedLimits = {
    hst: 300,
    ic: 200,
    non_electrified: 120
  };
  return speedLimits[trackType];
};

interface GameState {
  // Network data
  network: GameNetwork | null;
  selectedRegion: MapRegion | null;

  // UI State
  currentTool: Tool;
  toolSettings: ToolSettings;
  isToolMenuOpen: boolean;
  selectedStationId: string | null;
  selectedTrackId: string | null;

  // Track drawing state
  isDrawingTrack: boolean;
  trackDrawingPoints: Coordinates[];
  trackStartNodeId: string | null;

  // Actions
  setNetwork: (network: GameNetwork) => void;
  setSelectedRegion: (region: MapRegion) => Promise<void>;
  setCurrentTool: (tool: Tool) => void;
  setToolSettings: (settings: Partial<ToolSettings>) => void;
  toggleToolMenu: () => void;

  // Station actions
  addStation: (station: Omit<Station, 'id' | 'cost'>) => Promise<void>;
  removeStation: (id: string) => void;
  selectStation: (id: string | null) => void;

  // Track actions
  startDrawingTrack: (startNodeId: string, startPoint: Coordinates) => void;
  addTrackWaypoint: (point: Coordinates) => void;
  finishDrawingTrack: (track: Omit<Track, 'id' | 'lengthKm' | 'cost' | 'maintenanceCost' | 'speedLimit'>) => Promise<void>;
  cancelDrawingTrack: () => void;
  removeTrack: (id: string) => void;
  selectTrack: (id: string | null) => void;

  // Crossover actions
  addCrossover: (crossover: Crossover) => void;
  removeCrossover: (id: string) => void;

  // Budget actions
  spendBudget: (amount: number) => void;
  addIncome: (amount: number) => void;
  addExpense: (amount: number) => void;

  // Revenue calculation
  calculateRevenue: () => void;

  // Save/Load
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

const DEFAULT_TOOL_SETTINGS: ToolSettings = {
  stationType: 'regional',
  platforms: 5,
  trackType: 'ic',
  isDoubleTrack: false,
  crossoverType: 'simple',
  facilities: {
    parking: false,
    shops: false,
    bikeRental: false,
  },
};

const DEFAULT_NETWORK: GameNetwork = {
  id: crypto.randomUUID(),
  name: 'My Railway Network',
  budget: 1_000_000_000, // €1 billion starting budget
  income: 0,
  expenses: 0,
  gameYear: 2024,
  gameMonth: 1,
  stations: [],
  tracks: [],
  crossovers: [],
};

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  network: null,
  selectedRegion: null,
  currentTool: 'select',
  toolSettings: DEFAULT_TOOL_SETTINGS,
  isToolMenuOpen: false,
  selectedStationId: null,
  selectedTrackId: null,
  isDrawingTrack: false,
  trackDrawingPoints: [],
  trackStartNodeId: null,

  // Basic setters
  setNetwork: (network) => set({ network }),
  setSelectedRegion: async (region) => {
    // Set region and network immediately so map can render
    const initialNetwork = { ...DEFAULT_NETWORK, id: crypto.randomUUID() };
    set({ selectedRegion: region, network: initialNetwork });
    
    // Then try to initialize on backend (async, won't block rendering)
    try {
      const { network } = await api.initNetwork('My Railway Network', region.id);
      set({ network }); // Update with backend network if successful
    } catch (e) {
      console.warn('Backend network initialization failed, using local network:', e);
      // Keep using the initial network we already set
    }
  },
  setCurrentTool: (tool) => set({ currentTool: tool }),
  setToolSettings: (settings) =>
    set((state) => ({
      toolSettings: { ...state.toolSettings, ...settings },
    })),
  toggleToolMenu: () => set((state) => ({ isToolMenuOpen: !state.isToolMenuOpen })),

  // Station actions
  addStation: async (stationData) => {
    const state = get();
    if (!state.network) return;
    
    // Calculate cost
    const cost = calculateStationCost(
      stationData.stationType, 
      stationData.platforms, 
      stationData.facilities || {}
    );
    
    // Validate budget
    if (state.network.budget < cost) {
      console.warn(`Insufficient budget! Need €${cost.toLocaleString()} but only have €${state.network.budget.toLocaleString()}`);
      return;
    }

    const station: Station = {
      ...stationData,
      id: crypto.randomUUID(),
      cost
    };

    try {
      const { station: saved, budget } = await api.addStationToNetwork(state.network.id, station);
      set({
        network: {
          ...state.network,
          budget,
          stations: [...state.network.stations, saved],
        },
      });
    } catch {
      // If backend fails, add locally with cost deduction
      set({
        network: {
          ...state.network,
          budget: state.network.budget - cost,
          stations: [...state.network.stations, station],
        },
      });
    }
  },

  removeStation: (id) =>
    set((state) => {
      if (!state.network) return state;
      
      // Find station to potentially refund some cost
      const station = state.network.stations.find(s => s.id === id);
      let refund = 0;
      if (station) {
        refund = station.cost * 0.5; // 50% refund when demolishing
      }
      
      // Also remove any tracks connected to this station
      const tracksToRemove = state.network.tracks.filter(
        (t) => t.fromNodeId === id || t.toNodeId === id
      );
      
      // Refund track costs
      const trackRefund = tracksToRemove.reduce((sum, track) => sum + (track.cost * 0.3), 0);
      
      return {
        network: {
          ...state.network,
          budget: state.network.budget + refund + trackRefund,
          stations: state.network.stations.filter((s) => s.id !== id),
          tracks: state.network.tracks.filter(
            (t) => t.fromNodeId !== id && t.toNodeId !== id
          ),
        },
        selectedStationId: state.selectedStationId === id ? null : state.selectedStationId,
      };
    }),

  selectStation: (id) => set({ selectedStationId: id, selectedTrackId: null }),

  // Track actions
  startDrawingTrack: (startNodeId, startPoint) =>
    set({
      isDrawingTrack: true,
      trackDrawingPoints: [startPoint],
      trackStartNodeId: startNodeId,
      currentTool: 'track',
    }),

  addTrackWaypoint: (point) =>
    set((state) => ({
      trackDrawingPoints: [...state.trackDrawingPoints, point],
    })),

  finishDrawingTrack: async (trackData) => {
    const state = get();
    if (!state.network) return;
    
    // Calculate track length and cost
    const lengthKm = calculateTrackLength([...state.trackDrawingPoints]);
    const cost = calculateTrackCost(trackData.trackType, lengthKm, trackData.isDoubleTrack);
    
    // Validate budget
    if (state.network.budget < cost) {
      console.warn(`Insufficient budget for track! Need €${cost.toLocaleString()}`);
      get().cancelDrawingTrack();
      return;
    }

    const track: Track = {
      ...trackData,
      id: crypto.randomUUID(),
      lengthKm,
      cost,
      maintenanceCost: cost * 0.02, // 2% annual maintenance
      speedLimit: getSpeedLimit(trackData.trackType)
    };

    try {
      const { track: saved, budget } = await api.addTrackToNetwork(state.network.id, track);
      set({
        network: {
          ...state.network,
          budget,
          tracks: [...state.network.tracks, saved],
        },
        isDrawingTrack: false,
        trackDrawingPoints: [],
        trackStartNodeId: null,
      });
    } catch {
      set({
        network: {
          ...state.network,
          budget: state.network.budget - cost,
          tracks: [...state.network.tracks, track],
        },
        isDrawingTrack: false,
        trackDrawingPoints: [],
        trackStartNodeId: null,
      });
    }
  },

  cancelDrawingTrack: () =>
    set({
      isDrawingTrack: false,
      trackDrawingPoints: [],
      trackStartNodeId: null,
    }),

  removeTrack: (id) =>
    set((state) => {
      if (!state.network) return state;
      
      // Find track to refund some cost
      const track = state.network.tracks.find(t => t.id === id);
      let refund = 0;
      if (track) {
        refund = track.cost * 0.3; // 30% refund when removing track
      }
      
      return {
        network: {
          ...state.network,
          budget: state.network.budget + refund,
          tracks: state.network.tracks.filter((t) => t.id !== id),
        },
        selectedTrackId: state.selectedTrackId === id ? null : state.selectedTrackId,
      };
    }),

  selectTrack: (id) => set({ selectedTrackId: id, selectedStationId: null }),

  // Crossover actions
  addCrossover: (crossover) =>
    set((state) => {
      if (!state.network) return state;
      
      // Simple crossover cost calculation
      const cost = crossover.crossoverType === 'flying_junction' ? 5000000 : 
                  crossover.crossoverType === 'junction' ? 2500000 : 1000000;
                  
      const crossoverWithCost = { ...crossover, cost };
      
      // Validate budget
      if (state.network.budget < cost) {
        console.warn(`Insufficient budget for crossover! Need €${cost.toLocaleString()}`);
        return state;
      }
      
      return {
        network: {
          ...state.network,
          budget: state.network.budget - cost,
          crossovers: [...state.network.crossovers, crossoverWithCost],
        },
      };
    }),

  removeCrossover: (id) =>
    set((state) => {
      if (!state.network) return state;
      
      // Find crossover to refund some cost
      const crossover = state.network.crossovers.find(c => c.id === id);
      let refund = 0;
      if (crossover) {
        refund = crossover.cost * 0.4; // 40% refund
      }
      
      return {
        network: {
          ...state.network,
          budget: state.network.budget + refund,
          crossovers: state.network.crossovers.filter((c) => c.id !== id),
        },
      };
    }),

  // Budget actions
  spendBudget: (amount) =>
    set((state) => {
      if (!state.network) return state;
      const newBudget = state.network.budget - amount;
      if (newBudget < 0) {
        console.warn('Insufficient budget!');
        return state;
      }
      return {
        network: {
          ...state.network,
          budget: newBudget,
        },
      };
    }),

  addIncome: (amount) =>
    set((state) => {
      if (!state.network) return state;
      return {
        network: {
          ...state.network,
          income: state.network.income + amount,
          budget: state.network.budget + amount,
        },
      };
    }),

  addExpense: (amount) =>
    set((state) => {
      if (!state.network) return state;
      return {
        network: {
          ...state.network,
          expenses: state.network.expenses + amount,
          budget: state.network.budget - amount,
        },
      };
    }),

  // Revenue calculation
  calculateRevenue: () => {
    const state = get();
    if (!state.network) return;
    
    // Simple revenue calculation based on track length and stations
    const trackRevenue = state.network.tracks.reduce((sum, track) => 
      sum + (track.lengthKm * 10000), 0 // €10K per km annually
    );
    
    const stationRevenue = state.network.stations.reduce((sum, station) => 
      sum + (station.platforms * 50000), 0 // €50K per platform annually
    );
    
    const maintenanceCosts = state.network.tracks.reduce((sum, track) => 
      sum + track.maintenanceCost, 0
    );
    
    const totalRevenue = trackRevenue + stationRevenue - maintenanceCosts;
    
    set({
      network: {
        ...state.network,
        income: totalRevenue,
        expenses: maintenanceCosts,
      },
    });
  },

  // Save/Load
  saveToLocalStorage: () => {
    const state = get();
    if (state.network) {
      localStorage.setItem('trainbuilder_network', JSON.stringify(state.network));
      localStorage.setItem('trainbuilder_region', JSON.stringify(state.selectedRegion));
      console.log('Game saved to localStorage');
    }
  },

  loadFromLocalStorage: () => {
    const savedNetwork = localStorage.getItem('trainbuilder_network');
    const savedRegion = localStorage.getItem('trainbuilder_region');
    
    if (savedNetwork) {
      try {
        const network = JSON.parse(savedNetwork) as GameNetwork;
        const region = savedRegion ? JSON.parse(savedRegion) as MapRegion : null;
        set({ network, selectedRegion: region });
        console.log('Game loaded from localStorage');
      } catch (error) {
        console.error('Failed to load game:', error);
      }
    }
  },
}));