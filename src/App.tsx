import { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, emit } from '@tauri-apps/api/event';
import { useNoteStore, useTagStore, useTodoStore, useSettingsStore } from '@/stores';
import { ToastContainer } from '@/components/ui/Toast';
import { Sidebar, Header } from '@/components/layout';
import { EditPanel, ProjectCard } from '@/components/note';
import { CreateNoteModal, SettingsModal, ConfirmModal } from '@/components/modal';
import { DEFAULT_PROJECT_COLORS } from '@/constants';
import type { Note, NoteColor } from '@/types';
import { cn } from '@/utils';
import { getAllWindowStates, deleteWindowState } from '@/services/database';
import { createOrRestoreWindow } from '@/services/windowManager';

type ViewMode = 'all' | 'tag' | 'trash';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteColor, setNewNoteColor] = useState<NoteColor>('yellow');
  const [newNoteTags, setNewNoteTags] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTodoValue, setEditingTodoValue] = useState('');
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Note | null>(null);
  const [autoPopOut, setAutoPopOut] = useState(false);

  const { loadNotes, addNote, updateNote, deleteNote, permanentDeleteNote } = useNoteStore();
  const notes = useNoteStore((state) => state.notes);
  const { selectedTagId, loadTags } = useTagStore();
  const { todosByNote, loadTodosByNoteId, addTodo, updateTodo, deleteTodo, toggleTodoStatus, getProgress } = useTodoStore();
  const { settings } = useSettingsStore();

  const projectColors = settings.projectColors?.length ? settings.projectColors : DEFAULT_PROJECT_COLORS;

  useEffect(() => {
    loadNotes();
    loadTags();
    // 初始化关闭到托盘设置
    invoke('set_close_to_tray', { enabled: settings.closeToTray }).catch(console.error);
  }, [loadNotes, loadTags]);

  // 应用启动时恢复窗口
  useEffect(() => {
    const restoreWindows = async () => {
      try {
        // 获取所有保存的窗口状态
        const windowStates = await getAllWindowStates();

        // 验证便签是否存在并恢复窗口
        for (const state of windowStates) {
          const note = notes.find(n => n.id === state.noteId);

          if (note && note.status === 'active') {
            // 恢复窗口
            await createOrRestoreWindow(state.noteId, note.title, note.color);
          } else {
            // 便签已删除，清理窗口状态
            await deleteWindowState(state.noteId);
          }
        }
      } catch (err) {
        console.error('Failed to restore windows:', err);
      }
    };

    // 在数据加载完成后恢复窗口
    if (notes.length > 0) {
      restoreWindows();
    }
  }, [notes]);

  // 应用主题
  useEffect(() => {
    const applyTheme = (theme: 'light' | 'dark') => {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    };
    if (settings.theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(media.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
      media.addEventListener('change', handler);
      return () => media.removeEventListener('change', handler);
    } else {
      applyTheme(settings.theme);
    }
  }, [settings.theme]);

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenuId(null);
      setShowColorPicker(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    notes.forEach((note) => {
      if (!todosByNote[note.id]) {
        loadTodosByNoteId(note.id);
      }
    });
  }, [notes, todosByNote, loadTodosByNoteId]);

  // 监听桌面卡片的 todo 变更事件
  useEffect(() => {
    const unlisten = listen<{ noteId: string }>('todo-changed', (event) => {
      loadTodosByNoteId(event.payload.noteId);
    });
    return () => { unlisten.then(fn => fn()); };
  }, [loadTodosByNoteId]);

  // 监听桌面卡片的便签更新事件（标题、颜色等）
  useEffect(() => {
    const unlisten = listen('note-updated', () => {
      loadNotes();
    });
    return () => { unlisten.then(fn => fn()); };
  }, [loadNotes]);

  // 监听托盘新建项目事件
  useEffect(() => {
    const unlisten = listen('tray-new-project', () => {
      setAutoPopOut(true);
      setNewNoteTitle('');
      setNewNoteColor('yellow');
      setNewNoteTags([]);
      setShowCreateModal(true);
    });
    return () => { unlisten.then(fn => fn()); };
  }, []);

  const displayNotes = useMemo(() => {
    let result: Note[] = [];
    if (viewMode === 'trash') {
      result = notes.filter(n => n.status === 'deleted');
    } else if (viewMode === 'tag' && selectedTagId) {
      result = notes.filter(n => n.status === 'active' && n.tags.includes(selectedTagId));
    } else {
      result = notes.filter(n => n.status === 'active');
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(n => n.title.toLowerCase().includes(query) || n.description?.toLowerCase().includes(query));
    }

    return result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, viewMode, selectedTagId, searchQuery]);

  const handleCreateNote = () => {
    setNewNoteTitle('');
    setNewNoteColor('yellow');
    setNewNoteTags(viewMode === 'tag' && selectedTagId ? [selectedTagId] : []);
    setShowCreateModal(true);
  };

  const handleSaveNewNote = async () => {
    if (newNoteTitle.trim()) {
      const newNote = addNote({ title: newNoteTitle.trim(), color: newNoteColor, tags: newNoteTags });
      setShowCreateModal(false);
      if (autoPopOut) {
        await handlePopOut(newNote);
        setAutoPopOut(false);
      }
    }
  };

  const handleDeleteNote = (note: Note) => {
    setDeleteConfirm(note);
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    if (viewMode === 'trash') {
      permanentDeleteNote(deleteConfirm.id);
    } else {
      deleteNote(deleteConfirm.id);
    }
    if (editingNote?.id === deleteConfirm.id) setEditingNote(null);
    setDeleteConfirm(null);
  };

  const handlePopOut = async (note: Note) => {
    try {
      await createOrRestoreWindow(note.id, note.title || '便签', note.color);
    } catch (err) {
      console.error('Failed to create note window:', err);
    }
  };

  const currentTodos = editingNote ? (todosByNote[editingNote.id] || []) : [];
  const currentProgress = editingNote ? getProgress(editingNote.id) : { total: 0, completed: 0, percent: 0 };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateNote={handleCreateNote}
        />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {displayNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <p>暂无项目</p>
                <p className="text-sm mt-1 opacity-70">点击右上角 + 创建新项目</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {displayNotes.map((note) => (
                  <ProjectCard
                    key={note.id}
                    note={note}
                    todos={todosByNote[note.id] || []}
                    isExpanded={expandedProjects[note.id] || false}
                    editingTodoId={editingTodoId}
                    editingTodoValue={editingTodoValue}
                    onToggleExpand={() => setExpandedProjects(prev => ({ ...prev, [note.id]: !prev[note.id] }))}
                    onPopOut={() => handlePopOut(note)}
                    onTogglePin={async () => { updateNote(note.id, { isPinned: !note.isPinned }); await emit('note-updated', { noteId: note.id }); }}
                    onDelete={() => handleDeleteNote(note)}
                    onUpdateTitle={async (title) => { updateNote(note.id, { title }); await emit('note-updated', { noteId: note.id }); }}
                    onUpdateTodoStatus={async (todoId, status) => { updateTodo(todoId, note.id, { status }); await emit('todo-changed', { noteId: note.id }); }}
                    onUpdateTodoContent={async (todoId, content) => { updateTodo(todoId, note.id, { content }); await emit('todo-changed', { noteId: note.id }); }}
                    onUpdateTodoColor={async (todoId, color) => { updateTodo(todoId, note.id, { color }); await emit('todo-changed', { noteId: note.id }); }}
                    onDeleteTodo={async (todoId) => { deleteTodo(todoId, note.id); await emit('todo-changed', { noteId: note.id }); }}
                    onContextMenu={(e) => { e.preventDefault(); setContextMenuId(note.id); setContextMenuPos({ x: e.clientX, y: e.clientY }); }}
                    onEditTodo={(todoId, content) => { setEditingTodoId(todoId); setEditingTodoValue(content); }}
                    onCancelEditTodo={() => setEditingTodoId(null)}
                  />
                ))}
              </div>
            )}
          </div>

          {editingNote && (
            <EditPanel
              note={editingNote}
              todos={currentTodos}
              progress={currentProgress}
              onClose={() => setEditingNote(null)}
              onUpdateNote={async (id, updates) => { updateNote(id, updates); setEditingNote({ ...editingNote, ...updates }); await emit('note-updated', { noteId: id }); }}
              onPopOut={handlePopOut}
              onAddTodo={async (content) => { addTodo({ noteId: editingNote.id, content }); await emit('todo-changed', { noteId: editingNote.id }); }}
              onToggleStatus={async (id) => { toggleTodoStatus(id, editingNote.id); await emit('todo-changed', { noteId: editingNote.id }); }}
              onSetStatus={async (id, status) => { updateTodo(id, editingNote.id, { status }); await emit('todo-changed', { noteId: editingNote.id }); }}
              onDeleteTodo={async (id) => { deleteTodo(id, editingNote.id); await emit('todo-changed', { noteId: editingNote.id }); }}
              onUpdateTodo={async (id, content) => { updateTodo(id, editingNote.id, { content }); await emit('todo-changed', { noteId: editingNote.id }); }}
              onUpdateTodoColor={async (id, color) => { updateTodo(id, editingNote.id, { color }); await emit('todo-changed', { noteId: editingNote.id }); }}
            />
          )}
        </div>
      </main>

      {showCreateModal && (
        <CreateNoteModal
          title={newNoteTitle}
          color={newNoteColor}
          selectedTags={newNoteTags}
          onTitleChange={setNewNoteTitle}
          onColorChange={setNewNoteColor}
          onTagsChange={setNewNoteTags}
          onSave={handleSaveNewNote}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {deleteConfirm && (
        <ConfirmModal
          title={viewMode === 'trash' ? '永久删除' : '删除项目'}
          message={viewMode === 'trash' ? `确定要永久删除「${deleteConfirm.title || '未命名项目'}」吗？此操作不可恢复。` : `确定要删除「${deleteConfirm.title || '未命名项目'}」吗？删除后可在回收站恢复。`}
          confirmText="删除"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
          danger
        />
      )}

      {contextMenuId && (
        <div
          className="fixed py-1 bg-popover border border-border rounded-lg shadow-lg z-50 min-w-28"
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={async () => {
              const newTodo = await addTodo({ noteId: contextMenuId, content: '' });
              setEditingTodoId(newTodo.id);
              setEditingTodoValue('');
              await emit('todo-changed', { noteId: contextMenuId });
              setContextMenuId(null);
            }}
            className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent transition-colors"
          >
            添加子任务
          </button>
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent transition-colors"
            >
              更换颜色
            </button>
            {showColorPicker && (
              <div className="absolute left-full top-0 ml-1 p-2 bg-popover border border-border rounded-lg shadow-lg flex gap-1.5 flex-wrap max-w-40">
                {projectColors.map((color) => {
                  const note = notes.find(n => n.id === contextMenuId);
                  return (
                    <button
                      key={color.id}
                      onClick={async () => { updateNote(contextMenuId, { color: color.id as NoteColor }); await emit('note-updated', { noteId: contextMenuId }); setShowColorPicker(false); setContextMenuId(null); }}
                      className={cn('w-6 h-6 rounded-full border-2 transition-all', note?.color === color.id ? 'border-foreground scale-110' : 'border-transparent hover:scale-105')}
                      style={{ backgroundColor: color.bg }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}
