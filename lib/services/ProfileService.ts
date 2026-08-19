import { supabase } from "@/lib/supabase"

export type ProfileRole =
  | "super_admin"
  | "admin_rh"
  | "responsable_rh"
  | "responsable_site"
  | "chef_service"
  | "agent"

export type ProfileRecord = {
  id: string
  email: string
  nom: string | null
  prenom: string | null
  telephone: string | null
  fonction: string | null
  role: ProfileRole
  custom_role_id: number | null
  agent_id: string | number | null
  structure_id: string | number | null
  site_id: string | number | null
  service_id: string | number | null
  actif: boolean
  avatar_url: string | null
  derniere_connexion: string | null
  created_at: string
  updated_at: string | null

  structure?:
    | {
        id: string | number
        nom: string | null
      }
    | {
        id: string | number
        nom: string | null
      }[]
    | null

  site?:
    | {
        id: string | number
        nom: string | null
      }
    | {
        id: string | number
        nom: string | null
      }[]
    | null

  service?:
    | {
        id: string | number
        nom: string | null
      }
    | {
        id: string | number
        nom: string | null
      }[]
    | null
}

export type ProfileCreatePayload = {
  id: string
  email: string
  nom?: string | null
  prenom?: string | null
  telephone?: string | null
  fonction?: string | null
  role?: ProfileRole
  custom_role_id?: number | null
  agent_id?: string | number | null
  structure_id?: string | number | null
  site_id?: string | number | null
  service_id?: string | number | null
  actif?: boolean
  avatar_url?: string | null
}

export type ProfileUpdatePayload =
  Partial<Omit<ProfileCreatePayload, "id" | "email">> & {
    email?: string
    derniere_connexion?: string | null
  }

const profileSelect = `
  *,
  structure:structure_id (
    id,
    nom
  ),
  site:site_id (
    id,
    nom
  ),
  service:service_id (
    id,
    nom
  )
`

function normalizeText(
  value: string | null | undefined
) {
  const normalized = value?.trim()

  return normalized ? normalized : null
}

function normalizeRole(
  value: ProfileRole | null | undefined
): ProfileRole {
  return value || "agent"
}

function normalizeProfilePayload(
  payload:
    | ProfileCreatePayload
    | ProfileUpdatePayload
) {
  return {
    ...(payload.email !== undefined
      ? {
          email: payload.email
            .trim()
            .toLowerCase(),
        }
      : {}),

    ...(payload.nom !== undefined
      ? {
          nom: normalizeText(payload.nom),
        }
      : {}),

    ...(payload.prenom !== undefined
      ? {
          prenom: normalizeText(payload.prenom),
        }
      : {}),

    ...(payload.telephone !== undefined
      ? {
          telephone: normalizeText(
            payload.telephone
          ),
        }
      : {}),

    ...(payload.fonction !== undefined
      ? {
          fonction: normalizeText(
            payload.fonction
          ),
        }
      : {}),

    ...(payload.role !== undefined
      ? {
          role: normalizeRole(payload.role),
        }
      : {}),

      ...(payload.custom_role_id !== undefined
  ? {
      custom_role_id:
        payload.custom_role_id ?? null,
    }
  : {}),

    ...(payload.agent_id !== undefined
  ? {
      agent_id: payload.agent_id ?? null,
    }
  : {}),  

    ...(payload.structure_id !== undefined
      ? {
          structure_id:
            payload.structure_id ?? null,
        }
      : {}),

    ...(payload.site_id !== undefined
      ? {
          site_id: payload.site_id ?? null,
        }
      : {}),

    ...(payload.service_id !== undefined
      ? {
          service_id:
            payload.service_id ?? null,
        }
      : {}),

    ...(payload.actif !== undefined
      ? {
          actif: payload.actif,
        }
      : {}),

    ...(payload.avatar_url !== undefined
      ? {
          avatar_url: normalizeText(
            payload.avatar_url
          ),
        }
      : {}),

    ...("derniere_connexion" in payload &&
    payload.derniere_connexion !== undefined
      ? {
          derniere_connexion:
            payload.derniere_connexion,
        }
      : {}),

    updated_at: new Date().toISOString(),
  }
}

export const ProfileService = {
  async list(): Promise<ProfileRecord[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select(profileSelect)
      .order("actif", { ascending: false })
      .order("nom", { ascending: true })
      .order("prenom", { ascending: true })

    if (error) {
      throw error
    }

    return (data || []) as ProfileRecord[]
  },

  async getById(
    id: string
  ): Promise<ProfileRecord | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select(profileSelect)
      .eq("id", id)
      .maybeSingle()

    if (error) {
      throw error
    }

    return (data as ProfileRecord | null) ?? null
  },

  async getCurrent(): Promise<ProfileRecord | null> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      throw userError
    }

    if (!user) {
      return null
    }

    return this.getById(user.id)
  },

  async create(
    payload: ProfileCreatePayload
  ): Promise<ProfileRecord> {
    const { id, ...profileData } = payload

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id,
        ...normalizeProfilePayload({
          ...profileData,
          email: payload.email,
          role: normalizeRole(payload.role),
          actif: payload.actif ?? true,
        }),
      })
      .select(profileSelect)
      .single()

    if (error) {
      throw error
    }

    return data as ProfileRecord
  },

  async upsert(
    payload: ProfileCreatePayload
  ): Promise<ProfileRecord> {
    const { id, ...profileData } = payload

    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id,
          ...normalizeProfilePayload({
            ...profileData,
            email: payload.email,
            role: normalizeRole(payload.role),
            actif: payload.actif ?? true,
          }),
        },
        {
          onConflict: "id",
        }
      )
      .select(profileSelect)
      .single()

    if (error) {
      throw error
    }

    return data as ProfileRecord
  },

  async update(
    id: string,
    payload: ProfileUpdatePayload
  ): Promise<ProfileRecord> {
    const { data, error } = await supabase
      .from("profiles")
      .update(normalizeProfilePayload(payload))
      .eq("id", id)
      .select(profileSelect)
      .single()

    if (error) {
      throw error
    }

    return data as ProfileRecord
  },

  async updateRole(
    id: string,
    role: ProfileRole
  ) {
    return this.update(id, { role })
  },

  async updateScope(
    id: string,
    scope: {
      structure_id?: string | number | null
      site_id?: string | number | null
      service_id?: string | number | null
    }
  ) {
    return this.update(id, scope)
  },

  async setActive(
    id: string,
    actif: boolean
  ) {
    return this.update(id, { actif })
  },

  async markCurrentLogin() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      throw userError
    }

    if (!user) {
      return null
    }

    return this.update(user.id, {
      derniere_connexion:
        new Date().toISOString(),
    })
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id)

    if (error) {
      throw error
    }

    return true
  },

  async search(
    searchTerm: string
  ): Promise<ProfileRecord[]> {
    const search = searchTerm.trim()

    if (!search) {
      return this.list()
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(profileSelect)
      .or(
        [
          `email.ilike.%${search}%`,
          `nom.ilike.%${search}%`,
          `prenom.ilike.%${search}%`,
          `fonction.ilike.%${search}%`,
        ].join(",")
      )
      .order("nom", { ascending: true })
      .order("prenom", { ascending: true })

    if (error) {
      throw error
    }

    return (data || []) as ProfileRecord[]
  },
}

export default ProfileService