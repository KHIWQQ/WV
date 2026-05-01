import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type AuditAction =
  | "asset.create" | "asset.update" | "asset.delete" | "asset.restore"
  | "liability.create" | "liability.update" | "liability.delete"
  | "transaction.create" | "transaction.update" | "transaction.delete"
  | "goal.create" | "goal.update" | "goal.delete"
  | "watchlist.create" | "watchlist.delete"
  | "watchlist_item.create" | "watchlist_item.delete"
  | "profile.update"
  | "subscription.upgrade" | "subscription.downgrade"
  | "auth.login" | "auth.logout";

export type EntityType = "asset" | "liability" | "transaction" | "goal" | "watchlist" | "watchlist_item" | "profile" | "subscription" | "session";

interface AuditOptions {
  diff?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Append an entry to audit_log. Best-effort: failures are logged but do not throw,
 * so a broken audit pipeline never blocks a user-facing action.
 */
export async function logAudit(
  action: AuditAction,
  entityType: EntityType,
  entityId: string | null,
  opts: AuditOptions = {}
): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase.rpc("log_audit", {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_diff: opts.diff ?? null,
      p_metadata: opts.metadata ?? null,
    });
    if (error) {
      logger.warn({ err: error, action, entityType, entityId }, "audit: log_audit rpc failed");
    }
  } catch (e) {
    logger.warn({ err: e, action, entityType, entityId }, "audit: exception while logging");
  }
}
