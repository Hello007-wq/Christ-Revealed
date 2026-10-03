import { all, initLocalDb, run } from '@/lib/local-db';
import supabase, { getAuthSnapshot, getSafeUser } from '@/lib/supabase';
import { Playlist, Sermon } from '@/types';

type PlaylistRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

type PlaylistSermonRow = {
  user_id: string;
  playlist_id: string;
  sermon_id: string;
  title: string;
  speaker: string;
  date: string;
  duration: number;
  media_type: 'audio' | 'video';
  image_url: string | null;
  tags_json: string;
  views: number;
  downloads: number;
};

let initialized = false;

async function ensureInit() {
  if (!initialized) {
    await initLocalDb();
    initialized = true;
  }
}

async function getCurrentUserId() {
  const snapshot = await getAuthSnapshot();
  if (snapshot?.userId) return snapshot.userId;

  try {
    const user = await getSafeUser();
    if (user?.id) return user.id;
  } catch {
    // Fall through to local snapshot for offline or slow-network cases.
  }
  throw new Error('Please sign in first.');
}

function mapSermon(row: PlaylistSermonRow): Sermon {
  return {
    id: row.sermon_id,
    title: row.title,
    speaker: row.speaker,
    date: row.date,
    duration: row.duration,
    mediaType: row.media_type,
    imageUrl: row.image_url ?? '',
    tags: JSON.parse(row.tags_json || '[]'),
    views: row.views ?? 0,
    downloads: row.downloads ?? 0,
  };
}

export async function getPlaylists() {
  await ensureInit();
  const userId = await getCurrentUserId();
  const playlists = await all<PlaylistRow>(
    `SELECT * FROM playlists WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );
  const sermonRows = await all<PlaylistSermonRow>(
    `SELECT * FROM playlist_sermons WHERE user_id = ? ORDER BY added_at DESC`,
    [userId]
  );

  const sermonsByPlaylist = sermonRows.reduce<Record<string, Sermon[]>>((acc, row) => {
    if (!acc[row.playlist_id]) acc[row.playlist_id] = [];
    acc[row.playlist_id].push(mapSermon(row));
    return acc;
  }, {});

  return playlists.map((playlist) => ({
    id: playlist.id,
    name: playlist.name,
    createdAt: playlist.created_at,
    sermons: sermonsByPlaylist[playlist.id] ?? [],
  })) as Playlist[];
}

export async function getPlaylistById(id: string) {
  const playlists = await getPlaylists();
  return playlists.find((playlist) => playlist.id === id) ?? null;
}

export async function createPlaylist(name: string) {
  await ensureInit();
  const userId = await getCurrentUserId();
  const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const createdAt = new Date().toISOString();
  await run(`INSERT INTO playlists (id, user_id, name, created_at) VALUES (?, ?, ?, ?)`, [id, userId, name.trim(), createdAt]);
  return { id, name: name.trim(), createdAt, sermons: [] } as Playlist;
}

export async function deletePlaylist(id: string) {
  await ensureInit();
  const userId = await getCurrentUserId();
  await run(`DELETE FROM playlist_sermons WHERE playlist_id = ? AND user_id = ?`, [id, userId]);
  await run(`DELETE FROM playlists WHERE id = ? AND user_id = ?`, [id, userId]);
}

export async function addSermonToPlaylist(playlistId: string, sermon: Sermon) {
  await ensureInit();
  const userId = await getCurrentUserId();
  await run(
    `INSERT OR REPLACE INTO playlist_sermons
     (user_id, playlist_id, sermon_id, title, speaker, date, duration, media_type, image_url, tags_json, views, downloads, added_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      playlistId,
      sermon.id,
      sermon.title,
      sermon.speaker,
      sermon.date,
      sermon.duration,
      sermon.mediaType,
      sermon.imageUrl,
      JSON.stringify(sermon.tags ?? []),
      sermon.views,
      sermon.downloads,
      new Date().toISOString(),
    ]
  );
}

export async function removeSermonFromPlaylist(playlistId: string, sermonId: string) {
  await ensureInit();
  const userId = await getCurrentUserId();
  await run(`DELETE FROM playlist_sermons WHERE playlist_id = ? AND sermon_id = ? AND user_id = ?`, [playlistId, sermonId, userId]);
}

export async function getSavedSermonIds() {
  await ensureInit();
  const userId = await getCurrentUserId();
  const rows = await all<{ sermon_id: string }>(
    `SELECT DISTINCT sermon_id FROM playlist_sermons WHERE user_id = ?`,
    [userId]
  );
  return rows.map((row) => row.sermon_id);
}
