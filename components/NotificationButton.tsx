import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAppTheme } from '@/lib/theme';
import { getUnreadNotificationCount } from '@/lib/notifications-service';
import { useCallback } from 'react';

export default function NotificationButton() {
  const router = useRouter();
  const { colors, mode } = useAppTheme();
  const [count, setCount] = useState(0);

  const loadUnread = useCallback(async () => {
    try {
      const unread = await getUnreadNotificationCount();
      setCount(unread);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const unread = await getUnreadNotificationCount();
        if (mounted) setCount(unread);
      } catch {
        if (mounted) setCount(0);
      }
    };
    load().catch(() => undefined);
    const id = setInterval(() => load().catch(() => undefined), 20000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUnread().catch(() => undefined);
    }, [loadUnread])
  );

  const openNotifications = async () => {
    router.push('/notifications');
  };

  return (
    <TouchableOpacity
      onPress={openNotifications}
      style={{
        width: 40,
        height: 40,
        marginRight: 8,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: mode === 'dark' ? colors.surface : 'rgba(255,255,255,0.18)',
      }}
    >
      <Bell size={18} color={mode === 'dark' ? colors.primary : colors.headerText} />
      {count > 0 ? (
        <View
          style={{
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
          }}
        >
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{count > 99 ? '99+' : count}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
