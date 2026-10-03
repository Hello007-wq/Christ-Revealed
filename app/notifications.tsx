import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Bell, Check } from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';
import { getSeenNotificationIds, getUserNotifications, markNotificationSeen } from '@/lib/notifications-service';
import { useAppTheme } from '@/lib/theme';

type NotificationItem = Awaited<ReturnType<typeof getUserNotifications>>[number];

export default function NotificationsInboxScreen() {
  const { colors } = useAppTheme();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        setLoading(true);
        try {
          const [data, seen] = await Promise.all([getUserNotifications(40), getSeenNotificationIds()]);
          if (!active) return;
          setItems(data);
          setSeenIds(seen);
        } finally {
          if (active) setLoading(false);
        }
      };
      load().catch(() => {
        if (active) setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.mutedBackground }]}>
      <View style={[styles.hero, { backgroundColor: colors.header }]}>
        <Text style={[styles.heroTitle, { color: colors.headerText }]}>Notifications</Text>
        <Text style={[styles.heroText, { color: colors.headerText }]}>Updates from the admin team appear here.</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ color: colors.mutedText, marginTop: 8 }}>Loading notifications...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {items.map((item) => (
            <View key={item.id} style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.cardHeader}>
                <Bell size={18} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                <TouchableOpacity
                  style={[
                    styles.seenButton,
                    { backgroundColor: seenIds.has(item.id) ? colors.success : colors.surfaceAlt, borderColor: colors.border },
                  ]}
                  onPress={async () => {
                    if (seenIds.has(item.id)) return;
                    try {
                      await markNotificationSeen(item.id);
                      setSeenIds((prev) => new Set([...Array.from(prev), item.id]));
                    } catch {
                      // Ignore and keep screen responsive.
                    }
                  }}
                >
                  {seenIds.has(item.id) ? (
                    <Check size={14} color="#fff" />
                  ) : (
                    <Text style={[styles.seenButtonText, { color: colors.mutedText }]}>Seen</Text>
                  )}
                </TouchableOpacity>
              </View>
              <Text style={[styles.cardBody, { color: colors.mutedText }]}>{item.body}</Text>
              <Text style={[styles.cardDate, { color: colors.mutedText }]}>
                {new Date(item.created_at).toLocaleString()}
              </Text>
            </View>
          ))}

          {items.length === 0 ? (
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>No notifications yet</Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    margin: SPACING.sm,
    borderRadius: 20,
    padding: SPACING.md,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  heroText: {
    marginTop: SPACING.xs,
    lineHeight: 18,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 18,
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
  },
  cardBody: {
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  cardDate: {
    marginTop: SPACING.sm,
    fontSize: 12,
  },
  seenButton: {
    borderWidth: 1,
    borderRadius: 999,
    minWidth: 54,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  seenButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
