import supabase, { requireSafeUser } from '@/lib/supabase';

type AuditDetails = Record<string, unknown> | null | undefined;

export async function logAdminAction(
  action: string,
  targetType: string,
  targetId?: string | null,
  details?: AuditDetails
) {
  const user = await requireSafeUser();
  const { error } = await supabase.from('admin_audit_logs').insert({
    actor_id: user.id,
    action,
    target_type: targetType,
    target_id: targetId ?? null,
    details_json: details ?? {},
  });

  if (error) throw error;
}
