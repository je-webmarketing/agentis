import { supabase } from "@/lib/supabase"
import type { PermissionKey } from "@/lib/security/types"

export type RolePermissionRecord = {
  id: number
  role_id: number
  permission_key: PermissionKey
  created_at: string
}

export const RolePermissionService = {
  async listByRole(
    roleId: number
  ): Promise<PermissionKey[]> {
    const { data, error } = await supabase
      .from("security_role_permissions")
      .select("permission_key")
      .eq("role_id", roleId)
      .order("permission_key")

    if (error) {
      throw error
    }

    return (data || []).map(
      (row) =>
        row.permission_key as PermissionKey
    )
  },

  async replaceForRole(
    roleId: number,
    permissions: PermissionKey[]
  ) {
    const { error: deleteError } =
      await supabase
        .from("security_role_permissions")
        .delete()
        .eq("role_id", roleId)

    if (deleteError) {
      throw deleteError
    }

    if (permissions.length === 0) {
      return true
    }

    const rows = permissions.map(
      (permission) => ({
        role_id: roleId,
        permission_key: permission,
      })
    )

    const { error: insertError } =
      await supabase
        .from("security_role_permissions")
        .insert(rows)

    if (insertError) {
      throw insertError
    }

    return true
  },
}

export default RolePermissionService