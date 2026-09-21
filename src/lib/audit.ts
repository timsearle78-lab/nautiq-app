import { createClient as createAdminClient } from "@supabase/supabase-js";

type AuditParams = {
  userId: string;
  boatId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminClient = url && key ? createAdminClient(url, key) : null;

// Fire-and-forget — never awaited in the calling action so it can't block.
export function recordAudit(params: AuditParams): void {
  if (!adminClient) return;

  adminClient.from("audit_events").insert({
    user_id: params.userId,
    boat_id: params.boatId ?? null,
    action: params.action,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? null,
  }).then(() => { /* intentionally ignored */ });
}
