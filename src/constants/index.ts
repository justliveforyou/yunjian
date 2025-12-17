import { Circle, CircleDot, CircleCheck, CircleX, CirclePause, CirclePlay, Check, CheckCircle, Clock, Timer, Hourglass, Star, Flag, AlertCircle, XCircle, Zap, Target, Bookmark } from 'lucide-react';

// 图标映射
export const ICON_MAP: Record<string, typeof Check> = {
  Circle, CircleDot, CircleCheck, CircleX, CirclePause, CirclePlay,
  Check, CheckCircle, Clock, Timer, Hourglass,
  Star, Flag, AlertCircle, XCircle, Zap, Target, Bookmark,
};

export const ICON_OPTIONS = Object.keys(ICON_MAP);

// 任务卡片背景色
export const TASK_COLORS = [
  'bg-rose-100',
  'bg-amber-100',
  'bg-lime-100',
  'bg-sky-100',
  'bg-violet-100',
];

// 默认项目颜色
export const DEFAULT_PROJECT_COLORS = [
  { id: 'yellow', name: '黄色', bg: '#fefce8', border: '#fef08a' },
  { id: 'green', name: '绿色', bg: '#f0fdf4', border: '#bbf7d0' },
  { id: 'blue', name: '蓝色', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 'pink', name: '粉色', bg: '#fdf2f8', border: '#fbcfe8' },
  { id: 'purple', name: '紫色', bg: '#faf5ff', border: '#e9d5ff' },
  { id: 'orange', name: '橙色', bg: '#fff7ed', border: '#fed7aa' },
];

// 默认任务颜色
export const DEFAULT_TODO_COLORS = [
  { id: 'none', name: '无', bg: 'transparent', border: 'transparent' },
  { id: 'red', name: '红色', bg: '#fee2e2', border: '#fecaca' },
  { id: 'orange', name: '橙色', bg: '#ffedd5', border: '#fed7aa' },
  { id: 'yellow', name: '黄色', bg: '#fef9c3', border: '#fef08a' },
  { id: 'green', name: '绿色', bg: '#dcfce7', border: '#bbf7d0' },
  { id: 'blue', name: '蓝色', bg: '#dbeafe', border: '#bfdbfe' },
  { id: 'purple', name: '紫色', bg: '#f3e8ff', border: '#e9d5ff' },
  { id: 'pink', name: '粉色', bg: '#fce7f3', border: '#fbcfe8' },
];

// 默认任务状态
export const DEFAULT_TODO_STATUSES = [
  { id: 'pending', name: '待办', icon: 'Circle', color: 'text-muted-foreground' },
  { id: 'in_progress', name: '进行中', icon: 'Clock', color: 'text-amber-500' },
  { id: 'completed', name: '已完成', icon: 'Check', color: 'text-emerald-500' },
];

// 状态颜色选项
export const STATUS_COLOR_OPTIONS = [
  { value: 'text-muted-foreground', bg: 'bg-muted-foreground' },
  { value: 'text-amber-500', bg: 'bg-amber-500' },
  { value: 'text-emerald-500', bg: 'bg-emerald-500' },
  { value: 'text-blue-500', bg: 'bg-blue-500' },
  { value: 'text-rose-500', bg: 'bg-rose-500' },
  { value: 'text-purple-500', bg: 'bg-purple-500' },
  { value: 'text-orange-500', bg: 'bg-orange-500' },
  { value: 'text-cyan-500', bg: 'bg-cyan-500' },
];
