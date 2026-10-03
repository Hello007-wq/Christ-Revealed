import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Trash2, UserRound, Shield } from 'lucide-react-native';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { logAdminAction } from '@/lib/admin-audit';
import { deleteAdminUser, getAdminUsers, type AdminUserRow } from '@/lib/admin-users';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setUsers(await getAdminUsers());
    } catch (error: any) {
      Alert.alert('Users', error.message ?? 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const confirmDelete = (user: AdminUserRow) => {
    Alert.alert(
      'Delete user',
      `Delete ${user.email ?? 'this user'} and block that email from signing up again?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const previousUsers = users;
            try {
              setBusyId(user.id);
              setUsers((prev) => prev.filter((item) => item.id !== user.id));
              await deleteAdminUser(user.id);
              await logAdminAction('user_delete', 'user', user.id, {
                email: user.email,
              }).catch(() => undefined);
            } catch (error: any) {
              setUsers(previousUsers);
              Alert.alert('Users', error.message ?? 'Unable to delete user.');
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading user accounts...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.iconWrap}>
                {item.is_admin ? <Shield size={18} color={COLORS.white} /> : <UserRound size={18} color={COLORS.white} />}
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.name}>{item.full_name?.trim() || 'No username set'}</Text>
                <Text style={styles.email}>{item.email ?? 'No email found'}</Text>
                <Text style={styles.meta}>
                  {item.is_admin ? 'Admin' : 'User'} · {new Date(item.created_at).toLocaleString()}
                </Text>
              </View>
              {!item.is_admin ? (
                <TouchableOpacity
                  style={[styles.deleteButton, busyId === item.id && styles.deleteButtonDisabled]}
                  onPress={() => confirmDelete(item)}
                  disabled={busyId === item.id}
                >
                  <Trash2 size={18} color={COLORS.white} />
                </TouchableOpacity>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No users found</Text>
              <Text style={styles.emptyText}>User accounts will show here once profiles are available.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    color: COLORS.gray,
    fontWeight: '700',
  },
  list: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  name: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: FONTS.sizes.large,
  },
  email: {
    color: COLORS.gray,
    marginTop: 2,
  },
  meta: {
    color: COLORS.gray,
    marginTop: 4,
    fontSize: FONTS.sizes.small,
  },
  deleteButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    color: COLORS.text,
    fontWeight: '900',
    fontSize: 22,
  },
  emptyText: {
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
