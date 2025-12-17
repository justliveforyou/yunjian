import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Note, CreateNoteParams, UpdateNoteParams } from '@/types';
import { nowISO } from '@/utils';
import * as db from '@/services/database';

interface NoteStore {
  notes: Note[];
  activeNoteId: string | null;
  isLoading: boolean;

  // Actions
  loadNotes: () => Promise<void>;
  setNotes: (notes: Note[]) => void;
  addNote: (params?: CreateNoteParams) => Note;
  updateNote: (id: string, params: UpdateNoteParams) => void;
  deleteNote: (id: string) => void;
  restoreNote: (id: string) => void;
  permanentDeleteNote: (id: string) => void;
  toggleComplete: (id: string) => void;
  setActiveNote: (id: string | null) => void;
  getNoteById: (id: string) => Note | undefined;
  getActiveNotes: () => Note[];
  getDeletedNotes: () => Note[];
  getCompletedNotes: () => Note[];
  getNotesByTag: (tagId: string) => Note[];
}

export const useNoteStore = create<NoteStore>()((set, get) => ({
  notes: [],
  activeNoteId: null,
  isLoading: false,

  loadNotes: async () => {
    set({ isLoading: true });
    try {
      const notes = await db.getAllNotes();
      set({ notes, isLoading: false });
    } catch (err) {
      console.error('Failed to load notes:', err);
      set({ isLoading: false });
    }
  },

  setNotes: (notes) => set({ notes }),

  addNote: (params) => {
    const now = nowISO();
    const note: Note = {
      id: nanoid(),
      title: params?.title ?? '',
      content: params?.content ?? '',
      plainText: '',
      color: params?.color ?? 'yellow',
      priority: 'medium',
      status: 'active',
      isPinned: false,
      isLocked: false,
      isCompleted: false,
      tags: params?.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({ notes: [note, ...state.notes] }));
    // 异步保存到数据库
    db.createNote(note).catch((err) => console.error('Failed to create note:', err));
    return note;
  },

  updateNote: (id, params) => {
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id
          ? { ...n, ...params, updatedAt: nowISO() }
          : n
      ),
    }));
    // 异步保存到数据库
    db.updateNote(id, params).catch((err) => console.error('Failed to update note:', err));
  },

  deleteNote: (id) => {
    const now = nowISO();
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id
          ? { ...n, status: 'deleted' as const, deletedAt: now, updatedAt: now }
          : n
      ),
    }));
    // 异步保存到数据库
    db.updateNote(id, { status: 'deleted', deletedAt: now }).catch((err) => console.error('Failed to delete note:', err));
  },

  restoreNote: (id) => {
    const now = nowISO();
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id
          ? { ...n, status: 'active' as const, deletedAt: undefined, updatedAt: now }
          : n
      ),
    }));
    // 异步保存到数据库
    db.updateNote(id, { status: 'active', deletedAt: undefined }).catch((err) => console.error('Failed to restore note:', err));
  },

  permanentDeleteNote: (id) => {
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
    }));
    // 异步从数据库删除
    db.deleteNote(id).catch((err) => console.error('Failed to permanently delete note:', err));
  },

  toggleComplete: (id) => {
    const now = nowISO();
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;

    const newCompleted = !note.isCompleted;
    const completedAt = newCompleted ? now : undefined;

    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id
          ? {
              ...n,
              isCompleted: newCompleted,
              completedAt,
              updatedAt: now,
            }
          : n
      ),
    }));
    // 异步保存到数据库
    db.updateNote(id, { isCompleted: newCompleted, completedAt }).catch((err) => console.error('Failed to toggle complete:', err));
  },

  setActiveNote: (id) => set({ activeNoteId: id }),

  getNoteById: (id) => get().notes.find((n) => n.id === id),

  getActiveNotes: () => get().notes.filter((n) => n.status === 'active'),

  getDeletedNotes: () => get().notes.filter((n) => n.status === 'deleted'),

  getCompletedNotes: () => get().notes.filter((n) => n.status === 'active' && n.isCompleted),

  getNotesByTag: (tagId) => get().notes.filter((n) => n.status === 'active' && n.tags.includes(tagId)),
}));
