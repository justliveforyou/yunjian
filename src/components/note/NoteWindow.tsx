import { useState, useEffect } from 'react';
import { X, GripVertical, Pin, PinOff, Palette, Circle, Plus, Droplet } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { emit } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useSettingsStore } from '@/stores';
import { useTodoStore } from '@/stores/todoStore';
import { ICON_MAP, TASK_COLORS, DEFAULT_PROJECT_COLORS, DEFAULT_TODO_COLORS, DEFAULT_TODO_STATUSES } from '@/constants';
import { ConfirmModal } from '@/components/modal';
import { cn } from '@/utils';
import { getNoteById as getNoteFromDb, updateNote as updateNoteInDb, getTodosByNoteId } from '@/services/database';
import type { Note, NoteColor, TodoItem, TodoStatus, TodoColor } from '@/types';

interface NoteWindowProps {
  noteId: string;
}

export function NoteWindow({ noteId }: NoteWindowProps) {
  const [note, setNote] = useState<Note | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [openStatusPicker, setOpenStatusPicker] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [colorPickerPos, setColorPickerPos] = useState({ x: 0, y: 0 });
  const [statusPickerPos, setStatusPickerPos] = useState({ x: 0, y: 0 });
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTodoValue, setEditingTodoValue] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [deleteTodoConfirm, setDeleteTodoConfirm] = useState<string | null>(null);
  const [showNoteColorPicker, setShowNoteColorPicker] = useState(false);
  const [showOpacityPicker, setShowOpacityPicker] = useState(false);
  const [opacity, setOpacity] = useState(1);

  const { addTodo, updateTodo, deleteTodo } = useTodoStore();
  const { settings } = useSettingsStore();

  const projectColors = settings.projectColors?.length ? settings.projectColors : DEFAULT_PROJECT_COLORS;
  const todoColorsConfig = settings.todoColors?.length ? settings.todoColors : DEFAULT_TODO_COLORS;
  const todoStatuses = settings.todoStatuses?.length ? settings.todoStatuses : DEFAULT_TODO_STATUSES;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [foundNote, foundTodos] = await Promise.all([
          getNoteFromDb(noteId),
          getTodosByNoteId(noteId),
        ]);
        if (foundNote) setNote(foundNote);
        setTodos(foundTodos);
      } catch (err) {
        console.error('Failed to load note:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [noteId]);

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenStatusPicker(null);
      setShowColorPicker(null);
      setShowNoteColorPicker(false);
      setShowOpacityPicker(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleClose = async () => {
    try {
      await invoke('close_note_window', { noteId });
    } catch {
      const window = getCurrentWindow();
      await window.close();
    }
  };

  const handleToggleAlwaysOnTop = async () => {
    const newValue = !isAlwaysOnTop;
    setIsAlwaysOnTop(newValue);
    try {
      await invoke('set_window_always_on_top', { noteId, alwaysOnTop: newValue });
    } catch {
      const window = getCurrentWindow();
      await window.setAlwaysOnTop(newValue);
    }
  };

  const handleTitleChange = async (title: string) => {
    if (note) {
      setNote({ ...note, title });
      await updateNoteInDb(note.id, { title });
      await emit('note-updated', { noteId });
    }
  };

  const handleUpdateNoteColor = async (color: NoteColor) => {
    if (note) {
      setNote({ ...note, color });
      await updateNoteInDb(note.id, { color });
      await emit('note-updated', { noteId });
      setShowNoteColorPicker(false);
    }
  };

  const handleOpacityChange = (value: number) => {
    setOpacity(value);
  };

  const handleAddTodo = async () => {
    const newTodo = await addTodo({ noteId, content: '' });
    setTodos(prev => [...prev, newTodo]);
    setEditingTodoId(newTodo.id);
    setEditingTodoValue('');
    await emit('todo-changed', { noteId });
  };

  const handleUpdateTodoStatus = async (todoId: string, status: TodoStatus) => {
    await updateTodo(todoId, noteId, { status });
    setTodos(prev => prev.map(t => t.id === todoId ? { ...t, status } : t));
    setOpenStatusPicker(null);
    await emit('todo-changed', { noteId });
  };

  const handleUpdateTodoContent = async (todoId: string, content: string) => {
    await updateTodo(todoId, noteId, { content });
    setTodos(prev => prev.map(t => t.id === todoId ? { ...t, content } : t));
    await emit('todo-changed', { noteId });
  };

  const handleUpdateTodoColor = async (todoId: string, color: TodoColor) => {
    await updateTodo(todoId, noteId, { color });
    setTodos(prev => prev.map(t => t.id === todoId ? { ...t, color } : t));
    setShowColorPicker(null);
    await emit('todo-changed', { noteId });
  };

  const handleDeleteTodo = async (todoId: string) => {
    await deleteTodo(todoId, noteId);
    setTodos(prev => prev.filter(t => t.id !== todoId));
    await emit('todo-changed', { noteId });
  };

  const handleDragStart = async (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    setIsDragging(true);
    const window = getCurrentWindow();
    await window.startDragging();
    setIsDragging(false);
  };

  const completedCount = todos.filter(t => t.status === 'completed').length;
  const totalCount = todos.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const bgColor = note ? projectColors.find(c => c.id === note.color)?.bg || '#fefce8' : '#fefce8';

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-card rounded-2xl">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="h-screen flex flex-col bg-card rounded-2xl">
        <div className="flex justify-end p-2">
          <button onClick={handleClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">便签不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-transparent overflow-visible">
      <div
        className={cn('h-full flex flex-col rounded-2xl transition-all duration-200 overflow-hidden', isDragging && 'scale-[1.02]')}
        style={{ backgroundColor: bgColor, opacity }}
      >
        {/* 头部 */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-border/30 cursor-grab"
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            {editingTitle ? (
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={() => { if (titleValue.trim()) handleTitleChange(titleValue.trim()); setEditingTitle(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { if (titleValue.trim()) handleTitleChange(titleValue.trim()); setEditingTitle(false); } else if (e.key === 'Escape') setEditingTitle(false); }}
                autoFocus
                className="bg-transparent font-semibold text-foreground focus:outline-none flex-1 min-w-0 border-b border-primary"
              />
            ) : (
              <span
                className="font-semibold text-foreground cursor-pointer flex-1 min-w-0 truncate"
                onDoubleClick={() => { setEditingTitle(true); setTitleValue(note.title); }}
              >
                {note.title || '未命名项目'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 进度条 */}
        <div className="px-4 py-2 border-b border-border/30">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{completedCount} / {totalCount} 已完成</span>
            {totalCount > 0 && (
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* 任务列表 */}
        <div className="flex-1 overflow-y-scroll px-2 py-2 scrollbar-visible">
          {totalCount === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">暂无任务</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {todos.map((todo, index) => {
                const statusConfig = todoStatuses.find(s => s.id === todo.status) || todoStatuses[0];
                const StatusIcon = ICON_MAP[statusConfig.icon] || Circle;
                const taskBgColor = TASK_COLORS[index % TASK_COLORS.length];
                const todoColorConfig = todoColorsConfig.find(c => c.id === todo.color);
                const hasTodoColor = todo.color && todo.color !== 'none' && todoColorConfig;

                return (
                  <div
                    key={todo.id}
                    className={cn('group/task flex items-center gap-2.5 px-3 py-2 rounded-lg', !hasTodoColor && taskBgColor)}
                    style={hasTodoColor ? { backgroundColor: todoColorConfig.bg } : undefined}
                  >
                    {/* 状态图标 */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (openStatusPicker === todo.id) {
                            setOpenStatusPicker(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const windowHeight = window.innerHeight;
                            const spaceBelow = windowHeight - rect.bottom;
                            const y = spaceBelow < 150 ? rect.top - 120 : rect.bottom + 4;
                            setStatusPickerPos({ x: rect.left, y });
                            setOpenStatusPicker(todo.id);
                          }
                        }}
                        className={cn('shrink-0 hover:opacity-70 transition-opacity', statusConfig.color)}
                      >
                        <StatusIcon className="w-4 h-4" />
                      </button>
                    </div>

                    {/* 内容 */}
                    {editingTodoId === todo.id ? (
                      <input
                        type="text"
                        value={editingTodoValue}
                        onChange={(e) => setEditingTodoValue(e.target.value)}
                        onBlur={() => { if (editingTodoValue.trim()) handleUpdateTodoContent(todo.id, editingTodoValue.trim()); setEditingTodoId(null); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { if (editingTodoValue.trim()) handleUpdateTodoContent(todo.id, editingTodoValue.trim()); setEditingTodoId(null); } else if (e.key === 'Escape') setEditingTodoId(null); }}
                        autoFocus
                        className="flex-1 bg-transparent text-sm border-b border-primary focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className={cn('flex-1 text-sm cursor-pointer', todo.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground')}
                        onDoubleClick={() => { setEditingTodoId(todo.id); setEditingTodoValue(todo.content); }}
                      >
                        {todo.content || '未命名任务'}
                      </span>
                    )}

                    {/* 颜色选择 */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (showColorPicker === todo.id) {
                            setShowColorPicker(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const windowHeight = window.innerHeight;
                            // 如果下方空间不足，向上弹出
                            const spaceBelow = windowHeight - rect.bottom;
                            const y = spaceBelow < 100 ? rect.top - 80 : rect.bottom + 4;
                            setColorPickerPos({ x: Math.max(8, rect.right - 140), y });
                            setShowColorPicker(todo.id);
                          }
                        }}
                        className="p-1 rounded opacity-0 group-hover/task:opacity-100 hover:bg-black/10 transition-all text-muted-foreground"
                      >
                        <Palette className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 删除按钮 */}
                    <button
                      onClick={() => setDeleteTodoConfirm(todo.id)}
                      className="p-1 rounded opacity-0 group-hover/task:opacity-100 hover:bg-destructive/10 text-destructive transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 添加任务和功能按钮 */}
        <div className="px-3 py-2 border-t border-border/30 flex items-center justify-between gap-2">
          <button
            onClick={handleAddTodo}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="text-sm">添加任务</span>
          </button>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleToggleAlwaysOnTop}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isAlwaysOnTop ? 'bg-primary/15 text-primary' : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted'
              )}
              title={isAlwaysOnTop ? '取消固定' : '固定位置'}
            >
              {isAlwaysOnTop ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowNoteColorPicker(!showNoteColorPicker); }}
              className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-colors"
              title="更换颜色"
            >
              <Palette className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowOpacityPicker(!showOpacityPicker); }}
              className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-colors"
              title="调节透明度"
            >
              <Droplet className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 状态选择器 - fixed定位避免被裁剪 */}
      {openStatusPicker && (
        <div
          className="fixed p-1 bg-popover border border-border rounded-lg shadow-lg z-50 min-w-32 whitespace-nowrap"
          style={{ left: statusPickerPos.x, top: statusPickerPos.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {todoStatuses.map((status) => {
            const Icon = ICON_MAP[status.icon] || Circle;
            return (
              <button
                key={status.id}
                onClick={() => handleUpdateTodoStatus(openStatusPicker, status.id as TodoStatus)}
                className={cn('w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors', 'hover:bg-muted text-foreground')}
              >
                <span className={status.color}><Icon className="w-4 h-4" /></span>
                <span>{status.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 颜色选择器 - fixed定位避免被裁剪 */}
      {showColorPicker && (
        <div
          className="fixed p-2 bg-popover border border-border rounded-lg shadow-lg z-50 flex flex-wrap gap-1.5 w-35"
          style={{ left: colorPickerPos.x, top: colorPickerPos.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {todoColorsConfig.map((color) => (
            <button
              key={color.id}
              onClick={() => handleUpdateTodoColor(showColorPicker, color.id as TodoColor)}
              className={cn('w-6 h-6 rounded-full border-2 transition-all', 'border-transparent hover:scale-110')}
              style={{ backgroundColor: color.id === 'none' ? '#e5e5e5' : color.bg }}
            />
          ))}
        </div>
      )}

      {/* 便签颜色选择器 */}
      {showNoteColorPicker && (
        <div
          className="fixed bottom-14 right-4 p-2 bg-popover border border-border rounded-lg shadow-lg z-50 flex flex-wrap gap-1.5 w-40"
          onClick={(e) => e.stopPropagation()}
        >
          {projectColors.map((color) => (
            <button
              key={color.id}
              onClick={() => handleUpdateNoteColor(color.id as NoteColor)}
              className={cn('w-7 h-7 rounded-full border-2 transition-all', note?.color === color.id ? 'border-foreground scale-110' : 'border-transparent hover:scale-105')}
              style={{ backgroundColor: color.bg }}
              title={color.name}
            />
          ))}
        </div>
      )}

      {/* 透明度调节器 */}
      {showOpacityPicker && (
        <div
          className="fixed bottom-14 right-4 p-3 bg-popover border border-border rounded-lg shadow-lg z-50 w-48"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground">透明度</span>
            <span className="text-sm text-muted-foreground">{Math.round(opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.3"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {deleteTodoConfirm && (
        <ConfirmModal
          title="删除任务"
          message="确定要删除这个任务吗？"
          confirmText="删除"
          onConfirm={() => { handleDeleteTodo(deleteTodoConfirm); setDeleteTodoConfirm(null); }}
          onCancel={() => setDeleteTodoConfirm(null)}
          danger
        />
      )}
    </div>
  );
}
