import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { saveWindowState, getWindowState } from './database';
import { debounce, adjustWindowPosition, isWindowPositionValid } from '@/utils/window';
import type { NoteWindow } from '@/types';

/**
 * 窗口状态结构（从 Rust 返回）
 */
interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  always_on_top: boolean;
}

/**
 * 保存窗口状态（从数据库获取当前 opacity）
 */
async function saveCurrentWindowState(noteId: string) {
  try {
    const state = await invoke<WindowState>('get_window_state', { noteId });

    console.log('[WindowManager] Got window state from Rust:', JSON.stringify({
      noteId,
      x: state.x,
      y: state.y,
      width: state.width,
      height: state.height,
      always_on_top: state.always_on_top,
    }, null, 2));

    // 从数据库获取当前保存的状态以获取最新的 opacity
    const currentState = await getWindowState(noteId);
    const opacity = currentState?.opacity ?? 1;

    console.log('[WindowManager] Saving window state to database:', JSON.stringify({
      noteId,
      position: { x: state.x, y: state.y },
      size: { width: state.width, height: state.height },
      opacity,
    }, null, 2));

    await saveWindowState({
      noteId,
      windowLabel: `note-${noteId}`,
      position: { x: state.x, y: state.y },
      size: { width: state.width, height: state.height },
      isAlwaysOnTop: state.always_on_top,
      opacity,
    });

    console.log('[WindowManager] Window state saved successfully');
  } catch (err) {
    console.error('[WindowManager] Failed to save window state:', err);
  }
}

/**
 * 防抖保存窗口状态
 */
const debouncedSave = debounce(saveCurrentWindowState, 500);

/**
 * 设置窗口状态跟踪
 * 监听窗口移动和调整大小事件，自动保存状态到数据库
 * @param noteId 便签 ID
 * @param _opacity 初始透明度（用于首次保存）
 * @returns 清理函数
 */
export async function setupWindowStateTracking(
  noteId: string,
  _opacity: number
): Promise<() => void> {
  const window = getCurrentWindow();

  console.log('[WindowManager] Setting up window state tracking for noteId:', noteId);

  // 监听位置变化
  const unlistenPosition = await window.onMoved((position) => {
    console.log('[WindowManager] Window moved:', position);
    debouncedSave(noteId);
  });

  // 监听大小变化
  const unlistenSize = await window.onResized((size) => {
    console.log('[WindowManager] Window resized:', size);
    debouncedSave(noteId);
  });

  console.log('[WindowManager] Window state tracking setup complete');

  return () => {
    console.log('[WindowManager] Cleaning up window state tracking for noteId:', noteId);
    unlistenPosition();
    unlistenSize();
  };
}

/**
 * 验证窗口位置
 * 确保窗口在屏幕范围内
 * @param state 窗口状态
 * @returns 验证后的窗口状态
 */
function validateWindowPosition(state: NoteWindow): NoteWindow {
  const { x, y } = state.position;
  const { width, height } = state.size;

  // 检查位置是否有效
  if (!isWindowPositionValid(x, y, width, height)) {
    // 调整到屏幕内
    const adjusted = adjustWindowPosition(x, y, width, height);
    return {
      ...state,
      position: adjusted,
    };
  }

  return state;
}

/**
 * 创建或恢复窗口
 * 如果数据库中有保存的状态，使用保存的位置和大小创建窗口
 * 否则使用默认值
 * @param noteId 便签 ID
 * @param title 窗口标题
 * @param color 便签颜色
 */
export async function createOrRestoreWindow(
  noteId: string,
  title: string,
  color: string
): Promise<void> {
  try {
    const savedState = await getWindowState(noteId);

    if (savedState) {
      console.log('[WindowManager] Restoring window from saved state:', JSON.stringify({
        noteId,
        position: savedState.position,
        size: savedState.size,
        opacity: savedState.opacity,
      }, null, 2));

      // 验证位置
      const validatedState = validateWindowPosition(savedState);

      // 使用保存的状态创建窗口
      console.log('[WindowManager] Creating window with params:', JSON.stringify({
        noteId,
        x: validatedState.position.x,
        y: validatedState.position.y,
        width: validatedState.size.width,
        height: validatedState.size.height,
        alwaysOnTop: validatedState.isAlwaysOnTop,
        opacity: validatedState.opacity,
      }, null, 2));

      await invoke('create_note_window', {
        noteId,
        title,
        color,
        x: validatedState.position.x,
        y: validatedState.position.y,
        width: validatedState.size.width,
        height: validatedState.size.height,
        alwaysOnTop: validatedState.isAlwaysOnTop,
        opacity: validatedState.opacity,
      });

      console.log('[WindowManager] Window restored successfully');
    } else {
      console.log('[WindowManager] No saved state found, using defaults for noteId:', noteId);
      // 使用默认值创建窗口
      await invoke('create_note_window', {
        noteId,
        title,
        color,
        x: null,
        y: null,
        width: null,
        height: null,
        alwaysOnTop: true,
        opacity: 1.0,
      });
    }
  } catch (err) {
    console.error('[WindowManager] Failed to create or restore window:', err);
    throw err;
  }
}

/**
 * 保存透明度到数据库（防抖）
 * @param noteId 便签 ID
 * @param opacity 透明度
 */
export const debouncedSaveOpacity = debounce(async (noteId: string, opacity: number) => {
  try {
    const state = await getWindowState(noteId);
    if (state) {
      state.opacity = opacity;
      await saveWindowState(state);
    }
  } catch (err) {
    console.error('Failed to save opacity:', err);
  }
}, 300);
