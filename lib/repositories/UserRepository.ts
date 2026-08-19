import { supabaseAdmin } from "@/lib/supabase-admin"
import type { ProfileCreatePayload, ProfileRecord, ProfileUpdatePayload } from "@/lib/services/ProfileService"

const profileSelect = `
  *,
  structure:structure_id (id, nom),
  site:site_id (id, nom),
  service:service_id (id, nom)
`

export const UserRepository = {
  async listProfiles(): Promise<ProfileRecord[]> {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(profileSelect)
      .order("actif", { ascending: false })
      .order("nom", { ascending: true })
      .order("prenom", { ascending: true })

    if (error) throw error
    return (data || []) as ProfileRecord[]
  },

  async getProfileById(id: string): Promise<ProfileRecord | null> {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(profileSelect)
      .eq("id", id)
      .maybeSingle()

    if (error) throw error
    return (data as ProfileRecord | null) ?? null
  },

  async inviteAuthUser(params: {
    email: string
    redirectTo?: string
    metadata?: Record<string, unknown>
  }) {
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      params.email,
      {
        redirectTo: params.redirectTo,
        data: params.metadata,
      }
    )

    if (error) throw error
    if (!data.user) {
      throw new Error("Supabase n’a retourné aucun utilisateur après l’invitation.")
    }

    return data.user
  },

  async updateAuthUser(id: string, payload: {
    email?: string
    user_metadata?: Record<string, unknown>
  }) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, payload)
    if (error) throw error
    return data.user
  },

  async deleteAuthUser(id: string) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (error) throw error
    return true
  },

  async createProfile(payload: ProfileCreatePayload): Promise<ProfileRecord> {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .insert({
        ...payload,
        email: payload.email.trim().toLowerCase(),
        nom: payload.nom?.trim() || null,
        prenom: payload.prenom?.trim() || null,
        telephone: payload.telephone?.trim() || null,
        fonction: payload.fonction?.trim() || null,
        role: payload.role || "agent",
        structure_id: payload.structure_id ?? null,
        site_id: payload.site_id ?? null,
        service_id: payload.service_id ?? null,
        actif: payload.actif ?? true,
        avatar_url: payload.avatar_url?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .select(profileSelect)
      .single()

    if (error) throw error
    return data as ProfileRecord
  },

  async updateProfile(id: string, payload: ProfileUpdatePayload): Promise<ProfileRecord> {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({
        ...payload,
        ...(payload.email !== undefined ? { email: payload.email.trim().toLowerCase() } : {}),
        ...(payload.nom !== undefined ? { nom: payload.nom?.trim() || null } : {}),
        ...(payload.prenom !== undefined ? { prenom: payload.prenom?.trim() || null } : {}),
        ...(payload.telephone !== undefined ? { telephone: payload.telephone?.trim() || null } : {}),
        ...(payload.fonction !== undefined ? { fonction: payload.fonction?.trim() || null } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(profileSelect)
      .single()

    if (error) throw error
    return data as ProfileRecord
  },
}

export default UserRepository