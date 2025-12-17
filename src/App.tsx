import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Settings, Trash2, FolderOpen, MonitorUp, MoreHorizontal, ChevronDown, Check, Circle, Clock, Palette, CircleDot, CircleCheck, CircleX, CirclePause, CirclePlay, Star, Flag, AlertCircle, XCircle, CheckCircle, Timer, Hourglass, Zap, Target, Bookmark } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useNoteStore, useTagStore, useTodoStore, useSettingsStore } from '@/stores';
import { TodoList } from '@/components/todo';
import { Button } from '@/components/ui';
import type { Note, NoteColor, TodoStatus, TodoColor } from '@/types';
import { cn, formatRelativeTime } from '@/utils';

type ViewMode = 'all' | 'tag' | 'trash';

const TASK_COLORS = [
  'bg-rose-100',
  'bg-amber-100',
  'bg-lime-100',
  'bg-sky-100',
  'bg-violet-100',
];

// 图标映射
const ICON_MAP: Record<string, typeof Check> = {
  Circle, CircleDot, CircleCheck, CircleX, CirclePause, CirclePlay,
  Check, CheckCircle, Clock, Timer, Hourglass,
  Star, Flag, AlertCircle, XCircle, Zap, Target, Bookmark,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

const defaultTodoStatuses = [
  { id: 'pending', name: '待办', icon: 'Circle', color: 'text-muted-foreground' },
  { id: 'in_progress', name: '进行中', icon: 'Clock', color: 'text-amber-500' },
  { id: 'completed', name: '已完成', icon: 'Check', color: 'text-emerald-500' },
];

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openStatusPicker, setOpenStatusPicker] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteColor, setNewNoteColor] = useState<NoteColor>('yellow');
  const [newNoteTags, setNewNoteTags] = useState<string[]>([]);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [showAddTodoModal, setShowAddTodoModal] = useState<string | null>(null);
  const [newTodoContent, setNewTodoContent] = useState('');
  const [newTodoColor, setNewTodoColor] = useState<import('@/types').TodoColor>('none');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'projectColors' | 'todoColors' | 'todoStatuses' | 'general'>('projectColors');
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [editingTagColor, setEditingTagColor] = useState('#3b82f6');
  const [showAddTag, setShowAddTag] = useState(false);
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTodoValue, setEditingTodoValue] = useState('');

  const {
    loadNotes,
    addNote,
    updateNote,
    deleteNote,
    permanentDeleteNote,
    getActiveNotes,
    getDeletedNotes,
  } = useNoteStore();

  const { tags, selectedTagId, setSelectedTag, addTag, updateTag, deleteTag, loadTags } = useTagStore();

  const {
    todosByNote,
    loadTodosByNoteId,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodoStatus,
    getProgress,
  } = useTodoStore();

  const notes = useNoteStore((state) => state.notes);
  const { settings, updateSettings } = useSettingsStore();
  const defaultProjectColors = [
    { id: 'yellow', name: '黄色', bg: '#fefce8', border: '#fef08a' },
    { id: 'green', name: '绿色', bg: '#f0fdf4', border: '#bbf7d0' },
    { id: 'blue', name: '蓝色', bg: '#eff6ff', border: '#bfdbfe' },
    { id: 'pink', name: '粉色', bg: '#fdf2f8', border: '#fbcfe8' },
    { id: 'purple', name: '紫色', bg: '#faf5ff', border: '#e9d5ff' },
    { id: 'orange', name: '橙色', bg: '#fff7ed', border: '#fed7aa' },
  ];
  const defaultTodoColors = [
    { id: 'none', name: '无', bg: 'transparent', border: 'transparent' },
    { id: 'red', name: '红色', bg: '#fee2e2', border: '#fecaca' },
    { id: 'orange', name: '橙色', bg: '#ffedd5', border: '#fed7aa' },
    { id: 'yellow', name: '黄色', bg: '#fef9c3', border: '#fef08a' },
    { id: 'green', name: '绿色', bg: '#dcfce7', border: '#bbf7d0' },
    { id: 'blue', name: '蓝色', bg: '#dbeafe', border: '#bfdbfe' },
    { id: 'purple', name: '紫色', bg: '#f3e8ff', border: '#e9d5ff' },
    { id: 'pink', name: '粉色', bg: '#fce7f3', border: '#fbcfe8' },
  ];
  const projectColors = settings.projectColors?.length ? settings.projectColors : defaultProjectColors;
  const todoColorsConfig = settings.todoColors?.length ? settings.todoColors : defaultTodoColors;
  const todoStatuses = settings.todoStatuses?.length ? settings.todoStatuses : defaultTodoStatuses;

  useEffect(() => {
    loadNotes();
    loadTags();
  }, [loadNotes, loadTags]);

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
      setOpenStatusPicker(null);
      setShowColorPicker(null);
      setContextMenuId(null);
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

  const displayNotes = useMemo(() => {
    let result: Note[] = [];

    if (viewMode === 'trash') {
      result = notes.filter(n => n.status === 'deleted');
    } else if (viewMode === 'tag' && selectedTagId) {
      console.log('Filtering by tag:', selectedTagId);
      console.log('All notes:', notes.map(n => ({ id: n.id, title: n.title, tags: n.tags })));
      result = notes.filter(n => n.status === 'active' && n.tags.includes(selectedTagId));
      console.log('Filtered result:', result);
    } else {
      result = notes.filter(n => n.status === 'active');
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          (n.description && n.description.toLowerCase().includes(query))
      );
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

  const handleSaveNewNote = () => {
    if (newNoteTitle.trim()) {
      const newNote = addNote({ title: newNoteTitle.trim(), color: newNoteColor, tags: newNoteTags });
      console.log('Created note with tags:', newNote.tags);
      setShowCreateModal(false);
    }
  };

  const handleTitleDoubleClick = (note: Note) => {
    setEditingTitleId(note.id);
    setEditingTitleValue(note.title);
  };

  const handleTitleSave = (noteId: string) => {
    if (editingTitleValue.trim()) {
      updateNote(noteId, { title: editingTitleValue.trim() });
    }
    setEditingTitleId(null);
  };

  const handleAddTodoToNote = (noteId: string) => {
    if (newTodoContent.trim()) {
      addTodo({ noteId, content: newTodoContent.trim(), color: newTodoColor });
      setNewTodoContent('');
      setNewTodoColor('none');
      setShowAddTodoModal(null);
    }
  };

  const handleDeleteNote = (note: Note) => {
    if (viewMode === 'trash') {
      permanentDeleteNote(note.id);
    } else {
      deleteNote(note.id);
    }
    if (editingNote?.id === note.id) {
      setEditingNote(null);
    }
    setOpenMenuId(null);
  };

  const handleTogglePin = (note: Note) => {
    updateNote(note.id, { isPinned: !note.isPinned });
    setOpenMenuId(null);
  };

  const handlePopOut = async (note: Note) => {
    try {
      await invoke('create_note_window', {
        noteId: note.id,
        title: note.title || '便签',
        color: note.color,
      });
    } catch (err) {
      console.error('Failed to create note window:', err);
    }
  };

  const handleColorChange = (color: NoteColor) => {
    if (editingNote) {
      updateNote(editingNote.id, { color });
      setEditingNote({ ...editingNote, color });
    }
  };

  const handleAddTodo = async (content: string) => {
    if (editingNote) {
      await addTodo({ noteId: editingNote.id, content });
    }
  };

  const handleToggleTodoStatus = async (id: string) => {
    if (editingNote) {
      await toggleTodoStatus(id, editingNote.id);
    }
  };

  const handleSetTodoStatus = async (id: string, status: TodoStatus) => {
    if (editingNote) {
      await updateTodo(id, editingNote.id, { status });
    }
  };

  const handleDeleteTodo = async (id: string) => {
    if (editingNote) {
      await deleteTodo(id, editingNote.id);
    }
  };

  const handleUpdateTodo = async (id: string, content: string) => {
    if (editingNote) {
      await updateTodo(id, editingNote.id, { content });
    }
  };

  const handleUpdateTodoColor = async (id: string, color: import('@/types').TodoColor) => {
    if (editingNote) {
      await updateTodo(id, editingNote.id, { color });
    }
  };

  const toggleExpand = (noteId: string) => {
    setExpandedProjects((prev) => ({ ...prev, [noteId]: !prev[noteId] }));
  };

  const currentTodos = editingNote ? (todosByNote[editingNote.id] || []) : [];
  const currentProgress = editingNote ? getProgress(editingNote.id) : { total: 0, completed: 0, percent: 0 };

  return (
    <div className="flex h-screen bg-background">
      {/* 侧边栏 */}
      <aside className="w-60 border-r border-border flex flex-col bg-sidebar">
        <div className="p-5 pb-4">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">StickyNotes</h1>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <button
            onClick={() => {
              setViewMode('all');
              setSelectedTag(null);
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              viewMode === 'all' && !selectedTagId
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <FolderOpen className="w-4 h-4" />
            <span>全部项目</span>
            <span className="ml-auto text-xs text-muted-foreground">{getActiveNotes().length}</span>
          </button>

          {/* 标签列表 */}
          <div className="pt-4">
            <div className="flex items-center justify-between px-3 mb-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">标签</h3>
              <button
                onClick={() => { setShowAddTag(true); setEditingTagName(''); setEditingTagColor('#3b82f6'); }}
                className="text-xs text-primary hover:text-primary/80"
              >
                + 添加
              </button>
            </div>
            {showAddTag && (
              <div className="mx-2 mb-2 p-2 bg-accent rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <input type="color" value={editingTagColor} onChange={(e) => setEditingTagColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
                  <input type="text" value={editingTagName} onChange={(e) => setEditingTagName(e.target.value)} placeholder="标签名称" className="flex-1 px-2 py-1 text-sm bg-background rounded" autoFocus />
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowAddTag(false)} className="text-xs text-muted-foreground">取消</button>
                  <button onClick={() => { if (editingTagName.trim()) { addTag({ name: editingTagName.trim(), color: editingTagColor }); setShowAddTag(false); } }} className="text-xs text-primary">保存</button>
                </div>
              </div>
            )}
            {tags.map((tag) => (
              <div key={tag.id} className="group flex items-center">
                {editingTagId === tag.id ? (
                  <div className="flex-1 mx-2 p-2 bg-accent rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <input type="color" value={editingTagColor} onChange={(e) => setEditingTagColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
                      <input type="text" value={editingTagName} onChange={(e) => setEditingTagName(e.target.value)} className="flex-1 px-2 py-1 text-sm bg-background rounded" autoFocus />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => { deleteTag(tag.id); setEditingTagId(null); }} className="text-xs text-destructive mr-auto">删除</button>
                      <button onClick={() => setEditingTagId(null)} className="text-xs text-muted-foreground">取消</button>
                      <button onClick={() => { updateTag(tag.id, { name: editingTagName, color: editingTagColor }); setEditingTagId(null); }} className="text-xs text-primary">保存</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setViewMode('tag'); setSelectedTag(tag.id); }}
                    onDoubleClick={() => { setEditingTagId(tag.id); setEditingTagName(tag.name); setEditingTagColor(tag.color); }}
                    className={cn(
                      'flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      viewMode === 'tag' && selectedTagId === tag.id
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span>{tag.name}</span>
                    <span className="ml-auto text-xs">{notes.filter(n => n.status === 'active' && n.tags.includes(tag.id)).length}</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setViewMode('trash');
              setSelectedTag(null);
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              viewMode === 'trash'
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Trash2 className="w-4 h-4" />
            <span>回收站</span>
            <span className="ml-auto text-xs">{getDeletedNotes().length}</span>
          </button>
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>设置</span>
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 头部工具栏 */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-border">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="搜索项目..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 h-9 bg-secondary border-0 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button onClick={handleCreateNote} size="sm" className="h-9 px-4">
            <Plus className="w-4 h-4 mr-1.5" />
            新建项目
          </Button>
        </header>

        {/* 内容区域 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 项目卡片网格 */}
          <div className="flex-1 overflow-y-auto p-6">
            {displayNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <p>暂无项目</p>
                <p className="text-sm mt-1 opacity-70">点击右上角 + 创建新项目</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {displayNotes.map((note) => {
                  const todos = todosByNote[note.id] || [];
                  const completedCount = todos.filter((t) => t.status === 'completed').length;
                  const totalCount = todos.length;
                  const isExpanded = expandedProjects[note.id];
                  const displayTodos = isExpanded ? todos : todos.slice(0, 4);
                  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

                  return (
                    <div
                      key={note.id}
                      className="group bg-card border border-border rounded-xl hover:shadow-md transition-shadow flex flex-col"
                      style={{ backgroundColor: projectColors.find(c => c.id === note.color)?.bg || '#fefce8' }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenuId(note.id);
                        setContextMenuPos({ x: e.clientX, y: e.clientY });
                      }}
                    >
                      {/* 卡片头部 */}
                      <div className="p-4 pb-3">
                        <div className="flex items-start justify-between mb-2">
                          {editingTitleId === note.id ? (
                            <input
                              type="text"
                              value={editingTitleValue}
                              onChange={(e) => setEditingTitleValue(e.target.value)}
                              onBlur={() => handleTitleSave(note.id)}
                              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave(note.id)}
                              autoFocus
                              className="flex-1 bg-transparent font-semibold text-card-foreground border-b border-primary focus:outline-none"
                            />
                          ) : (
                            <h3
                              className="font-semibold text-card-foreground cursor-pointer"
                              onDoubleClick={() => handleTitleDoubleClick(note)}
                            >
                              {note.title || '未命名项目'}
                            </h3>
                          )}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePopOut(note);
                              }}
                              className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary hover:bg-accent transition-all"
                              title="发送到屏幕"
                            >
                              <MonitorUp className="w-4 h-4" />
                            </button>
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === note.id ? null : note.id);
                                }}
                                className="h-7 w-7 -mr-1.5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              {openMenuId === note.id && (
                                <div
                                  className="absolute right-0 top-full mt-1 py-1 bg-popover border border-border rounded-lg shadow-lg z-50 min-w-24"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => handleTogglePin(note)}
                                    className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent transition-colors"
                                  >
                                    {note.isPinned ? '取消置顶' : '置顶'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteNote(note)}
                                    className="w-full px-3 py-1.5 text-sm text-left text-destructive hover:bg-accent transition-colors"
                                  >
                                    删除
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {completedCount} / {totalCount} 已完成
                          </span>
                          {totalCount > 0 && (
                            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-300 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 任务列表 */}
                      <div className="px-2 pb-2 flex-1">
                        {totalCount === 0 ? (
                          <div className="py-6 text-center">
                            <p className="text-sm text-muted-foreground">暂无任务</p>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            {displayTodos.map((todo, index) => {
                              const statusConfig = todoStatuses.find(s => s.id === todo.status) || todoStatuses[0];
                              const StatusIcon = ICON_MAP[statusConfig.icon] || Circle;
                              const bgColor = TASK_COLORS[index % TASK_COLORS.length];

                              const todoColorConfig = todoColorsConfig.find(c => c.id === todo.color);
                              const hasTodoColor = todo.color && todo.color !== 'none' && todoColorConfig;

                              return (
                                <div
                                  key={todo.id}
                                  className={cn('group/task flex items-center gap-2.5 px-3 py-2 rounded-lg', !hasTodoColor && bgColor)}
                                  style={hasTodoColor ? { backgroundColor: todoColorConfig.bg } : undefined}
                                >
                                  <div className="relative">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenStatusPicker(openStatusPicker === todo.id ? null : todo.id);
                                      }}
                                      className={cn('flex-shrink-0 hover:opacity-70 transition-opacity', statusConfig.color)}
                                    >
                                      <StatusIcon className="w-4 h-4" />
                                    </button>

                                    {openStatusPicker === todo.id && (
                                      <div
                                        className="absolute left-0 top-full mt-1 p-1 bg-popover border border-border rounded-lg shadow-lg z-30 min-w-[120px]"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {todoStatuses.map((status) => {
                                          const Icon = ICON_MAP[status.icon] || Circle;
                                          const isActive = todo.status === status.id;
                                          return (
                                            <button
                                              key={status.id}
                                              onClick={() => {
                                                updateTodo(todo.id, note.id, { status: status.id as TodoStatus });
                                                setOpenStatusPicker(null);
                                              }}
                                              className={cn(
                                                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
                                                isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted text-foreground'
                                              )}
                                            >
                                              <span className={status.color}><Icon className="w-4 h-4" /></span>
                                              <span>{status.name}</span>
                                              {isActive && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  {editingTodoId === todo.id ? (
                                    <input
                                      type="text"
                                      value={editingTodoValue}
                                      onChange={(e) => setEditingTodoValue(e.target.value)}
                                      onBlur={() => {
                                        if (editingTodoValue.trim()) {
                                          updateTodo(todo.id, note.id, { content: editingTodoValue.trim() });
                                        }
                                        setEditingTodoId(null);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          if (editingTodoValue.trim()) {
                                            updateTodo(todo.id, note.id, { content: editingTodoValue.trim() });
                                          }
                                          setEditingTodoId(null);
                                        } else if (e.key === 'Escape') {
                                          setEditingTodoId(null);
                                        }
                                      }}
                                      autoFocus
                                      className="flex-1 bg-transparent text-sm border-b border-primary focus:outline-none"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <span
                                      className={cn(
                                        'flex-1 text-sm cursor-pointer',
                                        todo.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                                      )}
                                      onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        setEditingTodoId(todo.id);
                                        setEditingTodoValue(todo.content);
                                      }}
                                    >
                                      {todo.content || '未命名任务'}
                                    </span>
                                  )}

                                  {/* 颜色选择按钮 */}
                                  <div className="relative">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowColorPicker(showColorPicker === todo.id ? null : todo.id);
                                      }}
                                      className="p-1 rounded opacity-0 group-hover/task:opacity-100 hover:bg-black/10 transition-all text-muted-foreground"
                                      title="设置颜色"
                                    >
                                      <Palette className="w-3.5 h-3.5" />
                                    </button>
                                    {showColorPicker === todo.id && (
                                      <div
                                        className="absolute right-0 bottom-full mb-1 p-2 bg-popover border border-border rounded-lg shadow-lg z-50 flex flex-wrap gap-1.5 w-[140px]"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {todoColorsConfig.map((color) => (
                                          <button
                                            key={color.id}
                                            onClick={() => {
                                              updateTodo(todo.id, note.id, { color: color.id as TodoColor });
                                              setShowColorPicker(null);
                                            }}
                                            className={cn(
                                              'w-6 h-6 rounded-full border-2 transition-all',
                                              todo.color === color.id ? 'border-foreground scale-110' : 'border-transparent hover:scale-110'
                                            )}
                                            style={{ backgroundColor: color.id === 'none' ? '#e5e5e5' : color.bg }}
                                            title={color.name}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* 展开更多 */}
                        {totalCount > 4 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(note.id);
                            }}
                            className="w-full flex items-center justify-center gap-1 py-2 mt-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                          >
                            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isExpanded && 'rotate-180')} />
                            {isExpanded ? '收起' : `+${totalCount - 4} 更多`}
                          </button>
                        )}
                      </div>

                      {/* 时间戳 */}
                      <div className="px-4 py-3 border-t border-border bg-muted/30 rounded-b-xl">
                        <p className="text-xs text-muted-foreground">{formatRelativeTime(note.updatedAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 编辑面板 */}
          {editingNote && (
            <div className="w-[380px] border-l border-border flex flex-col bg-card">
              {/* 编辑器头部 */}
              <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
                <input
                  type="text"
                  placeholder="项目名称"
                  value={editingNote.title}
                  onChange={(e) => {
                    updateNote(editingNote.id, { title: e.target.value });
                    setEditingNote({ ...editingNote, title: e.target.value });
                  }}
                  className="flex-1 bg-transparent text-base font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  onClick={() => handlePopOut(editingNote)}
                  className="p-1.5 hover:bg-accent rounded-lg flex-shrink-0 text-primary transition-colors"
                  title="弹出到桌面"
                >
                  <MonitorUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingNote(null)}
                  className="p-1.5 hover:bg-accent rounded-lg flex-shrink-0 text-muted-foreground transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* 颜色选择 */}
              <div className="px-4 py-2.5 border-b border-border flex gap-2">
                {projectColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => handleColorChange(color.id as NoteColor)}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 transition-all',
                      editingNote.color === color.id ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: color.bg }}
                    title={color.name}
                  />
                ))}
              </div>

              {/* 任务列表 */}
              <div className="flex-1 overflow-hidden">
                <TodoList
                  todos={currentTodos}
                  progress={currentProgress}
                  onAddTodo={handleAddTodo}
                  onToggleStatus={handleToggleTodoStatus}
                  onSetStatus={handleSetTodoStatus}
                  onDeleteTodo={handleDeleteTodo}
                  onUpdateTodo={handleUpdateTodo}
                  onUpdateTodoColor={handleUpdateTodoColor}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 新建项目弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-card rounded-xl p-6 w-80 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">新建项目</h2>
            <input
              type="text"
              placeholder="项目名称"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveNewNote()}
              autoFocus
              className="w-full px-3 py-2 text-sm bg-secondary rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">选择颜色</p>
              <div className="flex gap-2 flex-wrap">
                {projectColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setNewNoteColor(color.id as NoteColor)}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 transition-all',
                      newNoteColor === color.id ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: color.bg }}
                  />
                ))}
              </div>
            </div>
            {tags.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">选择标签</p>
                <div className="flex gap-2 flex-wrap">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        setNewNoteTags(prev => {
                          const newTags = prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id];
                          console.log('Tag toggled:', tag.id, 'new tags:', newTags);
                          return newTags;
                        });
                      }}
                      className={cn(
                        'px-2 py-1 text-xs rounded-full border transition-all flex items-center gap-1',
                        newNoteTags.includes(tag.id) ? 'border-foreground bg-accent' : 'border-border hover:bg-accent/50'
                      )}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>取消</Button>
              <Button size="sm" onClick={handleSaveNewNote} disabled={!newNoteTitle.trim()}>保存</Button>
            </div>
          </div>
        </div>
      )}

      {/* 添加子任务弹窗 */}
      {showAddTodoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddTodoModal(null)}>
          <div className="bg-card rounded-xl p-6 w-80 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">添加子任务</h2>
            <input
              type="text"
              placeholder="任务内容"
              value={newTodoContent}
              onChange={(e) => setNewTodoContent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTodoToNote(showAddTodoModal)}
              autoFocus
              className="w-full px-3 py-2 text-sm bg-secondary rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">选择颜色</p>
              <div className="flex gap-2 flex-wrap">
                {todoColorsConfig.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setNewTodoColor(color.id as TodoColor)}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 transition-all',
                      newTodoColor === color.id ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: color.bg === 'transparent' ? 'var(--secondary)' : color.bg }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowAddTodoModal(null)}>取消</Button>
              <Button size="sm" onClick={() => handleAddTodoToNote(showAddTodoModal)} disabled={!newTodoContent.trim()}>添加</Button>
            </div>
          </div>
        </div>
      )}

      {/* 右键菜单 */}
      {contextMenuId && (
        <div
          className="fixed py-1 bg-popover border border-border rounded-lg shadow-lg z-50 min-w-28"
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setShowAddTodoModal(contextMenuId);
              setContextMenuId(null);
            }}
            className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent transition-colors"
          >
            添加子任务
          </button>
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(showColorPicker === contextMenuId ? null : contextMenuId)}
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent transition-colors"
            >
              更换颜色
            </button>
            {showColorPicker === contextMenuId && (
              <div className="absolute left-full top-0 ml-1 p-2 bg-popover border border-border rounded-lg shadow-lg flex gap-1.5 flex-wrap max-w-40">
                {projectColors.map((color) => {
                  const note = notes.find(n => n.id === contextMenuId);
                  return (
                    <button
                      key={color.id}
                      onClick={() => {
                        updateNote(contextMenuId, { color: color.id as NoteColor });
                        setShowColorPicker(null);
                        setContextMenuId(null);
                      }}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 transition-all',
                        note?.color === color.id ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                      )}
                      style={{ backgroundColor: color.bg }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 设置弹窗 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div className="bg-card rounded-xl shadow-xl w-[600px] h-[500px] flex overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* 侧边导航 */}
            <div className="w-36 bg-secondary/30 border-r border-border p-2">
              <h2 className="text-sm font-semibold px-3 py-2 text-muted-foreground">设置</h2>
              <button
                onClick={() => setSettingsTab('projectColors')}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                  settingsTab === 'projectColors' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                )}
              >
                项目颜色
              </button>
              <button
                onClick={() => setSettingsTab('todoColors')}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                  settingsTab === 'todoColors' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                )}
              >
                子任务颜色
              </button>
              <button
                onClick={() => setSettingsTab('todoStatuses')}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                  settingsTab === 'todoStatuses' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                )}
              >
                任务状态
              </button>
              <button
                onClick={() => setSettingsTab('general')}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                  settingsTab === 'general' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                )}
              >
                通用设置
              </button>
            </div>

            {/* 内容区 */}
            <div className="flex-1 p-4 overflow-y-auto">
              {settingsTab === 'projectColors' && (
                <div>
                  <h3 className="text-sm font-medium mb-3">项目颜色</h3>
                  <div className="space-y-2">
                    {projectColors.map((color) => (
                      <div key={color.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                        {editingColorId === color.id ? (
                          <>
                            <input type="color" value={color.bg} onChange={(e) => updateSettings({ projectColors: projectColors.map(c => c.id === color.id ? { ...c, bg: e.target.value } : c) })} className="w-8 h-8 rounded cursor-pointer" />
                            <input type="text" value={color.name} onChange={(e) => updateSettings({ projectColors: projectColors.map(c => c.id === color.id ? { ...c, name: e.target.value } : c) })} className="flex-1 px-2 py-1 text-sm bg-background rounded" />
                            <button onClick={() => setEditingColorId(null)} className="text-xs text-primary">完成</button>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 rounded" style={{ backgroundColor: color.bg }} />
                            <span className="flex-1 text-sm">{color.name}</span>
                            <button onClick={() => setEditingColorId(color.id)} className="text-xs text-muted-foreground hover:text-foreground">编辑</button>
                            <button onClick={() => updateSettings({ projectColors: projectColors.filter(c => c.id !== color.id) })} className="text-xs text-destructive">删除</button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { const c = { id: `p-${Date.now()}`, name: '新颜色', bg: '#e0e0e0', border: '#c0c0c0' }; updateSettings({ projectColors: [...projectColors, c] }); setEditingColorId(c.id); }} className="mt-3 w-full py-2 text-sm text-primary border border-dashed border-primary/50 rounded-lg hover:bg-primary/5">+ 添加颜色</button>
                </div>
              )}

              {settingsTab === 'todoColors' && (
                <div>
                  <h3 className="text-sm font-medium mb-3">子任务颜色</h3>
                  <div className="space-y-2">
                    {todoColorsConfig.map((color) => (
                      <div key={color.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                        {editingColorId === color.id ? (
                          <>
                            <input type="color" value={color.bg === 'transparent' ? '#ffffff' : color.bg} onChange={(e) => updateSettings({ todoColors: todoColorsConfig.map(c => c.id === color.id ? { ...c, bg: e.target.value } : c) })} className="w-8 h-8 rounded cursor-pointer" />
                            <input type="text" value={color.name} onChange={(e) => updateSettings({ todoColors: todoColorsConfig.map(c => c.id === color.id ? { ...c, name: e.target.value } : c) })} className="flex-1 px-2 py-1 text-sm bg-background rounded" />
                            <button onClick={() => setEditingColorId(null)} className="text-xs text-primary">完成</button>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 rounded border" style={{ backgroundColor: color.bg === 'transparent' ? 'var(--secondary)' : color.bg }} />
                            <span className="flex-1 text-sm">{color.name}</span>
                            <button onClick={() => setEditingColorId(color.id)} className="text-xs text-muted-foreground hover:text-foreground">编辑</button>
                            {color.id !== 'none' && <button onClick={() => updateSettings({ todoColors: todoColorsConfig.filter(c => c.id !== color.id) })} className="text-xs text-destructive">删除</button>}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { const c = { id: `t-${Date.now()}`, name: '新颜色', bg: '#e0e0e0', border: '#c0c0c0' }; updateSettings({ todoColors: [...todoColorsConfig, c] }); setEditingColorId(c.id); }} className="mt-3 w-full py-2 text-sm text-primary border border-dashed border-primary/50 rounded-lg hover:bg-primary/5">+ 添加颜色</button>
                </div>
              )}

              {settingsTab === 'todoStatuses' && (
                <div>
                  <h3 className="text-sm font-medium mb-3">任务状态</h3>
                  <div className="space-y-2">
                    {todoStatuses.map((status) => {
                      const Icon = ICON_MAP[status.icon] || Circle;
                      return (
                        <div key={status.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                          {editingStatusId === status.id ? (
                            <div className="flex flex-col gap-2 w-full">
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const picker = document.getElementById(`icon-picker-${status.id}`);
                                      if (picker) picker.classList.toggle('hidden');
                                    }}
                                    className="p-2 rounded bg-background hover:bg-accent"
                                    title="选择图标"
                                  >
                                    <Icon className={cn('w-5 h-5', status.color)} />
                                  </button>
                                  <div id={`icon-picker-${status.id}`} className="hidden absolute left-0 top-full mt-1 p-2 bg-popover border border-border rounded-lg shadow-lg z-50 w-[200px]">
                                    <p className="text-xs text-muted-foreground mb-2">选择图标</p>
                                    <div className="flex gap-1 flex-wrap">
                                      {ICON_OPTIONS.map((iconName) => {
                                        const IconComp = ICON_MAP[iconName];
                                        return (
                                          <button
                                            key={iconName}
                                            onClick={() => {
                                              updateSettings({ todoStatuses: todoStatuses.map(s => s.id === status.id ? { ...s, icon: iconName } : s) });
                                              document.getElementById(`icon-picker-${status.id}`)?.classList.add('hidden');
                                            }}
                                            className={cn(
                                              'p-1.5 rounded',
                                              status.icon === iconName ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                                            )}
                                            title={iconName}
                                          >
                                            <IconComp className="w-4 h-4" />
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                                <input type="text" value={status.name} onChange={(e) => updateSettings({ todoStatuses: todoStatuses.map(s => s.id === status.id ? { ...s, name: e.target.value } : s) })} className="flex-1 px-2 py-1 text-sm bg-background rounded" placeholder="状态名称" />
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const picker = document.getElementById(`color-picker-${status.id}`);
                                      if (picker) picker.classList.toggle('hidden');
                                    }}
                                    className={cn('w-6 h-6 rounded-full border-2 border-border', status.color.replace('text-', 'bg-'))}
                                    title="选择颜色"
                                  />
                                  <div id={`color-picker-${status.id}`} className="hidden absolute right-0 top-full mt-1 p-2 bg-popover border border-border rounded-lg shadow-lg z-50">
                                    <p className="text-xs text-muted-foreground mb-2">选择颜色</p>
                                    <div className="flex gap-1.5">
                                      {[
                                        { value: 'text-muted-foreground', bg: 'bg-muted-foreground' },
                                        { value: 'text-amber-500', bg: 'bg-amber-500' },
                                        { value: 'text-emerald-500', bg: 'bg-emerald-500' },
                                        { value: 'text-blue-500', bg: 'bg-blue-500' },
                                        { value: 'text-rose-500', bg: 'bg-rose-500' },
                                        { value: 'text-purple-500', bg: 'bg-purple-500' },
                                        { value: 'text-orange-500', bg: 'bg-orange-500' },
                                        { value: 'text-cyan-500', bg: 'bg-cyan-500' },
                                      ].map((c) => (
                                        <button
                                          key={c.value}
                                          onClick={() => {
                                            updateSettings({ todoStatuses: todoStatuses.map(s => s.id === status.id ? { ...s, color: c.value } : s) });
                                            document.getElementById(`color-picker-${status.id}`)?.classList.add('hidden');
                                          }}
                                          className={cn(
                                            'w-6 h-6 rounded-full',
                                            c.bg,
                                            status.color === c.value ? 'ring-2 ring-offset-2 ring-primary' : ''
                                          )}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <button onClick={() => setEditingStatusId(null)} className="text-xs text-primary">完成</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Icon className={cn('w-5 h-5', status.color)} />
                              <span className="flex-1 text-sm">{status.name}</span>
                              <button onClick={() => setEditingStatusId(status.id)} className="text-xs text-muted-foreground hover:text-foreground">编辑</button>
                              {todoStatuses.length > 1 && <button onClick={() => updateSettings({ todoStatuses: todoStatuses.filter(s => s.id !== status.id) })} className="text-xs text-destructive">删除</button>}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={() => { const s = { id: `s-${Date.now()}`, name: '新状态', icon: 'Circle', color: 'text-muted-foreground' }; updateSettings({ todoStatuses: [...todoStatuses, s] }); setEditingStatusId(s.id); }} className="mt-3 w-full py-2 text-sm text-primary border border-dashed border-primary/50 rounded-lg hover:bg-primary/5">+ 添加状态</button>
                </div>
              )}

              {settingsTab === 'general' && (
                <div>
                  <h3 className="text-sm font-medium mb-3">通用设置</h3>
                  <p className="text-sm text-muted-foreground">更多设置功能开发中...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
