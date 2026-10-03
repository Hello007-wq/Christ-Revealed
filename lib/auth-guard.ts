import supabase from '@/lib/supabase';

export async function isEmailBlocked(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  const { data, error } = await supabase.rpc('is_email_blocked', {
    email_input: normalized,
  });

  if (error) throw error;
  return Boolean(data);
}
