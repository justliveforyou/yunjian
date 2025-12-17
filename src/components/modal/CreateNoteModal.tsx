import { Button } from '@/components/ui';
import { useTagStore, useSettingsStore } from '@/stores';
import { DEFAULT_PROJECT_COLORS } from '@/constants';
import type { NoteColor } from '@/types';
import { cn } from '@/utils';

interface CreateNoteModalProps {
  title: string;
  color: NoteColor;
  selectedTags: string[];
  onTitleChange: (title: string) => void;
  onColorChange: (color: NoteColor) => void;
  onTagsChange: (tags: string[]) => void;
  onSave: () => void;
  onClose: () => void;
}

export function CreateNoteModal({
  title,
  color,
  selectedTags,
  onTitleChange,
  onColorChange,
  onTagsChange,
  onSave,
  onClose,
}: CreateNoteModalProps) {
  const { tags } = useTagStore();
  const { settings } = useSettingsStore();
  const projectColors = settings.projectColors?.length ? settings.projectColors : DEFAULT_PROJECT_COLORS;

  const handleTagToggle = (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter(t => t !== tagId)
      : [...selectedTags, tagId];
    onTagsChange(newTags);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-card rounded-xl p-6 w-80 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">新建项目</h2>
        <input
          type="text"
          placeholder="项目名称"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSave()}
          autoFocus
          className="w-full px-3 py-2 text-sm bg-secondary rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">选择颜色</p>
          <div className="flex gap-2 flex-wrap">
            {projectColors.map((c) => (
              <button
                key={c.id}
                onClick={() => onColorChange(c.id as NoteColor)}
                className={cn(
                  'w-7 h-7 rounded-full border-2 transition-all',
                  color === c.id ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                )}
                style={{ backgroundColor: c.bg }}
              />
            ))}
          </div>
        </div>
        {tags.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">选择标签</p>
            <div className="flex gap-2 flex-wrap">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.id)}
                  className={cn(
                    'px-2 py-1 text-xs rounded-full border transition-all flex items-center gap-1',
                    selectedTags.includes(tag.id) ? 'border-foreground bg-accent' : 'border-border hover:bg-accent/50'
                  )}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>取消</Button>
          <Button size="sm" onClick={onSave} disabled={!title.trim()}>保存</Button>
        </div>
      </div>
    </div>
  );
}
