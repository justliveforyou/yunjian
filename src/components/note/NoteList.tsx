import type { Note } from '@/types';
import { NoteCard } from './NoteCard';

interface NoteListProps {
  notes: Note[];
  onOpenNote?: (note: Note) => void;
  onDeleteNote?: (note: Note) => void;
  onTogglePin?: (note: Note) => void;
  onToggleComplete?: (note: Note) => void;
}

export function NoteList({ notes, onOpenNote, onDeleteNote, onTogglePin, onToggleComplete }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p className="text-lg">暂无便签</p>
        <p className="text-sm mt-1">点击右上角 + 创建新便签</p>
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
          <h2 className="text-sm font-medium text-gray-500 mb-3">置顶</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onOpen={onOpenNote}
                onDelete={onDeleteNote}
                onTogglePin={onTogglePin}
                onToggleComplete={onToggleComplete}
              />
            ))}
          </div>
        </div>
      )}

      {/* 普通便签 */}
      {normalNotes.length > 0 && (
        <div>
          {pinnedNotes.length > 0 && (
            <h2 className="text-sm font-medium text-gray-500 mb-3">其他</h2>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {normalNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onOpen={onOpenNote}
                onDelete={onDeleteNote}
                onTogglePin={onTogglePin}
                onToggleComplete={onToggleComplete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
