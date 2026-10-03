import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import SimpleChart from '@/components/SimpleChart';
import { getAdminAnalytics } from '@/lib/admin-analytics';
import { useAppTheme } from '@/lib/theme';

type AnalyticsState = Awaited<ReturnType<typeof getAdminAnalytics>> | null;

export default function AnalyticsScreen() {
  const { colors } = useAppTheme();
  const [analytics, setAnalytics] = useState<AnalyticsState>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        setLoading(true);
        try {
          const next = await getAdminAnalytics();
          if (active) setAnalytics(next);
        } finally {
          if (active) setLoading(false);
        }
      };
      load();
      return () => {
        active = false;
      };
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedText }]}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
        <Text style={[styles.headerText, { color: colors.mutedText }]}>This screen now computes live stats from the current sermon feed and Supabase users.</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{analytics?.summary.totalViews ?? 0}</Text>
          <Text style={styles.statLabel}>Total views</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{analytics?.summary.totalDownloads ?? 0}</Text>
          <Text style={styles.statLabel}>Downloads</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{analytics?.summary.activeUsers ?? 0}</Text>
          <Text style={styles.statLabel}>Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{analytics?.summary.videoShare ?? 0}%</Text>
          <Text style={styles.statLabel}>Video share</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <SimpleChart data={analytics?.viewTrendData ?? []} title="Recent sermon views" />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Format split</Text>
        <View style={styles.barGroup}>
          <Text style={styles.barLabel}>Audio</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${analytics?.summary.audioShare ?? 0}%`, backgroundColor: COLORS.primary }]} />
          </View>
          <Text style={styles.barValue}>{analytics?.summary.audioShare ?? 0}%</Text>
        </View>
        <View style={styles.barGroup}>
          <Text style={styles.barLabel}>Video</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${analytics?.summary.videoShare ?? 0}%`, backgroundColor: COLORS.accent }]} />
          </View>
          <Text style={styles.barValue}>{analytics?.summary.videoShare ?? 0}%</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Top performing sermons</Text>
        {(analytics?.topSermons ?? []).map((sermon, index) => (
          <View key={sermon.id} style={styles.topRow}>
            <Text style={styles.topRank}>#{index + 1}</Text>
            <View style={styles.topTextWrap}>
              <Text style={styles.topTitle}>{sermon.title}</Text>
              <Text style={styles.topMeta}>{sermon.speaker}</Text>
            </View>
            <Text style={styles.topViews}>{sermon.views}</Text>
          </View>
        ))}
      </View>
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
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.gray,
    fontWeight: '700',
  },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: '#EEF3FB',
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
  },
  headerText: {
    marginTop: SPACING.sm,
    color: COLORS.gray,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#EEF3FB',
  },
  statNumber: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '900',
  },
  statLabel: {
    marginTop: SPACING.xs,
    color: COLORS.gray,
    fontWeight: '700',
  },
  panel: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#EEF3FB',
  },
  panelTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: SPACING.md,
  },
  barGroup: {
    marginBottom: SPACING.md,
  },
  barLabel: {
    color: COLORS.text,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  barTrack: {
    height: 18,
    backgroundColor: '#EEF3FB',
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  barValue: {
    marginTop: 4,
    color: COLORS.gray,
    fontWeight: '700',
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
