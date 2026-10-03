import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider, useAppTheme } from '@/lib/theme';
import { configureDailyVerseNotifications, ensureDailyVerseNotifications } from '@/lib/daily-verse-service';
import { registerDevicePushToken } from '@/lib/push-service';
import supabase, {
  getLastProtectedRoute,
  getAuthSnapshot,
  isInvalidRefreshTokenError,
  recoverFromInvalidSession,
  resolveAdminState,
  setLastProtectedRoute,
} from '@/lib/supabase';

const CONNECTIVITY_TIMEOUT_MS = 3500;

function getDefaultProtectedRoute(isAdmin: boolean) {
  return isAdmin ? '/(admin)' : '/(tabs)';
}

function getStoredRouteForRole(route: string, isAdmin: boolean) {
  if (isAdmin && route.startsWith('/(tabs)')) {
    return '/(admin)';
  }

  if (!route.startsWith('/(admin)') && !route.startsWith('/(tabs)') && route !== '/notifications') {
    return getDefaultProtectedRoute(isAdmin);
  }

  if (!isAdmin && route.startsWith('/(admin)')) {
    return '/(tabs)';
  }

  return route;
}

function getProtectedRouteFromSegments(currentSegments: string[]) {
  if (currentSegments[0] === '(tabs)') {
    return currentSegments[1] ? `/(tabs)/${currentSegments[1]}` : '/(tabs)';
  }

  if (currentSegments[0] === '(admin)') {
    return currentSegments[1] ? `/(admin)/${currentSegments[1]}` : '/(admin)';
  }

  if (currentSegments[0] === 'notifications') {
    return '/notifications';
  }

  return null;
}

async function getOnlineStatus() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONNECTIVITY_TIMEOUT_MS);

  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
      },
      signal: controller.signal,
    });
    return Boolean(response);
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

function RootNavigator() {
  const { mode } = useAppTheme();
  const router = useRouter();
  const segments = useSegments();
  const segmentsRef = useRef<string[]>(segments);
  const lastRedirectRef = useRef<string | null>(null);
  const authSyncInFlightRef = useRef(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    configureDailyVerseNotifications().catch(() => undefined);
    ensureDailyVerseNotifications().catch(() => undefined);
  }, []);

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    let active = true;

    const refreshConnectivity = async () => {
      const nextState = await getOnlineStatus();
      if (active) {
        setIsOnline(nextState);
      }
    };

    refreshConnectivity().catch(() => {
      if (active) setIsOnline(false);
    });

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshConnectivity().catch(() => {
          if (active) setIsOnline(false);
        });
      }
    });

    const intervalId = setInterval(() => {
      refreshConnectivity().catch(() => {
        if (active) setIsOnline(false);
      });
    }, 15000);

    return () => {
      active = false;
      appStateSubscription.remove();
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const currentSegments = segmentsRef.current.length ? segmentsRef.current : segments;
    const route = getProtectedRouteFromSegments(currentSegments);
    if (!route || isOnline !== true) return;
    setLastProtectedRoute(route).catch(() => undefined);
  }, [segments, isOnline]);

  useEffect(() => {
    let mounted = true;

    const replaceRoute = (targetRoute: string) => {
      if (lastRedirectRef.current === targetRoute) return;
      lastRedirectRef.current = targetRoute;
      router.replace(targetRoute as any);
    };

    const routeFromSession = async () => {
      if (isOnline == null || authSyncInFlightRef.current) return;
      authSyncInFlightRef.current = true;

      try {
        const currentSegments = segmentsRef.current.length ? segmentsRef.current : segments;
        const inAuthGroup = currentSegments[0] === 'login' || currentSegments[0] === 'signup';
        const atPublicHome = currentSegments.length === 0;
        const inGuestGroup = currentSegments[0] === '(guest)';
        const atGuestBible = inGuestGroup && (!currentSegments[1] || currentSegments[1] === 'index');
        const atNotifications = currentSegments[0] === 'notifications';
        const inAdminGroup = currentSegments[0] === '(admin)';
        const inProtectedGroup =
          currentSegments[0] === '(tabs)' ||
          currentSegments[0] === '(admin)' ||
          currentSegments[0] === 'sermon' ||
          atNotifications;

        if (!isOnline) {
          if (!atGuestBible) {
            replaceRoute('/(guest)');
          }
          return;
        }

        let session = null;
        try {
          const {
            data: { session: nextSession },
          } = await supabase.auth.getSession();
          session = nextSession;
        } catch (error) {
          if (isInvalidRefreshTokenError(error)) {
            await recoverFromInvalidSession();
          } else {
            throw error;
          }
        }

        if (!mounted) return;

        if (!session?.user) {
          if (inProtectedGroup || inAdminGroup) {
            replaceRoute('/(guest)');
          }
          return;
        }

        const isAdmin = await resolveAdminState(session.user.id, session.user.email ?? undefined);

        if (!mounted) return;

        if (inAuthGroup || atPublicHome || inGuestGroup) {
          const defaultRoute = getDefaultProtectedRoute(isAdmin);
          const storedRoute = await getLastProtectedRoute(defaultRoute);
          replaceRoute(getStoredRouteForRole(storedRoute, isAdmin));
        } else if (isAdmin && currentSegments[0] === '(tabs)') {
          replaceRoute('/(admin)');
        } else if (inAdminGroup && !isAdmin) {
          replaceRoute('/(tabs)');
        }
        registerDevicePushToken().catch(() => undefined);
      } finally {
        authSyncInFlightRef.current = false;
        setBootstrapping(false);
      }
    };

    routeFromSession().catch(() => {
      if (mounted) setBootstrapping(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, _session) => {
      routeFromSession().catch(async (error) => {
        if (isInvalidRefreshTokenError(error)) {
          await recoverFromInvalidSession();
          if (mounted) setBootstrapping(false);
        }
      });
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [isOnline, router, segments]);

  if (bootstrapping) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: mode === 'dark' ? '#0E1525' : '#FFFFFF' }}>
        <ActivityIndicator color={mode === 'dark' ? '#5A9CFF' : '#186BFF'} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(guest)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notifications' }} />
        <Stack.Screen name="bible" options={{ headerShown: true, title: 'Bible' }} />
        <Stack.Screen name="playlist/[id]" options={{ headerShown: true, title: 'Playlist' }} />
        <Stack.Screen name="news/[id]" options={{ headerShown: true, title: 'News' }} />
        <Stack.Screen name="sermon/[id]" options={{ headerShown: true, title: 'Sermon Details' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}
