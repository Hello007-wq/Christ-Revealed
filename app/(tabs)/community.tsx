import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Heart, MessageSquareText, Plus, Send } from 'lucide-react-native';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import Card from '@/components/Card';
import CustomModal from '@/components/CustomModal';
import supabase, { getSafeUser } from '@/lib/supabase';
import { CommunityPost, PrayerRequest } from '@/types';
import {
  addCommunityReply,
  CommunityReply,
  getCommunityReplies,
  getPrayerReactionState,
  markCommunitySeen,
  togglePrayerReaction,
} from '@/lib/community-service';
import { useAppTheme } from '@/lib/theme';
import { useFocusEffect } from '@react-navigation/native';

type CommunityTab = 'discussions' | 'prayer' | 'testimonies';

export default function CommunityScreen() {
  const { colors } = useAppTheme();
  const [activeTab, setActiveTab] = useState<CommunityTab>('discussions');
  const [composerVisible, setComposerVisible] = useState(false);
  const [replyVisible, setReplyVisible] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [repliesByPost, setRepliesByPost] = useState<Record<string, CommunityReply[]>>({});
  const [reactedPrayerIds, setReactedPrayerIds] = useState<string[]>([]);
  const [replyPost, setReplyPost] = useState<CommunityPost | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    try {
      await supabase.rpc('cleanup_expired_social_content');
    } catch {
      // Keep loading content even if cleanup RPC is unavailable.
    }
    const minDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [user, { data: postData, error: postsError }, { data: prayerData, error: prayersError }] =
      await Promise.all([
        getSafeUser(),
        supabase
          .from('community_posts')
          .select('id, user_id, author, content, timestamp, type, replies, status')
          .gte('timestamp', minDate)
          .order('timestamp', { ascending: false })
          .limit(30),
        supabase
          .from('prayer_requests')
          .select('id, user_id, author, request, timestamp, prayers, status')
          .gte('timestamp', minDate)
          .order('timestamp', { ascending: false })
          .limit(30),
      ]);

    if (postsError || prayersError) {
      throw postsError || prayersError;
    }

    setCurrentUserId(user?.id ?? null);

    const nextPosts = (postData ?? []) as CommunityPost[];
    const nextPrayers = (prayerData ?? []) as PrayerRequest[];

    setPosts(nextPosts);
    setPrayers(nextPrayers);
    if (isRefresh) setRefreshing(false);
    else setLoading(false);

    Promise.all([
      getCommunityReplies(nextPosts.map((post) => post.id)),
      getPrayerReactionState(nextPrayers.map((item) => item.id)),
    ])
      .then(([replies, reacted]) => {
        setRepliesByPost(replies);
        setReactedPrayerIds(reacted);
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    setLoading(true);
    load().catch((error) => {
      Alert.alert('Community', error.message ?? 'Community data is not ready yet.');
      setLoading(false);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      setRefreshing(true);
      load(true)
        .then(() => {
          markCommunitySeen().catch(() => undefined);
        })
        .catch(() => setRefreshing(false));
    }, [])
  );

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const visible = post.status === 'approved' || (post.status === 'pending' && post.user_id === currentUserId);
      if (!visible) return false;
      if (activeTab === 'discussions') return post.type === 'discussion';
      if (activeTab === 'testimonies') return post.type === 'testimony';
      return false;
    });
  }, [activeTab, posts, currentUserId]);

  const prayerItems = useMemo(
    () =>
      prayers.filter((item) => {
        if (item.status === 'archived') return false;
        return item.status === 'approved' || (item.status === 'pending' && item.user_id === currentUserId);
      }),
    [prayers, currentUserId]
  );

  const handleSubmit = async () => {
    if (!newPostContent.trim()) return;
    try {
      setSubmitting(true);
      const user = await getSafeUser();
      const author = user?.user_metadata?.full_name || user?.email || 'Community Member';

      if (activeTab === 'prayer') {
        const userId = user?.id;
        if (!userId) throw new Error('Please sign in first.');
        const { error } = await supabase
          .from('prayer_requests')
          .insert({ author, user_id: userId, request: newPostContent.trim(), status: 'pending', prayers: 0 });
        if (error) throw error;
      } else {
        const type = activeTab === 'testimonies' ? 'testimony' : 'discussion';
        const userId = user?.id;
        if (!userId) throw new Error('Please sign in first.');
        const { error } = await supabase
          .from('community_posts')
          .insert({ author, user_id: userId, content: newPostContent.trim(), type, replies: 0, status: 'pending' });
        if (error) throw error;
      }

      setNewPostContent('');
      setComposerVisible(false);
      await load();
    } catch (error: any) {
      Alert.alert('Community', error.message ?? 'Unable to submit right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!replyPost || !replyContent.trim()) return;
    try {
      setSubmitting(true);
      const created = await addCommunityReply(replyPost.id, replyContent);
      setRepliesByPost((prev) => ({
        ...prev,
        [replyPost.id]: [...(prev[replyPost.id] ?? []), created],
      }));
      setPosts((prev) =>
        prev.map((post) => (post.id === replyPost.id ? { ...post, replies: (post.replies ?? 0) + 1 } : post))
      );
      setReplyContent('');
      setReplyVisible(false);
    } catch (error: any) {
      Alert.alert('Reply', error.message ?? 'Unable to send reply.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrayerToggle = async (request: PrayerRequest) => {
    const wasReacted = reactedPrayerIds.includes(request.id);
    const optimisticCount = wasReacted ? Math.max(0, (request.prayers || 0) - 1) : (request.prayers || 0) + 1;
    setPrayers((prev) =>
      prev.map((item) => (item.id === request.id ? { ...item, prayers: optimisticCount } : item))
    );
    setReactedPrayerIds((prev) =>
      wasReacted ? prev.filter((id) => id !== request.id) : [...prev, request.id]
    );
    try {
      await togglePrayerReaction(request.id, request.prayers || 0);
    } catch (error: any) {
      setPrayers((prev) =>
        prev.map((item) => (item.id === request.id ? { ...item, prayers: request.prayers || 0 } : item))
      );
      setReactedPrayerIds((prev) =>
        wasReacted ? [...prev, request.id] : prev.filter((id) => id !== request.id)
      );
      Alert.alert('Prayer', error.message ?? 'Unable to react right now.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.mutedBackground }]}>
      <View style={[styles.tabRow, { backgroundColor: colors.surface }]}>
        {[
          { key: 'discussions', label: 'Discussions' },
          { key: 'prayer', label: 'Prayer' },
          { key: 'testimonies', label: 'Testimonies' },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.tab, activeTab === item.key && styles.activeTab]}
            onPress={() => setActiveTab(item.key as CommunityTab)}
          >
            <Text style={[styles.tabText, { color: colors.mutedText }, activeTab === item.key && styles.activeTabText, activeTab === item.key && { color: colors.primary }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {refreshing ? <Text style={styles.refreshingText}>Refreshing...</Text> : null}
        <TouchableOpacity style={styles.addButton} onPress={() => setComposerVisible(true)}>
          <Plus size={18} color={COLORS.white} />
          <Text style={styles.addButtonText}>
            {activeTab === 'prayer'
              ? 'Submit a prayer request'
              : activeTab === 'testimonies'
                ? 'Share a testimony'
                : 'Start a discussion'}
          </Text>
        </TouchableOpacity>

        {activeTab === 'prayer'
          ? prayerItems.map((request) => {
              const reacted = reactedPrayerIds.includes(request.id);
              return (
                <Card key={request.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.author}>{request.author}</Text>
                      <Text style={styles.timestamp}>{new Date(request.timestamp).toLocaleString()}</Text>
                    </View>
                    <Text style={styles.prayerBadge}>{request.status}</Text>
                  </View>
                  <Text style={styles.content}>{request.request}</Text>
                  <TouchableOpacity style={styles.inlineAction} onPress={() => handlePrayerToggle(request)}>
                    <Heart
                      size={18}
                      color={reacted ? COLORS.error : COLORS.gray}
                      fill={reacted ? COLORS.error : 'none'}
                    />
                    <Text style={styles.inlineActionText}>{request.prayers} praying</Text>
                  </TouchableOpacity>
                </Card>
              );
            })
          : filteredPosts.map((post) => (
              <Card key={post.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.author}>{post.author}</Text>
                  <Text style={styles.timestamp}>{new Date(post.timestamp).toLocaleString()}</Text>
                  </View>
                  <Text style={styles.typeBadge}>{post.type}</Text>
                </View>
                <Text style={styles.content}>{post.content}</Text>
                {post.status === 'pending' ? (
                  <Text style={styles.pendingNote}>Pending admin approval</Text>
                ) : null}
                <TouchableOpacity
                  style={styles.replyButton}
                  onPress={() => {
                    setReplyPost(post);
                    setReplyVisible(true);
                  }}
                >
                  <MessageSquareText size={18} color={COLORS.primary} />
                  <Text style={styles.replyButtonText}>Reply ({post.replies || 0})</Text>
                </TouchableOpacity>

                {(repliesByPost[post.id] ?? []).map((reply) => (
                  <View key={reply.id} style={styles.replyCard}>
                    <Text style={styles.replyAuthor}>{reply.author}</Text>
                    <Text style={styles.replyBody}>{reply.content}</Text>
                    <Text style={styles.replyDate}>{new Date(reply.created_at).toLocaleString()}</Text>
                  </View>
                ))}
              </Card>
            ))}

        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Loading community...</Text>
            <Text style={styles.emptyText}>Pulling discussions, prayer requests, and testimonies.</Text>
          </View>
        ) : null}

        {!loading && (activeTab === 'prayer' ? prayerItems.length === 0 : filteredPosts.length === 0) ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nothing posted yet</Text>
            <Text style={styles.emptyText}>Be the first to add something meaningful here.</Text>
          </View>
        ) : null}
      </ScrollView>

      <CustomModal
        visible={composerVisible}
        onClose={() => setComposerVisible(false)}
        title={
          activeTab === 'prayer'
            ? 'Prayer Request'
            : activeTab === 'testimonies'
              ? 'Share Testimony'
              : 'New Discussion'
        }
      >
        <TextInput
          style={styles.textArea}
          value={newPostContent}
          onChangeText={setNewPostContent}
          placeholder="Write something honest, useful, and clear."
          multiline
          numberOfLines={7}
          textAlignVertical="top"
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
          <Send size={18} color={COLORS.white} />
          <Text style={styles.submitButtonText}>{submitting ? 'Submitting...' : 'Submit'}</Text>
        </TouchableOpacity>
      </CustomModal>

      <CustomModal
        visible={replyVisible}
        onClose={() => setReplyVisible(false)}
        title={replyPost ? `Reply to ${replyPost.author}` : 'Reply'}
      >
        <TextInput
          style={styles.textArea}
          value={replyContent}
          onChangeText={setReplyContent}
          placeholder="Write your reply"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleReply} disabled={submitting}>
          <Send size={18} color={COLORS.white} />
          <Text style={styles.submitButtonText}>{submitting ? 'Sending...' : 'Reply'}</Text>
        </TouchableOpacity>
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF4FF',
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: 14,
  },
  activeTab: {
    backgroundColor: '#EAF2FF',
  },
  tabText: {
    color: COLORS.gray,
    fontWeight: '700',
  },
  activeTabText: {
    color: COLORS.primary,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  refreshingText: {
    color: COLORS.gray,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  addButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 999,
    paddingVertical: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  card: {
    borderRadius: 24,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  author: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: FONTS.sizes.large,
  },
  timestamp: {
    color: COLORS.gray,
    fontSize: FONTS.sizes.small,
    marginTop: 2,
  },
  prayerBadge: {
    color: COLORS.accent,
    textTransform: 'capitalize',
    fontWeight: '800',
  },
  typeBadge: {
    color: COLORS.primary,
    textTransform: 'capitalize',
    fontWeight: '800',
  },
  content: {
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  inlineAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  inlineActionText: {
    color: COLORS.gray,
    fontWeight: '700',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
    backgroundColor: '#EAF2FF',
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  replyButtonText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  pendingNote: {
    marginTop: -6,
    marginBottom: SPACING.sm,
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: FONTS.sizes.small,
  },
  replyCard: {
    marginTop: SPACING.sm,
    backgroundColor: '#F8FBFF',
    borderRadius: 18,
    padding: SPACING.md,
  },
  replyAuthor: {
    color: COLORS.primary,
    fontWeight: '800',
    marginBottom: 4,
  },
  replyBody: {
    color: COLORS.text,
    lineHeight: 20,
  },
  replyDate: {
    marginTop: SPACING.sm,
    color: COLORS.gray,
    fontSize: FONTS.sizes.small,
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
  },
  emptyText: {
    color: COLORS.gray,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  textArea: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#D9E6FF',
    backgroundColor: '#F8FBFF',
    borderRadius: 18,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  submitButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 999,
    paddingVertical: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  submitButtonText: {
    color: COLORS.white,
    fontWeight: '800',
  },
});
