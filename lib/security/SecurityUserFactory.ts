import type {
  ProfileRecord,
} from "@/lib/services/ProfileService"

import { getRolePermissions } from "./RolePermissions"

import type {
  PermissionKey,
  SecurityScope,
  SecurityScopeType,
  SecurityUser,
} from "./types"

function buildCustomScope(
  profile: ProfileRecord,
  scopeType: SecurityScopeType
): SecurityScope {
  switch (scopeType) {
    case "global":
      return {
        type: "global",
      }

    case "structure":
      return {
        type: "structure",
        structureIds:
          profile.structure_id !== null
            ? [profile.structure_id]
            : [],
      }

    case "site":
      return {
        type: "site",
        siteIds:
          profile.site_id !== null
            ? [profile.site_id]
            : [],
      }

    case "service":
      return {
        type: "service",
        serviceIds:
          profile.service_id !== null
            ? [profile.service_id]
            : [],
      }

    case "self":
      return {
        type: "self",
        agentId:
          profile.agent_id ?? null,
      }

    default:
      return {
        type: "self",
        agentId: null,
      }
  }
}

function buildDefaultScope(
  profile: ProfileRecord
): SecurityScope {
  switch (profile.role) {
    case "super_admin":
    case "admin_rh":
      return {
        type: "global",
      }

    case "responsable_rh":
  return {
    type: "structure",
    structureIds:
      profile.structure_id !== null
        ? [profile.structure_id]
        : [],
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
        agentId:
          profile.agent_id ?? null,
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
  customPermissions?: PermissionKey[],
  customScopeType?: SecurityScopeType
): SecurityUser {
  const scope =
    customScopeType
      ? buildCustomScope(
          profile,
          customScopeType
        )
      : buildDefaultScope(profile)

  const displayName = [
    profile.prenom,
    profile.nom,
  ]
    .filter(Boolean)
    .join(" ")
    .trim()

  return {
    id: profile.id,

    email:
      profile.email,

    displayName:
      displayName ||
      profile.email,

    role:
      profile.role,

    active:
      profile.actif,

    permissions:
      customPermissions ??
      getRolePermissions(
        profile.role
      ),

    scope,
  }
}