import type { NoteColor } from './note';

/** 主题 */
export type Theme = 'light' | 'dark' | 'system';

/** 字体大小 */
export type FontSize = 'small' | 'medium' | 'large';

/** 应用设置 */
export interface AppSettings {
  // 外观
  theme: Theme;
  defaultNoteColor: NoteColor;
  defaultOpacity: number;
  fontSize: FontSize;

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
