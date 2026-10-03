import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Heart, MessageCircle, Play, PlusSquare } from 'lucide-react-native';
import { Sermon } from '@/types';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import MediaFallback from '@/components/MediaFallback';

interface SermonFeedCardProps {
  sermon: Sermon;
  reactionCount: number;
  commentCount: number;
  reacted: boolean;
  savedToPlaylist: boolean;
  onOpen: () => void;
  onReact: () => void;
  onComment: () => void;
  onAddToPlaylist: () => void;
}

export default function SermonFeedCard({
  sermon,
  reactionCount,
  commentCount,
  reacted,
  savedToPlaylist,
  onOpen,
  onReact,
  onComment,
  onAddToPlaylist,
}: SermonFeedCardProps) {
  return (
    <View style={styles.card}>
      <TouchableOpacity activeOpacity={0.92} onPress={onOpen}>
        <MediaFallback
          imageUrl={sermon.imageUrl}
          title="Sermon cover"
          subtitle="Artwork not available"
          variant="sermon"
          style={styles.image}
        />
        <View style={styles.overlay}>
          <View style={styles.mediaBadge}>
            <Play size={14} color={COLORS.white} fill={COLORS.white} />
            <Text style={styles.mediaBadgeText}>{sermon.mediaType === 'video' ? 'Watch Now' : 'Audio'}</Text>
          </View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{sermon.duration} min</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>{sermon.title}</Text>
        <Text style={styles.speaker}>{sermon.speaker}</Text>
        <Text style={styles.meta}>{new Date(sermon.date).toLocaleDateString()}</Text>

        {sermon.tags.length ? (
          <View style={styles.tagsRow}>
            {sermon.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={onReact}>
            <Heart
              size={18}
              color={reacted ? COLORS.error : COLORS.primary}
              fill={reacted ? COLORS.error : 'none'}
            />
            <Text style={styles.actionText}>{reactionCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onComment}>
            <MessageCircle size={18} color={COLORS.primary} />
            <Text style={styles.actionText}>{commentCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.playlistButton, savedToPlaylist && styles.playlistButtonSaved]}
            onPress={onAddToPlaylist}
          >
            <PlusSquare size={18} color={COLORS.white} />
            <Text style={styles.playlistText}>{savedToPlaylist ? 'Saved' : 'Playlist'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    shadowColor: '#0B2D64',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  image: {
    width: '100%',
    height: 230,
    backgroundColor: COLORS.lightGray,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  mediaBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(24,107,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  mediaBadgeText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.small,
    fontWeight: '700',
  },
  durationBadge: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(51,51,51,0.76)',
    borderRadius: 999,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  durationText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.small,
    fontWeight: '700',
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  speaker: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
  },
  meta: {
    color: COLORS.gray,
    fontSize: FONTS.sizes.small,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  tag: {
    backgroundColor: '#EAF2FF',
    borderRadius: 999,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  tagText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.small,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  actionText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.small,
    fontWeight: '700',
  },
  playlistButton: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  playlistButtonSaved: {
    backgroundColor: COLORS.success,
  },
  playlistText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.small,
    fontWeight: '700',
  },
});
