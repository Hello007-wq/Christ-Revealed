import { useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING, FONTS } from '@/constants/theme';
import { MOCK_SERMONS } from '@/data/mockData';
import { Play, Download, Bookmark, Share2 } from 'lucide-react-native';

export default function SermonDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const sermon = MOCK_SERMONS.find((s) => s.id === id);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  if (!sermon) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Sermon not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: sermon.imageUrl }} style={styles.image} />

      <View style={styles.content}>
        <Text style={styles.title}>{sermon.title}</Text>
        <Text style={styles.speaker}>{sermon.speaker}</Text>
        <Text style={styles.date}>{new Date(sermon.date).toLocaleDateString()}</Text>

        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {sermon.duration} minutes • {sermon.mediaType}
          </Text>
          <Text style={styles.metaText}>
            {sermon.views} views • {sermon.downloads} downloads
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton}>
            <Play size={24} color={COLORS.white} />
            <Text style={styles.primaryButtonText}>Play</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setIsDownloaded(!isDownloaded)}
          >
            <Download size={20} color={isDownloaded ? COLORS.success : COLORS.primary} />
            <Text style={styles.secondaryButtonText}>
              {isDownloaded ? 'Downloaded' : 'Download'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsBookmarked(!isBookmarked)}
          >
            <Bookmark
              size={24}
              color={isBookmarked ? COLORS.accent : COLORS.gray}
              fill={isBookmarked ? COLORS.accent : 'none'}
            />
            <Text style={styles.iconButtonText}>Bookmark</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <Share2 size={24} color={COLORS.gray} />
            <Text style={styles.iconButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tagsContainer}>
          {sermon.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>About This Sermon</Text>
        <Text style={styles.description}>
          A powerful message delivered by {sermon.speaker} exploring themes of {sermon.tags.join(', ')}.
          This sermon offers deep insights and practical application for daily Christian living.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  image: {
    width: '100%',
    height: 250,
    backgroundColor: COLORS.lightGray,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.title,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  speaker: {
    fontSize: FONTS.sizes.large,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  date: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.gray,
    marginBottom: SPACING.md,
  },
  meta: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.lightGray,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
  },
  metaText: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.gray,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.medium,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderColor: COLORS.lightGray,
    marginBottom: SPACING.lg,
  },
  iconButton: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  iconButtonText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.gray,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  tag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  tagText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.small,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xlarge,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.text,
    lineHeight: 24,
  },
  errorText: {
    fontSize: FONTS.sizes.large,
    color: COLORS.error,
    textAlign: 'center',
    padding: SPACING.xl,
  },
});
