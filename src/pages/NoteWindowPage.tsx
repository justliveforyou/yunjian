import { useParams } from 'react-router-dom';
import { NoteWindow } from '@/components/note/NoteWindow';

export function NoteWindowPage() {
  const { noteId } = useParams<{ noteId: string }>();

  if (!noteId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">便签 ID 无效</p>
      </div>
    );
  }

  return <NoteWindow noteId={noteId} />;
}
