import { create } from 'zustand';
import type { NoteWindow } from '@/types';

interface WindowStore {
  windows: Map<string, NoteWindow>;

  // Actions
  addWindow: (noteId: string, window: NoteWindow) => void;
  removeWindow: (noteId: string) => void;
  updateWindow: (noteId: string, updates: Partial<NoteWindow>) => void;
  getWindow: (noteId: string) => NoteWindow | undefined;
  getAllWindows: () => NoteWindow[];
  hasWindow: (noteId: string) => boolean;
}

export const useWindowStore = create<WindowStore>()((set, get) => ({
  windows: new Map(),

  addWindow: (noteId, window) => {
    set((state) => {
      const windows = new Map(state.windows);
      windows.set(noteId, window);
      return { windows };
    });
  },

  removeWindow: (noteId) => {
    set((state) => {
      const windows = new Map(state.windows);
      windows.delete(noteId);
      return { windows };
    });
  },

  updateWindow: (noteId, updates) => {
    set((state) => {
      const windows = new Map(state.windows);
      const current = windows.get(noteId);
      if (current) {
        windows.set(noteId, { ...current, ...updates });
      }
      return { windows };
    });
  },

  getWindow: (noteId) => get().windows.get(noteId),

  getAllWindows: () => Array.from(get().windows.values()),

  hasWindow: (noteId) => get().windows.has(noteId),
}));
