import supabase, { requireSafeUser } from '@/lib/supabase';

export type NewsPost = {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  headline: string | null;
  body: string | null;
  created_by: string;
  created_at: string;
  story_group_id: string | null;
  media_index: number;
};

export type NewsStory = {
  id: string;
  coverPostId: string;
  headline: string;
  body: string;
  caption: string | null;
  created_at: string;
  media: NewsPost[];
};

export type NewsMetrics = {
  reactionCount: number;
  commentCount: number;
  reacted: boolean;
};

export type NewsComment = {
  id: string;
  news_post_id: string;
  author: string;
  content: string;
  created_at: string;
};

async function getCurrentUserId() {
  const user = await requireSafeUser();
  return user.id;
}

export async function getNewsPosts(limit = 80) {
  const { data, error } = await supabase
    .from('news_posts')
    .select('id, media_url, media_type, caption, headline, body, created_by, created_at, story_group_id, media_index')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as NewsPost[];
}

export async function getNewsStories(limit = 40) {
  const posts = await getNewsPosts(limit * 5);
  const grouped = new Map<string, NewsStory>();

  posts.forEach((post) => {
    const key = post.story_group_id || post.id;
    const existing = grouped.get(key);
    if (existing) {
      existing.media.push(post);
      return;
    }

    grouped.set(key, {
      id: key,
      coverPostId: post.id,
      headline: post.headline || post.caption || 'Church News',
      body: post.body || post.caption || '',
      caption: post.caption,
      created_at: post.created_at,
      media: [post],
    });
  });

  return Array.from(grouped.values())
    .map((story) => ({
      ...story,
      media: story.media.slice().sort((a, b) => a.media_index - b.media_index),
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export async function getNewsStoryById(storyId: string) {
  const stories = await getNewsStories(80);
  return stories.find((story) => story.id === storyId) ?? null;
}

export async function createNewsStory(input: {
  mediaItems: { mediaUrl: string; mediaType: 'image' | 'video' }[];
  headline: string;
  body: string;
  caption?: string;
}) {
  const user = await requireSafeUser();
  if (!input.mediaItems.length) {
    throw new Error('Add at least one image or video.');
  }

  const storyGroupId =
    input.mediaItems.length > 1 ? `news-${Date.now()}-${Math.random().toString(16).slice(2, 8)}` : null;

  const { data, error } = await supabase
    .from('news_posts')
    .insert(
      input.mediaItems.map((item, index) => ({
        media_url: item.mediaUrl,
        media_type: item.mediaType,
        caption: input.caption?.trim() || null,
        headline: input.headline.trim(),
        body: input.body.trim(),
        created_by: user.id,
        story_group_id: storyGroupId,
        media_index: index,
      }))
    )
    .select('id, media_url, media_type, caption, headline, body, created_by, created_at, story_group_id, media_index');

  if (error) throw error;
  const stories = await getNewsStories(80);
  const key = storyGroupId || (data?.[0]?.id as string);
  return stories.find((story) => story.id === key) ?? null;
}

export async function deleteNewsStory(storyId: string, coverPostId: string) {
  const { error } = await supabase.from('news_posts').delete().or(`story_group_id.eq.${storyId},id.eq.${coverPostId}`);
  if (error) throw error;
}

export async function getNewsMetrics(postIds: string[]) {
  if (!postIds.length) return {} as Record<string, NewsMetrics>;
  const userId = await getCurrentUserId().catch(() => null);

  const [{ data: reactions }, { data: comments }] = await Promise.all([
    supabase.from('news_reactions').select('news_post_id, user_id').in('news_post_id', postIds),
    supabase.from('news_comments').select('id, news_post_id').in('news_post_id', postIds),
  ]);

  const metrics: Record<string, NewsMetrics> = {};
  for (const id of postIds) {
    metrics[id] = { reactionCount: 0, commentCount: 0, reacted: false };
  }

  for (const row of reactions ?? []) {
    const postId = String((row as any).news_post_id);
    if (!metrics[postId]) continue;
    metrics[postId].reactionCount += 1;
    if (userId && String((row as any).user_id) === userId) {
      metrics[postId].reacted = true;
    }
  }

  for (const row of comments ?? []) {
    const postId = String((row as any).news_post_id);
    if (!metrics[postId]) continue;
    metrics[postId].commentCount += 1;
  }

  return metrics;
}

export async function toggleNewsReaction(postId: string) {
  const userId = await getCurrentUserId();
  const { data: existing, error: existingError } = await supabase
    .from('news_reactions')
    .select('id')
    .eq('news_post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing?.id) {
    const { error } = await supabase.from('news_reactions').delete().eq('id', existing.id);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase.from('news_reactions').insert({ news_post_id: postId, user_id: userId });
  if (error) throw error;
  return true;
}

export async function getNewsComments(postId: string) {
  const { data, error } = await supabase
    .from('news_comments')
    .select('id, news_post_id, author, content, created_at')
    .eq('news_post_id', postId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as NewsComment[];
}

export async function addNewsComment(postId: string, content: string) {
  const user = await requireSafeUser();

  const { data, error } = await supabase
    .from('news_comments')
    .insert({
      news_post_id: postId,
      user_id: user.id,
      author: user.user_metadata?.full_name || user.email || 'Church Member',
      content: content.trim(),
    })
    .select('id, news_post_id, author, content, created_at')
    .single();

  if (error) throw error;
  return data as NewsComment;
}
