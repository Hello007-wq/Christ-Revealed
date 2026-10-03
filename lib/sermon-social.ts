import supabase, { getSafeUser, requireSafeUser } from '@/lib/supabase';

export interface SermonMetrics {
  reactionCount: number;
  commentCount: number;
  reacted: boolean;
}

export interface SermonComment {
  id: string;
  sermon_id: string;
  author: string;
  content: string;
  created_at: string;
}

async function getCurrentUser() {
  return getSafeUser();
}

export async function getSermonMetrics(sermonIds: string[]) {
  if (!sermonIds.length) return {} as Record<string, SermonMetrics>;

  const user = await getCurrentUser().catch(() => null);

  const [{ data: reactions }, { data: comments }] = await Promise.all([
    supabase.from('sermon_reactions').select('sermon_id, user_id').in('sermon_id', sermonIds),
    supabase.from('sermon_comments').select('id, sermon_id').in('sermon_id', sermonIds),
  ]);

  const metrics: Record<string, SermonMetrics> = {};
  for (const id of sermonIds) {
    metrics[id] = { reactionCount: 0, commentCount: 0, reacted: false };
  }

  for (const reaction of reactions ?? []) {
    const sermonId = String((reaction as any).sermon_id);
    if (!metrics[sermonId]) continue;
    metrics[sermonId].reactionCount += 1;
    if (user && String((reaction as any).user_id) === user.id) {
      metrics[sermonId].reacted = true;
    }
  }

  for (const comment of comments ?? []) {
    const sermonId = String((comment as any).sermon_id);
    if (!metrics[sermonId]) continue;
    metrics[sermonId].commentCount += 1;
  }

  return metrics;
}

export async function getSermonComments(sermonId: string) {
  const { data, error } = await supabase
    .from('sermon_comments')
    .select('id, sermon_id, author, content, created_at')
    .eq('sermon_id', sermonId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SermonComment[];
}

export async function addSermonComment(sermonId: string, content: string) {
  const user = await requireSafeUser();
  if (!user) throw new Error('Please log in first.');

  const payload = {
    sermon_id: sermonId,
    user_id: user.id,
    author: user.user_metadata?.full_name || user.email || 'Community Member',
    content: content.trim(),
  };

  const { data, error } = await supabase
    .from('sermon_comments')
    .insert(payload)
    .select('id, sermon_id, author, content, created_at')
    .single();
  if (error) throw error;
  return data as SermonComment;
}

export async function toggleSermonReaction(sermonId: string) {
  const user = await requireSafeUser();
  if (!user) throw new Error('Please log in first.');

  const { data: existing, error: existingError } = await supabase
    .from('sermon_reactions')
    .select('id')
    .eq('sermon_id', sermonId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing?.id) {
    const { error } = await supabase.from('sermon_reactions').delete().eq('id', existing.id);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase.from('sermon_reactions').insert({
    sermon_id: sermonId,
    user_id: user.id,
  });
  if (error) throw error;
  return true;
}
