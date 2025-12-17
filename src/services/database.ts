import Database from '@tauri-apps/plugin-sql';
import type { Note, Tag, NoteWindow } from '@/types';

let db: Database | null = null;

/**
 * 初始化数据库
 */
export async function initDatabase(): Promise<Database> {
  if (db) return db;

  db = await Database.load('sqlite:notes.db');

  // 执行迁移
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '{}',
      plain_text TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT 'yellow',
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'active',
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_locked INTEGER NOT NULL DEFAULT 0,
      is_completed INTEGER NOT NULL DEFAULT 0,
      tags TEXT NOT NULL DEFAULT '[]',
      reminder_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      completed_at TEXT
    )
  `);

  // 迁移：添加 is_completed 和 completed_at 列（如果不存在）
  try {
    await db.execute('ALTER TABLE notes ADD COLUMN is_completed INTEGER NOT NULL DEFAULT 0');
  } catch {
    // 列已存在，忽略错误
  }
  try {
    await db.execute('ALTER TABLE notes ADD COLUMN completed_at TEXT');
  } catch {
    // 列已存在，忽略错误
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      remind_at TEXT NOT NULL,
      repeat_type TEXT NOT NULL DEFAULT 'none',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS window_states (
      note_id TEXT PRIMARY KEY,
      x REAL NOT NULL,
      y REAL NOT NULL,
      width REAL NOT NULL,
      height REAL NOT NULL,
      is_always_on_top INTEGER NOT NULL DEFAULT 0,
      opacity REAL NOT NULL DEFAULT 1.0
    )
  `);

  // 创建索引
  await db.execute('CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at)');

  return db;
}

/**
 * 获取数据库实例
 */
export async function getDatabase(): Promise<Database> {
  if (!db) {
    return initDatabase();
  }
  return db;
}

// ==================== Notes ====================

interface NoteRow {
  id: string;
  title: string;
  content: string;
  plain_text: string;
  color: string;
  priority: string;
  status: string;
  is_pinned: number;
  is_locked: number;
  is_completed: number;
  tags: string;
  reminder_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  completed_at: string | null;
}

function rowToNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    plainText: row.plain_text,
    color: row.color as Note['color'],
    priority: row.priority as Note['priority'],
    status: row.status as Note['status'],
    isPinned: row.is_pinned === 1,
    isLocked: row.is_locked === 1,
    isCompleted: row.is_completed === 1,
    tags: JSON.parse(row.tags || '[]'),
    reminderId: row.reminder_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
  };
}

export async function getAllNotes(): Promise<Note[]> {
  const database = await getDatabase();
  const rows = await database.select<NoteRow[]>('SELECT * FROM notes ORDER BY updated_at DESC');
  return rows.map(rowToNote);
}

export async function getNoteById(id: string): Promise<Note | null> {
  const database = await getDatabase();
  const rows = await database.select<NoteRow[]>('SELECT * FROM notes WHERE id = ?', [id]);
  return rows.length > 0 ? rowToNote(rows[0]) : null;
}

