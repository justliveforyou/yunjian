/** 提醒重复类型 */
export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

/** 提醒状态 */
export type ReminderStatus = 'pending' | 'triggered' | 'dismissed' | 'completed';

/** 提醒 */
export interface Reminder {
  id: string;
  noteId: string;
  title: string;
  description?: string;
  remindAt: string;          // ISO 8601
  repeatType: RepeatType;
  status: ReminderStatus;
  createdAt: string;
  updatedAt: string;
}

/** 创建提醒参数 */
export interface CreateReminderParams {
  noteId: string;
  title: string;
  description?: string;
  remindAt: string;
  repeatType?: RepeatType;
}

/** 更新提醒参数 */
export interface UpdateReminderParams {
  title?: string;
  description?: string;
  remindAt?: string;
  repeatType?: RepeatType;
  status?: ReminderStatus;
}
