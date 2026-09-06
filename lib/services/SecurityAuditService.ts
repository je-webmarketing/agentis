import { supabaseAdmin } from "@/lib/supabase-admin"

export type SecurityAuditAction =
  | "ADMIN_LOGIN"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DISABLED"
  | "USER_ENABLED"
  | "USER_DELETED"
  | "SESSIONS_REVOKED"
  | "PASSWORD_RESET_REQUESTED"
  | "ROLE_CHANGED"

export type SecurityAuditPayload = {
  actorId?: string | null
  targetUserId?: string | null
  action: SecurityAuditAction
  category?: string
  description: string
  metadata?: Record<string, unknown>
  ipAddress?: string | null
  userAgent?: string | null
}

export const SecurityAuditService = {
  async log(
    payload: SecurityAuditPayload
  ) {
    const {
      error,
    } = await supabaseAdmin
      .from("security_audit_logs")
      .insert({
        actor_id:
          payload.actorId ?? null,

        target_user_id:
          payload.targetUserId ?? null,

        action:
          payload.action,

        category:
          payload.category ??
          "security",

        description:
          payload.description,

        metadata:
          payload.metadata ?? {},

        ip_address:
          payload.ipAddress ?? null,

        user_agent:
          payload.userAgent ?? null,
      })

    if (error) {
      throw error
    }

    return true
  },
}

export default SecurityAuditService