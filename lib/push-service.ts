import Constants from 'expo-constants';
import { Platform } from 'react-native';
import supabase, { getSafeUser } from '@/lib/supabase';

type NotificationsModule = typeof import('expo-notifications');

function isExpoGo() {
  return Constants.executionEnvironment === 'storeClient';
}

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (Platform.OS === 'web' || isExpoGo()) {
    return null;
  }

  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

function getExpoProjectId() {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ||
    (Constants as any).easConfig?.projectId ||
    null
  );
}

export async function registerDevicePushToken() {
  const Notifications = await getNotificationsModule();
  const projectId = getExpoProjectId();
  const user = await getSafeUser();

  if (!Notifications || !projectId || !user) {
    return null;
  }

  const permissions = await Notifications.getPermissionsAsync();
  let granted =
    permissions.granted ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync();
    granted =
      requested.granted ||
      requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  }

  if (!granted) {
    return null;
  }

  const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenResult.data;
  if (!token) {
    return null;
  }

  const { error } = await supabase.from('device_push_tokens').upsert(
    {
      user_id: user.id,
      token,
      platform: Platform.OS,
      enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'token' }
  );

  if (error) throw error;
  return token;
}

export async function sendPushNotificationToAll(title: string, body: string, data?: Record<string, unknown>) {
  const { data: rows, error } = await supabase
    .from('device_push_tokens')
    .select('token')
    .eq('enabled', true);

  if (error) throw error;

  const tokens = Array.from(new Set((rows ?? []).map((row: any) => String(row.token)).filter(Boolean)));
  if (!tokens.length) return 0;

  const messages = tokens.map((token) => ({
    to: token,
    title,
    body,
    sound: 'default',
    data,
  }));

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    throw new Error(`Push send failed with status ${response.status}`);
  }

  return tokens.length;
}
