import type { NoteColor } from '@/types';

/** 便签颜色配置 - 柔和低饱和度 */
export const noteColors: Record<NoteColor, { bg: string; border: string; name: string }> = {
  yellow: { bg: '#fefce8', border: '#fef08a', name: '黄色' },
  green: { bg: '#f0fdf4', border: '#bbf7d0', name: '绿色' },
  blue: { bg: '#eff6ff', border: '#bfdbfe', name: '蓝色' },
  pink: { bg: '#fdf2f8', border: '#fbcfe8', name: '粉色' },
  purple: { bg: '#faf5ff', border: '#e9d5ff', name: '紫色' },
  orange: { bg: '#fff7ed', border: '#fed7aa', name: '橙色' },
};

/** 获取便签背景色类名 */
export function getNoteColorClass(color: NoteColor): string {
  return `note-${color}`;
}

/** 预设标签颜色 */
export const tagColors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
];
