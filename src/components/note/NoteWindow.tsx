import { useState, useEffect } from 'react';
import { X, GripVertical, Pin, PinOff } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { TodoList } from '@/components/todo';
import { cn } from '@/utils';
import { getNoteById as getNoteFromDb, updateNote as updateNoteInDb, getTodosByNoteId } from '@/services/database';
import { useTodoStore } from '@/stores/todoStore';
import type { Note, TodoItem } from '@/types';

interface NoteWindowProps {
  noteId: string;
}

export function NoteWindow({ noteId }: NoteWindowProps) {
  const [note, setNote] = useState<Note | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const { addTodo, updateTodo, deleteTodo, toggleTodoStatus } = useTodoStore();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [foundNote, foundTodos] = await Promise.all([
          getNoteFromDb(noteId),
          getTodosByNoteId(noteId),
        ]);
        if (foundNote) {
          setNote(foundNote);
        }
        setTodos(foundTodos);
      } catch (err) {
        console.error('Failed to load note:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [noteId]);

  const handleClose = async () => {
    try {
      await invoke('close_note_window', { noteId });
    } catch (e) {
      const window = getCurrentWindow();
      await window.close();
    }
  };

  const handleToggleAlwaysOnTop = async () => {
    const newValue = !isAlwaysOnTop;
    setIsAlwaysOnTop(newValue);
    try {
      await invoke('set_window_always_on_top', { noteId, alwaysOnTop: newValue });
    } catch (e) {
      const window = getCurrentWindow();
      await window.setAlwaysOnTop(newValue);
    }
  };

  const handleTitleChange = async (title: string) => {
    if (note) {
      setNote({ ...note, title });
      await updateNoteInDb(note.id, { title });
    }
  };

  const handleAddTodo = async (content: string) => {
    const newTodo = await addTodo({ noteId, content });
    setTodos((prev) => [...prev, newTodo]);
  };

  const handleToggleStatus = async (id: string) => {
    await toggleTodoStatus(id, noteId);
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const statusOrder: Array<'pending' | 'in_progress' | 'completed'> = ['pending', 'in_progress', 'completed'];
          const currentIndex = statusOrder.indexOf(t.status);
          const nextStatus = statusOrder[(currentIndex + 1) % 3];
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const handleSetStatus = async (id: string, status: import('@/types').TodoStatus) => {
    await updateTodo(id, noteId, { status });
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  };

  const handleDeleteTodo = async (id: string) => {
    await deleteTodo(id, noteId);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateTodo = async (id: string, content: string) => {
    await updateTodo(id, noteId, { content });
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, content } : t))
    );
  };

  const handleUpdateTodoColor = async (id: string, color: import('@/types').TodoColor) => {
    await updateTodo(id, noteId, { color });
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, color } : t))
    );
  };

  const handleDragStart = async (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setIsDragging(true);
    const window = getCurrentWindow();
    await window.startDragging();
    setIsDragging(false);
  };

  const progress = {
    total: todos.length,
    completed: todos.filter((t) => t.status === 'completed').length,
    percent: todos.length > 0
      ? Math.round((todos.filter((t) => t.status === 'completed').length / todos.length) * 100)
      : 0,
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl"
        style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 12px 24px -8px rgba(0,0,0,0.15)' }}>
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-border/50 cursor-grab"
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-muted-foreground/40" />
            <span className="font-semibold text-foreground">加载中...</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="h-screen flex flex-col rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl"
        style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 12px 24px -8px rgba(0,0,0,0.15)' }}>
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-border/50 cursor-grab"
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-muted-foreground/40" />
            <span className="font-semibold text-foreground">错误</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
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
    <div className="h-screen bg-transparent">
      <div
        className={cn(
          'h-full flex flex-col rounded-2xl bg-card transition-all duration-200',
          isDragging && 'scale-[1.02]'
        )}
      >
      {/* 头部拖拽区域 */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3 border-b border-border/50',
          isAlwaysOnTop ? 'cursor-default' : 'cursor-grab'
        )}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground/40" />
          <input
            type="text"
            placeholder="项目名称"
            value={note.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="bg-transparent font-semibold text-foreground focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleAlwaysOnTop}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              isAlwaysOnTop
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted'
            )}
            title={isAlwaysOnTop ? '取消固定' : '固定位置'}
          >
            {isAlwaysOnTop ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
          </button>
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
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">
            {progress.completed} / {progress.total} 已完成
          </span>
          <span className="text-xs font-medium text-primary">
            {progress.percent}%
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

        {/* 任务列表 */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden">
          <TodoList
            todos={todos}
            progress={progress}
            onAddTodo={handleAddTodo}
            onToggleStatus={handleToggleStatus}
            onSetStatus={handleSetStatus}
            onDeleteTodo={handleDeleteTodo}
            onUpdateTodo={handleUpdateTodo}
            onUpdateTodoColor={handleUpdateTodoColor}
          />
        </div>

        {/* 底部提示 */}
        <div className="px-4 py-2.5 border-t border-border/30 bg-muted/30 rounded-b-2xl">
          <p className="text-[10px] text-muted-foreground text-center">拖拽移动 · 点击图钉固定</p>
        </div>
      </div>
    </div>
  );
}
