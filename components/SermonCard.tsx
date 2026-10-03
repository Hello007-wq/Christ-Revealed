import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Play } from 'lucide-react-native';
import { Sermon } from '@/types';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import MediaFallback from '@/components/MediaFallback';

interface SermonCardProps {
  sermon: Sermon;
  onPress: () => void;
}

export default function SermonCard({ sermon, onPress }: SermonCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      <MediaFallback
        imageUrl={sermon.imageUrl}
        title="Sermon cover"
        subtitle="Artwork not available"
        variant="sermon"
        style={styles.image}
      />
      <View style={styles.playButton}>
        <Play size={16} color={COLORS.white} fill={COLORS.white} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {sermon.title}
        </Text>
        <Text style={styles.speaker}>{sermon.speaker}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{new Date(sermon.date).toLocaleDateString()}</Text>
          <Text style={styles.meta}>{sermon.duration} min</Text>
          <Text style={styles.meta}>{sermon.mediaType}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: '#0B2D64',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.lightGray,
  },
  playButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(24,107,255,0.94)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
  },
  speaker: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.medium,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  meta: {
    color: COLORS.gray,
    fontSize: FONTS.sizes.small,
    fontWeight: '700',
  },
});
