/** 便签颜色主题 */
export type NoteColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'orange';

/** 便签优先级 */
export type NotePriority = 'low' | 'medium' | 'high';

/** 便签状态 */
export type NoteStatus = 'active' | 'archived' | 'deleted';

/** 便签（项目） */
export interface Note {
  id: string;
  title: string;
  description: string;       // 项目描述（纯文本）
  color: NoteColor;
  priority: NotePriority;
  status: NoteStatus;
  isPinned: boolean;
  isLocked: boolean;
  tags: string[];            // 标签 ID 列表
  reminderId?: string;
  createdAt: string;         // ISO 8601
  updatedAt: string;
  deletedAt?: string;
  // 运行时计算属性（不存储）
  todoCount?: number;        // 子任务总数
  completedCount?: number;   // 已完成子任务数
  progress?: number;         // 完成进度 0-100
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
  description?: string;
  color?: NoteColor;
  tags?: string[];
}

/** 更新便签参数 */
export interface UpdateNoteParams {
  title?: string;
  description?: string;
  color?: NoteColor;
  priority?: NotePriority;
  isPinned?: boolean;
  isLocked?: boolean;
  tags?: string[];
  reminderId?: string;
}
