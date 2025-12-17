import type { NoteColor } from './note';

/** 主题 */
export type Theme = 'light' | 'dark' | 'system';

/** 字体大小 */
export type FontSize = 'small' | 'medium' | 'large';

/** 自定义颜色 */
export interface CustomColor {
  id: string;
  name: string;
  bg: string;
  border: string;
}

/** 自定义状态 */
export interface CustomStatus {
  id: string;
  name: string;
  icon: string; // lucide icon 名称
  color: string; // tailwind 颜色类
}

/** 应用设置 */
export interface AppSettings {
  // 外观
  theme: Theme;
  defaultNoteColor: NoteColor;
  defaultOpacity: number;
  fontSize: FontSize;
  customColors: CustomColor[];
  projectColors: CustomColor[];
  todoColors: CustomColor[];
  todoStatuses: CustomStatus[];

  // 行为
  launchAtStartup: boolean;
  showInTray: boolean;
  closeToTray: boolean;

  // 快捷键
  shortcuts: {
    newNote: string;
    toggleAllNotes: string;
    quickCapture: string;
  };

  // 数据
  autoSaveInterval: number;
  backupEnabled: boolean;
  backupPath?: string;
}

/** 默认设置 */
export const defaultSettings: AppSettings = {
  theme: 'system',
  defaultNoteColor: 'yellow',
  defaultOpacity: 1,
  fontSize: 'medium',
  customColors: [],
  projectColors: [
    { id: 'yellow', name: '黄色', bg: '#fefce8', border: '#fef08a' },
    { id: 'green', name: '绿色', bg: '#f0fdf4', border: '#bbf7d0' },
    { id: 'blue', name: '蓝色', bg: '#eff6ff', border: '#bfdbfe' },
    { id: 'pink', name: '粉色', bg: '#fdf2f8', border: '#fbcfe8' },
    { id: 'purple', name: '紫色', bg: '#faf5ff', border: '#e9d5ff' },
    { id: 'orange', name: '橙色', bg: '#fff7ed', border: '#fed7aa' },
  ],
  todoColors: [
    { id: 'none', name: '无', bg: 'transparent', border: 'transparent' },
    { id: 'red', name: '红色', bg: '#fee2e2', border: '#fecaca' },
    { id: 'orange', name: '橙色', bg: '#ffedd5', border: '#fed7aa' },
    { id: 'yellow', name: '黄色', bg: '#fef9c3', border: '#fef08a' },
    { id: 'green', name: '绿色', bg: '#dcfce7', border: '#bbf7d0' },
    { id: 'blue', name: '蓝色', bg: '#dbeafe', border: '#bfdbfe' },
    { id: 'purple', name: '紫色', bg: '#f3e8ff', border: '#e9d5ff' },
    { id: 'pink', name: '粉色', bg: '#fce7f3', border: '#fbcfe8' },
  ],
  todoStatuses: [
    { id: 'pending', name: '待办', icon: 'Circle', color: 'text-muted-foreground' },
    { id: 'in_progress', name: '进行中', icon: 'Clock', color: 'text-amber-500' },
    { id: 'completed', name: '已完成', icon: 'Check', color: 'text-emerald-500' },
  ],
  launchAtStartup: false,
  showInTray: true,
  closeToTray: true,
  shortcuts: {
    newNote: 'CommandOrControl+Shift+N',
    toggleAllNotes: 'CommandOrControl+Shift+S',
    quickCapture: 'CommandOrControl+Shift+C',
  },
  autoSaveInterval: 1000,
  backupEnabled: false,
};
