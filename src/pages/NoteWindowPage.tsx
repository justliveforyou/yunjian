import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { NoteWindow } from '@/components/note/NoteWindow';

export function NoteWindowPage() {
  const { noteId } = useParams<{ noteId: string }>();

  // 设置窗口背景透明并隐藏滚动条
  useEffect(() => {
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
    document.body.style.overflow = 'visible';
    document.documentElement.style.overflow = 'visible';
    document.body.classList.add('note-window-scrollbar-hidden');
    document.documentElement.classList.add('note-window-scrollbar-hidden');
  }, []);

  if (!noteId) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">便签 ID 无效</p>
      </div>
    );
  }

  return <NoteWindow noteId={noteId} />;
}
