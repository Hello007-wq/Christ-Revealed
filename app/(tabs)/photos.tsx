import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Download, Heart, MessageCircle, Send } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { SPACING } from '@/constants/theme';
import {
  addPhotoComment,
  getPhotoComments,
  getPhotoMetrics,
  getPhotoPosts,
  markPhotosSeen,
  PhotoComment,
  PhotoMetrics,
  PhotoPost,
  togglePhotoReaction,
} from '@/lib/photos-service';
import { useAppTheme } from '@/lib/theme';
import CustomModal from '@/components/CustomModal';

type PhotoGallery = {
  id: string;
  coverPostId: string;
  caption: string | null;
  created_at: string;
  images: PhotoPost[];
};

function buildGalleries(posts: PhotoPost[]) {
  const grouped = new Map<string, PhotoGallery>();

  posts.forEach((post) => {
    const key = post.gallery_group_id || post.id;
    const existing = grouped.get(key);
    if (existing) {
      existing.images.push(post);
    } else {
      grouped.set(key, {
        id: key,
        coverPostId: post.id,
        caption: post.caption,
        created_at: post.created_at,
        images: [post],
      });
    }
  });

  return Array.from(grouped.values())
    .map((gallery) => ({
      ...gallery,
      images: gallery.images.slice().sort((a, b) => a.gallery_index - b.gallery_index),
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export default function PhotosScreen() {
  const { colors } = useAppTheme();
  const [posts, setPosts] = useState<PhotoPost[]>([]);
  const [galleries, setGalleries] = useState<PhotoGallery[]>([]);
  const [metrics, setMetrics] = useState<Record<string, PhotoMetrics>>({});
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [activePost, setActivePost] = useState<PhotoPost | null>(null);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [activeGallery, setActiveGallery] = useState<PhotoGallery | null>(null);
  const [comments, setComments] = useState<PhotoComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingComment, setSendingComment] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        setLoading(true);
        try {
          const data = await getPhotoPosts();
          if (!active) return;

          setPosts(data);
          setGalleries(buildGalleries(data));
          setLoading(false);

          data
            .slice(0, 8)
            .forEach((item) => {
              Image.prefetch(item.image_url).catch(() => undefined);
            });

          getPhotoMetrics(data.map((item) => item.id))
            .then((nextMetrics) => {
              if (active) setMetrics(nextMetrics);
            })
            .catch(() => undefined);

          markPhotosSeen().catch(() => undefined);
        } finally {
          if (active) setLoading(false);
        }
      };
      load().catch(() => {
        if (active) setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const openComments = async (post: PhotoPost) => {
    setActivePost(post);
    setCommentsVisible(true);
    try {
      const list = await getPhotoComments(post.id);
      setComments(list);
    } catch (error: any) {
      Alert.alert('Comments', error.message ?? 'Unable to load comments right now.');
    }
  };

  const handleToggleReaction = async (postId: string) => {
    const previous = metrics[postId] ?? { reactionCount: 0, commentCount: 0, reacted: false };
    const optimistic = {
      ...previous,
      reacted: !previous.reacted,
      reactionCount: previous.reacted ? Math.max(0, previous.reactionCount - 1) : previous.reactionCount + 1,
    };
    setMetrics((prev) => ({ ...prev, [postId]: optimistic }));
    try {
      await togglePhotoReaction(postId);
    } catch (error: any) {
      setMetrics((prev) => ({ ...prev, [postId]: previous }));
      Alert.alert('Reaction', error.message ?? 'Unable to react right now.');
    }
  };

  const handleSendComment = async () => {
    if (!activePost || !commentText.trim()) return;
    try {
      setSendingComment(true);
      const created = await addPhotoComment(activePost.id, commentText);
      setComments((prev) => [created, ...prev]);
      setCommentText('');
      setMetrics((prev) => {
        const current = prev[activePost.id] ?? { reactionCount: 0, commentCount: 0, reacted: false };
        return {
          ...prev,
          [activePost.id]: { ...current, commentCount: current.commentCount + 1 },
        };
      });
    } catch (error: any) {
      Alert.alert('Comment', error.message ?? 'Unable to post comment.');
    } finally {
      setSendingComment(false);
    }
  };

  const openGallery = (gallery: PhotoGallery) => {
    setActiveGallery(gallery);
    setGalleryVisible(true);
  };

  const saveImageToGallery = async (imageUrl: string) => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photos', 'Please allow photo library access to save images.');
        return;
      }

      const fileName = `crwm-photo-${Date.now()}.jpg`;
      const targetPath = `${FileSystem.cacheDirectory}${fileName}`;
      const downloaded = await FileSystem.downloadAsync(imageUrl, targetPath);
      const asset = await MediaLibrary.createAssetAsync(downloaded.uri);
      await MediaLibrary.createAlbumAsync('Christ Revealed', asset, false).catch(() => undefined);
      Alert.alert('Saved', 'Photo saved to your gallery.');
    } catch {
      try {
        await Linking.openURL(imageUrl);
      } catch {
        Alert.alert('Photos', 'Unable to save this image right now.');
      }
    }
  };

  const renderGalleryPreview = (gallery: PhotoGallery) => {
    const preview = gallery.images.slice(0, 4);
    const extraCount = gallery.images.length - preview.length;

    if (preview.length === 1) {
      return <Image source={{ uri: preview[0].image_url }} style={styles.singleImage} />;
    }

    if (preview.length === 2) {
      return (
        <View style={styles.twoUpWrap}>
          {preview.map((image) => (
            <View key={image.id} style={styles.twoUpTile}>
              <Image source={{ uri: image.image_url }} style={styles.gridImage} />
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.gridWrap}>
        {preview.map((image, index) => (
          <View
            key={image.id}
            style={preview.length === 3 && index === 0 ? styles.largeGridTile : styles.gridTile}
          >
            <Image source={{ uri: image.image_url }} style={styles.gridImage} />
            {index === preview.length - 1 && extraCount > 0 ? (
              <View style={styles.moreOverlay}>
                <Text style={styles.moreOverlayText}>+{extraCount}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.mutedBackground }]}>
      <View style={[styles.hero, { backgroundColor: colors.header }]}>
        <Text style={[styles.heroTitle, { color: colors.headerText }]}>Church Photos</Text>
        <Text style={[styles.heroText, { color: colors.headerText }]}>Latest photos shared by admin.</Text>
      </View>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={galleries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={5}
          removeClippedSubviews
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <TouchableOpacity activeOpacity={0.92} onPress={() => openGallery(item)}>
                {renderGalleryPreview(item)}
              </TouchableOpacity>
              <View style={styles.cardBody}>
                {item.caption ? <Text style={[styles.caption, { color: colors.text }]}>{item.caption}</Text> : null}
                <Text style={[styles.meta, { color: colors.mutedText }]}>
                  {item.images.length} image{item.images.length === 1 ? '' : 's'} - {new Date(item.created_at).toLocaleString()}
                </Text>
                <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleToggleReaction(item.coverPostId)}>
                    <Heart
                      size={18}
                      color={(metrics[item.coverPostId]?.reacted ?? false) ? colors.error : colors.mutedText}
                      fill={(metrics[item.coverPostId]?.reacted ?? false) ? colors.error : 'none'}
                    />
                    <Text style={[styles.actionText, { color: colors.text }]}>{metrics[item.coverPostId]?.reactionCount ?? 0}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => openComments(item.images[0])}>
                    <MessageCircle size={18} color={colors.mutedText} />
                    <Text style={[styles.actionText, { color: colors.text }]}>{metrics[item.coverPostId]?.commentCount ?? 0}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.caption, { color: colors.text }]}>No photos posted yet.</Text>
            </View>
          }
        />
      )}

      <CustomModal
        visible={commentsVisible}
        onClose={() => setCommentsVisible(false)}
        title={activePost ? 'Photo comments' : 'Comments'}
      >
        <View style={styles.commentComposer}>
          <TextInput
            style={[styles.commentInput, { borderColor: colors.border, backgroundColor: colors.surfaceAlt, color: colors.text }]}
            placeholder="Write a comment"
            placeholderTextColor={colors.mutedText}
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.accent }]}
            onPress={handleSendComment}
            disabled={sendingComment}
          >
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

      <CustomModal
        visible={galleryVisible}
        onClose={() => setGalleryVisible(false)}
        title={activeGallery ? `${activeGallery.images.length} photo${activeGallery.images.length === 1 ? '' : 's'}` : 'Gallery'}
      >
        <ScrollView>
          {activeGallery?.caption ? (
            <Text style={[styles.galleryCaption, { color: colors.text }]}>{activeGallery.caption}</Text>
          ) : null}
          {activeGallery?.images.map((image) => (
            <View key={image.id} style={styles.galleryImageCard}>
              <Image source={{ uri: image.image_url }} style={styles.galleryImage} />
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.accent }]}
                onPress={() => saveImageToGallery(image.image_url)}
              >
                <Download size={16} color="#fff" />
                <Text style={styles.saveButtonText}>Save to Phone</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    margin: SPACING.sm,
    borderRadius: 20,
    padding: SPACING.md,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  heroText: {
    marginTop: SPACING.xs,
    lineHeight: 18,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  cardBody: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  singleImage: {
    width: '100%',
    height: 220,
  },
  twoUpWrap: {
    flexDirection: 'row',
    gap: 2,
    padding: 2,
    height: 220,
  },
  twoUpTile: {
    flex: 1,
    overflow: 'hidden',
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: 220,
    gap: 2,
    padding: 2,
  },
  gridTile: {
    width: '49.5%',
    height: 108,
    overflow: 'hidden',
  },
  largeGridTile: {
    width: '49.5%',
    height: 218,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreOverlayText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  caption: {
    fontWeight: '700',
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  meta: {
    fontSize: 12,
    paddingHorizontal: SPACING.sm,
    paddingTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    paddingTop: SPACING.sm,
    marginTop: SPACING.sm,
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
  galleryCaption: {
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  galleryImageCard: {
    marginBottom: SPACING.md,
  },
  galleryImage: {
    width: '100%',
    height: 240,
    borderRadius: 14,
  },
  saveButton: {
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
});

