import { all, first, initLocalDb, run } from '@/lib/local-db';
import supabase, { getAuthSnapshot, getSafeUser } from '@/lib/supabase';
import { Sermon } from '@/types';

export interface LiveServiceItem {
  id: string;
  title: string;
  scheduledTime: string;
  isLive: boolean;
  reminderSet: boolean;
}

export interface SermonDetail extends Sermon {
  mediaUrl?: string | null;
  mp3Url?: string | null;
}

export interface UploadSermonInput {
  title: string;
  speaker: string;
  duration: number;
  tags: string[];
  scheduledDate: string;
  mediaType: 'video' | 'audio';
  youtubeUrl: string;
  mp3Url?: string;
}

type SupabaseSermon = {
  id: string;
  title: string;
  speaker: string;
  date: string;
  duration: number;
  media_type: 'audio' | 'video';
  image_url: string | null;
  media_url: string | null;
  mp3_url: string | null;
  tags_json: string | null;
  views: number | null;
  downloads: number | null;
};

type DbSermon = {
  id: string;
  title: string;
  speaker: string;
  date: string;
  duration: number;
  media_type: 'audio' | 'video';
  image_url: string | null;
  media_url: string | null;
  mp3_url: string | null;
  tags_json: string;
  views: number;
  downloads: number;
};

type DbLiveService = {
  id: string;
  title: string;
  scheduled_time: string;
  is_live: number;
  reminder_set: number;
};

let initialized = false;

function mapSupabaseSermon(s: SupabaseSermon): SermonDetail {
  return {
    id: String(s.id),
    title: s.title,
    speaker: s.speaker,
    date: String(s.date),
    duration: Number(s.duration ?? 0),
    mediaType: s.media_type ?? 'video',
    imageUrl: s.image_url ?? youtubeThumbnail(s.media_url) ?? '',
    mediaUrl: s.media_url ?? null,
    mp3Url: s.mp3_url ?? null,
    tags: JSON.parse(s.tags_json || '[]'),
    views: Number(s.views ?? 0),
    downloads: Number(s.downloads ?? 0),
  };
}

function mapDbSermon(s: DbSermon): SermonDetail {
  return {
    id: s.id,
    title: s.title,
    speaker: s.speaker,
    date: s.date,
    duration: s.duration,
    mediaType: s.media_type,
    imageUrl: s.image_url ?? youtubeThumbnail(s.media_url) ?? '',
    mediaUrl: s.media_url,
    mp3Url: s.mp3_url,
    tags: JSON.parse(s.tags_json || '[]'),
    views: s.views ?? 0,
    downloads: s.downloads ?? 0,
  };
}

function mapDbLiveService(item: DbLiveService): LiveServiceItem {
  return {
    id: item.id,
    title: item.title,
    scheduledTime: item.scheduled_time,
    isLive: item.is_live === 1,
    reminderSet: item.reminder_set === 1,
  };
}

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
    return null;
  }

  return null;
}

