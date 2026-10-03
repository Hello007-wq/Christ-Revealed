import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Music2 } from 'lucide-react-native';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { Playlist } from '@/types';
import { getPlaylistById, removeSermonFromPlaylist } from '@/lib/playlist-service';
import { useAppTheme } from '@/lib/theme';

export default function PlaylistDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPlaylist = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await getPlaylistById(String(id));
      setPlaylist(result);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadPlaylist().catch((error) => {
        Alert.alert('Playlist', error.message ?? 'Unable to load playlist.');
      });
    }, [loadPlaylist])
  );

  const handleRemove = async (sermonId: string) => {
    if (!playlist) return;
    try {
      await removeSermonFromPlaylist(playlist.id, sermonId);
      await loadPlaylist();
    } catch (error: any) {
      Alert.alert('Playlist', error.message ?? 'Unable to remove sermon.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.mutedBackground }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Loading playlist...</Text>
            <Text style={styles.emptyCopy}>Preparing your saved sermons.</Text>
          </View>
        ) : !playlist ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Playlist not found</Text>
            <Text style={styles.emptyCopy}>It may have been removed.</Text>
          </View>
        ) : (
          <View style={styles.playlistCard}>
            <View style={styles.playlistHeader}>
              <View style={styles.badge}>
                <Music2 size={18} color={COLORS.white} />
              </View>
              <View style={styles.playlistTextWrap}>
                <Text style={styles.playlistName}>{playlist.name}</Text>
                <Text style={styles.playlistMeta}>
                  {playlist.sermons.length} saved sermon{playlist.sermons.length === 1 ? '' : 's'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.addLibraryButton}
              onPress={() =>
                router.push({
                  pathname: '/sermon-list',
                  params: { playlistId: playlist.id, playlistName: playlist.name },
                })
              }
            >
              <Text style={styles.addLibraryButtonText}>Add Sermons From Full Library</Text>
            </TouchableOpacity>

            {playlist.sermons.length ? (
              playlist.sermons.map((sermon) => (
                <View key={sermon.id} style={styles.sermonRow}>
                  <TouchableOpacity style={styles.sermonTextWrap} onPress={() => router.push(`/sermon/${sermon.id}` as any)}>
                    <Text style={styles.sermonTitle}>{sermon.title}</Text>
                    <Text style={styles.sermonMeta}>{sermon.speaker} - {sermon.duration} min</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRemove(sermon.id)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No sermons saved in this playlist yet.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF4FF',
  },
  scrollContent: {
    padding: SPACING.md,
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
  },
  emptyCopy: {
    marginTop: SPACING.sm,
    color: COLORS.gray,
    textAlign: 'center',
  },
  playlistCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.lg,
    shadowColor: '#0B2D64',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  playlistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  playlistTextWrap: {
    flex: 1,
  },
  playlistName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  playlistMeta: {
    color: COLORS.gray,
    marginTop: 2,
  },
  addLibraryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAF2FF',
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  addLibraryButtonText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  sermonRow: {
    backgroundColor: '#F8FBFF',
    borderRadius: 18,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  sermonTextWrap: {
    flex: 1,
  },
  sermonTitle: {
    color: COLORS.text,
    fontWeight: '700',
  },
  sermonMeta: {
    color: COLORS.gray,
    fontSize: FONTS.sizes.small,
    marginTop: 2,
  },
  removeText: {
    color: COLORS.error,
    fontWeight: '700',
  },
  emptyText: {
    color: COLORS.gray,
    fontStyle: 'italic',
    marginTop: SPACING.sm,
  },
});
