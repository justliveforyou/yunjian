import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';
import { Toolbar } from './Toolbar';
import { cn } from '@/utils';

interface EditorProps {
  content: string;
  onChange: (content: string, plainText: string) => void;
  placeholder?: string;
  editable?: boolean;
  autoFocus?: boolean;
  showToolbar?: boolean;
  className?: string;
}

export function Editor({
  content,
  onChange,
  placeholder = '写点什么...',
  editable = true,
  autoFocus = false,
  showToolbar = true,
  className,
}: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: { class: 'task-item' },
      }),
      Placeholder.configure({ placeholder }),
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-500 underline cursor-pointer',
        },
      }),
    ],
    content: content ? (tryParseJSON(content) as string) : '',
    editable,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON());
      const text = editor.getText();
      onChange(json, text);
    },
  });

  // 内容变化时更新编辑器
  useEffect(() => {
    if (editor && content) {
      const currentContent = JSON.stringify(editor.getJSON());
      if (currentContent !== content) {
        const parsed = tryParseJSON(content);
        if (parsed) {
          editor.commands.setContent(parsed);
        }
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {showToolbar && <Toolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className="flex-1 overflow-y-auto p-3 text-sm"
      />
    </div>
  );
}

function tryParseJSON(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}
