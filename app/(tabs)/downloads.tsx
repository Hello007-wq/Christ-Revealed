import { useRouter } from 'expo-router';
import { Download, BookOpen, PlayCircle } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { useAppTheme } from '@/lib/theme';

export default function DownloadsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.mutedBackground }]} contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: colors.header }]}>
        <Download size={26} color={colors.headerText} />
        <Text style={[styles.heroTitle, { color: colors.headerText }]}>Offline Library</Text>
        <Text style={[styles.heroText, { color: colors.headerText }]}>
          Saved sermons and playlists will appear here so people can revisit ministry content without reloading the feed.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>No saved content yet</Text>
        <Text style={[styles.cardBody, { color: colors.mutedText }]}>
          You can continue browsing sermons and playlists from the main app. When an item is saved for offline access, it will surface here automatically.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/(tabs)')}>
            <PlayCircle size={18} color={COLORS.white} />
            <Text style={styles.actionText}>Browse sermons</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryAction, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/playlists')}
          >
            <BookOpen size={18} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Open playlists</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  hero: {
    borderRadius: 22,
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
  },
  heroText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: FONTS.sizes.medium,
    lineHeight: 20,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: SPACING.xl,
    gap: SPACING.sm,
    shadowColor: '#0B2D64',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
  },
  cardBody: {
    color: COLORS.gray,
    fontSize: FONTS.sizes.medium,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 48,
  },
  secondaryAction: {
    borderWidth: 1,
  },
  actionText: {
    color: COLORS.white,
    fontWeight: '800',
  },
});
