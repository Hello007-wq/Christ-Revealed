import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Heart, MessageCircle, Send } from 'lucide-react-native';
import { SPACING } from '@/constants/theme';
import { useAppTheme } from '@/lib/theme';
import CustomModal from '@/components/CustomModal';
import {
  addNewsComment,
  getNewsComments,
  getNewsMetrics,
  getNewsStoryById,
  NewsComment,
  NewsStory,
  toggleNewsReaction,
} from '@/lib/news-service';

function NewsVideo({ source }: { source: string }) {
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = false;
  });

  return (
    <VideoView
      style={styles.video}
      player={player}
      nativeControls
      contentFit="contain"
      fullscreenOptions={{ enable: true }}
    />
  );
}

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const [story, setStory] = useState<NewsStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [reactionCount, setReactionCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [reacted, setReacted] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState<NewsComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const nextStory = await getNewsStoryById(String(id));
        if (!nextStory) {
          setStory(null);
          return;
        }
        const nextMetrics = await getNewsMetrics([nextStory.coverPostId]);
        const summary = nextMetrics[nextStory.coverPostId] ?? {
          reactionCount: 0,
          commentCount: 0,
          reacted: false,
        };
        setStory(nextStory);
        setReactionCount(summary.reactionCount);
        setCommentCount(summary.commentCount);
        setReacted(summary.reacted);
      } finally {
        setLoading(false);
      }
    };
    load().catch(() => setLoading(false));
  }, [id]);

  const openComments = async () => {
    if (!story) return;
    setCommentsVisible(true);
    try {
      setComments(await getNewsComments(story.coverPostId));
    } catch (error: any) {
      Alert.alert('News comments', error.message ?? 'Unable to load comments.');
    }
  };

  const handleToggleReaction = async () => {
    if (!story) return;
    const previousReacted = reacted;
    const previousCount = reactionCount;
    setReacted(!previousReacted);
    setReactionCount(previousReacted ? Math.max(0, previousCount - 1) : previousCount + 1);
    try {
      await toggleNewsReaction(story.coverPostId);
    } catch (error: any) {
      setReacted(previousReacted);
      setReactionCount(previousCount);
      Alert.alert('News', error.message ?? 'Unable to react right now.');
    }
  };

  const handleSendComment = async () => {
    if (!story || !commentText.trim()) return;
    try {
      setSendingComment(true);
      const created = await addNewsComment(story.coverPostId, commentText);
      setComments((prev) => [created, ...prev]);
      setCommentText('');
      setCommentCount((prev) => prev + 1);
    } catch (error: any) {
      Alert.alert('News comments', error.message ?? 'Unable to post comment.');
    } finally {
      setSendingComment(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingWrap, { backgroundColor: colors.mutedBackground }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!story) {
    return (
      <View style={[styles.loadingWrap, { backgroundColor: colors.mutedBackground }]}>
        <Text style={{ color: colors.text, fontWeight: '800' }}>Story not found.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.mutedBackground }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.kicker, { color: colors.accent }]}>Church News</Text>
        <Text style={[styles.headline, { color: colors.text }]}>{story.headline}</Text>
        <Text style={[styles.meta, { color: colors.mutedText }]}>
          {new Date(story.created_at).toLocaleString()} - {story.media.length} media item{story.media.length === 1 ? '' : 's'}
        </Text>

        {story.media.map((item) =>
          item.media_type === 'image' ? (
            <Image key={item.id} source={{ uri: item.media_url }} style={styles.image} resizeMode="cover" />
          ) : (
            <NewsVideo key={item.id} source={item.media_url} />
          )
        )}

        {story.caption ? (
          <Text style={[styles.caption, { color: colors.mutedText }]}>{story.caption}</Text>
        ) : null}
        <Text style={[styles.body, { color: colors.text }]}>{story.body}</Text>

        <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.actionButton} onPress={handleToggleReaction}>
            <Heart size={18} color={reacted ? colors.error : colors.mutedText} fill={reacted ? colors.error : 'none'} />
            <Text style={[styles.actionText, { color: colors.text }]}>{reactionCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={openComments}>
            <MessageCircle size={18} color={colors.mutedText} />
            <Text style={[styles.actionText, { color: colors.text }]}>{commentCount}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomModal visible={commentsVisible} onClose={() => setCommentsVisible(false)} title="News comments">
        <View style={styles.commentComposer}>
          <TextInput
            style={[styles.commentInput, { borderColor: colors.border, backgroundColor: colors.surfaceAlt, color: colors.text }]}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Write a comment"
            placeholderTextColor={colors.mutedText}
            multiline
          />
          <TouchableOpacity style={[styles.sendButton, { backgroundColor: colors.accent }]} onPress={handleSendComment}>
            <Send size={16} color="#fff" />
            <Text style={styles.sendButtonText}>{sendingComment ? 'Posting...' : 'Post'}</Text>
          </TouchableOpacity>
        </View>

        {comments.map((comment) => (
          <View key={comment.id} style={[styles.commentCard, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.commentAuthor, { color: colors.primary }]}>{comment.author}</Text>
            <Text style={[styles.commentBody, { color: colors.text }]}>{comment.content}</Text>
            <Text style={[styles.commentDate, { color: colors.mutedText }]}>{new Date(comment.created_at).toLocaleString()}</Text>
          </View>
        ))}
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  meta: {
    fontSize: 12,
  },
  image: {
    width: '100%',
    height: 260,
    borderRadius: 12,
  },
  video: {
    width: '100%',
    height: 240,
    borderRadius: 12,
  },
  body: {
    lineHeight: 26,
    fontSize: 16,
  },
  caption: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionText: {
    fontWeight: '700',
  },
  commentComposer: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  commentInput: {
    minHeight: 90,
    borderWidth: 1,
    borderRadius: 14,
    padding: SPACING.sm,
    textAlignVertical: 'top',
  },
  sendButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
  commentCard: {
    borderRadius: 14,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  commentAuthor: {
    fontWeight: '800',
  },
  commentBody: {
    marginTop: 4,
    lineHeight: 20,
  },
  commentDate: {
    marginTop: 6,
    fontSize: 12,
  },
});
