import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Sermon } from '@/types';
import { COLORS, SPACING, FONTS } from '@/constants/theme';
import { Play, Download } from 'lucide-react-native';

interface SermonCardProps {
  sermon: Sermon;
  onPress: () => void;
}

export default function SermonCard({ sermon, onPress }: SermonCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: sermon.imageUrl }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {sermon.title}
        </Text>
        <Text style={styles.speaker}>{sermon.speaker}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {sermon.duration} min • {sermon.mediaType}
          </Text>
          <View style={styles.stats}>
            <Play size={14} color={COLORS.gray} />
            <Text style={styles.statText}>{sermon.views}</Text>
            <Download size={14} color={COLORS.gray} style={styles.statIcon} />
            <Text style={styles.statText}>{sermon.downloads}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginVertical: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.lightGray,
  },
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  speaker: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.gray,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginLeft: SPACING.sm,
  },
  statText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.gray,
    marginLeft: 4,
  },
});
