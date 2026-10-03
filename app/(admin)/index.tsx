import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart3, Bell, Camera, Clapperboard, Shield, ShoppingBag, Sparkles, Upload, Users, Video } from 'lucide-react-native';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { getAdminAnalytics } from '@/lib/admin-analytics';
import { useAppTheme } from '@/lib/theme';

type DashboardState = Awaited<ReturnType<typeof getAdminAnalytics>> | null;

export default function AdminDashboard() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [dashboard, setDashboard] = useState<DashboardState>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        setLoading(true);
        try {
          const next = await getAdminAnalytics();
          if (active) setDashboard(next);
        } finally {
          if (active) setLoading(false);
        }
      };
      load().catch(() => undefined);
      return () => {
        active = false;
      };
    }, [])
  );

  const menuItems = [
    { id: 'upload', title: 'Upload Sermon', route: '/(admin)/upload', icon: Upload, color: COLORS.accent },
    { id: 'analytics', title: 'Analytics', route: '/(admin)/analytics', icon: BarChart3, color: COLORS.primary },
    { id: 'notifications', title: 'Notifications', route: '/(admin)/notifications', icon: Bell, color: COLORS.success },
    { id: 'photos', title: 'Post Photos', route: '/(admin)/photos', icon: Camera, color: COLORS.primary },
    { id: 'news', title: 'Upload News', route: '/(admin)/news', icon: Clapperboard, color: COLORS.accent },
    { id: 'moderate', title: 'Moderation', route: '/(admin)/moderate', icon: Shield, color: COLORS.error },
    { id: 'users', title: 'Users', route: '/(admin)/users', icon: Users, color: COLORS.primary },
    { id: 'merch', title: 'Merch Upload', route: '/(admin)/merch-upload', icon: ShoppingBag, color: COLORS.primary },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>Admin Control</Text>
      </View>

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.loadingText}>Refreshing dashboard...</Text>
        </View>
      ) : (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Users size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>{dashboard?.summary.activeUsers ?? 0}</Text>
              <Text style={styles.statLabel}>Users</Text>
            </View>
            <View style={styles.statCard}>
              <Sparkles size={24} color={COLORS.accent} />
              <Text style={styles.statValue}>{dashboard?.summary.totalViews ?? 0}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.statCard}>
              <Video size={24} color={COLORS.success} />
              <Text style={styles.statValue}>{dashboard?.summary.videoShare ?? 0}%</Text>
              <Text style={styles.statLabel}>Video</Text>
            </View>
          </View>

          <View style={styles.menuGrid}>
            {menuItems.map((item) => (
              <TouchableOpacity key={item.id} style={styles.menuCard} onPress={() => router.push(item.route as any)}>
                <View style={[styles.menuIconWrap, { backgroundColor: `${item.color}16` }]}>
                  <item.icon size={22} color={item.color} />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Top sermons right now</Text>
            {(dashboard?.topSermons ?? []).slice(0, 3).map((sermon, index) => (
              <View key={sermon.id} style={styles.topRow}>
                <Text style={styles.topRank}>#{index + 1}</Text>
                <View style={styles.topTextWrap}>
                  <Text style={styles.topTitle}>{sermon.title}</Text>
                  <Text style={styles.topMeta}>{sermon.speaker}</Text>
                </View>
                <Text style={styles.topViews}>{sermon.views} views</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  hero: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E3ECFF',
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.small,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loadingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    color: COLORS.gray,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: '#EEF3FB',
  },
  statValue: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '900',
  },
  statLabel: {
    color: COLORS.gray,
    fontWeight: '700',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  menuCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#EEF3FB',
  },
  menuIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  menuTitle: {
    color: COLORS.text,
    fontSize: FONTS.sizes.large,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#EEF3FB',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F4FA',
  },
  topRank: {
    width: 38,
    color: COLORS.primary,
    fontWeight: '900',
  },
  topTextWrap: {
    flex: 1,
  },
  topTitle: {
    color: COLORS.text,
    fontWeight: '800',
  },
  topMeta: {
    color: COLORS.gray,
    marginTop: 2,
  },
  topViews: {
    color: COLORS.accent,
    fontWeight: '800',
  },
});
