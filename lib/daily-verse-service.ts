import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { DAILY_VERSES, type DailyVerse } from '@/lib/daily-verses';
import { first, initLocalDb, run } from '@/lib/local-db';

const DAILY_VERSE_NOTIFICATION_VERSION = '1';
const IDS_KEY = 'daily_verse_notification_ids';
const VERSION_KEY = 'daily_verse_notification_version';
const ORDER_KEY = 'daily_verse_notification_order';
const ENABLED_KEY = 'daily_verse_notifications_enabled';
const START_DATE_KEY = 'daily_verse_cycle_start';

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

export async function configureDailyVerseNotifications() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

function shuffle<T>(items: T[]) {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function getFirstTriggerDate() {
  const now = new Date();
  const first = new Date(now);
  first.setHours(9, 0, 0, 0);
  if (first.getTime() <= now.getTime()) {
    first.setDate(first.getDate() + 1);
  }
  return first;
}

function sanitizeVerseText(text: string) {
  return text
    .replace(/\s*A Psalm by [^.]+\.?$/i, '')
    .replace(/\s*For the Chief Musician[^.]*\.?$/i, '')
    .replace(/\s*Selah\.?$/i, '')
    .trim();
}

function getTodayDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDaysBetween(startDateString: string, endDate = new Date()) {
  const start = new Date(`${startDateString}T00:00:00`);
  const end = new Date(`${getTodayDateString(endDate)}T00:00:00`);
  const diff = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

function buildNotificationContent(verse: DailyVerse) {
  return {
    title: 'Daily Verse',
    body: `${sanitizeVerseText(verse.text)} - ${verse.reference}`,
    sound: false,
    data: {
      kind: 'daily_verse',
      reference: verse.reference,
    },
  } as const;
}

async function getStoredString(key: string) {
  await initLocalDb();
  const row = await first<{ value: string | null }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

async function setStoredString(key: string, value: string) {
  await initLocalDb();
  await run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
}

async function clearStoredString(key: string) {
  await initLocalDb();
  await run('DELETE FROM settings WHERE key = ?', [key]);
}

async function getDailyVerseOrder() {
  const storedOrder = await getStoredString(ORDER_KEY);
  const storedStart = await getStoredString(START_DATE_KEY);

  if (storedOrder && storedStart) {
    try {
      const parsed = JSON.parse(storedOrder) as string[];
      if (Array.isArray(parsed) && parsed.length) {
        return { order: parsed, startDate: storedStart };
      }
    } catch {
      // Rebuild below.
    }
  }

  const freshOrder = shuffle(DAILY_VERSES.map((verse) => verse.reference));
  const startDate = getTodayDateString();
  await setStoredString(ORDER_KEY, JSON.stringify(freshOrder));
  await setStoredString(START_DATE_KEY, startDate);
  return { order: freshOrder, startDate };
}

async function cancelStoredNotifications() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const rawIds = await getStoredString(IDS_KEY);
  if (!rawIds) return;

  try {
    const ids = JSON.parse(rawIds) as string[];
    await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)));
  } catch {
    // Ignore parse/cancel issues and reset below.
  }

  await clearStoredString(IDS_KEY);
}

async function ensureAndroidChannel() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  await Notifications.setNotificationChannelAsync('daily-verse', {
    name: 'Daily Verse',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: undefined,
  }).catch(() => undefined);
}

async function getPermissionStatus() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return false;

  const permissions = await Notifications.getPermissionsAsync();
  return permissions.granted || permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function ensureDailyVerseNotifications(options?: { requestPermission?: boolean }) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return false;
  }

  const requestPermission = options?.requestPermission ?? true;

  await initLocalDb();
  await ensureAndroidChannel();

  let granted = await getPermissionStatus();
  if (!granted && requestPermission) {
    const requested = await Notifications.requestPermissionsAsync();
    granted =
      requested.granted ||
      requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  }

  if (!granted) {
    return false;
  }

  const storedVersion = await getStoredString(VERSION_KEY);
  const storedIds = await getStoredString(IDS_KEY);
  const storedEnabled = await getStoredString(ENABLED_KEY);
  let activeNotificationCount = 0;

  if (storedIds) {
    try {
      const wantedIds = JSON.parse(storedIds) as string[];
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const scheduledIds = new Set(scheduled.map((item) => item.identifier));
      activeNotificationCount = wantedIds.filter((id) => scheduledIds.has(id)).length;
    } catch {
      activeNotificationCount = 0;
    }
  }

  if (
    storedVersion === DAILY_VERSE_NOTIFICATION_VERSION &&
    storedIds &&
    storedEnabled === '1' &&
    activeNotificationCount > 14
  ) {
    return true;
  }

  await cancelStoredNotifications();

  const { order: shuffled, startDate } = await getDailyVerseOrder();
  const refMap = new Map(DAILY_VERSES.map((verse) => [verse.reference, verse]));
  const firstTrigger = getFirstTriggerDate();
  const notificationIds: string[] = [];

  for (let index = 0; index < shuffled.length; index += 1) {
    const reference = shuffled[index];
    const verse = refMap.get(reference);
    if (!verse) continue;

    const triggerDate = new Date(firstTrigger);
    triggerDate.setDate(firstTrigger.getDate() + index);

    const id = await Notifications.scheduleNotificationAsync({
      content: buildNotificationContent(verse),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: 'daily-verse',
      },
    });

    notificationIds.push(id);
  }

  await setStoredString(ORDER_KEY, JSON.stringify(shuffled));
  await setStoredString(START_DATE_KEY, startDate);
  await setStoredString(IDS_KEY, JSON.stringify(notificationIds));
  await setStoredString(VERSION_KEY, DAILY_VERSE_NOTIFICATION_VERSION);
  await setStoredString(ENABLED_KEY, '1');
  return true;
}

export async function disableDailyVerseNotifications() {
  await cancelStoredNotifications();
  await clearStoredString(ORDER_KEY);
  await clearStoredString(START_DATE_KEY);
  await clearStoredString(VERSION_KEY);
  await setStoredString(ENABLED_KEY, '0');
}

export async function getDailyVerseNotificationsEnabled() {
  const enabled = await getStoredString(ENABLED_KEY);
  return enabled === '1';
}

export async function getTodaysDailyVerse(date = new Date()) {
  const { order, startDate } = await getDailyVerseOrder();
  const dayIndex = getDaysBetween(startDate, date) % order.length;
  const reference = order[dayIndex];
  return DAILY_VERSES.find((verse) => verse.reference === reference) ?? DAILY_VERSES[0];
}
