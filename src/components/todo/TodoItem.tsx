import { useState } from 'react';
import { Check, Circle, Clock, Trash2, Palette } from 'lucide-react';
import type { TodoItem as TodoItemType, TodoStatus, TodoColor } from '@/types';
import { todoColors } from '@/types';
import { cn } from '@/utils';

interface TodoItemProps {
  todo: TodoItemType;
  onToggleStatus: (id: string) => void;
  onSetStatus: (id: string, status: TodoStatus) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
  onUpdateColor: (id: string, color: TodoColor) => void;
}

const statusIcons: Record<TodoStatus, typeof Check> = {
  pending: Circle,
  in_progress: Clock,
  completed: Check,
};

const statusColorClasses: Record<TodoStatus, string> = {
  pending: 'text-muted-foreground',
  in_progress: 'text-amber-500',
  completed: 'text-emerald-500',
};

const statusTitles: Record<TodoStatus, string> = {
  pending: '待办',
  in_progress: '进行中',
  completed: '已完成',
};

const colorOptions: TodoColor[] = ['none', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];
const statusOptions: TodoStatus[] = ['pending', 'in_progress', 'completed'];

export function TodoItemComponent({
  todo,
  onSetStatus,
  onDelete,
  onUpdate,
  onUpdateColor,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(todo.content);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const StatusIcon = statusIcons[todo.status];
  const todoColor = todo.color || 'none';
  const colorConfig = todoColors[todoColor];

  const handleBlur = () => {
    setIsEditing(false);
    if (editContent.trim() !== todo.content) {
      onUpdate(todo.id, editContent.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditContent(todo.content);
      setIsEditing(false);
    }
  };

  const handleColorSelect = (color: TodoColor) => {
    onUpdateColor(todo.id, color);
    setShowColorPicker(false);
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors relative',
        todoColor !== 'none' ? colorConfig.bg : 'hover:bg-accent'
      )}
    >
      {/* 状态按钮 */}
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowStatusPicker(!showStatusPicker);
            setShowColorPicker(false);
          }}
          className={cn(
            'p-1 rounded-lg transition-colors shrink-0 cursor-pointer hover:opacity-70',
            statusColorClasses[todo.status]
          )}
          title={`状态: ${statusTitles[todo.status]} (点击选择)`}
        >
          <StatusIcon className="w-5 h-5" />
        </button>

        {/* 状态选择器弹出框 */}
        {showStatusPicker && (
          <div className="absolute left-0 top-full mt-1 p-1 bg-popover border border-border rounded-lg shadow-lg z-20 min-w-30">
            {statusOptions.map((status) => {
              const Icon = statusIcons[status];
              const isActive = todo.status === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetStatus(todo.id, status);
                    setShowStatusPicker(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
                    isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted text-foreground'
                  )}
                >
                  <Icon className={cn('w-4 h-4', statusColorClasses[status])} />
                  <span>{statusTitles[status]}</span>
                  {isActive && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 内容 */}
      {isEditing ? (
        <input
          type="text"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="flex-1 bg-transparent border-b border-primary focus:outline-none text-sm py-1 text-foreground"
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={cn(
            'flex-1 text-sm cursor-text py-1',
            todo.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
          )}
        >
          {todo.content || '点击编辑...'}
        </span>
      )}

      {/* 颜色选择按钮 */}
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowColorPicker(!showColorPicker);
            setShowStatusPicker(false);
          }}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-accent transition-all shrink-0 text-muted-foreground"
          title="设置颜色"
        >
          <Palette className="w-4 h-4" />
        </button>

        {/* 颜色选择器弹出框 */}
        {showColorPicker && (
          <div className="absolute right-0 top-full mt-1 p-2 bg-popover border border-border rounded-lg shadow-lg z-20 flex gap-1.5">
            {colorOptions.map((color) => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className={cn(
                  'w-7 h-7 rounded-full border-2 transition-all',
                  todoColor === color ? 'border-foreground scale-110' : 'border-transparent hover:scale-110'
                )}
                style={{ backgroundColor: color === 'none' ? 'var(--secondary)' : todoColors[color].bg }}
                title={todoColors[color].name}
              />
            ))}
          </div>
        )}
      </div>

      {/* 删除按钮 */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(todo.id);
        }}
        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-all shrink-0"
        title="删除"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
