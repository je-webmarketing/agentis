import { supabase } from "@/lib/supabase"

export type BaseRole =
  | "super_admin"
  | "admin_rh"
  | "responsable_rh"
  | "responsable_site"
  | "chef_service"
  | "agent"

export type ScopeType =
  | "global"
  | "structure"
  | "site"
  | "service"
  | "self"

export type SecurityRoleRecord = {
  id: number
  key: string
  name: string
  description: string | null
  base_role: BaseRole
  scope_type: ScopeType
  is_system: boolean
  active: boolean
  created_at: string
  updated_at: string | null
}

export type SecurityRoleCreatePayload = {
  key: string
  name: string
  description?: string | null
  base_role: BaseRole
  scope_type: ScopeType
  active?: boolean
}

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

export const RoleService = {
  async list(): Promise<SecurityRoleRecord[]> {
    const { data, error } = await supabase
      .from("security_roles")
      .select("*")
      .order("is_system", {
        ascending: false,
      })
      .order("name", {
        ascending: true,
      })

    if (error) {
      throw error
    }

    return (data || []) as SecurityRoleRecord[]
  },

  async getById(
  id: number
): Promise<SecurityRoleRecord | null> {
  const { data, error } = await supabase
    .from("security_roles")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (
    data as SecurityRoleRecord | null
  ) ?? null
},

  async create(
    payload: SecurityRoleCreatePayload
  ): Promise<SecurityRoleRecord> {
    const roleKey = normalizeKey(
      payload.key || payload.name
    )

    if (!roleKey) {
      throw new Error(
        "La clé du rôle est obligatoire."
      )
    }

    const { data, error } = await supabase
      .from("security_roles")
      .insert({
        key: roleKey,
        name: payload.name.trim(),
        description:
          payload.description?.trim() || null,
        base_role: payload.base_role,
        scope_type: payload.scope_type,
        is_system: false,
        active: payload.active ?? true,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single()

    if (error) {
      throw error
    }

    return data as SecurityRoleRecord
  },

  async setActive(
    id: number,
    active: boolean
  ): Promise<SecurityRoleRecord> {
    const { data, error } = await supabase
      .from("security_roles")
      .update({
        active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("is_system", false)
      .select("*")
      .single()

    if (error) {
      throw error
    }

    return data as SecurityRoleRecord
  },

  async delete(id: number) {
    const { error } = await supabase
      .from("security_roles")
      .delete()
      .eq("id", id)
      .eq("is_system", false)

    if (error) {
      throw error
    }

    return true
  },
}

export default RoleService