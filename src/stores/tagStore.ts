import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Tag, CreateTagParams, UpdateTagParams } from '@/types';
import { nowISO } from '@/utils';
import * as db from '@/services/database';

interface TagStore {
  tags: Tag[];
  selectedTagId: string | null;

  // Actions
  loadTags: () => Promise<void>;
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

  loadTags: async () => {
    try {
      const tags = await db.getAllTags();
      set({ tags });
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  },

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
    db.createTag(tag).catch((err) => console.error('Failed to create tag:', err));
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
    db.updateTag(id, params).catch((err) => console.error('Failed to update tag:', err));
  },

  deleteTag: (id) => {
    set((state) => ({
      tags: state.tags.filter((t) => t.id !== id),
      selectedTagId: state.selectedTagId === id ? null : state.selectedTagId,
    }));
    db.deleteTag(id).catch((err) => console.error('Failed to delete tag:', err));
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
