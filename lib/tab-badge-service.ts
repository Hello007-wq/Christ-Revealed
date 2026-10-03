import supabase, { getAuthSnapshot, getSafeUser } from '@/lib/supabase';
import { first, initLocalDb, run } from '@/lib/local-db';

function isNetworkError(error: any) {
  const msg = String(error?.message ?? '');
  return (
    msg.includes('Network request failed') ||
    msg.includes('Failed to fetch') ||
    msg.includes('fetch')
  );
}

async function getCurrentUserId() {
  try {
    const user = await getSafeUser();
    if (user?.id) return user.id;
  } catch {
    // Fall back to local snapshot for offline scenarios.
  }
  const snapshot = await getAuthSnapshot();
  return snapshot?.userId ?? null;
}

function merchSeenKey(userId: string) {
  return `merch_seen_at_${userId}`;
}

function communitySeenKey(userId: string) {
  return `community_seen_at_${userId}`;
}

async function readSeenAt(key: string) {
  await initLocalDb();
  const row = await first<{ value: string | null }>(`SELECT value FROM settings WHERE key = ?`, [key]);
  return row?.value ?? null;
}

async function writeSeenAt(key: string, iso: string) {
  await initLocalDb();
  await run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [key, iso]);
}

async function getLatestMerchCreatedAt() {
  const { data, error } = await supabase
    .from('merchandise')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as any)?.created_at ? String((data as any).created_at) : null;
}

async function getLatestCommunityCreatedAt() {
  const [postsResult, prayersResult] = await Promise.all([
    supabase
      .from('community_posts')
      .select('timestamp')
      .eq('status', 'approved')
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('prayer_requests')
      .select('timestamp')
      .eq('status', 'approved')
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (postsResult.error) throw postsResult.error;
  if (prayersResult.error) throw prayersResult.error;

  const postTime = (postsResult.data as any)?.timestamp ? Date.parse(String((postsResult.data as any).timestamp)) : 0;
  const prayerTime = (prayersResult.data as any)?.timestamp ? Date.parse(String((prayersResult.data as any).timestamp)) : 0;
  const latest = Math.max(postTime, prayerTime);
  return latest > 0 ? new Date(latest).toISOString() : null;
}

export async function getTabBadgeCounts() {
  const userId = await getCurrentUserId();
  if (!userId) return { merch: 0, community: 0 };

  let merch = 0;
  let community = 0;

  try {
    const seenAt = await readSeenAt(merchSeenKey(userId));
    let query = supabase.from('merchandise').select('id', { count: 'exact', head: true });
    if (seenAt) query = query.gt('created_at', seenAt);
    const { count, error } = await query;
    if (error) throw error;
    merch = Number(count ?? 0);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    merch = 0;
  }

  try {
    const seenAt = await readSeenAt(communitySeenKey(userId));
    let postQuery = supabase
      .from('community_posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved');
    let prayerQuery = supabase
      .from('prayer_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved');
    if (seenAt) {
      postQuery = postQuery.gt('timestamp', seenAt);
      prayerQuery = prayerQuery.gt('timestamp', seenAt);
    }
    const [postsResult, prayersResult] = await Promise.all([postQuery, prayerQuery]);
    if (postsResult.error) throw postsResult.error;
    if (prayersResult.error) throw prayersResult.error;
    community = Number(postsResult.count ?? 0) + Number(prayersResult.count ?? 0);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    community = 0;
  }

  return { merch, community };
}

export async function markMerchSeen() {
  const userId = await getCurrentUserId();
  if (!userId) return;
  const fallback = new Date().toISOString();
  try {
    const latest = await getLatestMerchCreatedAt();
    await writeSeenAt(merchSeenKey(userId), latest ?? fallback);
  } catch {
    await writeSeenAt(merchSeenKey(userId), fallback);
  }
}

export async function markCommunitySeen() {
  const userId = await getCurrentUserId();
  if (!userId) return;
  const fallback = new Date().toISOString();
  try {
    const latest = await getLatestCommunityCreatedAt();
    await writeSeenAt(communitySeenKey(userId), latest ?? fallback);
  } catch {
    await writeSeenAt(communitySeenKey(userId), fallback);
  }
}