export async function createNote(note: Note): Promise<void> {
  const database = await getDatabase();
  await database.execute(
    `INSERT INTO notes (id, title, content, plain_text, color, priority, status, is_pinned, is_locked, is_completed, tags, reminder_id, created_at, updated_at, deleted_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      note.id,
      note.title,
      note.content,
      note.plainText,
      note.color,
      note.priority,
      note.status,
      note.isPinned ? 1 : 0,
      note.isLocked ? 1 : 0,
      note.isCompleted ? 1 : 0,
      JSON.stringify(note.tags),
      note.reminderId ?? null,
      note.createdAt,
      note.updatedAt,
      note.deletedAt ?? null,
      note.completedAt ?? null,
    ]
  );
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<void> {
  const database = await getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(updates.content);
  }
  if (updates.plainText !== undefined) {
    fields.push('plain_text = ?');
    values.push(updates.plainText);
  }
  if (updates.color !== undefined) {
    fields.push('color = ?');
    values.push(updates.color);
  }
  if (updates.priority !== undefined) {
    fields.push('priority = ?');
    values.push(updates.priority);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.isPinned !== undefined) {
    fields.push('is_pinned = ?');
    values.push(updates.isPinned ? 1 : 0);
  }
  if (updates.isLocked !== undefined) {
    fields.push('is_locked = ?');
    values.push(updates.isLocked ? 1 : 0);
  }
  if (updates.tags !== undefined) {
    fields.push('tags = ?');
    values.push(JSON.stringify(updates.tags));
  }
  if (updates.reminderId !== undefined) {
    fields.push('reminder_id = ?');
    values.push(updates.reminderId);
  }
  if (updates.deletedAt !== undefined) {
    fields.push('deleted_at = ?');
    values.push(updates.deletedAt);
  }
  if (updates.isCompleted !== undefined) {
    fields.push('is_completed = ?');
    values.push(updates.isCompleted ? 1 : 0);
  }
  if (updates.completedAt !== undefined) {
    fields.push('completed_at = ?');
    values.push(updates.completedAt);
  }

  // 总是更新 updated_at
  fields.push('updated_at = ?');
  values.push(new Date().toISOString());

  values.push(id);

  await database.execute(`UPDATE notes SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteNote(id: string): Promise<void> {
  const database = await getDatabase();
  await database.execute('DELETE FROM notes WHERE id = ?', [id]);
}

// ==================== Tags ====================

interface TagRow {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

function rowToTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon ?? undefined,
    noteCount: 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllTags(): Promise<Tag[]> {
  const database = await getDatabase();
  const rows = await database.select<TagRow[]>('SELECT * FROM tags ORDER BY name');
  return rows.map(rowToTag);
}

export async function createTag(tag: Tag): Promise<void> {
  const database = await getDatabase();
  await database.execute(
    'INSERT INTO tags (id, name, color, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [tag.id, tag.name, tag.color, tag.icon ?? null, tag.createdAt, tag.updatedAt]
  );
}

export async function updateTag(id: string, updates: Partial<Tag>): Promise<void> {
  const database = await getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.color !== undefined) {
    fields.push('color = ?');
    values.push(updates.color);
  }
  if (updates.icon !== undefined) {
    fields.push('icon = ?');
    values.push(updates.icon);
  }

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await database.execute(`UPDATE tags SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteTag(id: string): Promise<void> {
  const database = await getDatabase();
  await database.execute('DELETE FROM tags WHERE id = ?', [id]);
}

// ==================== Window States ====================

interface WindowStateRow {
  note_id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  is_always_on_top: number;
  opacity: number;
}

export async function getWindowState(noteId: string): Promise<NoteWindow | null> {
  const database = await getDatabase();
  const rows = await database.select<WindowStateRow[]>(
    'SELECT * FROM window_states WHERE note_id = ?',
    [noteId]
  );

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    noteId: row.note_id,
    windowLabel: `note-${row.note_id}`,
    position: { x: row.x, y: row.y },
    size: { width: row.width, height: row.height },
    isAlwaysOnTop: row.is_always_on_top === 1,
    opacity: row.opacity,
  };
}

export async function saveWindowState(state: NoteWindow): Promise<void> {
  const database = await getDatabase();
  await database.execute(
    `INSERT OR REPLACE INTO window_states (note_id, x, y, width, height, is_always_on_top, opacity)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      state.noteId,
      state.position.x,
      state.position.y,
      state.size.width,
      state.size.height,
      state.isAlwaysOnTop ? 1 : 0,
      state.opacity,
    ]
  );
}

export async function deleteWindowState(noteId: string): Promise<void> {
  const database = await getDatabase();
  await database.execute('DELETE FROM window_states WHERE note_id = ?', [noteId]);
}
