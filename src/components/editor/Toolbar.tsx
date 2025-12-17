import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  CheckSquare,
  Heading1,
  Heading2,
  Highlighter,
} from 'lucide-react';
import { cn } from '@/utils';

interface ToolbarProps {
  editor: Editor;
}

export function Toolbar({ editor }: ToolbarProps) {
  const tools = [
    {
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
      title: '加粗',
    },
    {
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
      title: '斜体',
    },
    {
      icon: Strikethrough,
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive('strike'),
      title: '删除线',
    },
    { type: 'divider' as const },
    {
      icon: Heading1,
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive('heading', { level: 1 }),
      title: '标题 1',
    },
    {
      icon: Heading2,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive('heading', { level: 2 }),
      title: '标题 2',
    },
    { type: 'divider' as const },
    {
      icon: List,
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
      title: '无序列表',
    },
    {
      icon: ListOrdered,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
      title: '有序列表',
    },
    {
      icon: CheckSquare,
      action: () => editor.chain().focus().toggleTaskList().run(),
      isActive: editor.isActive('taskList'),
      title: '任务列表',
    },
    { type: 'divider' as const },
    {
      icon: Highlighter,
      action: () => editor.chain().focus().toggleHighlight().run(),
      isActive: editor.isActive('highlight'),
      title: '高亮',
    },
  ];

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 border-b border-black/10">
      {tools.map((tool, index) => {
        if ('type' in tool && tool.type === 'divider') {
          return (
            <div
              key={`divider-${index}`}
              className="w-px h-4 bg-black/10 mx-1"
            />
          );
        }

        const { icon: Icon, action, isActive, title } = tool as {
          icon: typeof Bold;
          action: () => void;
          isActive: boolean;
          title: string;
        };

        return (
          <button
            key={title}
            onClick={action}
            title={title}
            className={cn(
              'p-1.5 rounded hover:bg-black/10 transition-colors',
              isActive && 'bg-black/10'
            )}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}
