import { useState } from 'react';
import { FolderOpen, Trash2, Settings } from 'lucide-react';
import { useNoteStore, useTagStore } from '@/stores';
import { cn } from '@/utils';
import { YunJianLogo } from '@/components/ui/Logo';
import type { Tag } from '@/types';

type ViewMode = 'all' | 'tag' | 'trash';

interface SidebarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenSettings: () => void;
}

export function Sidebar({ viewMode, onViewModeChange, onOpenSettings }: SidebarProps) {
  const { getActiveNotes, getDeletedNotes } = useNoteStore();
  const notes = useNoteStore((state) => state.notes);
  const { tags, selectedTagId, setSelectedTag, addTag, updateTag, deleteTag } = useTagStore();

  const [showAddTag, setShowAddTag] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [editingTagColor, setEditingTagColor] = useState('#3b82f6');

  const handleSelectAll = () => {
    onViewModeChange('all');
    setSelectedTag(null);
  };

  const handleSelectTag = (tagId: string) => {
    onViewModeChange('tag');
    setSelectedTag(tagId);
  };

  const handleSelectTrash = () => {
    onViewModeChange('trash');
    setSelectedTag(null);
  };

  const handleAddTag = () => {
    if (editingTagName.trim()) {
      addTag({ name: editingTagName.trim(), color: editingTagColor });
      setShowAddTag(false);
      setEditingTagName('');
      setEditingTagColor('#3b82f6');
    }
  };

  const handleSaveTag = (tag: Tag) => {
    updateTag(tag.id, { name: editingTagName, color: editingTagColor });
    setEditingTagId(null);
  };

  return (
    <aside className="w-60 border-r border-border flex flex-col bg-sidebar">
      {/* macOS 红绿灯区域 + 拖拽区域 */}
      <div className="h-8 shrink-0" data-tauri-drag-region />
      <div className="px-5 pb-4 flex items-center gap-2">
        <YunJianLogo size={28} />
        <h1 className="text-xl font-semibold tracking-tight text-foreground">云笺</h1>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        <button
          onClick={handleSelectAll}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            viewMode === 'all' && !selectedTagId
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <FolderOpen className="w-4 h-4" />
          <span>全部项目</span>
          <span className="ml-auto text-xs text-muted-foreground">{getActiveNotes().length}</span>
        </button>

        {/* 标签列表 */}
        <div className="pt-4">
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">标签</h3>
            <button
              onClick={() => { setShowAddTag(true); setEditingTagName(''); setEditingTagColor('#3b82f6'); }}
              className="text-xs text-primary hover:text-primary/80"
            >
              + 添加
            </button>
          </div>

          {showAddTag && (
            <div className="mx-2 mb-2 p-2 bg-accent rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <input type="color" value={editingTagColor} onChange={(e) => setEditingTagColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
                <input type="text" value={editingTagName} onChange={(e) => setEditingTagName(e.target.value)} placeholder="标签名称" className="flex-1 px-2 py-1 text-sm bg-background rounded" autoFocus />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddTag(false)} className="text-xs text-muted-foreground">取消</button>
                <button onClick={handleAddTag} className="text-xs text-primary">保存</button>
              </div>
            </div>
          )}

          {tags.map((tag) => (
            <div key={tag.id} className="group flex items-center">
              {editingTagId === tag.id ? (
                <div className="flex-1 mx-2 p-2 bg-accent rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <input type="color" value={editingTagColor} onChange={(e) => setEditingTagColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
                    <input type="text" value={editingTagName} onChange={(e) => setEditingTagName(e.target.value)} className="flex-1 px-2 py-1 text-sm bg-background rounded" autoFocus />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { deleteTag(tag.id); setEditingTagId(null); }} className="text-xs text-destructive mr-auto">删除</button>
                    <button onClick={() => setEditingTagId(null)} className="text-xs text-muted-foreground">取消</button>
                    <button onClick={() => handleSaveTag(tag)} className="text-xs text-primary">保存</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleSelectTag(tag.id)}
                  onDoubleClick={() => { setEditingTagId(tag.id); setEditingTagName(tag.name); setEditingTagColor(tag.color); }}
                  className={cn(
                    'flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    viewMode === 'tag' && selectedTagId === tag.id
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span>{tag.name}</span>
                  <span className="ml-auto text-xs">{notes.filter(n => n.status === 'active' && n.tags.includes(tag.id)).length}</span>
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleSelectTrash}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            viewMode === 'trash'
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <Trash2 className="w-4 h-4" />
          <span>回收站</span>
          <span className="ml-auto text-xs">{getDeletedNotes().length}</span>
        </button>
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>设置</span>
        </button>
      </div>
    </aside>
  );
}
