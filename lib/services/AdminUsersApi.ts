import { supabase } from "@/lib/supabase"

import type {
  ProfileRecord,
  ProfileRole,
} from "@/lib/services/ProfileService"

export type CreateAdminUserPayload = {
  email?: string | null
  contact_email?: string | null
login_identifier?: string | null
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
    contact_email?: string | null
    additional_site_ids?: Array<string | number>
  }

type ApiSuccess<T> = {
  ok: true
  data: T
}

type ApiError = {
  ok?: false
  error?: string
  message?: string
}

async function getAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  const accessToken =
    session?.access_token

  if (!accessToken) {
    throw new Error(
      "Session administrateur introuvable."
    )
  }

  return accessToken
}

async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken =
    await getAccessToken()

  const response = await fetch(
    url,
    {
      ...options,

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${accessToken}`,

        ...options.headers,
      },
    }
  )

  const result =
    (await response.json()) as
      | ApiSuccess<T>
      | ApiError

  if (
    !response.ok ||
    !("ok" in result) ||
    result.ok !== true
  ) {
    const message =
      "error" in result &&
      typeof result.error === "string"
        ? result.error
        : "message" in result &&
            typeof result.message === "string"
          ? result.message
          : "Une erreur est survenue."

    throw new Error(message)
  }

  return result.data
}

export const AdminUsersApi = {
  /*
   * =====================================================
   * LISTE
   * =====================================================
   */

  async list():
    Promise<ProfileRecord[]> {
    return apiRequest<
      ProfileRecord[]
    >(
      "/api/admin/users",
      {
        method: "GET",
      }
    )
  },

  /*
   * =====================================================
   * CRÉATION
   * =====================================================
   */

  async create(
    payload: CreateAdminUserPayload
  ): Promise<ProfileRecord> {
    return apiRequest<
      ProfileRecord
    >(
      "/api/admin/users",
      {
        method: "POST",

        body:
          JSON.stringify(
            payload
          ),
      }
    )
  },

  /*
   * =====================================================
   * MODIFICATION
   * =====================================================
   */

  async update(
    payload: UpdateAdminUserPayload
  ): Promise<ProfileRecord> {
    return apiRequest<
      ProfileRecord
    >(
      "/api/admin/users",
      {
        method: "PATCH",

        body:
          JSON.stringify(
            payload
          ),
      }
    )
  },

  /*
   * =====================================================
   * SUPPRESSION
   * =====================================================
   */

  async delete(
    id: string
  ): Promise<{
    id: string
    deleted: boolean
  }> {
    return apiRequest<{
      id: string
      deleted: boolean
    }>(
      "/api/admin/users",
      {
        method: "DELETE",

        body:
          JSON.stringify({
            id,
          }),
      }
    )
  },
}

export default AdminUsersApi