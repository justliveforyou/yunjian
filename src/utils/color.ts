import type { NoteColor } from '@/types';

/** 便签颜色配置 */
export const noteColors: Record<NoteColor, { bg: string; border: string; name: string }> = {
  yellow: {
    bg: 'rgba(255, 243, 176, 0.95)',
    border: 'rgba(255, 235, 130, 1)',
    name: '黄色',
  },
  green: {
    bg: 'rgba(200, 230, 201, 0.95)',
    border: 'rgba(165, 214, 167, 1)',
    name: '绿色',
  },
  blue: {
    bg: 'rgba(187, 222, 251, 0.95)',
    border: 'rgba(144, 202, 249, 1)',
    name: '蓝色',
  },
  pink: {
    bg: 'rgba(248, 187, 208, 0.95)',
    border: 'rgba(244, 143, 177, 1)',
    name: '粉色',
  },
  purple: {
    bg: 'rgba(225, 190, 231, 0.95)',
    border: 'rgba(206, 147, 216, 1)',
    name: '紫色',
  },
  orange: {
    bg: 'rgba(255, 224, 178, 0.95)',
    border: 'rgba(255, 204, 128, 1)',
    name: '橙色',
  },
};

/** 获取便签背景色类名 */
export function getNoteColorClass(color: NoteColor): string {
  return `note-${color}`;
}

/** 预设标签颜色 */
export const tagColors = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
];
