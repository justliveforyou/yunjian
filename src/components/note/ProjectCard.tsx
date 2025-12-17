import { useState } from 'react';
import { MoreHorizontal, ChevronDown, Check, Palette, MonitorUp, Circle, X } from 'lucide-react';
import { useSettingsStore } from '@/stores';
import { ICON_MAP, TASK_COLORS, DEFAULT_PROJECT_COLORS, DEFAULT_TODO_COLORS, DEFAULT_TODO_STATUSES } from '@/constants';
import { ConfirmModal } from '@/components/modal';
import type { Note, TodoItem, TodoStatus, TodoColor } from '@/types';
import { cn, formatRelativeTime } from '@/utils';

interface ProjectCardProps {
  note: Note;
  todos: TodoItem[];
  isExpanded: boolean;
  editingTodoId: string | null;
  editingTodoValue: string;
  onToggleExpand: () => void;
  onPopOut: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
  onUpdateTitle: (title: string) => void;
  onUpdateTodoStatus: (todoId: string, status: TodoStatus) => void;
  onUpdateTodoContent: (todoId: string, content: string) => void;
  onUpdateTodoColor: (todoId: string, color: TodoColor) => void;
  onDeleteTodo: (todoId: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onEditTodo: (todoId: string, content: string) => void;
  onCancelEditTodo: () => void;
}

export function ProjectCard({
  note,
  todos,
  isExpanded,
  editingTodoId,
  editingTodoValue,
  onToggleExpand,
  onPopOut,
  onTogglePin,
  onDelete,
  onUpdateTitle,
  onUpdateTodoStatus,
  onUpdateTodoContent,
  onUpdateTodoColor,
  onDeleteTodo,
  onContextMenu,
  onEditTodo,
  onCancelEditTodo,
}: ProjectCardProps) {
  const { settings } = useSettingsStore();
  const projectColors = settings.projectColors?.length ? settings.projectColors : DEFAULT_PROJECT_COLORS;
  const todoColorsConfig = settings.todoColors?.length ? settings.todoColors : DEFAULT_TODO_COLORS;
  const todoStatuses = settings.todoStatuses?.length ? settings.todoStatuses : DEFAULT_TODO_STATUSES;

  const [openMenuId, setOpenMenuId] = useState(false);
  const [openStatusPicker, setOpenStatusPicker] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(note.title);
  const [deleteTodoConfirm, setDeleteTodoConfirm] = useState<string | null>(null);

  const completedCount = todos.filter(t => t.status === 'completed').length;
  const totalCount = todos.length;
  const displayTodos = isExpanded ? todos : todos.slice(0, 4);
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleTitleSave = () => {
    if (titleValue.trim()) onUpdateTitle(titleValue.trim());
    setEditingTitle(false);
  };

  return (
    <div
      className="group bg-card border border-border rounded-xl hover:shadow-md transition-shadow flex flex-col"
      style={{ backgroundColor: projectColors.find(c => c.id === note.color)?.bg || '#fefce8' }}
      onContextMenu={onContextMenu}
    >
      {/* 卡片头部 */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-2">
          {editingTitle ? (
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              autoFocus
              className="flex-1 bg-transparent font-semibold text-card-foreground border-b border-primary focus:outline-none"
            />
          ) : (
            <h3
              className="font-semibold text-card-foreground cursor-pointer"
              onDoubleClick={() => { setEditingTitle(true); setTitleValue(note.title); }}
            >
              {note.title || '未命名项目'}
            </h3>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onPopOut(); }}
              className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary hover:bg-accent transition-all"
              title="发送到屏幕"
            >
              <MonitorUp className="w-4 h-4" />
            </button>
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setOpenMenuId(!openMenuId); }}
                className="h-7 w-7 -mr-1.5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {openMenuId && (
                <div className="absolute right-0 top-full mt-1 py-1 bg-popover border border-border rounded-lg shadow-lg z-50 min-w-24" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => { onTogglePin(); setOpenMenuId(false); }} className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent transition-colors">
                    {note.isPinned ? '取消置顶' : '置顶'}
                  </button>
                  <button onClick={onDelete} className="w-full px-3 py-1.5 text-sm text-left text-destructive hover:bg-accent transition-colors">
                    删除
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
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
                      onClick={(e) => { e.stopPropagation(); setOpenStatusPicker(openStatusPicker === todo.id ? null : todo.id); }}
                      className={cn('shrink-0 hover:opacity-70 transition-opacity', statusConfig.color)}
                    >
                      <StatusIcon className="w-4 h-4" />
                    </button>
                    {openStatusPicker === todo.id && (
                      <div className="absolute left-0 top-full mt-1 p-1 bg-popover border border-border rounded-lg shadow-lg z-30 min-w-32 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {todoStatuses.map((status) => {
                          const Icon = ICON_MAP[status.icon] || Circle;
                          return (
                            <button
                              key={status.id}
                              onClick={() => { onUpdateTodoStatus(todo.id, status.id as TodoStatus); setOpenStatusPicker(null); }}
                              className={cn('w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors', todo.status === status.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted text-foreground')}
                            >
                              <span className={status.color}><Icon className="w-4 h-4" /></span>
                              <span>{status.name}</span>
                              {todo.status === status.id && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
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
                      onChange={(e) => onEditTodo(todo.id, e.target.value)}
                      onBlur={() => { if (editingTodoValue.trim()) onUpdateTodoContent(todo.id, editingTodoValue.trim()); onCancelEditTodo(); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { if (editingTodoValue.trim()) onUpdateTodoContent(todo.id, editingTodoValue.trim()); onCancelEditTodo(); } else if (e.key === 'Escape') onCancelEditTodo(); }}
                      autoFocus
                      className="flex-1 bg-transparent text-sm border-b border-primary focus:outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className={cn('flex-1 text-sm cursor-pointer', todo.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground')}
                      onDoubleClick={(e) => { e.stopPropagation(); onEditTodo(todo.id, todo.content); }}
                    >
                      {todo.content || '未命名任务'}
                    </span>
                  )}

                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowColorPicker(showColorPicker === todo.id ? null : todo.id); }}
                      className="p-1 rounded opacity-0 group-hover/task:opacity-100 hover:bg-black/10 transition-all text-muted-foreground"
                    >
                      <Palette className="w-3.5 h-3.5" />
                    </button>
                    {showColorPicker === todo.id && (
                      <div className="absolute right-0 bottom-full mb-1 p-2 bg-popover border border-border rounded-lg shadow-lg z-50 flex flex-wrap gap-1.5 w-35" onClick={(e) => e.stopPropagation()}>
                        {todoColorsConfig.map((color) => (
                          <button
                            key={color.id}
                            onClick={() => { onUpdateTodoColor(todo.id, color.id as TodoColor); setShowColorPicker(null); }}
                            className={cn('w-6 h-6 rounded-full border-2 transition-all', todo.color === color.id ? 'border-foreground scale-110' : 'border-transparent hover:scale-110')}
                            style={{ backgroundColor: color.id === 'none' ? '#e5e5e5' : color.bg }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 删除按钮 */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTodoConfirm(todo.id); }}
                    className="p-1 rounded opacity-0 group-hover/task:opacity-100 hover:bg-destructive/10 text-destructive transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {totalCount > 4 && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
            className="w-full flex items-center justify-center gap-1 py-2 mt-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isExpanded && 'rotate-180')} />
            {isExpanded ? '收起' : `+${totalCount - 4} 更多`}
          </button>
        )}
      </div>

      <div className="px-4 py-3 border-t border-border bg-muted/30 rounded-b-xl">
        <p className="text-xs text-muted-foreground">{formatRelativeTime(note.updatedAt)}</p>
      </div>

      {deleteTodoConfirm && (
        <ConfirmModal
          title="删除任务"
          message="确定要删除这个任务吗？"
          confirmText="删除"
          onConfirm={() => { onDeleteTodo(deleteTodoConfirm); setDeleteTodoConfirm(null); }}
          onCancel={() => setDeleteTodoConfirm(null)}
          danger
        />
      )}
    </div>
  );
}
