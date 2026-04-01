import { create } from 'zustand';

interface AppState {
  selectedSector: string | null;
  selectedCompany: string | null;
  searchQuery: string;
  dailyLookups: number;
  locale: string;

  setSelectedSector: (sector: string | null) => void;
  setSelectedCompany: (company: string | null) => void;
  setSearchQuery: (query: string) => void;
  incrementLookups: () => void;
  resetLookups: () => void;
  setLocale: (locale: string) => void;
  canLookup: () => boolean;
}

const FREE_TIER_LIMIT = 5;

export const useAppStore = create<AppState>((set, get) => ({
  selectedSector: null,
  selectedCompany: null,
  searchQuery: '',
  dailyLookups: 0,
  locale: 'en',

  setSelectedSector: (sector) => set({ selectedSector: sector }),
  setSelectedCompany: (company) => set({ selectedCompany: company }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  incrementLookups: () => set((state) => ({ dailyLookups: state.dailyLookups + 1 })),
  resetLookups: () => set({ dailyLookups: 0 }),
  setLocale: (locale) => set({ locale }),
  canLookup: () => get().dailyLookups < FREE_TIER_LIMIT,
}));
