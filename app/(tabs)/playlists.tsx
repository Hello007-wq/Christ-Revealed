import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Music2, Plus, Trash2 } from 'lucide-react-native';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { Playlist } from '@/types';
import CustomModal from '@/components/CustomModal';
import { createPlaylist, deletePlaylist, getPlaylists } from '@/lib/playlist-service';
import { useAppTheme } from '@/lib/theme';

export default function PlaylistsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPlaylists = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setPlaylists(await getPlaylists());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPlaylists(true).catch((error) => {
        Alert.alert('Playlists', error.message ?? 'Failed to refresh playlists.');
      });
    }, [])
  );

  const handleCreate = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      await createPlaylist(newPlaylistName);
      setNewPlaylistName('');
      setModalVisible(false);
      await loadPlaylists();
    } catch (error: any) {
      Alert.alert('Playlists', error.message ?? 'Failed to create playlist.');
    }
  };

  const handleDelete = async (id: string) => {
    await deletePlaylist(id);
    await loadPlaylists();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.mutedBackground }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Your Playlists</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>Curate your own sermon flow</Text>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
          <Plus size={18} color={COLORS.white} />
          <Text style={styles.createButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {refreshing ? <Text style={styles.refreshingText}>Refreshing...</Text> : null}
        {loading && playlists.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Loading playlists...</Text>
            <Text style={styles.emptyCopy}>Preparing your saved sermons.</Text>
          </View>
        ) : null}
        {playlists.length ? (
          playlists.map((playlist) => (
            <View key={playlist.id} style={styles.playlistCard}>
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
                <TouchableOpacity onPress={() => handleDelete(playlist.id)}>
                  <Trash2 size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.addLibraryButton}
                  onPress={() =>
                    router.push({
                      pathname: '/sermon-list',
                      params: { playlistId: playlist.id, playlistName: playlist.name },
                    })
                  }
                >
                  <Text style={styles.addLibraryButtonText}>Add From Library</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.openPlaylistButton}
                  onPress={() => router.push(`/playlist/${playlist.id}` as any)}
                >
                  <Text style={styles.openPlaylistButtonText}>
                    {playlist.sermons.length ? 'Open Playlist' : 'View Playlist'}
                  </Text>
                </TouchableOpacity>
              </View>

              {!playlist.sermons.length ? (
                <Text style={styles.emptyText}>Add sermons from the home feed or sermon details.</Text>
              ) : null}
            </View>
          ))
        ) : !loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No playlists yet</Text>
            <Text style={styles.emptyCopy}>Create one, then save sermons from the home feed.</Text>
          </View>
        ) : null}
      </ScrollView>

      <CustomModal visible={modalVisible} onClose={() => setModalVisible(false)} title="Create Playlist">
        <TextInput
          style={styles.modalInput}
          value={newPlaylistName}
          onChangeText={setNewPlaylistName}
          placeholder="Prayer fuel, Road trip, Sunday replay..."
        />
        <TouchableOpacity style={styles.modalButton} onPress={handleCreate}>
          <Text style={styles.modalButtonText}>Create Playlist</Text>
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
  header: {
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
  },
  subtitle: {
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  createButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  createButtonText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingTop: 0,
    gap: SPACING.md,
  },
  playlistCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
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
  emptyText: {
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  addLibraryButton: {
    flex: 1,
    backgroundColor: '#EAF2FF',
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  addLibraryButtonText: {
    color: COLORS.primary,
    fontWeight: '800',
    textAlign: 'center',
  },
  openPlaylistButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  openPlaylistButtonText: {
    color: COLORS.white,
    fontWeight: '800',
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
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
  refreshingText: {
    color: COLORS.gray,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D9E6FF',
    backgroundColor: '#F8FBFF',
    borderRadius: 18,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  modalButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 999,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  modalButtonText: {
    color: COLORS.white,
    fontWeight: '800',
  },
});

