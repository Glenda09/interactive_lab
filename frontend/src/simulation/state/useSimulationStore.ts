import { create } from "zustand";

export interface SimulationEvent {
  id: string;
  type: string;
  timestamp: string;
  detail: string;
}

interface SimulationState {
  events: SimulationEvent[];
  addEvent: (event: Omit<SimulationEvent, "id" | "timestamp">) => void;
  reset: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  events: [],
  addEvent: (event) =>
    set((state) => ({
      events: [
        {
          ...event,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        },
        ...state.events
      ].slice(0, 12)
    })),
  reset: () => set({ events: [] })
}));

