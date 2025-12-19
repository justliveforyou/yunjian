/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param wait 等待时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 验证窗口位置是否在屏幕范围内
 * @param x 窗口 x 坐标
 * @param y 窗口 y 坐标
 * @param width 窗口宽度
 * @param height 窗口高度
 * @returns 是否有效
 */
export function isWindowPositionValid(
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  // 获取屏幕尺寸
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;

  // 至少有 50px 的窗口可见
  const minVisible = 50;

  return (
    x + width > minVisible &&
    x < screenWidth - minVisible &&
    y + height > minVisible &&
    y < screenHeight - minVisible
  );
}

/**
 * 调整窗口位置到屏幕内
 * @param x 窗口 x 坐标
 * @param y 窗口 y 坐标
 * @param width 窗口宽度
 * @param height 窗口高度
 * @returns 调整后的位置
 */
export function adjustWindowPosition(
  x: number,
  y: number,
  width: number,
  height: number
): { x: number; y: number } {
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;

  let newX = x;
  let newY = y;

  // 确保窗口不超出屏幕右边
  if (newX + width > screenWidth) {
    newX = screenWidth - width - 20;
  }

  // 确保窗口不超出屏幕底部
  if (newY + height > screenHeight) {
    newY = screenHeight - height - 20;
  }

  // 确保窗口不超出屏幕左边
  if (newX < 0) {
    newX = 20;
  }

  // 确保窗口不超出屏幕顶部
  if (newY < 0) {
    newY = 20;
  }

  return { x: newX, y: newY };
}
