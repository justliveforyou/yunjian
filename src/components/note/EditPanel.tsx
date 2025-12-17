import { MonitorUp, X } from 'lucide-react';
import { TodoList } from '@/components/todo';
import { useSettingsStore } from '@/stores';
import { DEFAULT_PROJECT_COLORS } from '@/constants';
import type { Note, NoteColor, TodoItem, TodoStatus, TodoColor } from '@/types';
import { cn } from '@/utils';

interface EditPanelProps {
  note: Note;
  todos: TodoItem[];
  progress: { total: number; completed: number; percent: number };
  onClose: () => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onPopOut: (note: Note) => void;
  onAddTodo: (content: string) => void;
  onToggleStatus: (id: string) => void;
  onSetStatus: (id: string, status: TodoStatus) => void;
  onDeleteTodo: (id: string) => void;
  onUpdateTodo: (id: string, content: string) => void;
  onUpdateTodoColor: (id: string, color: TodoColor) => void;
}

export function EditPanel({
  note,
  todos,
  progress,
  onClose,
  onUpdateNote,
  onPopOut,
  onAddTodo,
  onToggleStatus,
  onSetStatus,
  onDeleteTodo,
  onUpdateTodo,
  onUpdateTodoColor,
}: EditPanelProps) {
  const { settings } = useSettingsStore();
  const projectColors = settings.projectColors?.length ? settings.projectColors : DEFAULT_PROJECT_COLORS;

  const handleColorChange = (color: NoteColor) => {
    onUpdateNote(note.id, { color });
  };

  return (
    <div className="w-95 border-l border-border flex flex-col bg-card">
      {/* 编辑器头部 */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
        <input
          type="text"
          placeholder="项目名称"
          value={note.title}
          onChange={(e) => onUpdateNote(note.id, { title: e.target.value })}
          className="flex-1 bg-transparent text-base font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          onClick={() => onPopOut(note)}
          className="p-1.5 hover:bg-accent rounded-lg shrink-0 text-primary transition-colors"
          title="弹出到桌面"
        >
          <MonitorUp className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-accent rounded-lg shrink-0 text-muted-foreground transition-colors"
        >
          <X className="w-4 h-4" />
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
              note.color === color.id ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
            )}
            style={{ backgroundColor: color.bg }}
            title={color.name}
          />
        ))}
      </div>

      {/* 任务列表 */}
      <div className="flex-1 overflow-hidden">
        <TodoList
          todos={todos}
          progress={progress}
          onAddTodo={onAddTodo}
          onToggleStatus={onToggleStatus}
          onSetStatus={onSetStatus}
          onDeleteTodo={onDeleteTodo}
          onUpdateTodo={onUpdateTodo}
          onUpdateTodoColor={onUpdateTodoColor}
        />
      </div>
    </div>
  );
}
