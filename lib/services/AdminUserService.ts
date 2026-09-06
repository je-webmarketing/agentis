import { supabaseAdmin } from "@/lib/supabase-admin"
import { EmailService } from "@/lib/services/EmailService"

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

  agent_id?: string | number | null
  structure_id?: string | number | null
  site_id?: string | number | null
  additional_site_ids?: Array<string | number>
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
  ),
  responsable_site_affectations (
    site_id,
    principal,
    actif
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

function buildTechnicalAuthEmail(
  loginIdentifier: string
) {
  const normalized =
    loginIdentifier
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "-")

  return `${normalized}@auth.agentis.local`
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
   ...(payload.email !== undefined &&
payload.email !== null
  ? {
      email:
        normalizeEmail(
          payload.email
        ),
    }
  : {}),
    ...(payload.contact_email !== undefined
  ? {
      contact_email:
        payload.contact_email
          ? normalizeEmail(payload.contact_email)
          : null,
    }
  : {}),

  ...(payload.login_identifier !== undefined
  ? {
      login_identifier:
        normalizeText(
          payload.login_identifier
        )?.toLowerCase() ?? null,
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
   
    const loginIdentifier =
  normalizeText(
    payload.login_identifier
  )?.toLowerCase() ?? null

  if (!loginIdentifier) {
  throw new Error(
    "L’identifiant de connexion AGENTIS est obligatoire."
  )
}

const contactEmail =
  payload.contact_email
    ? normalizeEmail(
        payload.contact_email
      )
    : null

const technicalAuthEmail =
  buildTechnicalAuthEmail(
    loginIdentifier
  )
   
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
    .generateLink({
      type: "invite",

      email:
        technicalAuthEmail,

      options: {
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

          login_identifier:
            loginIdentifier,
        },
      },
    })

if (inviteError) {
  throw inviteError
}

const user =
  inviteData.user

const inviteUrl =
  inviteData.properties
    ?.action_link

if (!inviteUrl) {
  throw new Error(
    "Supabase n’a pas retourné le lien d’invitation."
  )
}

    if (!user?.id) {
      throw new Error(
        "Supabase n’a pas retourné l’identifiant du nouvel utilisateur."
      )
    }

    if (!contactEmail) {
  try {
    await supabaseAdmin
      .auth
      .admin
      .deleteUser(user.id)
  } catch (cleanupError) {
    console.error(
      "Impossible de nettoyer l’utilisateur Auth sans email de contact :",
      cleanupError
    )
  }

  throw new Error(
    "Une adresse email de contact est obligatoire pour envoyer l’invitation."
  )
}

try {
  await EmailService.sendInvitation({
    to: contactEmail,
    inviteUrl,
    recipientName:
      normalizeText(payload.prenom),
  })
} catch (emailError) {
  try {
    await supabaseAdmin
      .auth
      .admin
      .deleteUser(user.id)
  } catch (cleanupError) {
    console.error(
      "Impossible de nettoyer l’utilisateur Auth après erreur d’envoi :",
      cleanupError
    )
  }

  throw emailError
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

            email:
  technicalAuthEmail,

            contact_email:
  payload.contact_email
    ? normalizeEmail(payload.contact_email)
    : null,

    login_identifier:
  normalizeText(
    payload.login_identifier
  )?.toLowerCase() ?? null,

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
    
  {
  const agentName =
    [
      normalizeText(payload.prenom),
      normalizeText(payload.nom),
    ]
      .filter(Boolean)
      .join(" ")
      .trim() || loginIdentifier

  const {
    data: createdAgent,
    error: agentError,
  } = await supabaseAdmin
    .from("agents")
    .insert({
      nom: agentName,
      statut: "Actif",
      temps: "35h",

      poste_id: null,

      service_id:
        normalizeNullableId(
          payload.service_id
        ),

      site_id:
        normalizeNullableId(
          payload.site_id
        ),
    })
    .select("id")
    .single()

  if (agentError || !createdAgent) {
    throw (
      agentError ||
      new Error(
        "Impossible de créer la fiche agent."
      )
    )
  }

  const {
    data: linkedProfile,
    error: linkError,
  } = await supabaseAdmin
    .from("profiles")
    .update({
      agent_id: createdAgent.id,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", user.id)
    .select(profileSelect)
    .single()

  if (linkError) {
    try {
      await supabaseAdmin
        .from("agents")
        .delete()
        .eq("id", createdAgent.id)
    } catch (cleanupError) {
      console.error(
        "Impossible de nettoyer la fiche agent après erreur de liaison :",
        cleanupError
      )
    }

    throw linkError
  }

  /*
   * Sites gérés par un responsable de site.
   */
  if (
    payload.role ===
    "responsable_site"
  ) {
    const principalSiteId =
      normalizeNullableId(
        payload.site_id
      )

    const additionalSiteIds =
      (
        payload.additional_site_ids ||
        []
      )
        .map((siteId) =>
          normalizeNullableId(siteId)
        )
        .filter(
          (
            siteId
          ): siteId is string | number =>
            siteId !== null
        )
        .filter(
          (siteId) =>
            String(siteId) !==
            String(
              principalSiteId ?? ""
            )
        )

    const siteAffectations = [
      ...(principalSiteId !== null
        ? [
            {
              profile_id: user.id,
              site_id:
                principalSiteId,
              principal: true,
              actif: true,
            },
          ]
        : []),

      ...additionalSiteIds.map(
        (siteId) => ({
          profile_id: user.id,
          site_id: siteId,
          principal: false,
          actif: true,
        })
      ),
    ]

    if (
      siteAffectations.length > 0
    ) {
      const {
        error:
          affectationsError,
      } = await supabaseAdmin
        .from(
          "responsable_site_affectations"
        )
        .insert(
          siteAffectations
        )

      if (affectationsError) {
        throw affectationsError
      }
    }
  }

  return linkedProfile as ProfileRecord
}
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
    additional_site_ids,
    ...changes
  } = payload

  if (!id) {
    throw new Error(
      "L’identifiant utilisateur est obligatoire."
    )
  }

  const profilePayload =
    buildProfilePayload(changes)

  const {
    data,
    error,
  } = await supabaseAdmin
    .from("profiles")
    .update(profilePayload)
    .eq("id", id)
    .select(profileSelect)
    .single()

  if (error) {
    throw error
  }

  /*
   * Synchronisation des sites d'un responsable de site.
   */
  if (
    changes.role === "responsable_site" &&
    additional_site_ids !== undefined
  ) {
    const principalSiteId =
      normalizeNullableId(
        changes.site_id
      )

    /*
     * On supprime les anciennes affectations
     * puis on reconstruit proprement la liste.
     */
    const {
      error: deleteError,
    } = await supabaseAdmin
      .from(
        "responsable_site_affectations"
      )
      .delete()
      .eq("profile_id", id)

    if (deleteError) {
      throw deleteError
    }

    const normalizedAdditionalSiteIds =
      additional_site_ids
        .map((siteId) =>
          normalizeNullableId(siteId)
        )
        .filter(
          (
            siteId
          ): siteId is string | number =>
            siteId !== null
        )
        .filter(
          (siteId) =>
            String(siteId) !==
            String(
              principalSiteId ?? ""
            )
        )

    const siteAffectations = [
      ...(principalSiteId !== null
        ? [
            {
              profile_id: id,
              site_id:
                principalSiteId,
              principal: true,
              actif: true,
            },
          ]
        : []),

      ...normalizedAdditionalSiteIds.map(
        (siteId) => ({
          profile_id: id,
          site_id: siteId,
          principal: false,
          actif: true,
        })
      ),
    ]

    if (
      siteAffectations.length > 0
    ) {
      const {
        error:
          insertError,
      } = await supabaseAdmin
        .from(
          "responsable_site_affectations"
        )
        .insert(
          siteAffectations
        )

      if (insertError) {
        throw insertError
      }
    }
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

  const {
    data: profile,
    error: profileLookupError,
  } = await supabaseAdmin
    .from("profiles")
    .select("id, agent_id")
    .eq("id", id)
    .single()

  if (profileLookupError) {
    throw profileLookupError
  }

  const agentId =
    profile?.agent_id ?? null

  const {
    error: profileError,
  } = await supabaseAdmin
    .from("profiles")
    .delete()
    .eq("id", id)

  if (profileError) {
    throw profileError
  }

  if (agentId) {
    const {
      error: agentError,
    } = await supabaseAdmin
      .from("agents")
      .delete()
      .eq("id", agentId)

    if (agentError) {
      throw agentError
    }
  }

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

    /*
   * =====================================================
   * RÉVOCATION DES SESSIONS
   * =====================================================
   */

  async revokeSessions(
    id: string
  ): Promise<{
    id: string
    sessionsRevoked: boolean
  }> {
    if (!id) {
      throw new Error(
        "L’identifiant utilisateur est obligatoire."
      )
    }

    const {
      error,
    } =
      await supabaseAdmin
        .auth
        .admin
        .signOut(
          id,
          "global"
        )

    if (error) {
      throw error
    }

    return {
      id,
      sessionsRevoked: true,
    }
  },
    /*
   * =====================================================
   * ACTIVATION / DÉSACTIVATION DU COMPTE
   * =====================================================
   */

  async setActiveStatus(
    id: string,
    actif: boolean
  ): Promise<{
    id: string
    actif: boolean
  }> {
    if (!id) {
      throw new Error(
        "L’identifiant utilisateur est obligatoire."
      )
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("profiles")
      .update({
        actif,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, actif")
      .single()

    if (error) {
      throw error
    }

    /*
     * Si le compte est désactivé,
     * on révoque également ses sessions.
     */
    if (!actif) {
      const {
        error: signOutError,
      } = await supabaseAdmin
        .auth
        .admin
        .signOut(
          id,
          "global"
        )

      if (signOutError) {
        throw signOutError
      }
    }

    return {
      id: data.id,
      actif: data.actif,
    }
  },
}

export default AdminUserService