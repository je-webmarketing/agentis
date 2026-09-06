import type { ProfileRole, ProfileUpdatePayload } from "@/lib/services/ProfileService"

const allowedRoles: ProfileRole[] = [
  "super_admin",
  "admin_rh",
  "responsable_rh",
  "responsable_site",
  "chef_service",
  "agent",
]

export type CreateAdminUserInput = {
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
  additional_site_ids?: Array<string | number>
}

export type UpdateAdminUserInput =
  ProfileUpdatePayload & {
    id: string
    additional_site_ids?: Array<string | number>
  }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return null
  if (typeof value !== "string") throw new Error("Une valeur texte possède un format invalide.")
  return value.trim() || null
}

function normalizeId(value: unknown) {
  if (value === null || value === undefined || value === "") return null
  if (typeof value !== "string" && typeof value !== "number") {
    throw new Error("Un identifiant de périmètre possède un format invalide.")
  }
  return value
}

function validateEmail(value: unknown) {
  if (typeof value !== "string") throw new Error("L’adresse email est obligatoire.")
  const email = value.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("L’adresse email n’est pas valide.")
  }
  return email
}

function validateRole(value: unknown, fallback: ProfileRole = "agent") {
  if (value === undefined || value === null) return fallback
  if (typeof value !== "string" || !allowedRoles.includes(value as ProfileRole)) {
    throw new Error("Le rôle utilisateur n’est pas valide.")
  }
  return value as ProfileRole
}

function normalizeCustomRoleId(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null
  }

  if (typeof value === "number") {
    return value
  }

  if (
    typeof value === "string" &&
    value.trim() &&
    !Number.isNaN(Number(value))
  ) {
    return Number(value)
  }

  throw new Error(
    "Le rôle personnalisé possède un format invalide."
  )
}

function normalizeIdArray(
  value: unknown
): Array<string | number> {
  if (
    value === undefined ||
    value === null
  ) {
    return []
  }

  if (!Array.isArray(value)) {
    throw new Error(
      "La liste des sites supplémentaires possède un format invalide."
    )
  }

  return value
    .map((item) =>
      normalizeId(item)
    )
    .filter(
      (
        item
      ): item is string | number =>
        item !== null
    )
}

export const UserValidator = {
  validateCreate(body: unknown): CreateAdminUserInput {
  if (!isRecord(body)) {
    throw new Error(
      "Le corps de la requête est invalide."
    )
  }

  const role =
    validateRole(body.role)

  const siteId =
    normalizeId(body.site_id)

  if (
    role === "responsable_site" &&
    !siteId
  ) {
    throw new Error(
      "Le site est obligatoire pour un responsable de site."
    )
  }

  return {
    contact_email:
      body.contact_email !== undefined &&
      body.contact_email !== null &&
      body.contact_email !== ""
        ? validateEmail(
            body.contact_email
          )
        : null,

    login_identifier:
      typeof body.login_identifier === "string" &&
      body.login_identifier.trim()
        ? body.login_identifier
            .trim()
            .toLowerCase()
        : null,

    nom:
      normalizeText(body.nom),

    prenom:
      normalizeText(body.prenom),

    telephone:
      normalizeText(body.telephone),

    fonction:
      normalizeText(body.fonction),

    role,

    custom_role_id:
      normalizeCustomRoleId(
        body.custom_role_id
      ),

    structure_id:
      normalizeId(
        body.structure_id
      ),

    site_id:
      siteId,

    additional_site_ids:
  normalizeIdArray(
    body.additional_site_ids
  ),

    service_id:
      normalizeId(
        body.service_id
      ),

    actif:
      typeof body.actif === "boolean"
        ? body.actif
        : true,

    redirectTo:
      typeof body.redirectTo === "string" &&
      body.redirectTo.trim()
        ? body.redirectTo.trim()
        : undefined,
  }
},

  validateUpdate(body: unknown): UpdateAdminUserInput {
    if (!isRecord(body)) throw new Error("Le corps de la requête est invalide.")
    if (typeof body.id !== "string" || !body.id.trim()) {
      throw new Error("L’identifiant utilisateur est obligatoire.")
    }
   
    const result: UpdateAdminUserInput = { id: body.id.trim() }

     if (body.contact_email !== undefined) {
  result.contact_email =
    body.contact_email === null ||
    body.contact_email === ""
      ? null
      : validateEmail(body.contact_email)
}
if (body.login_identifier !== undefined) {
  result.login_identifier =
    body.login_identifier === null ||
    body.login_identifier === ""
      ? null
      : normalizeText(
          body.login_identifier
        )?.toLowerCase() ?? null
}

    if (body.email !== undefined) result.email = validateEmail(body.email)
    if (body.nom !== undefined) result.nom = normalizeText(body.nom)
    if (body.prenom !== undefined) result.prenom = normalizeText(body.prenom)
    if (body.telephone !== undefined) result.telephone = normalizeText(body.telephone)
    if (body.fonction !== undefined) result.fonction = normalizeText(body.fonction)
    if (body.role !== undefined) result.role = validateRole(body.role)
    if (body.custom_role_id !== undefined) {
  result.custom_role_id =
    normalizeCustomRoleId(
      body.custom_role_id
    )
}
    if (body.structure_id !== undefined) result.structure_id = normalizeId(body.structure_id)
    if (body.site_id !== undefined) result.site_id = normalizeId(body.site_id)
    if (body.service_id !== undefined) result.service_id = normalizeId(body.service_id)

    if (body.actif !== undefined) {
      if (typeof body.actif !== "boolean") {
        throw new Error("Le statut actif possède un format invalide.")
      }
      result.actif = body.actif
    }

   if (
  result.role === "responsable_site" &&
  !result.site_id
) {
  throw new Error(
    "Le site est obligatoire pour un responsable de site."
  )
} 

if (
  body.additional_site_ids !== undefined
) {
  result.additional_site_ids =
    normalizeIdArray(
      body.additional_site_ids
    )
}

    return result
  },
}

export default UserValidator