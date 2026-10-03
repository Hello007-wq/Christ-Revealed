import supabase, { requireSafeUser } from '@/lib/supabase';
import { markCommunitySeen as markCommunitySeenInternal } from '@/lib/tab-badge-service';

export interface CommunityReply {
  id: string;
  post_id: string;
  author: string;
  content: string;
  created_at: string;
}

async function getCurrentUser() {
  return requireSafeUser();
}

export async function getCommunityReplies(postIds: string[]) {
  if (!postIds.length) return {} as Record<string, CommunityReply[]>;

  const { data, error } = await supabase
    .from('community_replies')
    .select('id, post_id, author, content, created_at')
    .in('post_id', postIds)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const grouped: Record<string, CommunityReply[]> = {};
  for (const postId of postIds) grouped[postId] = [];
  for (const row of data ?? []) {
    const postId = String((row as any).post_id);
    if (!grouped[postId]) grouped[postId] = [];
    grouped[postId].push(row as CommunityReply);
  }
  return grouped;
}

export async function addCommunityReply(postId: string, content: string) {
  const user = await getCurrentUser();
  const author = user.user_metadata?.full_name || user.email || 'Community Member';

  const { data, error } = await supabase
    .from('community_replies')
    .insert({
      post_id: postId,
      author,
      user_id: user.id,
      content: content.trim(),
    })
    .select('id, post_id, author, content, created_at')
    .single();

  if (error) throw error;

  const { error: updateError } = await supabase.rpc('increment_post_replies', {
    post_id_input: postId,
  });
  if (updateError) {
    await supabase.from('community_posts').update({ replies: 1 }).eq('id', postId);
  }

  return data as CommunityReply;
}

export async function getPrayerReactionState(prayerIds: string[]) {
  const user = await getCurrentUser();
  if (!prayerIds.length) return [] as string[];

  const { data, error } = await supabase
    .from('prayer_reactions')
    .select('prayer_id')
    .eq('user_id', user.id)
    .in('prayer_id', prayerIds);

  if (error) throw error;
  return (data ?? []).map((row: any) => String(row.prayer_id));
}

export async function togglePrayerReaction(prayerId: string, currentCount: number) {
  const user = await getCurrentUser();
  const { data: existing, error: existingError } = await supabase
    .from('prayer_reactions')
    .select('id')
    .eq('prayer_id', prayerId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (existingError) throw existingError;

  const nextCount = existing?.id ? Math.max(0, currentCount - 1) : currentCount + 1;

  if (existing?.id) {
    const { error } = await supabase.from('prayer_reactions').delete().eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('prayer_reactions').insert({
      prayer_id: prayerId,
      user_id: user.id,
    });
    if (error) throw error;
  }

  const { error: updateError } = await supabase
    .from('prayer_requests')
    .update({ prayers: nextCount })
    .eq('id', prayerId);
  if (updateError) throw updateError;

  return {
    reacted: !existing?.id,
    prayers: nextCount,
  };
}

export async function markCommunitySeen() {
  await markCommunitySeenInternal();
}
