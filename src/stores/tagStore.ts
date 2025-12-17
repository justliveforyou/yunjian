import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Tag, CreateTagParams, UpdateTagParams } from '@/types';
import { nowISO } from '@/utils';

interface TagStore {
  tags: Tag[];
  selectedTagId: string | null;

  // Actions
  setTags: (tags: Tag[]) => void;
  addTag: (params: CreateTagParams) => Tag;
  updateTag: (id: string, params: UpdateTagParams) => void;
  deleteTag: (id: string) => void;
  setSelectedTag: (id: string | null) => void;
  getTagById: (id: string) => Tag | undefined;
  updateNoteCount: (id: string, count: number) => void;
}

export const useTagStore = create<TagStore>()((set, get) => ({
  tags: [],
  selectedTagId: null,

  setTags: (tags) => set({ tags }),

  addTag: (params) => {
    const now = nowISO();
    const tag: Tag = {
      id: nanoid(),
      name: params.name,
      color: params.color,
      icon: params.icon,
      noteCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({ tags: [...state.tags, tag] }));
    return tag;
  },

  updateTag: (id, params) => {
    set((state) => ({
      tags: state.tags.map((t) =>
        t.id === id
          ? { ...t, ...params, updatedAt: nowISO() }
          : t
      ),
    }));
  },

  deleteTag: (id) => {
    set((state) => ({
      tags: state.tags.filter((t) => t.id !== id),
      selectedTagId: state.selectedTagId === id ? null : state.selectedTagId,
    }));
  },

  setSelectedTag: (id) => set({ selectedTagId: id }),

  getTagById: (id) => get().tags.find((t) => t.id === id),

  updateNoteCount: (id, count) => {
    set((state) => ({
      tags: state.tags.map((t) =>
        t.id === id ? { ...t, noteCount: count } : t
      ),
    }));
  },
}));
