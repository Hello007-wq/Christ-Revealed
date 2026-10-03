import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SPACING, FONTS } from '@/constants/theme';
import Card from '@/components/Card';
import { CheckCircle, XCircle, Archive } from 'lucide-react-native';
import { logAdminAction } from '@/lib/admin-audit';
import supabase from '@/lib/supabase';
import { CommunityPost, PrayerRequest } from '@/types';

export default function ModerateScreen() {
  const [activeTab, setActiveTab] = useState<'posts' | 'prayer'>('posts');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        await supabase.rpc('cleanup_expired_social_content');
      } catch {
        // Continue loading moderation queue even if cleanup RPC is unavailable.
      }
      const minDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: postData } = await supabase
        .from('community_posts')
        .select('id, user_id, author, content, timestamp, type, replies, status')
        .gte('timestamp', minDate)
        .order('timestamp', { ascending: false })
        .limit(100);
      if (postData) setPosts(postData as any);

      const { data: prayerData } = await supabase
        .from('prayer_requests')
        .select('id, user_id, author, request, timestamp, prayers, status')
        .gte('timestamp', minDate)
        .order('timestamp', { ascending: false })
        .limit(100);
      if (prayerData) setPrayerRequests(prayerData as any);
    };
    load();
  }, []);

  const approvePost = async (id: string) => {
    const previousPosts = posts;
    try {
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p)));
      const { error } = await supabase.from('community_posts').update({ status: 'approved' }).eq('id', id);
      if (error) throw error;
      await logAdminAction('community_post_approve', 'community_post', id).catch(() => undefined);
    } catch (e: any) {
      setPosts(previousPosts);
      Alert.alert('Moderation', e.message ?? 'Failed to approve post');
    }
  };

  const rejectPost = async (id: string) => {
    const previousPosts = posts;
    try {
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'rejected' } : p)));
      const { error } = await supabase.from('community_posts').update({ status: 'rejected' }).eq('id', id);
      if (error) throw error;
      await logAdminAction('community_post_reject', 'community_post', id).catch(() => undefined);
    } catch (e: any) {
      setPosts(previousPosts);
      Alert.alert('Moderation', e.message ?? 'Failed to reject post');
    }
  };

  const approvePrayer = async (id: string) => {
    const previousRequests = prayerRequests;
    try {
      setPrayerRequests((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'approved' } as any : p)));
      const { error } = await supabase.from('prayer_requests').update({ status: 'approved' }).eq('id', id);
      if (error) throw error;
      await logAdminAction('prayer_request_approve', 'prayer_request', id).catch(() => undefined);
    } catch (e: any) {
      setPrayerRequests(previousRequests);
      Alert.alert('Moderation', e.message ?? 'Failed to approve request');
    }
  };

  const rejectPrayer = async (id: string) => {
    const previousRequests = prayerRequests;
    try {
      setPrayerRequests((prev) => prev.filter((p) => p.id !== id));
      const { error } = await supabase.from('prayer_requests').delete().eq('id', id);
      if (error) throw error;
      await logAdminAction('prayer_request_reject', 'prayer_request', id).catch(() => undefined);
    } catch (e: any) {
      setPrayerRequests(previousRequests);
      Alert.alert('Moderation', e.message ?? 'Failed to reject request');
    }
  };

  const archivePrayer = async (id: string) => {
    const previousRequests = prayerRequests;
    try {
      setPrayerRequests((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'archived' } as any : p)));
      const { error } = await supabase.from('prayer_requests').update({ status: 'archived' }).eq('id', id);
      if (error) throw error;
      await logAdminAction('prayer_request_archive', 'prayer_request', id).catch(() => undefined);
    } catch (e: any) {
      setPrayerRequests(previousRequests);
      Alert.alert('Moderation', e.message ?? 'Failed to archive request');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            Community Posts ({posts.filter((p) => (p.status ?? 'pending') === 'pending').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'prayer' && styles.activeTab]}
          onPress={() => setActiveTab('prayer')}
        >
          <Text style={[styles.tabText, activeTab === 'prayer' && styles.activeTabText]}>
            Prayer Requests ({prayerRequests.filter((p) => p.status === 'pending').length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {activeTab === 'posts' ? (
          <>
            {posts.filter((post) => (post.status ?? 'pending') === 'pending').length === 0 ? (
              <Card>
                <Text style={styles.emptyText}>No posts to moderate</Text>
              </Card>
            ) : (
              posts
                .filter((post) => (post.status ?? 'pending') === 'pending')
                .map((post) => (
                <Card key={post.id} style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <View>
                      <Text style={styles.author}>{post.author}</Text>
                      <Text style={styles.timestamp}>
                        {new Date(post.timestamp).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeText}>{post.type}</Text>
                    </View>
                  </View>

                  <Text style={styles.content}>{post.content}</Text>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => approvePost(post.id)}
                    >
                      <CheckCircle size={20} color={COLORS.white} />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => rejectPost(post.id)}
                    >
                      <XCircle size={20} color={COLORS.white} />
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            )}
          </>
        ) : (
          <>
            {prayerRequests.filter((p) => p.status === 'pending').length === 0 ? (
              <Card>
                <Text style={styles.emptyText}>No prayer requests to moderate</Text>
              </Card>
            ) : (
              prayerRequests
                .filter((p) => p.status === 'pending')
                .map((request) => (
                  <Card key={request.id} style={styles.postCard}>
                    <View style={styles.postHeader}>
                      <View>
                        <Text style={styles.author}>{request.author}</Text>
                        <Text style={styles.timestamp}>
                          {new Date(request.timestamp).toLocaleString()}
                        </Text>
                      </View>
                      <Text style={styles.prayerCount}>{request.prayers} praying</Text>
                    </View>

                    <Text style={styles.content}>{request.request}</Text>

                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => approvePrayer(request.id)}
                      >
                        <CheckCircle size={18} color={COLORS.white} />
                        <Text style={styles.approveButtonText}>Approve</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.archiveButton}
                        onPress={() => archivePrayer(request.id)}
                      >
                        <Archive size={18} color={COLORS.white} />
                        <Text style={styles.archiveButtonText}>Archive</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => rejectPrayer(request.id)}
                      >
                        <XCircle size={18} color={COLORS.white} />
                        <Text style={styles.rejectButtonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.accent,
  },
  tabText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.gray,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.primary,
  },
  scrollView: {
    flex: 1,
    padding: SPACING.md,
  },
  postCard: {
    marginBottom: SPACING.md,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  author: {
    fontSize: FONTS.sizes.medium,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: FONTS.sizes.small,
    color: COLORS.gray,
  },
  typeBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.white,
    fontWeight: '600',
  },
  prayerCount: {
    fontSize: FONTS.sizes.small,
    color: COLORS.error,
    fontWeight: '600',
  },
  content: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  approveButton: {
    flex: 1,
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderRadius: 8,
    gap: 4,
  },
  approveButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.small,
    fontWeight: '700',
  },
  archiveButton: {
    flex: 1,
    backgroundColor: COLORS.gray,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderRadius: 8,
    gap: 4,
  },
  archiveButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.small,
    fontWeight: '700',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderRadius: 8,
    gap: 4,
  },
  rejectButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.small,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.gray,
    textAlign: 'center',
    padding: SPACING.xl,
  },
});
