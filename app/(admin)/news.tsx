import { useCallback, useState } from 'react';
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
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect } from 'expo-router';
import { ImagePlus, Trash2, Video } from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';
import { logAdminAction } from '@/lib/admin-audit';
import { NewsStory } from '@/lib/news-service';
import { sendPushNotificationToAll } from '@/lib/push-service';
import supabase from '@/lib/supabase';
import { createNewsStory, deleteNewsStory, getNewsStories } from '@/lib/news-service';
import { useAppTheme } from '@/lib/theme';

export default function AdminNewsScreen() {
  const { colors } = useAppTheme();
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [caption, setCaption] = useState('');
  const [items, setItems] = useState<NewsStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await getNewsStories(50));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load().catch(() => undefined);
    }, [])
  );

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*'],
        copyToCacheDirectory: true,
        multiple: true,
      });
      if (result.canceled) return;

      const assets = result.assets ?? [];
      if (!assets.length) return;
      if (!headline.trim() || !body.trim()) {
        Alert.alert('News', 'Add a bold headline and the full news body first.');
        return;
      }
      if (assets.some((asset) => (asset.size ?? 0) > 30 * 1024 * 1024)) {
        Alert.alert('News', 'Each selected file must be below 30MB.');
        return;
      }

      setUploading(true);
      const mediaItems: { mediaUrl: string; mediaType: 'image' | 'video' }[] = [];

      for (const asset of assets) {
        const mediaType = asset.mimeType?.startsWith('video/') ? 'video' : 'image';
        const ext = asset.name.includes('.') ? asset.name.split('.').pop() : mediaType === 'video' ? 'mp4' : 'jpg';
        const response = await fetch(asset.uri);
        const fileBuffer = await response.arrayBuffer();
        const path = `news/${Date.now()}-${Math.random().toString(16).slice(2, 8)}.${ext}`;

        const { error } = await supabase.storage.from('news').upload(path, fileBuffer, {
          contentType: asset.mimeType ?? (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
          upsert: true,
        });
        if (error) throw error;

        const { data } = supabase.storage.from('news').getPublicUrl(path);
        mediaItems.push({
          mediaUrl: data.publicUrl,
          mediaType,
        });
      }

      await createNewsStory({
        mediaItems,
        headline,
        body,
        caption,
      });
      await logAdminAction('news_story_create', 'news_story', null, {
        headline: headline.trim(),
        mediaCount: mediaItems.length,
      }).catch(() => undefined);
      await supabase.from('notifications').insert({
        title: 'New church news',
        body: headline.trim(),
        sent: true,
      });
      await sendPushNotificationToAll(
        'New church news',
        headline.trim(),
        { kind: 'news' }
      ).catch(() => undefined);

      setHeadline('');
      setBody('');
      setCaption('');
      await load();
    } catch (error: any) {
      Alert.alert('News', error.message ?? 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (story: NewsStory) => {
    const previous = items;
    try {
      setBusyId(story.id);
      setItems((current) => current.filter((item) => item.id !== story.id));
      await deleteNewsStory(story.id, story.coverPostId);
      await logAdminAction('news_story_delete', 'news_story', story.id, {
        headline: story.headline,
      }).catch(() => undefined);
    } catch (error: any) {
      setItems(previous);
      Alert.alert('News', error.message ?? 'Unable to delete this news item.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.mutedBackground }]} contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>Upload church news</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          Build a full news story with a bold headline, full article text, and multiple images or videos.
        </Text>
        <TextInput
          style={[styles.titleInput, { borderColor: colors.border, backgroundColor: colors.surfaceAlt, color: colors.text }]}
          value={headline}
          onChangeText={setHeadline}
          placeholder="Headline"
          placeholderTextColor={colors.mutedText}
        />
        <TextInput
          style={[styles.bodyInput, { borderColor: colors.border, backgroundColor: colors.surfaceAlt, color: colors.text }]}
          value={body}
          onChangeText={setBody}
          placeholder="Full news story"
          placeholderTextColor={colors.mutedText}
          multiline
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surfaceAlt, color: colors.text }]}
          value={caption}
          onChangeText={setCaption}
          placeholder="Caption (optional)"
          placeholderTextColor={colors.mutedText}
          multiline
        />
        <TouchableOpacity style={styles.button} onPress={handleUpload} disabled={uploading}>
          {uploading ? <ActivityIndicator color={COLORS.white} /> : <ImagePlus size={18} color={COLORS.white} />}
          <Text style={styles.buttonText}>{uploading ? 'Uploading...' : 'Select story media'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : items.length ? (
        items.map((item) => (
          <View key={item.id} style={[styles.card, { backgroundColor: colors.surface }]}>
            {item.media[0]?.media_type === 'image' ? (
              <Image source={{ uri: item.media[0].media_url }} style={styles.image} />
            ) : (
              <View style={[styles.videoPlaceholder, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Video size={22} color={colors.primary} />
                <Text style={[styles.videoPlaceholderText, { color: colors.text }]}>Video-led story</Text>
              </View>
            )}
            <Text style={[styles.storyHeadline, { color: colors.text }]}>{item.headline}</Text>
            {item.caption ? <Text style={[styles.caption, { color: colors.text }]}>{item.caption}</Text> : null}
            <View style={styles.row}>
              <Text style={[styles.meta, { color: colors.mutedText }]}>
                {item.media.length} media item{item.media.length === 1 ? '' : 's'} - {new Date(item.created_at).toLocaleString()}
              </Text>
              <TouchableOpacity onPress={() => handleDelete(item)} disabled={busyId === item.id}>
                {busyId === item.id ? <ActivityIndicator color={COLORS.error} /> : <Trash2 size={18} color={COLORS.error} />}
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.storyHeadline, { color: colors.text }]}>No news stories yet.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  card: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 18,
    padding: SPACING.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  input: {
    marginTop: SPACING.md,
    borderWidth: 1,
    borderRadius: 14,
    padding: SPACING.md,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  titleInput: {
    marginTop: SPACING.md,
    borderWidth: 1,
    borderRadius: 14,
    padding: SPACING.md,
    fontSize: 18,
    fontWeight: '800',
  },
  bodyInput: {
    marginTop: SPACING.md,
    borderWidth: 1,
    borderRadius: 14,
    padding: SPACING.md,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.accent,
    borderRadius: 999,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 14,
  },
  videoPlaceholder: {
    height: 180,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  videoPlaceholderText: {
    fontWeight: '800',
  },
  caption: {
    marginTop: SPACING.sm,
    fontWeight: '700',
  },
  storyHeadline: {
    marginTop: SPACING.sm,
    fontSize: 20,
    fontWeight: '900',
  },
  row: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    fontSize: 12,
  },
});
