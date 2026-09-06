import { ProfileService } from "@/lib/services/ProfileService"
import { RolePermissionService } from "@/lib/services/RolePermissionService"
import { RoleService } from "@/lib/services/RoleService"

import { createSecurityUser } from "./SecurityUserFactory"
import { getRolePermissions } from "./RolePermissions"

import type {
  PermissionKey,
  SecurityUser,
} from "./types"

export const SecurityUserService = {
  async getCurrent(): Promise<SecurityUser | null> {
    const profile =
      await ProfileService.getCurrent()

    if (!profile) {
      return null
    }

    /*
     * Aucun rôle personnalisé :
     * comportement standard AGENTIS.
     */
    if (!profile.custom_role_id) {
      return createSecurityUser(profile)
    }

    /*
     * Chargement du rôle personnalisé.
     */
    const customRole =
      await RoleService.getById(
        profile.custom_role_id
      )

    /*
     * Un rôle personnalisé inexistant
     * ou désactivé ne doit jamais
     * accorder de droits supplémentaires.
     */
    if (
      !customRole ||
      !customRole.active
    ) {
      return createSecurityUser(
        profile,
        []
      )
    }

    /*
     * Permissions explicitement définies
     * pour le rôle personnalisé.
     */
    const customPermissions =
      await RolePermissionService.listByRole(
        customRole.id
      )

    /*
     * Si aucune permission personnalisée
     * n'est enregistrée, le rôle hérite
     * des permissions de son rôle de base.
     */
    const permissions: PermissionKey[] =
      customPermissions.length > 0
        ? customPermissions
        : getRolePermissions(
            customRole.base_role
          )

   return createSecurityUser(
  profile,
  permissions,
  customRole.scope_type
)
  },
}

export default SecurityUserService