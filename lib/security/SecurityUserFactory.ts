import type {
  ProfileRecord,
} from "@/lib/services/ProfileService"

import { getRolePermissions } from "./RolePermissions"
import type {
  PermissionKey,
  SecurityScope,
  SecurityUser,
} from "./types"


function buildScope(
  profile: ProfileRecord
): SecurityScope {
  switch (profile.role) {
    case "super_admin":
    case "admin_rh":
      return {
        type: "global",
      }

    case "responsable_rh":
      if (profile.structure_id) {
        return {
          type: "structure",
          structureIds: [profile.structure_id],
        }
      }

      return {
        type: "global",
      }

    case "responsable_site":
      return {
        type: "site",
        siteIds:
          profile.site_id !== null
            ? [profile.site_id]
            : [],
      }

    case "chef_service":
      return {
        type: "service",
        serviceIds:
          profile.service_id !== null
            ? [profile.service_id]
            : [],
      }

    case "agent":
      return {
        type: "self",
        agentId: null,
      }

    default:
      return {
        type: "self",
        agentId: null,
      }
  }
}

export function createSecurityUser(
  profile: ProfileRecord,
  customPermissions?: PermissionKey[]
): SecurityUser {
  const scope = buildScope(profile)

  if (profile.role === "agent") {
    scope.agentId = profile.agent_id ?? null
  }

  const displayName = [
    profile.prenom,
    profile.nom,
  ]
    .filter(Boolean)
    .join(" ")
    .trim()

  return {
    id: profile.id,
    email: profile.email,
    displayName:
      displayName || profile.email,
    role: profile.role,
    active: profile.actif,
    permissions:
  customPermissions ??
  getRolePermissions(profile.role),
    scope,
  }
}