import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { TodoItem, CreateTodoParams, UpdateTodoParams, TodoStatus } from '@/types';
import { nowISO } from '@/utils';
import * as db from '@/services/database';

interface TodoStore {
  // 按 noteId 分组的 todos
  todosByNote: Record<string, TodoItem[]>;
  isLoading: boolean;

  // Actions
  loadTodosByNoteId: (noteId: string) => Promise<void>;
  addTodo: (params: CreateTodoParams) => TodoItem;
  updateTodo: (id: string, noteId: string, params: UpdateTodoParams) => void;
  deleteTodo: (id: string, noteId: string) => void;
  toggleTodoStatus: (id: string, noteId: string) => void;
  reorderTodos: (noteId: string, todoIds: string[]) => void;

  // Getters
  getTodosByNoteId: (noteId: string) => TodoItem[];
  getProgress: (noteId: string) => { total: number; completed: number; percent: number };
}

export const useTodoStore = create<TodoStore>()((set, get) => ({
  todosByNote: {},
  isLoading: false,

  loadTodosByNoteId: async (noteId) => {
    set({ isLoading: true });
    try {
      const todos = await db.getTodosByNoteId(noteId);
      set((state) => ({
        todosByNote: { ...state.todosByNote, [noteId]: todos },
        isLoading: false,
      }));
    } catch (err) {
      console.error('Failed to load todos:', err);
      set({ isLoading: false });
    }
  },

  addTodo: (params) => {
    const now = nowISO();
    const existingTodos = get().todosByNote[params.noteId] || [];
    const maxOrder =
      existingTodos.length > 0
        ? Math.max(...existingTodos.map((t) => t.order)) + 1
        : 0;

    const todo: TodoItem = {
      id: nanoid(),
      noteId: params.noteId,
      content: params.content,
      status: 'pending',
      color: params.color ?? 'none',
      order: params.order ?? maxOrder,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      todosByNote: {
        ...state.todosByNote,
        [params.noteId]: [...(state.todosByNote[params.noteId] || []), todo],
      },
    }));

    db.createTodoItem(todo).catch((err) =>
      console.error('Failed to create todo:', err)
    );
    return todo;
  },

  updateTodo: (id, noteId, params) => {
    const now = nowISO();
    set((state) => ({
      todosByNote: {
        ...state.todosByNote,
        [noteId]: (state.todosByNote[noteId] || []).map((t) =>
          t.id === id ? { ...t, ...params, updatedAt: now } : t
        ),
      },
    }));
    db.updateTodoItem(id, params).catch((err) =>
      console.error('Failed to update todo:', err)
    );
  },

  deleteTodo: (id, noteId) => {
    set((state) => ({
      todosByNote: {
        ...state.todosByNote,
        [noteId]: (state.todosByNote[noteId] || []).filter((t) => t.id !== id),
      },
    }));
    db.deleteTodoItem(id).catch((err) =>
      console.error('Failed to delete todo:', err)
    );
  },

  toggleTodoStatus: (id, noteId) => {
    const now = nowISO();
    const todos = get().todosByNote[noteId] || [];
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    // pending -> in_progress -> completed -> pending
    const statusCycle: Record<TodoStatus, TodoStatus> = {
      pending: 'in_progress',
      in_progress: 'completed',
      completed: 'pending',
    };
    const newStatus = statusCycle[todo.status];
    const completedAt = newStatus === 'completed' ? now : undefined;

    set((state) => ({
      todosByNote: {
        ...state.todosByNote,
        [noteId]: (state.todosByNote[noteId] || []).map((t) =>
          t.id === id
            ? { ...t, status: newStatus, completedAt, updatedAt: now }
            : t
        ),
      },
    }));

    db.updateTodoItem(id, { status: newStatus, completedAt }).catch((err) =>
      console.error('Failed to toggle todo status:', err)
    );
  },

  reorderTodos: (noteId, todoIds) => {
    const todos = get().todosByNote[noteId] || [];
    const reordered = todoIds
      .map((id, index) => {
        const todo = todos.find((t) => t.id === id);
        return todo ? { ...todo, order: index } : null;
      })
      .filter(Boolean) as TodoItem[];

    set((state) => ({
      todosByNote: { ...state.todosByNote, [noteId]: reordered },
    }));
    db.reorderTodoItems(noteId, todoIds).catch((err) =>
      console.error('Failed to reorder:', err)
    );
  },

  getTodosByNoteId: (noteId) => {
    return (get().todosByNote[noteId] || []).sort((a, b) => a.order - b.order);
  },

  getProgress: (noteId) => {
    const todos = get().todosByNote[noteId] || [];
    const total = todos.length;
    const completed = todos.filter((t) => t.status === 'completed').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  },
}));
