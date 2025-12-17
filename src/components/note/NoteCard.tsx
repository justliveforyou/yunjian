import { useState } from 'react';
import { MoreHorizontal, Check, Circle, Clock, ChevronDown } from 'lucide-react';
import type { Note, TodoItem, TodoStatus } from '@/types';
import { todoColors } from '@/types';
import { cn, formatRelativeTime } from '@/utils';

interface NoteCardProps {
  note: Note;
  todos?: TodoItem[];
  onOpen?: (note: Note) => void;
  onDelete?: (note: Note) => void;
  onTogglePin?: (note: Note) => void;
  onSetTodoStatus?: (todoId: string, noteId: string, status: TodoStatus) => void;
}

const statusIcons: Record<TodoStatus, typeof Check> = {
  pending: Circle,
  in_progress: Clock,
  completed: Check,
};

const statusColors: Record<TodoStatus, string> = {
  pending: 'var(--muted-foreground)',
  in_progress: 'oklch(0.7 0.15 80)',
  completed: 'oklch(0.6 0.15 145)',
};

const MAX_VISIBLE_TODOS = 4;

const statusOptions: TodoStatus[] = ['pending', 'in_progress', 'completed'];
const statusTitles: Record<TodoStatus, string> = {
  pending: '待办',
  in_progress: '进行中',
  completed: '已完成',
};

// 任务背景色
const taskBgColors = [
  'task-rose',
  'task-amber',
  'task-lime',
  'task-sky',
  'task-violet',
];

export function NoteCard({ note, todos = [], onOpen, onDelete, onTogglePin, onSetTodoStatus }: NoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openStatusPickerId, setOpenStatusPickerId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const handleClick = () => {
    onOpen?.(note);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(note);
    setShowMenu(false);
  };

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin?.(note);
    setShowMenu(false);
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const todoCount = todos.length;
  const completedCount = todos.filter((t) => t.status === 'completed').length;
  const progress = todoCount > 0 ? (completedCount / todoCount) * 100 : 0;

  const hasMoreTodos = todoCount > MAX_VISIBLE_TODOS;
  const displayTodos = isExpanded ? todos : todos.slice(0, MAX_VISIBLE_TODOS);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      className="rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {/* 卡片头部 */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold" style={{ color: 'var(--card-foreground)' }}>
            {note.title || '未命名项目'}
          </h3>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="h-7 w-7 -mr-1.5 flex items-center justify-center rounded hover:bg-black/5 transition-colors"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg z-20 min-w-[100px]"
                style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleTogglePin}
                  className="w-full px-3 py-1.5 text-sm text-left hover:bg-black/5 transition-colors"
                  style={{ color: 'var(--foreground)' }}
                >
                  {note.isPinned ? '取消置顶' : '置顶'}
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-1.5 text-sm text-left hover:bg-black/5 transition-colors"
                  style={{ color: 'var(--destructive)' }}
                >
                  删除
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 进度信息 */}
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {completedCount} / {todoCount} 已完成
          </span>
          {todoCount > 0 && (
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--secondary)' }}>
              <div
                className="h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%`, backgroundColor: 'var(--primary)' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* 任务列表 */}
      <div className="px-2 pb-2">
        {todoCount === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>暂无任务</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {displayTodos.map((todo, index) => {
              const StatusIcon = statusIcons[todo.status];
              const colorConfig = todoColors[todo.color || 'none'];
              const isStatusPickerOpen = openStatusPickerId === todo.id;
              const bgClass = todo.color && todo.color !== 'none' ? colorConfig.bg : taskBgColors[index % taskBgColors.length];

              return (
                <div
                  key={todo.id}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg relative',
                    typeof bgClass === 'string' && !bgClass.startsWith('bg-') ? bgClass : ''
                  )}
                  style={bgClass.startsWith('bg-') ? undefined : undefined}
                >
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenStatusPickerId(isStatusPickerOpen ? null : todo.id);
                      }}
                      className="flex-shrink-0 hover:opacity-70 transition-opacity"
                      style={{ color: statusColors[todo.status] }}
                    >
                      <StatusIcon className="w-4 h-4" />
                    </button>

                    {/* 状态选择器 */}
                    {isStatusPickerOpen && (
                      <div
                        className="absolute left-0 top-full mt-1 p-1 rounded-lg shadow-lg z-30 min-w-[120px]"
                        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {statusOptions.map((status) => {
                          const Icon = statusIcons[status];
                          const isActive = todo.status === status;
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSetTodoStatus?.(todo.id, note.id, status);
                                setOpenStatusPickerId(null);
                              }}
                              className={cn(
                                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
                                isActive ? 'bg-[var(--accent)]' : 'hover:bg-[var(--muted)]'
                              )}
                              style={{ color: 'var(--foreground)' }}
                            >
                              <span style={{ color: statusColors[status] }}><Icon className="w-4 h-4" /></span>
                              <span>{statusTitles[status]}</span>
                              {isActive && <Check className="w-3.5 h-3.5 ml-auto" style={{ color: 'var(--primary)' }} />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <span
                    className={cn(
                      'flex-1 text-sm',
                      todo.status === 'completed' && 'line-through'
                    )}
                    style={{ color: todo.status === 'completed' ? 'var(--muted-foreground)' : 'var(--foreground)' }}
                  >
                    {todo.content || '未命名任务'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* 展开更多 */}
        {hasMoreTodos && (
          <button
            type="button"
            onClick={handleToggleExpand}
            className="w-full flex items-center justify-center gap-1 py-2 mt-1 text-xs font-medium transition-colors"
            style={{ color: 'var(--primary)' }}
          >
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isExpanded && 'rotate-180')} />
            {isExpanded ? '收起' : `+${todoCount - MAX_VISIBLE_TODOS} 更多`}
          </button>
        )}
      </div>

      {/* 时间戳 */}
      <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'oklch(0.96 0.008 85 / 0.3)' }}>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{formatRelativeTime(note.updatedAt)}</p>
      </div>
    </div>
  );
}
