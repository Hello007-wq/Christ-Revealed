import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, Send, Sparkles } from 'lucide-react-native';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { Sermon } from '@/types';
import { getRecentSermons } from '@/lib/sermon-service';
import {
  addSermonComment,
  getSermonComments,
  getSermonMetrics,
  SermonComment,
  SermonMetrics,
  toggleSermonReaction,
} from '@/lib/sermon-social';
import { addSermonToPlaylist, createPlaylist, getPlaylists, getSavedSermonIds } from '@/lib/playlist-service';
import { getUserNotifications } from '@/lib/notifications-service';
import SermonFeedCard from '@/components/SermonFeedCard';
import CustomModal from '@/components/CustomModal';
import { useAppTheme } from '@/lib/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [metrics, setMetrics] = useState<Record<string, SermonMetrics>>({});
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [playlistVisible, setPlaylistVisible] = useState(false);
  const [activeSermon, setActiveSermon] = useState<Sermon | null>(null);
  const [comments, setComments] = useState<SermonComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [playlists, setPlaylists] = useState<{ id: string; name: string }[]>([]);
  const [savedSermonIds, setSavedSermonIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [latestNotifications, setLatestNotifications] = useState<{ id: string; title: string; created_at: string }[]>([]);

  const load = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const items = ((await getRecentSermons(20)) as Sermon[]).filter((item) => item.mediaType === 'video');
      const ids = items.map((item) => item.id);
      const [nextMetrics, availablePlaylists, savedIds, notifications] = await Promise.all([
        getSermonMetrics(ids),
        getPlaylists(),
        getSavedSermonIds(),
        getUserNotifications(3),
      ]);
      setSermons(items);
      setMetrics(nextMetrics);
      setPlaylists(availablePlaylists.map(({ id, name }) => ({ id, name })));
      setSavedSermonIds(savedIds);
      setLatestNotifications(
        notifications.map((item) => ({ id: item.id, title: item.title, created_at: item.created_at }))
      );
    } catch (error: any) {
      Alert.alert('Home feed', error.message ?? 'Failed to load sermons');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(true).catch(() => undefined);
    }, [])
  );

  const refreshMetrics = async (sermonId?: string) => {
    const ids = sermonId ? [sermonId] : sermons.map((item) => item.id);
    const latest = await getSermonMetrics(ids);
    setMetrics((prev) => ({ ...prev, ...latest }));
  };

  const openComments = async (sermon: Sermon) => {
    setActiveSermon(sermon);
    setCommentsVisible(true);
    try {
      setComments(await getSermonComments(sermon.id));
      await refreshMetrics(sermon.id);
    } catch (error: any) {
      Alert.alert('Comments', error.message ?? 'Comments are not ready yet.');
    }
  };

  const handleReact = async (sermonId: string) => {
    const previous = metrics[sermonId] ?? { reactionCount: 0, commentCount: 0, reacted: false };
    const optimistic = {
      ...previous,
      reacted: !previous.reacted,
      reactionCount: previous.reacted ? Math.max(0, previous.reactionCount - 1) : previous.reactionCount + 1,
    };
    setMetrics((prev) => ({ ...prev, [sermonId]: optimistic }));
    try {
      await toggleSermonReaction(sermonId);
    } catch (error: any) {
      setMetrics((prev) => ({ ...prev, [sermonId]: previous }));
      Alert.alert('Reaction', error.message ?? 'Unable to react right now.');
    }
  };

  const handleSendComment = async () => {
    if (!activeSermon || !commentText.trim()) return;
    try {
      const created = await addSermonComment(activeSermon.id, commentText);
      setComments((prev) => [created, ...prev]);
      setCommentText('');
      await refreshMetrics(activeSermon.id);
    } catch (error: any) {
      Alert.alert('Comment', error.message ?? 'Unable to send comment.');
    }
  };

  const openPlaylistPicker = async (sermon: Sermon) => {
    setActiveSermon(sermon);
    setPlaylistVisible(true);
    getPlaylists()
      .then((availablePlaylists) => {
        setPlaylists(availablePlaylists.map(({ id, name }) => ({ id, name })));
      })
      .catch(() => undefined);
  };

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) return;
    try {
      const created = await createPlaylist(playlistName);
      setPlaylists((prev) => [{ id: created.id, name: created.name }, ...prev]);
      setPlaylistName('');
    } catch (error: any) {
      Alert.alert('Playlist', error.message ?? 'Unable to create playlist.');
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!activeSermon) return;
    const sermon = activeSermon;
    try {
      setPlaylistVisible(false);
      setSavedSermonIds((prev) => (prev.includes(sermon.id) ? prev : [...prev, sermon.id]));
      Alert.alert('Playlist', `"${sermon.title}" was added to your playlist.`);
      await addSermonToPlaylist(playlistId, sermon);
    } catch (error: any) {
      setSavedSermonIds((prev) => prev.filter((id) => id !== sermon.id));
      Alert.alert('Playlist', error.message ?? 'Unable to save playlist item.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.mutedBackground }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {refreshing ? <Text style={styles.refreshingText}>Refreshing...</Text> : null}
        <View style={styles.libraryButtonWrap}>
          <TouchableOpacity style={styles.heroButton} onPress={() => router.push('/sermon-list')}>
            <Sparkles size={18} color={colors.primary} />
            <Text style={[styles.heroButtonText, { color: colors.primary }]}>Browse full library</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.feedHeader}>
          <Text style={[styles.feedTitle, { color: colors.text }]}>Latest Sermon Feed</Text>
          <Text style={[styles.feedSubtitle, { color: colors.mutedText }]}>Video-first. Audio remains available inside each sermon.</Text>
        </View>

        {latestNotifications.length ? (
          <View style={[styles.noticeCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.noticeEyebrow}>Latest notification</Text>
            <Text style={styles.noticeBody}>{latestNotifications[0].title}</Text>
            <Text style={[styles.noticeDate, { color: colors.mutedText }]}>
              {new Date(latestNotifications[0].created_at).toLocaleString()}
            </Text>
          </View>
        ) : null}

        {loading && sermons.length === 0 ? (
          <View style={[styles.emptyFeed, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyFeedTitle, { color: colors.text }]}>Loading sermons...</Text>
            <Text style={[styles.emptyFeedText, { color: colors.mutedText }]}>Fetching the latest feed.</Text>
          </View>
        ) : null}

        {sermons.map((sermon) => {
          const sermonMetrics = metrics[sermon.id] ?? {
            reactionCount: 0,
            commentCount: 0,
            reacted: false,
          };
          return (
            <SermonFeedCard
              key={sermon.id}
              sermon={sermon}
              reactionCount={sermonMetrics.reactionCount}
              commentCount={sermonMetrics.commentCount}
              reacted={sermonMetrics.reacted}
              savedToPlaylist={savedSermonIds.includes(sermon.id)}
              onOpen={() => router.push(`/sermon/${sermon.id}`)}
              onReact={() => handleReact(sermon.id)}
              onComment={() => openComments(sermon)}
              onAddToPlaylist={() => openPlaylistPicker(sermon)}
            />
          );
        })}

        {!loading && !sermons.length ? (
          <View style={[styles.emptyFeed, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyFeedTitle, { color: colors.text }]}>No video sermons yet</Text>
            <Text style={[styles.emptyFeedText, { color: colors.mutedText }]}>Upload a sermon from the admin panel and it will land here.</Text>
          </View>
        ) : null}
      </ScrollView>

      <CustomModal
        visible={commentsVisible}
        onClose={() => setCommentsVisible(false)}
        title={activeSermon ? `Comments on ${activeSermon.title}` : 'Comments'}
      >
        <View style={styles.modalSection}>
          <TextInput
            style={styles.commentInput}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Write a comment about the sermon"
            multiline
          />
          <TouchableOpacity style={styles.modalButton} onPress={handleSendComment}>
            <Send size={16} color={COLORS.white} />
            <Text style={styles.modalButtonText}>Post Comment</Text>
          </TouchableOpacity>
        </View>

        {comments.length ? (
          comments.map((comment) => (
            <View key={comment.id} style={styles.commentCard}>
              <Text style={styles.commentAuthor}>{comment.author}</Text>
              <Text style={styles.commentBody}>{comment.content}</Text>
              <Text style={styles.commentDate}>{new Date(comment.created_at).toLocaleString()}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyMessage}>No comments yet. Start the conversation.</Text>
        )}
      </CustomModal>

      <CustomModal
        visible={playlistVisible}
        onClose={() => setPlaylistVisible(false)}
        title={activeSermon ? `Save ${activeSermon.title}` : 'Playlists'}
      >
        <View style={styles.modalSection}>
          <TextInput
            style={styles.playlistInput}
            value={playlistName}
            onChangeText={setPlaylistName}
            placeholder="Create a new playlist"
          />
          <TouchableOpacity style={styles.modalButton} onPress={handleCreatePlaylist}>
            <Plus size={16} color={COLORS.white} />
            <Text style={styles.modalButtonText}>Create Playlist</Text>
          </TouchableOpacity>
        </View>

        {playlists.length ? (
          playlists.map((playlist) => (
            <TouchableOpacity
              key={playlist.id}
              style={styles.playlistCard}
              onPress={() => handleAddToPlaylist(playlist.id)}
            >
              <Text style={styles.playlistCardTitle}>{playlist.name}</Text>
              <Text style={styles.playlistCardText}>Tap to add this sermon</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyMessage}>Create your first playlist to start curating sermons.</Text>
        )}
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF4FF',
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  libraryButtonWrap: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  heroButtonText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: FONTS.sizes.medium,
  },
  feedHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  feedTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
  },
  feedSubtitle: {
    marginTop: SPACING.xs,
    color: COLORS.gray,
    fontSize: FONTS.sizes.medium,
  },
  noticeCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 20,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#F3B3B3',
  },
  noticeEyebrow: {
    color: '#A12626',
    fontWeight: '900',
    fontSize: FONTS.sizes.small,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  noticeBody: {
    marginTop: 6,
    color: '#C62828',
    fontWeight: '900',
    fontSize: FONTS.sizes.large,
    lineHeight: 22,
  },
  noticeDate: {
    marginTop: 6,
    fontSize: FONTS.sizes.small,
  },
  emptyFeed: {
    marginHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyFeedTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
  },
  emptyFeedText: {
    marginTop: SPACING.sm,
    color: COLORS.gray,
    textAlign: 'center',
  },
  refreshingText: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    color: COLORS.gray,
    fontWeight: '700',
  },
  modalSection: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  commentInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#D9E6FF',
    backgroundColor: '#F8FBFF',
    borderRadius: 18,
    padding: SPACING.md,
    textAlignVertical: 'top',
  },
  playlistInput: {
    borderWidth: 1,
    borderColor: '#D9E6FF',
    backgroundColor: '#F8FBFF',
    borderRadius: 18,
    padding: SPACING.md,
  },
  modalButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.accent,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  modalButtonText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  commentCard: {
    backgroundColor: '#F8FBFF',
    borderRadius: 18,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  commentAuthor: {
    color: COLORS.primary,
    fontWeight: '800',
    marginBottom: 4,
  },
  commentBody: {
    color: COLORS.text,
    lineHeight: 20,
  },
  commentDate: {
    marginTop: SPACING.sm,
    color: COLORS.gray,
    fontSize: FONTS.sizes.small,
  },
  playlistCard: {
    backgroundColor: '#FFF6ED',
    borderRadius: 18,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  playlistCardTitle: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: FONTS.sizes.large,
  },
  playlistCardText: {
    color: COLORS.gray,
    marginTop: 4,
  },
  emptyMessage: {
    color: COLORS.gray,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
});

