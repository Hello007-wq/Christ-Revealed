import { all, initLocalDb, run } from '@/lib/local-db';

export type OfflineNote = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

function makeId() {
  return `note-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export async function getOfflineNotes() {
  await initLocalDb();
  return all<OfflineNote>(
    `SELECT id, title, content, created_at, updated_at
     FROM offline_notes
     ORDER BY updated_at DESC`
  );
}

export async function saveOfflineNote(note: {
  id?: string;
  title: string;
  content: string;
}) {
  await initLocalDb();

  const now = new Date().toISOString();
  const id = note.id ?? makeId();
  const title = note.title.trim() || 'Untitled note';
  const content = note.content.trim();

  if (note.id) {
    await run(
      `UPDATE offline_notes
       SET title = ?, content = ?, updated_at = ?
       WHERE id = ?`,
      [title, content, now, id]
    );
  } else {
    await run(
      `INSERT INTO offline_notes (id, title, content, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, title, content, now, now]
    );
  }

  return id;
}

export async function deleteOfflineNote(id: string) {
  await initLocalDb();
  await run(`DELETE FROM offline_notes WHERE id = ?`, [id]);
}
