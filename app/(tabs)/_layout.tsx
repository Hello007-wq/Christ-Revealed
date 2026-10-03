import { Tabs } from 'expo-router';
import { Platform, Text } from 'react-native';
import { Home, Newspaper, ShoppingBag, MessageCircle, UsersRound } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { useSegments } from 'expo-router';
import HeaderMenu from '@/components/HeaderMenu';
import { useAppTheme } from '@/lib/theme';
import { getTabBadgeCounts } from '@/lib/tab-badge-service';

export default function TabLayout() {
  const { colors } = useAppTheme();
  const segments = useSegments();
  const [merchBadge, setMerchBadge] = useState(0);
  const [communityBadge, setCommunityBadge] = useState(0);

  const loadBadges = useCallback(async () => {
    try {
      const counts = await getTabBadgeCounts();
      setMerchBadge(counts.merch);
      setCommunityBadge(counts.community);
    } catch {
      setMerchBadge(0);
      setCommunityBadge(0);
    }
  }, []);

  useEffect(() => {
    loadBadges().catch(() => undefined);
    const id = setInterval(() => loadBadges().catch(() => undefined), 20000);
    return () => clearInterval(id);
  }, [loadBadges]);

  useEffect(() => {
    const current = segments[segments.length - 1] ?? '';
    if (current === 'merch') {
      setMerchBadge(0);
    }
    if (current === 'community') {
      setCommunityBadge(0);
    }
  }, [segments]);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.header,
        },
        headerTintColor: colors.headerText,
        headerTitle: ({ children, tintColor }) => (
          <Text
            style={{
              color: tintColor ?? colors.headerText,
              fontWeight: '700',
              marginTop: Platform.OS === 'ios' ? -2 : 0,
            }}
          >
            {children}
          </Text>
        ),
        headerTitleAlign: 'left',
        headerRightContainerStyle: {
          paddingRight: 6,
          paddingTop: Platform.OS === 'ios' ? 2 : 0,
        },
        headerLeftContainerStyle: {
          paddingLeft: 6,
          paddingTop: Platform.OS === 'ios' ? 2 : 0,
        },
        headerRight: () => <HeaderMenu />,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          height: 68,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarItemStyle: {
          minHeight: 56,
          paddingVertical: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'News',
          tabBarIcon: ({ size, color }) => <Newspaper size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="playlists"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="merch"
        options={{
          title: 'Store',
          tabBarIcon: ({ size, color }) => <ShoppingBag size={size} color={color} />,
          tabBarBadge: merchBadge > 0 ? (merchBadge > 99 ? '99+' : merchBadge) : undefined,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ size, color }) => <MessageCircle size={size} color={color} />,
          tabBarBadge: communityBadge > 0 ? (communityBadge > 99 ? '99+' : communityBadge) : undefined,
        }}
      />
      <Tabs.Screen
        name="pastors"
        options={{
          title: 'Pastors',
          tabBarIcon: ({ size, color }) => <UsersRound size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="photos"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="downloads"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
