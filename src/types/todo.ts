/** 子任务状态 */
export type TodoStatus = 'pending' | 'in_progress' | 'completed';

/** 子任务颜色 */
export type TodoColor = 'none' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink';

/** 子任务颜色配置 */
export const todoColors: Record<TodoColor, { name: string; bg: string; text: string }> = {
  none: { name: '无', bg: 'transparent', text: 'text-gray-900' },
  red: { name: '红色', bg: 'bg-red-100', text: 'text-red-900' },
  orange: { name: '橙色', bg: 'bg-orange-100', text: 'text-orange-900' },
  yellow: { name: '黄色', bg: 'bg-yellow-100', text: 'text-yellow-900' },
  green: { name: '绿色', bg: 'bg-green-100', text: 'text-green-900' },
  blue: { name: '蓝色', bg: 'bg-blue-100', text: 'text-blue-900' },
  purple: { name: '紫色', bg: 'bg-purple-100', text: 'text-purple-900' },
  pink: { name: '粉色', bg: 'bg-pink-100', text: 'text-pink-900' },
};

/** 子任务 */
export interface TodoItem {
  id: string;
  noteId: string;           // 所属项目 ID
  content: string;          // 任务内容（纯文本）
  status: TodoStatus;       // pending -> in_progress -> completed
  color: TodoColor;         // 背景颜色
  order: number;            // 排序顺序
  createdAt: string;        // ISO 8601
  updatedAt: string;
  completedAt?: string;     // 完成时间
}

/** 创建子任务参数 */
export interface CreateTodoParams {
  noteId: string;
  content: string;
  color?: TodoColor;
  order?: number;
}

/** 更新子任务参数 */
export interface UpdateTodoParams {
  content?: string;
  status?: TodoStatus;
  color?: TodoColor;
  order?: number;
}
