import type { ProfileRole } from "@/lib/services/ProfileService"

export type UserCreatePayload = {
  nom: string
  prenom: string
  email?: string | null
contact_email?: string | null
login_identifier?: string | null
  telephone: string
  fonction: string

  role: ProfileRole

  actif: boolean

  structure_id: string
  site_id: string
  service_id: string

  redirectTo?: string
}