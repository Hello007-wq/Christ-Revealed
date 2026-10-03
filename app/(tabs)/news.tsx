import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MessageCircle, PlayCircle } from 'lucide-react-native';
import { SPACING } from '@/constants/theme';
import { useAppTheme } from '@/lib/theme';
import { getNewsMetrics, getNewsStories, NewsMetrics, NewsStory } from '@/lib/news-service';

export default function NewsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [metrics, setMetrics] = useState<Record<string, NewsMetrics>>({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        setLoading(true);
        try {
          const nextStories = await getNewsStories(50);
          const nextMetrics = await getNewsMetrics(nextStories.map((story) => story.coverPostId));
          if (!active) return;
          setStories(nextStories);
          setMetrics(nextMetrics);
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

  return (
    <View style={[styles.container, { backgroundColor: colors.mutedBackground }]}>
      <View style={[styles.hero, { backgroundColor: colors.header }]}>
        <Text style={[styles.heroTitle, { color: colors.headerText }]}>Church News</Text>
        <Text style={[styles.heroText, { color: colors.headerText }]}>
          Read the latest ministry stories, updates, and announcements.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={stories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => {
            const coverMedia = item.media[0];
            const storyMetrics = metrics[item.coverPostId] ?? { reactionCount: 0, commentCount: 0, reacted: false };
            const leadStory = index === 0;

            return (
              <TouchableOpacity
                activeOpacity={0.92}
                style={[styles.card, leadStory ? styles.leadCard : styles.storyRowCard, { backgroundColor: colors.surface }]}
                onPress={() => router.push(`/news/${item.id}` as any)}
              >
                {coverMedia?.media_type === 'image' ? (
                  <Image source={{ uri: coverMedia.media_url }} style={leadStory ? styles.coverImage : styles.rowImage} />
                ) : (
                  <View style={[leadStory ? styles.videoCover : styles.rowVideoCover, { backgroundColor: colors.surfaceAlt }]}>
                    <PlayCircle size={leadStory ? 42 : 28} color={colors.primary} />
                    <Text style={[styles.videoCoverText, { color: colors.text }]}>{leadStory ? 'Video story' : 'Video'}</Text>
                  </View>
                )}

                <View style={leadStory ? styles.cardBody : styles.rowBody}>
                  <Text style={[styles.kicker, { color: colors.accent }]}>Latest</Text>
                  <Text style={[styles.headline, { color: colors.text }]}>{item.headline}</Text>
                  <Text style={[styles.preview, { color: colors.mutedText }]} numberOfLines={leadStory ? 3 : 2}>
                    {item.body}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={[styles.meta, { color: colors.mutedText }]}>
                      {new Date(item.created_at).toLocaleDateString()} - {item.media.length} media
                    </Text>
                    <View style={styles.commentCountWrap}>
                      <MessageCircle size={16} color={colors.mutedText} />
                      <Text style={[styles.commentCountText, { color: colors.mutedText }]}>
                        {storyMetrics.commentCount}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.headline, { color: colors.text }]}>No news stories yet.</Text>
            </View>
          }
        />
      )}
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
    lineHeight: 19,
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
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  leadCard: {},
  storyRowCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  coverImage: {
    width: '100%',
    height: 210,
  },
  rowImage: {
    width: 128,
    minHeight: 136,
  },
  videoCover: {
    width: '100%',
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  videoCoverText: {
    fontWeight: '800',
  },
  rowVideoCover: {
    width: 128,
    minHeight: 136,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  cardBody: {
    padding: SPACING.md,
  },
  rowBody: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'center',
  },
  kicker: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  headline: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  preview: {
    marginTop: SPACING.sm,
    lineHeight: 22,
  },
  metaRow: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    fontSize: 12,
  },
  commentCountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  commentCountText: {
    fontWeight: '700',
  },
});
