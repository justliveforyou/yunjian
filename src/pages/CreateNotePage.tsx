import { useState } from 'react';
import { nanoid } from 'nanoid';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useSettingsStore } from '@/stores';
import { DEFAULT_PROJECT_COLORS } from '@/constants';
import { cn, nowISO } from '@/utils';
import { createNote } from '@/services/database';
import type { NoteColor, Note } from '@/types';

export function CreateNotePage() {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState<NoteColor>('yellow');
  const { settings } = useSettingsStore();

  const projectColors = settings.projectColors?.length ? settings.projectColors : DEFAULT_PROJECT_COLORS;

  const handleSave = async () => {
    if (title.trim()) {
      const now = nowISO();
      const note: Note = {
        id: nanoid(),
        title: title.trim(),
        description: '',
        color,
        priority: 'medium',
        status: 'active',
        isPinned: false,
        isLocked: false,
        tags: [],
        createdAt: now,
        updatedAt: now,
      };
      try {
        // 先写入数据库
        await createNote(note);
        // 再创建桌面便签窗口
        await invoke('create_note_window', { noteId: note.id, title: note.title || '便签', color: note.color });
      } catch (err) {
        console.error('Failed to create note:', err);
        alert('创建失败: ' + (err instanceof Error ? err.message : String(err)));
        return; // 失败时不关闭窗口
      }
      // 无论成功失败都关闭窗口
      try {
        await invoke('close_create_window');
      } catch {
        const window = getCurrentWindow();
        await window.close();
      }
    }
  };

  const handleCancel = async () => {
    try {
      await invoke('close_create_window');
    } catch (err) {
      console.error('Failed to close window:', err);
      const window = getCurrentWindow();
      await window.close();
    }
  };

  return (
    <div className="h-screen bg-background p-6 flex flex-col">
      <h2 className="text-lg font-semibold mb-4">新建项目</h2>

      <div className="space-y-4 flex-1">
        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">项目名称</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入项目名称"
            autoFocus
            className="w-full px-3 py-2 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">颜色</label>
          <div className="flex gap-2 flex-wrap">
            {projectColors.map((c) => (
              <button
                key={c.id}
                onClick={() => setColor(c.id as NoteColor)}
                className={cn(
                  'w-8 h-8 rounded-full border-2 transition-all',
                  color === c.id ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                )}
                style={{ backgroundColor: c.bg }}
                title={c.name}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-sm text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={!title.trim()}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          创建并固定
        </button>
      </div>
    </div>
  );
}
