import { supabase } from "@/lib/supabase"
import type {
  ProfileRecord,
  ProfileRole,
} from "@/lib/services/ProfileService"

export type CreateAdminUserPayload = {
  email: string
  nom?: string | null
  prenom?: string | null
  telephone?: string | null
  fonction?: string | null
  role?: ProfileRole
  custom_role_id?: number | null
  structure_id?: string | number | null
  site_id?: string | number | null
  service_id?: string | number | null
  actif?: boolean
  redirectTo?: string
}

export type UpdateAdminUserPayload =
  Partial<CreateAdminUserPayload> & {
    id: string
  }

async function getAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  if (!session?.access_token) {
    throw new Error(
      "Vous devez être connecté pour administrer les utilisateurs."
    )
  }

  return session.access_token
}

async function request<T>(
  url: string,
  init: RequestInit
): Promise<T> {
  const accessToken = await getAccessToken()

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers || {}),
    },
  })

  const rawText = await response.text()

  let payload: any = null

  try {
    payload = rawText
      ? JSON.parse(rawText)
      : null
  } catch {
    payload = null
  }

  if (!response.ok || payload?.ok !== true) {
    console.warn(
  "ADMIN USERS API ERROR\n" +
    JSON.stringify(
      {
        status: response.status,
        statusText: response.statusText,
        url,
        rawText,
        payload,
      },
      null,
      2
    )
)

    let message =
      payload?.error ||
      payload?.message ||
      rawText ||
      `Erreur HTTP ${response.status} ${response.statusText}`

    if (
      typeof message === "object"
    ) {
      message = JSON.stringify(
        message,
        null,
        2
      )
    }

    throw new Error(
      String(message)
    )
  }

  return payload.data as T
}

export const AdminUsersApi = {
  async list(): Promise<ProfileRecord[]> {
    return request<ProfileRecord[]>(
      "/api/admin/users",
      {
        method: "GET",
      }
    )
  },

  async create(
    payload: CreateAdminUserPayload
  ): Promise<ProfileRecord> {
    return request<ProfileRecord>(
      "/api/admin/users",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    )
  },

  async update(
    payload: UpdateAdminUserPayload
  ): Promise<ProfileRecord> {
    return request<ProfileRecord>(
      "/api/admin/users",
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    )
  },

  async delete(
    id: string
  ): Promise<{
    id: string
    deleted: boolean
  }> {
    return request<{
      id: string
      deleted: boolean
    }>(
      `/api/admin/users?id=${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      }
    )
  },
}

export default AdminUsersApi