async function cacheSermons(sermons: SermonDetail[]) {
  const now = new Date().toISOString();
  for (const s of sermons) {
    await run(
      `INSERT OR REPLACE INTO sermons
       (id, title, speaker, date, duration, media_type, image_url, media_url, mp3_url, tags_json, views, downloads, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id,
        s.title,
        s.speaker,
        s.date,
        s.duration,
        s.mediaType,
        s.imageUrl || null,
        s.mediaUrl ?? null,
        s.mp3Url ?? null,
        JSON.stringify(s.tags ?? []),
        s.views ?? 0,
        s.downloads ?? 0,
        now,
      ]
    );
  }
}

async function getLocalSermons(limit?: number) {
  const sql = `SELECT * FROM sermons ORDER BY date DESC${typeof limit === 'number' ? ' LIMIT ?' : ''}`;
  const rows = await all<DbSermon>(sql, typeof limit === 'number' ? [limit] : []);
  return rows.map(mapDbSermon);
}

async function getLocalSermonById(id: string) {
  const row = await first<DbSermon>(`SELECT * FROM sermons WHERE id = ?`, [id]);
  return row ? mapDbSermon(row) : null;
}

async function fetchSermonsFromSupabase(limit?: number) {
  let query = supabase
    .from('sermons')
    .select('id, title, speaker, date, duration, media_type, image_url, media_url, mp3_url, tags_json, views, downloads')
    .order('date', { ascending: false });
  if (typeof limit === 'number') query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapSupabaseSermon(row as SupabaseSermon));
}

async function fetchSermonByIdFromSupabase(id: string) {
  const { data, error } = await supabase
    .from('sermons')
    .select('id, title, speaker, date, duration, media_type, image_url, media_url, mp3_url, tags_json, views, downloads')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSupabaseSermon(data as SupabaseSermon) : null;
}

export function extractYoutubeId(url?: string | null) {
  if (!url) return null;
  const v = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/i);
  const embed = url.match(/youtube\.com\/embed\/([^&?/]+)/i);
  const live = url.match(/youtube\.com\/live\/([^&?/]+)/i);
  return v?.[1] ?? embed?.[1] ?? live?.[1] ?? null;
}

export function toYoutubeEmbedUrl(url?: string | null) {
  const id = extractYoutubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function youtubeThumbnail(url?: string | null) {
  const id = extractYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

export async function getRecentSermons(limit = 5) {
  await ensureInit();
  const local = await getLocalSermons(limit);
  if (local.length) {
    fetchSermonsFromSupabase(limit).then(cacheSermons).catch(() => undefined);
    return local;
  }
  try {
    const remote = await fetchSermonsFromSupabase(limit);
    await cacheSermons(remote);
    return remote;
  } catch {
    return local;
  }
}

export async function getAllSermons() {
  await ensureInit();
  const local = await getLocalSermons();
  if (local.length) {
    fetchSermonsFromSupabase().then(cacheSermons).catch(() => undefined);
    return local;
  }
  try {
    const remote = await fetchSermonsFromSupabase();
    await cacheSermons(remote);
    return remote;
  } catch {
    return local;
  }
}

export async function getSermonById(id: string) {
  await ensureInit();
  const local = await getLocalSermonById(id);
  if (local) {
    fetchSermonByIdFromSupabase(id)
      .then((remote) => (remote ? cacheSermons([remote]) : undefined))
      .catch(() => undefined);
    return local;
  }
  try {
    const remote = await fetchSermonByIdFromSupabase(id);
    if (remote) await cacheSermons([remote]);
    return remote;
  } catch {
    return local;
  }
}

export async function getLiveServices(limit = 5) {
  await ensureInit();
  const rows = await all<DbLiveService>(
    `SELECT * FROM live_services ORDER BY scheduled_time ASC LIMIT ?`,
    [limit]
  );
  return rows.map(mapDbLiveService);
}

export async function setLocalReminder(serviceId: string, reminderSet: boolean) {
  await ensureInit();
  await run(`UPDATE live_services SET reminder_set = ?, updated_at = ? WHERE id = ?`, [
    reminderSet ? 1 : 0,
    new Date().toISOString(),
    serviceId,
  ]);
}

export async function incrementSermonView(sermonId: string) {
  await ensureInit();
  const userId = await getCurrentUserId();
  if (!userId) return;

  const viewKey = `sermon_view_${userId}_${sermonId}`;
  const existing = await first<{ value: string | null }>(`SELECT value FROM settings WHERE key = ?`, [viewKey]);
  if (existing?.value === '1') return;

  await run(`UPDATE sermons SET views = views + 1, updated_at = ? WHERE id = ?`, [
    new Date().toISOString(),
    sermonId,
  ]);
  await run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [viewKey, '1']);
  try {
    const { error } = await supabase.rpc('increment_sermon_view', { sermon_id_input: sermonId });
    if (error) throw error;
  } catch {
    // Keep local increment even if RPC fails.
  }
}

export async function incrementSermonDownload(sermonId: string) {
  await ensureInit();
  await run(`UPDATE sermons SET downloads = downloads + 1, updated_at = ? WHERE id = ?`, [
    new Date().toISOString(),
    sermonId,
  ]);
  try {
    const { error } = await supabase.rpc('increment_sermon_download', { sermon_id_input: sermonId });
    if (error) throw error;
  } catch {
    // Keep local increment even if RPC fails.
  }
}

export async function getPlaybackLinks(sermonId: string) {
  await ensureInit();
  const local = await getLocalSermonById(sermonId);
  if (local?.mediaUrl || local?.mp3Url) {
    fetchSermonByIdFromSupabase(sermonId)
      .then((remote) => (remote ? cacheSermons([remote]) : undefined))
      .catch(() => undefined);
    return { url: local.mediaUrl ?? null, mp3Url: local.mp3Url ?? null };
  }
  const remote = await fetchSermonByIdFromSupabase(sermonId).catch(() => null);
  if (remote) {
    await cacheSermons([remote]);
  }
  return { url: remote?.mediaUrl ?? null, mp3Url: remote?.mp3Url ?? null };
}

export async function uploadSermon(payload: UploadSermonInput) {
  await ensureInit();
  const youtubeUrl = payload.youtubeUrl.trim();
  if (!youtubeUrl) throw new Error('youtubeUrl is required');

  const row = {
    title: payload.title,
    speaker: payload.speaker,
    date: payload.scheduledDate,
    duration: payload.duration,
    media_type: payload.mediaType,
    image_url: youtubeThumbnail(youtubeUrl),
    media_url: youtubeUrl,
    mp3_url: payload.mp3Url?.trim() || null,
    tags_json: JSON.stringify(payload.tags ?? []),
    views: 0,
    downloads: 0,
  };

  const { data, error } = await supabase
    .from('sermons')
    .insert(row)
    .select('id, title, speaker, date, duration, media_type, image_url, media_url, mp3_url, tags_json, views, downloads')
    .single();
  if (error) throw error;

  const uploaded = mapSupabaseSermon(data as SupabaseSermon);
  await cacheSermons([uploaded]);
  return uploaded;
}

export async function deleteSermonById(sermonId: string) {
  await ensureInit();
  const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sermonId);
  if (uuidLike) {
    const { error } = await supabase.from('sermons').delete().eq('id', sermonId);
    if (error) throw error;
  }
  await run(`DELETE FROM sermons WHERE id = ?`, [sermonId]);
}
