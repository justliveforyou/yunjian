import { useState, useEffect } from 'react';
import { X, Pin, Minus, Check, Circle } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Editor } from '@/components/editor';
import { cn, getNoteColorClass, nowISO } from '@/utils';
import { getNoteById as getNoteFromDb, updateNote as updateNoteInDb } from '@/services/database';
import type { Note } from '@/types';

interface NoteWindowProps {
  noteId: string;
}

export function NoteWindow({ noteId }: NoteWindowProps) {
  const [note, setNote] = useState<Note | null>(null);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // 从数据库加载便签
  useEffect(() => {
    const loadNote = async () => {
      try {
        const foundNote = await getNoteFromDb(noteId);
        if (foundNote) {
          setNote(foundNote);
        }
      } catch (err) {
        console.error('Failed to load note:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadNote();
  }, [noteId]);

  const handleClose = async () => {
    try {
      await invoke('close_note_window', { noteId });
    } catch (e) {
      // 如果命令失败，尝试直接关闭窗口
      const window = getCurrentWindow();
      await window.close();
    }
  };

  const handleMinimize = async () => {
    const window = getCurrentWindow();
    await window.minimize();
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

  const handleContentChange = async (content: string, plainText: string) => {
    if (note) {
      setNote({ ...note, content, plainText });
      await updateNoteInDb(note.id, { content, plainText });
    }
  };

  const handleTitleChange = async (title: string) => {
    if (note) {
      setNote({ ...note, title });
      await updateNoteInDb(note.id, { title });
    }
  };

  const handleToggleComplete = async () => {
    if (note) {
      const newCompleted = !note.isCompleted;
      const completedAt = newCompleted ? nowISO() : undefined;
      setNote({ ...note, isCompleted: newCompleted, completedAt });
      await updateNoteInDb(note.id, { isCompleted: newCompleted, completedAt });
    }
  };

  const handleDragStart = async (e: React.MouseEvent) => {
    // 如果点击的是按钮，不触发拖动
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    const window = getCurrentWindow();
    await window.startDragging();
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-yellow-50">
        {/* 标题栏 */}
        <div
          className="h-8 flex items-center justify-end px-2 border-b border-black/10 cursor-move select-none"
          onMouseDown={handleDragStart}
        >
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-red-500 hover:text-white text-gray-600"
            title="关闭"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="h-screen flex flex-col bg-gray-100">
        {/* 标题栏 */}
        <div
          className="h-8 flex items-center justify-end px-2 border-b border-black/10 cursor-move select-none"
          onMouseDown={handleDragStart}
        >
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-red-500 hover:text-white text-gray-600"
            title="关闭"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">便签不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'h-screen flex flex-col rounded-lg overflow-hidden shadow-2xl',
        getNoteColorClass(note.color)
      )}
    >
      {/* 标题栏 - 可拖动区域 */}
      <div
        className="h-8 flex items-center justify-between px-2 border-b border-black/10 cursor-move select-none"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-1">
          {/* 完成按钮 */}
          <button
            onClick={handleToggleComplete}
            className={cn(
              'p-1 rounded hover:bg-black/10 transition-colors',
              note.isCompleted ? 'text-green-600' : 'text-gray-500'
            )}
            title={note.isCompleted ? '标记为未完成' : '标记为已完成'}
          >
            {note.isCompleted ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Circle className="w-3.5 h-3.5" />
            )}
          </button>
          {/* 置顶按钮 */}
          <button
            onClick={handleToggleAlwaysOnTop}
            className={cn(
              'p-1 rounded hover:bg-black/10 transition-colors',
              isAlwaysOnTop ? 'text-amber-600' : 'text-gray-500'
            )}
            title={isAlwaysOnTop ? '取消置顶' : '置顶'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-0.5">
          {/* 最小化按钮 */}
          <button
            onClick={handleMinimize}
            className="p-1 rounded hover:bg-black/10 text-gray-600"
            title="最小化"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-red-500 hover:text-white text-gray-600"
            title="关闭"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 标题输入 */}
      <div className="px-3 py-2 border-b border-black/5">
        <input
          type="text"
          placeholder="标题"
          value={note.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className={cn(
            'w-full bg-transparent text-sm font-medium focus:outline-none',
            note.isCompleted && 'line-through text-gray-500'
          )}
        />
      </div>

      {/* 完成状态提示 */}
      {note.isCompleted && (
        <div className="px-3 py-1 bg-green-50 border-b border-green-100 text-green-700 text-xs flex items-center gap-1">
          <Check className="w-3 h-3" />
          已完成
        </div>
      )}

      {/* 编辑器 */}
      <div className="flex-1 overflow-hidden">
        <Editor
          content={note.content}
          onChange={handleContentChange}
        />
      </div>
    </div>
  );
}
