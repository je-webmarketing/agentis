import type { ProfileRole } from "@/lib/services/ProfileService"

export type UserCreatePayload = {
  nom: string
  prenom: string
  email: string

  telephone: string
  fonction: string

  role: ProfileRole

  actif: boolean

  structure_id: string
  site_id: string
  service_id: string

  redirectTo?: string
}