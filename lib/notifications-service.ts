import Constants from 'expo-constants';
import { Platform } from 'react-native';
import supabase, { requireSafeUser } from '@/lib/supabase';

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  scheduled_at: string | null;
  sent: boolean;
};

async function getCurrentUserId() {
  const user = await requireSafeUser();
  return user.id;
}

async function setAppBadgeCount(count: number) {
  if (Constants.executionEnvironment === 'storeClient') return;
  if (Platform.OS === 'web') return;

  try {
    const Notifications = await import('expo-notifications');
    await Notifications.setBadgeCountAsync(count);
  } catch {
    // Ignore badge sync issues and keep data flow working.
  }
}

export async function getUserNotifications(limit = 30) {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, body, created_at, scheduled_at, sent')
    .eq('sent', true)
    .or(`scheduled_at.is.null,scheduled_at.lte.${nowIso}`)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

export async function getUnreadNotificationCount() {
  const userId = await getCurrentUserId();
  const nowIso = new Date().toISOString();
  const [notificationsResult, readsResult] = await Promise.all([
    supabase
      .from('notifications')
      .select('id')
      .eq('sent', true)
      .or(`scheduled_at.is.null,scheduled_at.lte.${nowIso}`),
    supabase
      .from('notification_reads')
      .select('notification_id')
      .eq('user_id', userId),
  ]);
  if (notificationsResult.error) throw notificationsResult.error;
  if (readsResult.error) throw readsResult.error;

  const sentIds = new Set((notificationsResult.data ?? []).map((n: any) => String(n.id)));
  const readIds = new Set((readsResult.data ?? []).map((r: any) => String(r.notification_id)));
  let unread = 0;
  sentIds.forEach((id) => {
    if (!readIds.has(id)) unread += 1;
  });
  setAppBadgeCount(unread).catch(() => undefined);
  return unread;
}

export async function markNotificationsSeen(notificationIds: string[]) {
  if (!notificationIds.length) return;
  const userId = await getCurrentUserId();
  const rows = notificationIds.map((id) => ({ notification_id: id, user_id: userId }));
  const { error } = await supabase
    .from('notification_reads')
    .upsert(rows, { onConflict: 'notification_id,user_id' });
  if (error) throw error;
  getUnreadNotificationCount().catch(() => undefined);
}

export async function markAllNotificationsSeen() {
  const userId = await getCurrentUserId();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('notifications')
    .select('id')
    .eq('sent', true)
    .or(`scheduled_at.is.null,scheduled_at.lte.${nowIso}`)
    .limit(500);
  if (error) throw error;
  const ids = (data ?? []).map((row: any) => String(row.id));
  if (!ids.length) return;
  const rows = ids.map((id) => ({ notification_id: id, user_id: userId }));
  const { error: upsertError } = await supabase
    .from('notification_reads')
    .upsert(rows, { onConflict: 'notification_id,user_id' });
  if (upsertError) throw upsertError;
  getUnreadNotificationCount().catch(() => undefined);
}

export async function getSeenNotificationIds() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('notification_reads')
    .select('notification_id')
    .eq('user_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map((row: any) => String(row.notification_id)));
}

export async function markNotificationSeen(notificationId: string) {
  await markNotificationsSeen([notificationId]);
}
