import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 格式化日期为相对时间
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
}

/**
 * 格式化日期为友好显示
 */
export function formatFriendlyDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isToday(d)) {
    return `今天 ${format(d, 'HH:mm')}`;
  }
  if (isTomorrow(d)) {
    return `明天 ${format(d, 'HH:mm')}`;
  }
  if (isYesterday(d)) {
    return `昨天 ${format(d, 'HH:mm')}`;
  }

  return format(d, 'MM月dd日 HH:mm', { locale: zhCN });
}

/**
 * 格式化日期为完整格式
 */
export function formatFullDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy年MM月dd日 HH:mm:ss', { locale: zhCN });
}

/**
 * 获取当前 ISO 时间字符串
 */
export function nowISO(): string {
  return new Date().toISOString();
}
