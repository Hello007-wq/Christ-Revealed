import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { COLORS, SPACING, FONTS } from '@/constants/theme';
import { MOCK_SERMONS } from '@/data/mockData';
import { Playlist } from '@/types';
import Card from '@/components/Card';
import CustomModal from '@/components/CustomModal';
import { Plus, Music, Trash2 } from 'lucide-react-native';

export default function PlaylistsScreen() {
  const [playlists, setPlaylists] = useState<Playlist[]>([
    {
      id: '1',
      name: 'Favorites',
      sermons: MOCK_SERMONS.slice(0, 3),
      createdAt: '2025-10-01',
    },
    {
      id: '2',
      name: 'Sunday Messages',
      sermons: MOCK_SERMONS.slice(1, 4),
      createdAt: '2025-10-15',
    },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const createPlaylist = () => {
    if (newPlaylistName.trim()) {
      const newPlaylist: Playlist = {
        id: Date.now().toString(),
        name: newPlaylistName,
        sermons: [],
        createdAt: new Date().toISOString(),
      };
      setPlaylists([...playlists, newPlaylist]);
      setNewPlaylistName('');
      setModalVisible(false);
    }
  };

  const deletePlaylist = (id: string) => {
    setPlaylists(playlists.filter((p) => p.id !== id));
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>My Playlists</Text>
          <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
            <Plus size={20} color={COLORS.white} />
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </View>

        {playlists.map((playlist) => (
          <Card key={playlist.id} style={styles.playlistCard}>
            <View style={styles.playlistHeader}>
              <View style={styles.playlistIcon}>
                <Music size={24} color={COLORS.accent} />
              </View>
              <View style={styles.playlistInfo}>
                <Text style={styles.playlistName}>{playlist.name}</Text>
                <Text style={styles.playlistMeta}>
                  {playlist.sermons.length} sermons
                </Text>
              </View>
              <TouchableOpacity onPress={() => deletePlaylist(playlist.id)}>
                <Trash2 size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>

            {playlist.sermons.length > 0 ? (
              <View style={styles.sermonsList}>
                {playlist.sermons.slice(0, 3).map((sermon) => (
                  <Text key={sermon.id} style={styles.sermonTitle} numberOfLines={1}>
                    • {sermon.title}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No sermons yet</Text>
            )}
          </Card>
        ))}
      </ScrollView>

      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Create Playlist"
      >
        <Text style={styles.label}>Playlist Name</Text>
        <TextInput
          style={styles.input}
          value={newPlaylistName}
          onChangeText={setNewPlaylistName}
          placeholder="Enter playlist name"
        />
        <TouchableOpacity style={styles.submitButton} onPress={createPlaylist}>
          <Text style={styles.submitButtonText}>Create Playlist</Text>
        </TouchableOpacity>
      </CustomModal>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.title,
    fontWeight: '700',
    color: COLORS.text,
  },
  createButton: {
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.medium,
    fontWeight: '600',
  },
  playlistCard: {
    marginHorizontal: SPACING.md,
  },
  playlistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  playlistIcon: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  playlistMeta: {
    fontSize: FONTS.sizes.small,
    color: COLORS.gray,
  },
  sermonsList: {
    gap: SPACING.xs,
  },
  sermonTitle: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.text,
  },
  emptyText: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  label: {
    fontSize: FONTS.sizes.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONTS.sizes.medium,
    marginBottom: SPACING.lg,
  },
  submitButton: {
    backgroundColor: COLORS.accent,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
  },
});
