import { useEffect, useState } from 'react';
import { Alert, View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING, FONTS } from '@/constants/theme';
import { Sermon } from '@/types';
import { getAllSermons } from '@/lib/sermon-service';
import { addSermonToPlaylist } from '@/lib/playlist-service';
import { useAppTheme } from '@/lib/theme';
import MediaFallback from '@/components/MediaFallback';

export default function SermonListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ playlistId?: string; playlistName?: string }>();
  const { colors } = useAppTheme();
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const playlistId = params.playlistId ? String(params.playlistId) : '';
  const playlistName = params.playlistName ? String(params.playlistName) : 'playlist';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const items = await getAllSermons();
        setSermons(items as Sermon[]);
      } finally {
        setLoading(false);
      }
    };
    load().catch(() => undefined);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.mutedBackground }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.primary }]}>All Sermons</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            {loading ? 'Loading sermons...' : `${sermons.length} sermons available`}
          </Text>
        </View>

        {sermons.map((sermon) => (
          <View key={sermon.id} style={styles.sermonCard}>
            <TouchableOpacity style={styles.sermonRow} onPress={() => router.push(`/sermon/${sermon.id}`)}>
              <MediaFallback
                imageUrl={sermon.imageUrl}
                title="Sermon thumbnail"
                variant="sermon"
                compact
                style={styles.thumbnail}
              />
              <View style={styles.sermonInfo}>
                <Text style={styles.sermonTitle} numberOfLines={2}>
                  {sermon.title}
                </Text>
                <Text style={styles.speaker}>{sermon.speaker}</Text>
                <Text style={styles.meta}>
                  {new Date(sermon.date).toLocaleDateString()} - {sermon.duration} min - {sermon.mediaType}
                </Text>
              </View>
            </TouchableOpacity>
            {playlistId ? (
              <TouchableOpacity
                style={[styles.addButton, addedIds.includes(sermon.id) ? styles.addedButton : null]}
                onPress={async () => {
                  if (addedIds.includes(sermon.id)) return;
                  setAddedIds((prev) => (prev.includes(sermon.id) ? prev : [...prev, sermon.id]));
                  try {
                    await addSermonToPlaylist(playlistId, sermon);
                  } catch (error: any) {
                    setAddedIds((prev) => prev.filter((id) => id !== sermon.id));
                    Alert.alert('Playlist', error.message ?? 'Unable to add sermon.');
                  }
                }}
              >
                <Text style={styles.addButtonText}>
                  {addedIds.includes(sermon.id) ? 'Added' : `Add to ${playlistName}`}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
        {!loading && sermons.length === 0 ? (
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>No sermons available yet.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  scrollView: {
    flex: 1,
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
    marginTop: SPACING.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.gray,
  },
  sermonCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: '#0B2D64',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  sermonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  thumbnail: {
    width: 110,
    height: 72,
    borderRadius: 0,
    backgroundColor: '#E8EEF8',
  },
  sermonInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  sermonTitle: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 15,
    lineHeight: 20,
  },
  speaker: {
    marginTop: 4,
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  meta: {
    marginTop: 4,
    color: COLORS.gray,
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    alignSelf: 'flex-end',
    marginTop: -SPACING.xs,
    marginBottom: SPACING.sm,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.accent,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  addedButton: {
    backgroundColor: COLORS.success,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: '800',
  },
});
