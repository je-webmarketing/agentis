import { supabaseAdmin } from "@/lib/supabase-admin"

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

  agent_id?: string | number | null
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

  return normalized
    ? normalized
    : null
}

function normalizeEmail(value: string) {
  return value
    .trim()
    .toLowerCase()
}

function normalizeNullableId(
  value:
    | string
    | number
    | null
    | undefined
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null
  }

  return value
}

function buildProfilePayload(
  payload: Partial<CreateAdminUserPayload>
) {
  return {
    ...(payload.email !== undefined
      ? {
          email:
            normalizeEmail(
              payload.email
            ),
        }
      : {}),

    ...(payload.nom !== undefined
      ? {
          nom:
            normalizeText(
              payload.nom
            ),
        }
      : {}),

    ...(payload.prenom !== undefined
      ? {
          prenom:
            normalizeText(
              payload.prenom
            ),
        }
      : {}),

    ...(payload.telephone !== undefined
      ? {
          telephone:
            normalizeText(
              payload.telephone
            ),
        }
      : {}),

    ...(payload.fonction !== undefined
      ? {
          fonction:
            normalizeText(
              payload.fonction
            ),
        }
      : {}),

    ...(payload.role !== undefined
      ? {
          role:
            payload.role,
        }
      : {}),

    ...(payload.custom_role_id !== undefined
      ? {
          custom_role_id:
            payload.custom_role_id ??
            null,
        }
      : {}),

    ...(payload.agent_id !== undefined
      ? {
          agent_id:
            normalizeNullableId(
              payload.agent_id
            ),
        }
      : {}),

    ...(payload.structure_id !== undefined
      ? {
          structure_id:
            normalizeNullableId(
              payload.structure_id
            ),
        }
      : {}),

    ...(payload.site_id !== undefined
      ? {
          site_id:
            normalizeNullableId(
              payload.site_id
            ),
        }
      : {}),

    ...(payload.service_id !== undefined
      ? {
          service_id:
            normalizeNullableId(
              payload.service_id
            ),
        }
      : {}),

    ...(payload.actif !== undefined
      ? {
          actif:
            payload.actif,
        }
      : {}),

    updated_at:
      new Date().toISOString(),
  }
}

export const AdminUserService = {
  /*
   * =====================================================
   * LISTE
   * =====================================================
   */

  async list(): Promise<ProfileRecord[]> {
    const {
      data,
      error,
    } = await supabaseAdmin
      .from("profiles")
      .select(profileSelect)
      .order(
        "actif",
        {
          ascending: false,
        }
      )
      .order(
        "nom",
        {
          ascending: true,
        }
      )
      .order(
        "prenom",
        {
          ascending: true,
        }
      )

    if (error) {
      throw error
    }

    return (
      data || []
    ) as ProfileRecord[]
  },

  /*
   * =====================================================
   * CRÉATION + INVITATION
   * =====================================================
   */

  async create(
    payload: CreateAdminUserPayload
  ): Promise<ProfileRecord> {
    const email =
      normalizeEmail(
        payload.email
      )

    if (!email) {
      throw new Error(
        "L’adresse email est obligatoire."
      )
    }

    /*
     * Envoi de l'invitation Supabase Auth.
     */

    const {
      data: inviteData,
      error: inviteError,
    } =
      await supabaseAdmin
        .auth
        .admin
        .inviteUserByEmail(
          email,
          {
            redirectTo:
              payload.redirectTo,

            data: {
              nom:
                normalizeText(
                  payload.nom
                ),

              prenom:
                normalizeText(
                  payload.prenom
                ),
            },
          }
        )

    if (inviteError) {
      throw inviteError
    }

    const user =
      inviteData.user

    if (!user?.id) {
      throw new Error(
        "Supabase n’a pas retourné l’identifiant du nouvel utilisateur."
      )
    }

    /*
     * Création / synchronisation du profil.
     *
     * upsert permet également de fonctionner
     * si un trigger Supabase crée déjà profiles.
     */

    const {
      data: profile,
      error: profileError,
    } =
      await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id:
              user.id,

            email,

            nom:
              normalizeText(
                payload.nom
              ),

            prenom:
              normalizeText(
                payload.prenom
              ),

            telephone:
              normalizeText(
                payload.telephone
              ),

            fonction:
              normalizeText(
                payload.fonction
              ),

            role:
              payload.role ??
              "agent",

            custom_role_id:
              payload.custom_role_id ??
              null,

            agent_id:
              normalizeNullableId(
                payload.agent_id
              ),

            structure_id:
              normalizeNullableId(
                payload.structure_id
              ),

            site_id:
              normalizeNullableId(
                payload.site_id
              ),

            service_id:
              normalizeNullableId(
                payload.service_id
              ),

            actif:
              payload.actif ??
              true,

            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict: "id",
          }
        )
        .select(profileSelect)
        .single()

    if (profileError) {
      /*
       * L'utilisateur Auth a déjà été créé.
       * On tente de nettoyer pour éviter
       * un compte Auth sans profil AGENTIS.
       */
      try {
        await supabaseAdmin
          .auth
          .admin
          .deleteUser(user.id)
      } catch (
        cleanupError
      ) {
        console.error(
          "Impossible de nettoyer l’utilisateur Auth après erreur profil :",
          cleanupError
        )
      }

      throw profileError
    }

    return profile as ProfileRecord
  },

  /*
   * =====================================================
   * MODIFICATION
   * =====================================================
   */

  async update(
    payload: UpdateAdminUserPayload
  ): Promise<ProfileRecord> {
    const {
      id,
      redirectTo: _redirectTo,
      ...changes
    } = payload

    if (!id) {
      throw new Error(
        "L’identifiant utilisateur est obligatoire."
      )
    }

    /*
     * Si l'email change, on synchronise
     * également Supabase Auth.
     */

    if (
      changes.email !== undefined
    ) {
      const email =
        normalizeEmail(
          changes.email
        )

      const {
        error: authError,
      } =
        await supabaseAdmin
          .auth
          .admin
          .updateUserById(
            id,
            {
              email,
            }
          )

      if (authError) {
        throw authError
      }

      changes.email =
        email
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("profiles")
      .update(
        buildProfilePayload(
          changes
        )
      )
      .eq(
        "id",
        id
      )
      .select(profileSelect)
      .single()

    if (error) {
      throw error
    }

    return data as ProfileRecord
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
    if (!id) {
      throw new Error(
        "L’identifiant utilisateur est obligatoire."
      )
    }

    /*
     * On supprime d'abord le profil métier.
     */

    const {
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq(
        "id",
        id
      )

    if (profileError) {
      throw profileError
    }

    /*
     * Puis le compte Supabase Auth.
     */

    const {
      error: authError,
    } =
      await supabaseAdmin
        .auth
        .admin
        .deleteUser(id)

    if (authError) {
      throw authError
    }

    return {
      id,
      deleted: true,
    }
  },
}

export default AdminUserService