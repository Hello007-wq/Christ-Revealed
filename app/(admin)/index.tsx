import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONTS } from '@/constants/theme';
import { MOCK_ANALYTICS } from '@/data/mockData';
import Card from '@/components/Card';
import { Upload, BarChart3, Bell, Shield, Users, TrendingUp, ShoppingBag } from 'lucide-react-native';

export default function AdminDashboard() {
  const router = useRouter();

  const menuItems = [
    {
      id: 'upload',
      title: 'Upload Sermon',
      icon: Upload,
      route: '/(admin)/upload',
      color: COLORS.accent,
    },
    {
      id: 'analytics',
      title: 'View Analytics',
      icon: BarChart3,
      route: '/(admin)/analytics',
      color: COLORS.primary,
    },
    {
      id: 'notifications',
      title: 'Push Notifications',
      icon: Bell,
      route: '/(admin)/notifications',
      color: COLORS.error,
    },
    {
      id: 'moderate',
      title: 'Moderate Content',
      icon: Shield,
      route: '/(admin)/moderate',
      color: COLORS.success,
    },
    {
      id: 'merch-upload',
      title: 'Upload Merchandise',
      icon: ShoppingBag,
      route: '/(admin)/merch-upload',
      color: COLORS.accent,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, Admin</Text>
        <Text style={styles.subtitle}>Manage your ministry content</Text>
      </View>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Users size={32} color={COLORS.primary} />
          <Text style={styles.statValue}>{MOCK_ANALYTICS.activeUsers.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Active Users</Text>
        </Card>

        <Card style={styles.statCard}>
          <TrendingUp size={32} color={COLORS.accent} />
          <Text style={styles.statValue}>{MOCK_ANALYTICS.totalViews.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Views</Text>
        </Card>

        <Card style={styles.statCard}>
          <BarChart3 size={32} color={COLORS.success} />
          <Text style={styles.statValue}>{MOCK_ANALYTICS.engagementRate}%</Text>
          <Text style={styles.statLabel}>Engagement</Text>
        </Card>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
              <item.icon size={24} color={item.color} />
            </View>
            <Text style={styles.menuText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <Card>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatLabel}>Audio vs Video Preference</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${MOCK_ANALYTICS.formatPreference.audio}%`,
                    backgroundColor: COLORS.primary,
                  },
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>
                Audio: {MOCK_ANALYTICS.formatPreference.audio}%
              </Text>
              <Text style={styles.progressLabel}>
                Video: {MOCK_ANALYTICS.formatPreference.video}%
              </Text>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  welcomeText: {
    fontSize: FONTS.sizes.title,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.accent,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    padding: SPACING.md,
  },
  statValue: {
    fontSize: FONTS.sizes.xxlarge,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  statLabel: {
    fontSize: FONTS.sizes.small,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  menu: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuText: {
    fontSize: FONTS.sizes.large,
    fontWeight: '600',
    color: COLORS.text,
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
  quickStat: {
    gap: SPACING.md,
  },
  quickStatLabel: {
    fontSize: FONTS.sizes.medium,
    fontWeight: '600',
    color: COLORS.text,
  },
  progressBar: {
    height: 30,
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: FONTS.sizes.small,
    color: COLORS.gray,
  },
});
