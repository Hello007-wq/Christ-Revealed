import supabase from '@/lib/supabase';

export type AdminUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
};

export async function getAdminUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, is_admin, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as AdminUserRow[];
}

export async function deleteAdminUser(userId: string) {
  const { error } = await supabase.rpc('admin_delete_user', {
    target_user_id: userId,
  });

  if (error) throw error;
}
