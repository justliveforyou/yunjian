/** 便签颜色主题 */
export type NoteColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'orange';

/** 便签优先级 */
export type NotePriority = 'low' | 'medium' | 'high';

/** 便签状态 */
export type NoteStatus = 'active' | 'archived' | 'deleted';

/** 便签 */
export interface Note {
  id: string;
  title: string;
  content: string;           // Tiptap JSON
  plainText: string;         // 用于搜索
  color: NoteColor;
  priority: NotePriority;
  status: NoteStatus;
  isPinned: boolean;
  isLocked: boolean;
  isCompleted: boolean;      // 是否已完成
  tags: string[];            // 标签 ID 列表
  reminderId?: string;
  createdAt: string;         // ISO 8601
  updatedAt: string;
  deletedAt?: string;
  completedAt?: string;      // 完成时间
}

/** 便签窗口状态 */
export interface NoteWindow {
  noteId: string;
  windowLabel: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isAlwaysOnTop: boolean;
  opacity: number;
}

/** 创建便签参数 */
export interface CreateNoteParams {
  title?: string;
  content?: string;
  color?: NoteColor;
  tags?: string[];
}

/** 更新便签参数 */
export interface UpdateNoteParams {
  title?: string;
  content?: string;
  plainText?: string;
  color?: NoteColor;
  priority?: NotePriority;
  isPinned?: boolean;
  isLocked?: boolean;
  isCompleted?: boolean;
  tags?: string[];
  reminderId?: string;
}
