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

export type UpdateAdminUserInput = ProfileUpdatePayload & { id: string }

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

export const UserValidator = {
  validateCreate(body: unknown): CreateAdminUserInput {
    if (!isRecord(body)) throw new Error("Le corps de la requête est invalide.")

    return {
      email: validateEmail(body.email),
      nom: normalizeText(body.nom),
      prenom: normalizeText(body.prenom),
      telephone: normalizeText(body.telephone),
      fonction: normalizeText(body.fonction),
      role: validateRole(body.role),
      custom_role_id:
  normalizeCustomRoleId(
    body.custom_role_id
  ),
      structure_id: normalizeId(body.structure_id),
      site_id: normalizeId(body.site_id),
      service_id: normalizeId(body.service_id),
      actif: typeof body.actif === "boolean" ? body.actif : true,
      redirectTo: typeof body.redirectTo === "string" && body.redirectTo.trim()
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

    return result
  },
}

export default UserValidator