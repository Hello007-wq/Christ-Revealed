import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bell,
  BookOpen,
  Images,
  Info,
  LogOut,
  Menu,
  X,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SPACING, FONTS } from '@/constants/theme';
import { useAppTheme } from '@/lib/theme';
import { getUnreadNotificationCount } from '@/lib/notifications-service';
import { getUnseenPhotoCount } from '@/lib/photos-service';
import supabase, { clearAuthSnapshot } from '@/lib/supabase';
import ChurchInfoSheet from '@/components/ChurchInfoSheet';

function MenuRow({
  label,
  icon,
  onPress,
  badge,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  badge?: number;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.menuIconWrap}>{icon}</View>
      <Text style={styles.menuLabel}>{label}</Text>
      {typeof badge === 'number' && badge > 0 ? (
        <View style={styles.rowBadge}>
          <Text style={styles.rowBadgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export default function HeaderMenu() {
  const router = useRouter();
  const { colors, mode } = useAppTheme();
  const [visible, setVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);

  const loadBadges = useCallback(async () => {
    try {
      const [notifications, photos] = await Promise.all([
        getUnreadNotificationCount().catch(() => 0),
        getUnseenPhotoCount().catch(() => 0),
      ]);
      setNotificationCount(notifications);
      setPhotoCount(photos);
    } catch {
      setNotificationCount(0);
      setPhotoCount(0);
    }
  }, []);

  useEffect(() => {
    loadBadges().catch(() => undefined);
    const id = setInterval(() => loadBadges().catch(() => undefined), 20000);
    return () => clearInterval(id);
  }, [loadBadges]);

  useFocusEffect(
    useCallback(() => {
      loadBadges().catch(() => undefined);
    }, [loadBadges])
  );

  const totalBadge = notificationCount;

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={[
          styles.trigger,
          {
            backgroundColor: mode === 'dark' ? colors.surface : 'rgba(255,255,255,0.18)',
          },
        ]}
      >
        <Menu size={18} color={mode === 'dark' ? colors.primary : colors.headerText} />
        {totalBadge > 0 ? (
          <View style={styles.triggerBadge}>
            <Text style={styles.triggerBadgeText}>{totalBadge > 99 ? '99+' : totalBadge}</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Quick Menu</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <MenuRow
              label="Church Info"
              icon={<Info size={18} color={colors.primary} />}
              onPress={() => {
                setVisible(false);
                setInfoVisible(true);
              }}
            />

            <MenuRow
              label="Notifications"
              icon={<Bell size={18} color={colors.primary} />}
              badge={notificationCount}
              onPress={() => {
                setVisible(false);
                router.push('/notifications');
              }}
            />

            <MenuRow
              label="Church Photos"
              icon={<Images size={18} color={colors.primary} />}
              badge={photoCount}
              onPress={() => {
                setVisible(false);
                router.push('/(tabs)/photos');
              }}
            />

            <MenuRow
              label="Bible"
              icon={<BookOpen size={18} color={colors.primary} />}
              onPress={() => {
                setVisible(false);
                router.push('/bible');
              }}
            />

            <MenuRow
              label="Sign Out"
              icon={<LogOut size={18} color={colors.error} />}
              onPress={() => {
                setVisible(false);
                Alert.alert('Sign out', 'Do you want to sign out?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Sign out',
                    style: 'destructive',
                    onPress: async () => {
                      await clearAuthSnapshot();
                      await supabase.auth.signOut();
                      router.replace('/(guest)');
                    },
                  },
                ]);
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <ChurchInfoSheet visible={infoVisible} onClose={() => setInfoVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 40,
    height: 40,
    marginRight: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  triggerBadge: {
    position: 'absolute',
    right: 2,
    top: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E24646',
  },
  triggerBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  sheet: {
    marginTop: Platform.OS === 'ios' ? 96 : 90,
    marginRight: SPACING.md,
    marginLeft: 'auto',
    width: 250,
    borderRadius: 20,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sheetTitle: {
    fontSize: FONTS.sizes.large,
    fontWeight: '900',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  menuIconWrap: {
    width: 26,
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  menuLabel: {
    flex: 1,
    fontWeight: '700',
  },
  rowBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E24646',
  },
  rowBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
});
