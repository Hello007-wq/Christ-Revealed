import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS } from '@/constants/theme';
import { MOCK_ANALYTICS, MOCK_SERMONS } from '@/data/mockData';
import Card from '@/components/Card';
import SimpleChart from '@/components/SimpleChart';
import { TrendingUp, Download, Eye, Users } from 'lucide-react-native';

export default function AnalyticsScreen() {
  const viewTrendData = MOCK_ANALYTICS.viewTrends.map((trend) => ({
    label: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: trend.views,
  }));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Eye size={28} color={COLORS.primary} />
          <Text style={styles.statValue}>{MOCK_ANALYTICS.totalViews.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Views</Text>
        </Card>

        <Card style={styles.statCard}>
          <Download size={28} color={COLORS.accent} />
          <Text style={styles.statValue}>{MOCK_ANALYTICS.totalDownloads.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Downloads</Text>
        </Card>

        <Card style={styles.statCard}>
          <Users size={28} color={COLORS.success} />
          <Text style={styles.statValue}>{MOCK_ANALYTICS.activeUsers.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Active Users</Text>
        </Card>

        <Card style={styles.statCard}>
          <TrendingUp size={28} color={COLORS.error} />
          <Text style={styles.statValue}>{MOCK_ANALYTICS.engagementRate}%</Text>
          <Text style={styles.statLabel}>Engagement</Text>
        </Card>
      </View>

      <View style={styles.section}>
        <SimpleChart data={viewTrendData} title="Views Over Time" />
      </View>

      <View style={styles.section}>
        <Card>
          <Text style={styles.sectionTitle}>Format Preference</Text>
          <View style={styles.formatStats}>
            <View style={styles.formatItem}>
              <Text style={styles.formatLabel}>Audio</Text>
              <View style={styles.formatBarContainer}>
                <View
                  style={[
                    styles.formatBar,
                    {
                      width: `${MOCK_ANALYTICS.formatPreference.audio}%`,
                      backgroundColor: COLORS.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.formatValue}>{MOCK_ANALYTICS.formatPreference.audio}%</Text>
            </View>

            <View style={styles.formatItem}>
              <Text style={styles.formatLabel}>Video</Text>
              <View style={styles.formatBarContainer}>
                <View
                  style={[
                    styles.formatBar,
                    {
                      width: `${MOCK_ANALYTICS.formatPreference.video}%`,
                      backgroundColor: COLORS.accent,
                    },
                  ]}
                />
              </View>
              <Text style={styles.formatValue}>{MOCK_ANALYTICS.formatPreference.video}%</Text>
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Performing Sermons</Text>
        {MOCK_ANALYTICS.popularSermons.map((sermon, index) => (
          <Card key={sermon.id} style={styles.sermonCard}>
            <View style={styles.rank}>
              <Text style={styles.rankText}>#{index + 1}</Text>
            </View>
            <View style={styles.sermonInfo}>
              <Text style={styles.sermonTitle} numberOfLines={1}>
                {sermon.title}
              </Text>
              <Text style={styles.sermonSpeaker}>{sermon.speaker}</Text>
              <View style={styles.sermonStats}>
                <View style={styles.stat}>
                  <Eye size={14} color={COLORS.gray} />
                  <Text style={styles.statText}>{sermon.views}</Text>
                </View>
                <View style={styles.stat}>
                  <Download size={14} color={COLORS.gray} />
                  <Text style={styles.statText}>{sermon.downloads}</Text>
                </View>
              </View>
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: SPACING.md,
  },
  statValue: {
    fontSize: FONTS.sizes.title,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  statLabel: {
    fontSize: FONTS.sizes.small,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  section: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xlarge,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  formatStats: {
    gap: SPACING.lg,
  },
  formatItem: {
    gap: SPACING.sm,
  },
  formatLabel: {
    fontSize: FONTS.sizes.medium,
    fontWeight: '600',
    color: COLORS.text,
  },
  formatBarContainer: {
    height: 30,
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    overflow: 'hidden',
  },
  formatBar: {
    height: '100%',
  },
  formatValue: {
    fontSize: FONTS.sizes.medium,
    fontWeight: '700',
    color: COLORS.text,
  },
  sermonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  rank: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  rankText: {
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
    color: COLORS.white,
  },
  sermonInfo: {
    flex: 1,
  },
  sermonTitle: {
    fontSize: FONTS.sizes.medium,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  sermonSpeaker: {
    fontSize: FONTS.sizes.small,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  sermonStats: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.gray,
  },
});
