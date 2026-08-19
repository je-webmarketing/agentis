import { ProfileService } from "@/lib/services/ProfileService"
import { RolePermissionService } from "@/lib/services/RolePermissionService"

import { createSecurityUser } from "./SecurityUserFactory"

import type {
  SecurityUser,
} from "./types"

export const SecurityUserService = {
  async getCurrent(): Promise<SecurityUser | null> {
    const profile =
      await ProfileService.getCurrent()

    if (!profile) {
      return null
    }

    if (!profile.custom_role_id) {
      return createSecurityUser(profile)
    }

    const customPermissions =
      await RolePermissionService.listByRole(
        profile.custom_role_id
      )

    return createSecurityUser(
      profile,
      customPermissions
    )
  },
}

export default SecurityUserService