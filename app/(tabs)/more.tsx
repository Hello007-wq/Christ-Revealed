import { useRouter } from 'expo-router';
import { Image as ImageIcon, UsersRound } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { useAppTheme } from '@/lib/theme';

type Destination = {
  key: string;
  title: string;
  description: string;
  route: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  accent: string;
};

export default function MoreScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

  const destinations: Destination[] = [
    {
      key: 'pastors',
      title: 'Pastors',
      description: 'Quick access to the pastoral team for prayer and support.',
      route: '/(tabs)/pastors',
      icon: UsersRound,
      accent: colors.success,
    },
    {
      key: 'photos',
      title: 'Church Photos',
      description: 'Browse recent ministry photos and event moments.',
      route: '/(tabs)/photos',
      icon: ImageIcon,
      accent: COLORS.primary,
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.mutedBackground }]} contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: colors.header }]}>
        <Text style={[styles.heroTitle, { color: colors.headerText }]}>More</Text>
        <Text style={[styles.heroText, { color: colors.headerText }]}>
          Secondary pages stay organized here so the main bottom navigation stays clean, readable, and accessible.
        </Text>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>More pages</Text>
        <Text style={[styles.sectionText, { color: colors.mutedText }]}>
          These pages remain fully available, but they no longer crowd the primary tab bar.
        </Text>

        <View style={styles.grid}>
          {destinations.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.9}
                style={[styles.destinationCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                onPress={() => router.push(item.route as any)}
                accessibilityRole="button"
                accessibilityLabel={item.title}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${item.accent}18` }]}>
                  <Icon size={22} color={item.accent} />
                </View>
                <Text style={[styles.destinationTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.destinationText, { color: colors.mutedText }]}>{item.description}</Text>
              </TouchableOpacity>
            );
          })}
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
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  heroText: {
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  sectionText: {
    marginTop: 6,
    lineHeight: 20,
  },
  grid: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  destinationCard: {
    minHeight: 108,
    borderWidth: 1,
    borderRadius: 20,
    padding: SPACING.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  destinationTitle: {
    fontSize: FONTS.sizes.large,
    fontWeight: '800',
  },
  destinationText: {
    marginTop: 4,
    lineHeight: 19,
  },
});
