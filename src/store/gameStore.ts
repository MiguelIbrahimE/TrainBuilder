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
  addStation: (station: Station) => Promise<void>;
  removeStation: (id: string) => void;
  selectStation: (id: string | null) => void;

  // Track actions
  startDrawingTrack: (startNodeId: string, startPoint: Coordinates) => void;
  addTrackWaypoint: (point: Coordinates) => void;
  finishDrawingTrack: (track: Track) => Promise<void>;
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
  addStation: async (station) => {
    const state = get();
    if (!state.network) return;
    try {
      const { station: saved, budget } = await api.addStationToNetwork(state.network.id, {
        name: station.name,
        location: station.location,
        platforms: station.platforms,
        stationType: station.stationType,
        facilities: station.facilities,
      });
      set({
        network: {
          ...state.network,
          budget,
          stations: [...state.network.stations, saved],
        },
      });
    } catch {
      // If backend fails, add locally
      set({
        network: {
          ...state.network,
          stations: [...state.network.stations, station],
        },
      });
    }
  },

  removeStation: (id) =>
    set((state) => {
      if (!state.network) return state;
      // Also remove any tracks connected to this station
      const tracksToRemove = state.network.tracks.filter(
        (t) => t.fromNodeId === id || t.toNodeId === id
      );
      return {
        network: {
          ...state.network,
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

  finishDrawingTrack: async (track) => {
    const state = get();
    if (!state.network) return;
    try {
      const { track: saved, budget } = await api.addTrackToNetwork(state.network.id, {
        trackType: track.trackType,
        fromNodeId: track.fromNodeId,
        toNodeId: track.toNodeId,
        waypoints: track.waypoints,
        isDoubleTrack: track.isDoubleTrack,
      });
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
      return {
        network: {
          ...state.network,
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
      return {
        network: {
          ...state.network,
          crossovers: [...state.network.crossovers, crossover],
        },
      };
    }),

  removeCrossover: (id) =>
    set((state) => {
      if (!state.network) return state;
      return {
        network: {
          ...state.network,
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
        },
      };
    }),

  // Save/Load
  saveToLocalStorage: () => {
    const state = get();
    if (state.network) {
      localStorage.setItem('trainbuilder_network', JSON.stringify(state.network));
      console.log('Network saved to localStorage');
    }
  },

  loadFromLocalStorage: () => {
    const saved = localStorage.getItem('trainbuilder_network');
    if (saved) {
      try {
        const network = JSON.parse(saved) as GameNetwork;
        set({ network });
        console.log('Network loaded from localStorage');
      } catch (error) {
        console.error('Failed to load network:', error);
      }
    }
  },
}));
