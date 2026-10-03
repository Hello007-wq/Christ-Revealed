import supabase, { requireSafeUser } from '@/lib/supabase';
import { first, initLocalDb, run } from '@/lib/local-db';

export type PhotoPost = {
  id: string;
  image_url: string;
  storage_path?: string | null;
  caption: string | null;
  created_at: string;
  created_by: string;
  gallery_group_id: string | null;
  gallery_index: number;
};

export type PhotoMetrics = {
  reactionCount: number;
  commentCount: number;
  reacted: boolean;
};

export type PhotoComment = {
  id: string;
  media_post_id: string;
  author: string;
  content: string;
  created_at: string;
};

function isMissingStoragePathColumn(error: any) {
  const message = String(error?.message ?? error ?? '').toLowerCase();
  return message.includes('storage_path') && (message.includes('column') || message.includes('schema cache'));
}

async function getCurrentUserId() {
  const user = await requireSafeUser();
  return user.id;
}

async function getSeenKey() {
  const userId = await getCurrentUserId();
  return `photos_last_seen_${userId}`;
}

export async function getPhotoPosts(limit = 60) {
  try {
    await supabase.rpc('cleanup_expired_social_content');
  } catch {
    // Continue even if cleanup RPC is unavailable.
  }
  let { data, error } = await supabase
    .from('media_posts')
    .select('id, image_url, storage_path, caption, created_at, created_by, gallery_group_id, gallery_index')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error && isMissingStoragePathColumn(error)) {
    const fallback = await supabase
      .from('media_posts')
      .select('id, image_url, caption, created_at, created_by, gallery_group_id, gallery_index')
      .order('created_at', { ascending: false })
      .limit(limit);
    data = fallback.data as any;
    error = fallback.error as any;
  }

  if (error) throw error;
  return (data ?? []) as PhotoPost[];
}

export async function getUnseenPhotoCount() {
  await initLocalDb();
  const key = await getSeenKey();
  const seenRow = await first<{ value: string | null }>(`SELECT value FROM settings WHERE key = ?`, [key]);
  const seenAt = seenRow?.value ?? null;

  const posts = await getPhotoPosts(100);
  if (!seenAt) return posts.length;
  const seenTime = new Date(seenAt).getTime();
  return posts.filter((post) => new Date(post.created_at).getTime() > seenTime).length;
}

export async function markPhotosSeen() {
  await initLocalDb();
  const key = await getSeenKey();
  await run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [key, new Date().toISOString()]);
}

export async function createPhotoPost(imageUrl: string, caption: string) {
  const [created] = await createPhotoPosts([imageUrl], caption);
  return created;
}

type NewPhotoItem = string | { imageUrl: string; storagePath?: string | null };

export async function createPhotoPosts(imageItems: NewPhotoItem[], caption: string) {
  const user = await requireSafeUser();
  if (!imageItems.length) throw new Error('Select at least one image.');

  const galleryGroupId =
    imageItems.length > 1 ? `gallery-${Date.now()}-${Math.random().toString(16).slice(2, 8)}` : null;

  let { data, error } = await supabase
    .from('media_posts')
    .insert(
      imageItems.map((item, index) => ({
        image_url: typeof item === 'string' ? item : item.imageUrl,
        storage_path: typeof item === 'string' ? null : item.storagePath ?? null,
        caption: caption.trim() || null,
        created_by: user.id,
        gallery_group_id: galleryGroupId,
        gallery_index: index,
      }))
    )
    .select('id, image_url, storage_path, caption, created_at, created_by, gallery_group_id, gallery_index');

  if (error && isMissingStoragePathColumn(error)) {
    const fallback = await supabase
      .from('media_posts')
      .insert(
        imageItems.map((item, index) => ({
          image_url: typeof item === 'string' ? item : item.imageUrl,
          caption: caption.trim() || null,
          created_by: user.id,
          gallery_group_id: galleryGroupId,
          gallery_index: index,
        }))
      )
      .select('id, image_url, caption, created_at, created_by, gallery_group_id, gallery_index');
    data = fallback.data as any;
    error = fallback.error as any;
  }

  if (error) throw error;
  return (data ?? []) as PhotoPost[];
}

export async function deletePhotoPost(postId: string) {
  const { data: existing, error: existingError } = await supabase
    .from('media_posts')
    .select('storage_path')
    .eq('id', postId)
    .maybeSingle();

  if (!existingError && existing?.storage_path) {
    await supabase.storage.from('gallery').remove([existing.storage_path]).catch(() => undefined);
  }
  const { error } = await supabase.from('media_posts').delete().eq('id', postId);
  if (error) throw error;
}

export async function getPhotoMetrics(postIds: string[]) {
  if (!postIds.length) return {} as Record<string, PhotoMetrics>;
  const userId = await getCurrentUserId().catch(() => null);

  const [{ data: reactions }, { data: comments }] = await Promise.all([
    supabase.from('media_post_reactions').select('media_post_id, user_id').in('media_post_id', postIds),
    supabase.from('media_post_comments').select('id, media_post_id').in('media_post_id', postIds),
  ]);

  const metrics: Record<string, PhotoMetrics> = {};
  for (const id of postIds) {
    metrics[id] = { reactionCount: 0, commentCount: 0, reacted: false };
  }

  for (const row of reactions ?? []) {
    const postId = String((row as any).media_post_id);
    if (!metrics[postId]) continue;
    metrics[postId].reactionCount += 1;
    if (userId && String((row as any).user_id) === userId) metrics[postId].reacted = true;
  }

  for (const row of comments ?? []) {
    const postId = String((row as any).media_post_id);
    if (!metrics[postId]) continue;
    metrics[postId].commentCount += 1;
  }

  return metrics;
}

export async function togglePhotoReaction(postId: string) {
  const userId = await getCurrentUserId();
  const { data: existing, error: existingError } = await supabase
    .from('media_post_reactions')
    .select('id')
    .eq('media_post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing?.id) {
    const { error } = await supabase.from('media_post_reactions').delete().eq('id', existing.id);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase.from('media_post_reactions').insert({ media_post_id: postId, user_id: userId });
  if (error) throw error;
  return true;
}

export async function getPhotoComments(postId: string) {
  const { data, error } = await supabase
    .from('media_post_comments')
    .select('id, media_post_id, author, content, created_at')
    .eq('media_post_id', postId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PhotoComment[];
}

export async function addPhotoComment(postId: string, content: string) {
  const user = await requireSafeUser();

  const payload = {
    media_post_id: postId,
    user_id: user.id,
    author: user.user_metadata?.full_name || user.email || 'Community Member',
    content: content.trim(),
  };

  const { data, error } = await supabase
    .from('media_post_comments')
    .insert(payload)
    .select('id, media_post_id, author, content, created_at')
    .single();
  if (error) throw error;
  return data as PhotoComment;
}
