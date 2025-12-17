import { Pin, Trash2, ExternalLink, Check, Circle, MonitorUp } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import type { Note } from '@/types';
import { cn, formatRelativeTime, getNoteColorClass } from '@/utils';

interface NoteCardProps {
  note: Note;
  onOpen?: (note: Note) => void;
  onDelete?: (note: Note) => void;
  onTogglePin?: (note: Note) => void;
  onToggleComplete?: (note: Note) => void;
}

export function NoteCard({ note, onOpen, onDelete, onTogglePin, onToggleComplete }: NoteCardProps) {
  const handleClick = () => {
    onOpen?.(note);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(note);
  };

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin?.(note);
  };

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleComplete?.(note);
  };

  const handlePopOut = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative p-4 rounded-lg cursor-pointer transition-all',
        'hover:shadow-lg hover:-translate-y-0.5',
        'border border-black/5',
        getNoteColorClass(note.color),
        note.isCompleted && 'opacity-70'
      )}
    >
      {/* 操作按钮 */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleTogglePin}
          className={cn(
            'p-1 rounded hover:bg-black/10',
            note.isPinned && 'text-amber-600'
          )}
          title={note.isPinned ? '取消置顶' : '置顶'}
        >
          <Pin className="w-4 h-4" />
        </button>
        <button
          onClick={handlePopOut}
          className="p-1 rounded hover:bg-black/10 text-blue-600"
          title="弹出到桌面"
        >
          <MonitorUp className="w-4 h-4" />
        </button>
        <button
          onClick={handleClick}
          className="p-1 rounded hover:bg-black/10"
          title="打开便签"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1 rounded hover:bg-black/10 text-red-500"
          title="删除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* 左上角：置顶标记和完成按钮 */}
      <div className="absolute top-2 left-2 flex items-center gap-1">
        {note.isPinned && (
          <Pin className="w-4 h-4 text-amber-600" />
        )}
        <button
          onClick={handleToggleComplete}
          className={cn(
            'p-0.5 rounded hover:bg-black/10 transition-colors',
            note.isCompleted ? 'text-green-600' : 'text-gray-400'
          )}
          title={note.isCompleted ? '标记为未完成' : '标记为已完成'}
        >
          {note.isCompleted ? (
            <Check className="w-4 h-4" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* 标题 */}
      {note.title && (
        <h3 className={cn(
          'font-medium text-gray-900 mb-2 pr-16 pl-8 line-clamp-1',
          note.isCompleted && 'line-through text-gray-500'
        )}>
          {note.title}
        </h3>
      )}

      {/* 内容预览 */}
      <p className={cn(
        'text-sm text-gray-600 line-clamp-4 whitespace-pre-wrap',
        note.isCompleted && 'line-through text-gray-400',
        !note.title && 'pl-8'
      )}>
        {note.plainText || '空便签'}
      </p>

      {/* 底部信息 */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span>{formatRelativeTime(note.updatedAt)}</span>
          {note.isCompleted && (
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">
              已完成
            </span>
          )}
        </div>
        {note.tags.length > 0 && (
          <span className="px-2 py-0.5 bg-black/5 rounded">
            {note.tags.length} 个标签
          </span>
        )}
      </div>
    </div>
  );
}
