import type { Note, TodoItem } from '@/types';
import { NoteCard } from './NoteCard';

interface NoteListProps {
  notes: Note[];
  todosByNote: Record<string, TodoItem[]>;
  onOpenNote?: (note: Note) => void;
  onDeleteNote?: (note: Note) => void;
  onTogglePin?: (note: Note) => void;
  onSetTodoStatus?: (todoId: string, noteId: string, status: import('@/types').TodoStatus) => void;
}

export function NoteList({ notes, todosByNote, onOpenNote, onDeleteNote, onTogglePin, onSetTodoStatus }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64" style={{ color: 'var(--muted-foreground)' }}>
        <p>暂无项目</p>
        <p className="text-sm mt-1 opacity-70">点击右上角 + 创建新项目</p>
      </div>
    );
  }

  // 分离置顶和普通便签
  const pinnedNotes = notes.filter((n) => n.isPinned);
  const normalNotes = notes.filter((n) => !n.isPinned);

  return (
    <div className="space-y-6">
      {/* 置顶便签 */}
      {pinnedNotes.length > 0 && (
        <div>
          <h2 className="text-xs font-medium mb-3 uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>置顶</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                todos={todosByNote[note.id] || []}
                onOpen={onOpenNote}
                onDelete={onDeleteNote}
                onTogglePin={onTogglePin}
                onSetTodoStatus={onSetTodoStatus}
              />
            ))}
          </div>
        </div>
      )}

      {/* 普通便签 */}
      {normalNotes.length > 0 && (
        <div>
          {pinnedNotes.length > 0 && (
            <h2 className="text-xs font-medium mb-3 uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>其他</h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {normalNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                todos={todosByNote[note.id] || []}
                onOpen={onOpenNote}
                onDelete={onDeleteNote}
                onTogglePin={onTogglePin}
                onSetTodoStatus={onSetTodoStatus}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
