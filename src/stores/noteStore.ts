import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { invoke } from '@tauri-apps/api/core';
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
  setActiveNote: (id: string | null) => void;
  getNoteById: (id: string) => Note | undefined;
  getActiveNotes: () => Note[];
  getDeletedNotes: () => Note[];
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
      description: params?.description ?? '',
      color: params?.color ?? 'yellow',
      priority: 'medium',
      status: 'active',
      isPinned: false,
      isLocked: false,
      tags: params?.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({ notes: [note, ...state.notes] }));
    db.createNote(note).catch((err) => console.error('Failed to create note:', err));
    return note;
  },

  updateNote: (id, params) => {
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, ...params, updatedAt: nowISO() } : n
      ),
    }));
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
    db.updateNote(id, { status: 'deleted', deletedAt: now }).catch((err) =>
      console.error('Failed to delete note:', err)
    );
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
    db.updateNote(id, { status: 'active', deletedAt: undefined }).catch((err) =>
      console.error('Failed to restore note:', err)
    );
  },

  permanentDeleteNote: async (id) => {
    // 清理窗口状态
    await db.deleteWindowState(id).catch((err) => console.error('Failed to delete window state:', err));

    // 如果窗口打开，关闭它
    try {
      await invoke('close_note_window', { noteId: id });
    } catch {
      // 窗口可能未打开，忽略错误
    }

    // 删除便签
    await db.deleteNote(id).catch((err) => console.error('Failed to permanently delete note:', err));

    // 更新状态
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
    }));
  },

  setActiveNote: (id) => set({ activeNoteId: id }),

  getNoteById: (id) => get().notes.find((n) => n.id === id),

  getActiveNotes: () => get().notes.filter((n) => n.status === 'active'),

  getDeletedNotes: () => get().notes.filter((n) => n.status === 'deleted'),

  getNotesByTag: (tagId) =>
    get().notes.filter((n) => n.status === 'active' && n.tags.includes(tagId)),
}));
