import { useState, useCallback, useEffect } from 'react';
import { Plus, Search, Settings, Trash2, FolderOpen, Check, Circle, MonitorUp } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useNoteStore, useTagStore } from '@/stores';
import { NoteList } from '@/components/note';
import { Editor } from '@/components/editor';
import { Button } from '@/components/ui';
import type { Note, NoteColor } from '@/types';
import { cn, noteColors } from '@/utils';

type ViewMode = 'all' | 'tag' | 'trash';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const {
    loadNotes,
    addNote,
    updateNote,
    deleteNote,
    permanentDeleteNote,
    toggleComplete,
    getActiveNotes,
    getDeletedNotes,
    getNotesByTag,
  } = useNoteStore();

  const { tags, selectedTagId, setSelectedTag } = useTagStore();

  // 加载便签数据
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // 获取当前显示的便签
  const getDisplayNotes = useCallback(() => {
    let displayNotes: Note[] = [];

    if (viewMode === 'trash') {
      displayNotes = getDeletedNotes();
    } else if (viewMode === 'tag' && selectedTagId) {
      displayNotes = getNotesByTag(selectedTagId);
    } else {
      displayNotes = getActiveNotes();
    }

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      displayNotes = displayNotes.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.plainText.toLowerCase().includes(query)
      );
    }

    // 排序：置顶优先，然后按更新时间
    return displayNotes.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [viewMode, selectedTagId, searchQuery, getActiveNotes, getDeletedNotes, getNotesByTag]);

  // 创建新便签
  const handleCreateNote = () => {
    const note = addNote();
    setEditingNote(note);
  };

  // 打开便签
  const handleOpenNote = (note: Note) => {
    setEditingNote(note);
  };

  // 删除便签
  const handleDeleteNote = (note: Note) => {
    if (viewMode === 'trash') {
      permanentDeleteNote(note.id);
    } else {
      deleteNote(note.id);
    }
    if (editingNote?.id === note.id) {
      setEditingNote(null);
    }
  };

  // 切换置顶
  const handleTogglePin = (note: Note) => {
    updateNote(note.id, { isPinned: !note.isPinned });
  };

  // 切换完成状态
  const handleToggleComplete = (note: Note) => {
    toggleComplete(note.id);
    if (editingNote?.id === note.id) {
      setEditingNote({ ...editingNote, isCompleted: !note.isCompleted });
    }
  };

  // 弹出便签到桌面
  const handlePopOut = async (note: Note) => {
    try {
      await invoke('create_note_window', {
        noteId: note.id,
        title: note.title || '便签',
        color: note.color,
      });
    } catch (err) {
      console.error('Failed to create note window:', err);
    }
  };

  // 更新便签内容
  const handleContentChange = (content: string, plainText: string) => {
    if (editingNote) {
      updateNote(editingNote.id, { content, plainText });
      setEditingNote({ ...editingNote, content, plainText });
    }
  };

  // 更新便签颜色
  const handleColorChange = (color: NoteColor) => {
    if (editingNote) {
      updateNote(editingNote.id, { color });
      setEditingNote({ ...editingNote, color });
    }
  };

  const displayNotes = getDisplayNotes();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 侧边栏 */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">StickyNotes</h1>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          <button
            onClick={() => {
              setViewMode('all');
              setSelectedTag(null);
            }}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
              viewMode === 'all' && !selectedTagId
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <FolderOpen className="w-4 h-4" />
            全部便签
            <span className="ml-auto text-xs text-gray-400">
              {getActiveNotes().length}
            </span>
          </button>

          {/* 标签列表 */}
          {tags.length > 0 && (
            <div className="pt-4">
              <h3 className="px-3 text-xs font-medium text-gray-400 uppercase">
                标签
              </h3>
              <div className="mt-2 space-y-1">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      setViewMode('tag');
                      setSelectedTag(tag.id);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                      viewMode === 'tag' && selectedTagId === tag.id
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                    <span className="ml-auto text-xs text-gray-400">
                      {tag.noteCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 回收站 */}
          <div className="pt-4">
            <button
              onClick={() => {
                setViewMode('trash');
                setSelectedTag(null);
              }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                viewMode === 'trash'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Trash2 className="w-4 h-4" />
              回收站
              <span className="ml-auto text-xs text-gray-400">
                {getDeletedNotes().length}
              </span>
            </button>
          </div>
        </nav>

        {/* 设置按钮 */}
        <div className="p-2 border-t border-gray-200">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <Settings className="w-4 h-4" />
            设置
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部工具栏 */}
        <header className="h-14 px-4 flex items-center gap-4 border-b border-gray-200 bg-white">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索便签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-md pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button onClick={handleCreateNote} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            新建便签
          </Button>
        </header>

        {/* 内容区域 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 便签列表 */}
          <div className="flex-1 overflow-y-auto p-4">
            <NoteList
              notes={displayNotes}
              onOpenNote={handleOpenNote}
              onDeleteNote={handleDeleteNote}
              onTogglePin={handleTogglePin}
              onToggleComplete={handleToggleComplete}
            />
          </div>

          {/* 编辑面板 */}
          {editingNote && (
            <div
              className={cn(
                'w-96 border-l border-gray-200 flex flex-col',
                `note-${editingNote.color}`
              )}
            >
              {/* 编辑器头部 */}
              <div className="p-3 border-b border-black/10 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleComplete(editingNote)}
                  className={cn(
                    'p-1 rounded hover:bg-black/10 transition-colors flex-shrink-0',
                    editingNote.isCompleted ? 'text-green-600' : 'text-gray-400'
                  )}
                  title={editingNote.isCompleted ? '标记为未完成' : '标记为已完成'}
                >
                  {editingNote.isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="text"
                  placeholder="标题"
                  value={editingNote.title}
                  onChange={(e) => {
                    updateNote(editingNote.id, { title: e.target.value });
                    setEditingNote({ ...editingNote, title: e.target.value });
                  }}
                  className={cn(
                    'flex-1 bg-transparent text-lg font-medium focus:outline-none',
                    editingNote.isCompleted && 'line-through text-gray-500'
                  )}
                />
                <button
                  onClick={() => handlePopOut(editingNote)}
                  className="p-1 hover:bg-black/10 rounded flex-shrink-0 text-blue-600"
                  title="弹出到桌面"
                >
                  <MonitorUp className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setEditingNote(null)}
                  className="p-1 hover:bg-black/10 rounded flex-shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* 完成状态提示 */}
              {editingNote.isCompleted && (
                <div className="px-3 py-1.5 bg-green-50 border-b border-green-100 text-green-700 text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  已完成
                </div>
              )}

              {/* 颜色选择 */}
              <div className="px-3 py-2 border-b border-black/10 flex gap-2">
                {(Object.keys(noteColors) as NoteColor[]).map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={cn(
                      'w-6 h-6 rounded-full border-2',
                      editingNote.color === color
                        ? 'border-gray-800'
                        : 'border-transparent'
                    )}
                    style={{ backgroundColor: noteColors[color].bg }}
                    title={noteColors[color].name}
                  />
                ))}
              </div>

              {/* 编辑器 */}
              <div className="flex-1 overflow-hidden">
                <Editor
                  content={editingNote.content}
                  onChange={handleContentChange}
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
