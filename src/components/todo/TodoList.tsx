import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { TodoItem, TodoColor } from '@/types';
import { TodoItemComponent } from './TodoItem';

interface TodoListProps {
  todos: TodoItem[];
  progress: { total: number; completed: number; percent: number };
  onAddTodo: (content: string) => void;
  onToggleStatus: (id: string) => void;
  onSetStatus: (id: string, status: import('@/types').TodoStatus) => void;
  onDeleteTodo: (id: string) => void;
  onUpdateTodo: (id: string, content: string) => void;
  onUpdateTodoColor: (id: string, color: TodoColor) => void;
}

export function TodoList({
  todos,
  onAddTodo,
  onToggleStatus,
  onSetStatus,
  onDeleteTodo,
  onUpdateTodo,
  onUpdateTodoColor,
}: TodoListProps) {
  const [newTodoContent, setNewTodoContent] = useState('');

  const handleAddTodo = () => {
    if (newTodoContent.trim()) {
      onAddTodo(newTodoContent.trim());
      setNewTodoContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTodo();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 任务列表 */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden p-2">
        {todos.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">暂无任务</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {todos.map((todo) => (
              <TodoItemComponent
                key={todo.id}
                todo={todo}
                onToggleStatus={onToggleStatus}
                onSetStatus={onSetStatus}
                onDelete={onDeleteTodo}
                onUpdate={onUpdateTodo}
                onUpdateColor={onUpdateTodoColor}
              />
            ))}
          </div>
        )}
      </div>

      {/* 添加新任务 */}
      <div className="p-3 border-t border-border/30">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="添加新任务..."
            value={newTodoContent}
            onChange={(e) => setNewTodoContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-2 text-sm bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={handleAddTodo}
            disabled={!newTodoContent.trim()}
            className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
