import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { first, getSetting, initLocalDb, run, setSetting } from '@/lib/local-db';
import type { User } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  if (__DEV__) {
    console.warn('[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }
}

const SQLiteStorage = {
    async getItem(key: string) {
        await initLocalDb();
        const row = await first<{ value: string | null }>(`SELECT value FROM settings WHERE key = ?`, [key]);
        return row?.value ?? null;
    },
    async setItem(key: string, value: string) {
        await initLocalDb();
        await run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [key, value]);
    },
    async removeItem(key: string) {
        await initLocalDb();
        await run(`DELETE FROM settings WHERE key = ?`, [key]);
    },
};

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
    auth: {
        storage: SQLiteStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

const AUTH_SNAPSHOT_KEY = 'auth_snapshot';
const LAST_PROTECTED_ROUTE_KEY = 'last_protected_route';
const FORCED_ADMIN_EMAILS = new Set([
    'hellocooperations@gmail.com',
    'richardrudanda1@gmail.com',
]);

type AuthSnapshot = {
    userId: string;
    isAdmin: boolean;
    email?: string;
    updatedAt: string;
};

export async function setAuthSnapshot(snapshot: Omit<AuthSnapshot, 'updatedAt'>) {
    await initLocalDb();
    const payload: AuthSnapshot = { ...snapshot, updatedAt: new Date().toISOString() };
    await run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [AUTH_SNAPSHOT_KEY, JSON.stringify(payload)]);
}

export async function getAuthSnapshot() {
    await initLocalDb();
    const row = await first<{ value: string | null }>(`SELECT value FROM settings WHERE key = ?`, [AUTH_SNAPSHOT_KEY]);
    if (!row?.value) return null;
    try {
        return JSON.parse(row.value) as AuthSnapshot;
    } catch {
        return null;
    }
}

export async function clearAuthSnapshot() {
  await initLocalDb();
  await run(`DELETE FROM settings WHERE key = ?`, [AUTH_SNAPSHOT_KEY]);
}

export async function setLastProtectedRoute(route: string) {
  await setSetting(LAST_PROTECTED_ROUTE_KEY, route);
}

export async function getLastProtectedRoute(fallback: string) {
  const stored = await getSetting(LAST_PROTECTED_ROUTE_KEY);
  return stored || fallback;
}

export function isInvalidRefreshTokenError(error: unknown) {
    const message = String((error as any)?.message ?? error ?? '');
    return (
        message.includes('Invalid Refresh Token') ||
        message.includes('Refresh Token Not Found') ||
        message.includes('refresh_token_not_found')
    );
}

export async function clearSupabaseAuthStorage() {
    await initLocalDb();
    await run(`DELETE FROM settings WHERE key LIKE 'sb-%'`);
    await run(`DELETE FROM settings WHERE key LIKE '%auth-token%'`);
    await run(`DELETE FROM settings WHERE key LIKE '%refresh-token%'`);
}

export async function recoverFromInvalidSession() {
    try {
        await supabase.auth.signOut({ scope: 'local' });
    } catch {
        // Ignore; local storage cleanup below is the critical part.
    }
    await clearSupabaseAuthStorage();
    await clearAuthSnapshot();
}

export async function getSafeUser(): Promise<User | null> {
    try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        return data.user ?? null;
    } catch (error) {
        if (isInvalidRefreshTokenError(error)) {
            await recoverFromInvalidSession();
            return null;
        }
        throw error;
    }
}

export async function requireSafeUser(): Promise<User> {
    const user = await getSafeUser();
    if (!user) throw new Error('Please sign in first.');
    return user;
}

function isForcedAdminEmail(email?: string | null) {
    return email ? FORCED_ADMIN_EMAILS.has(email.trim().toLowerCase()) : false;
}

export async function resolveAdminState(userId: string, email?: string) {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', userId)
            .single();
        if (error) throw error;

        const isAdmin = Boolean(profile?.is_admin) || isForcedAdminEmail(email);
        await setAuthSnapshot({
            userId,
            isAdmin,
            email,
        });
        return isAdmin;
    } catch {
        const snapshot = await getAuthSnapshot().catch(() => null);
        if (snapshot?.userId === userId) {
            return snapshot.isAdmin || isForcedAdminEmail(email);
        }

        await setAuthSnapshot({
            userId,
            isAdmin: isForcedAdminEmail(email),
            email,
        });
        return isForcedAdminEmail(email);
    }
}
export default supabase;
