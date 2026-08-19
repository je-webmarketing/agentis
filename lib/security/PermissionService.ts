import type {
  PermissionCheckContext,
  PermissionCheckResult,
  PermissionKey,
  SecurityScope,
  SecurityUser,
} from "./types"

function includesId(
  values: Array<string | number> | undefined,
  value: string | number | null | undefined
) {
  if (value === null || value === undefined) {
    return false
  }

  return (values || []).some(
    (item) => String(item) === String(value)
  )
}

function hasPermission(
  permissions: PermissionKey[],
  permission: PermissionKey
) {
  return (
    permissions.includes("*") ||
    permissions.includes(permission)
  )
}

function isInsideScope(
  scope: SecurityScope,
  context: PermissionCheckContext
) {
  switch (scope.type) {
    case "global":
      return true

    case "structure":
      return includesId(
        scope.structureIds,
        context.structureId
      )

    case "site":
      return includesId(
        scope.siteIds,
        context.siteId
      )

    case "service":
      return includesId(
        scope.serviceIds,
        context.serviceId
      )

    case "self":
      return (
        scope.agentId !== null &&
        scope.agentId !== undefined &&
        context.agentId !== null &&
        context.agentId !== undefined &&
        String(scope.agentId) ===
          String(context.agentId)
      )

    default:
      return false
  }
}

export const PermissionService = {
  check(
    user: SecurityUser | null,
    permission: PermissionKey,
    context: PermissionCheckContext = {}
  ): PermissionCheckResult {
    if (!user) {
      return {
        allowed: false,
        reason: "unauthenticated",
      }
    }

    if (!user.active) {
      return {
        allowed: false,
        reason: "inactive",
      }
    }

    if (!hasPermission(user.permissions, permission)) {
      return {
        allowed: false,
        reason: "missing_permission",
      }
    }

    if (!isInsideScope(user.scope, context)) {
      return {
        allowed: false,
        reason: "outside_scope",
      }
    }

    return {
      allowed: true,
      reason: "allowed",
    }
  },

  has(
    user: SecurityUser | null,
    permission: PermissionKey
  ) {
    if (!user) {
      return false
    }

    if (!user.active) {
      return false
    }

    return hasPermission(
      user.permissions,
      permission
    )
  },

  can(
    user: SecurityUser | null,
    permission: PermissionKey,
    context: PermissionCheckContext = {}
  ) {
    return this.check(
      user,
      permission,
      context
    ).allowed
  },

  canAny(
    user: SecurityUser | null,
    permissions: PermissionKey[],
    context: PermissionCheckContext = {}
  ) {
    return permissions.some((permission) =>
      this.can(
        user,
        permission,
        context
      )
    )
  },

  canAll(
    user: SecurityUser | null,
    permissions: PermissionKey[],
    context: PermissionCheckContext = {}
  ) {
    return permissions.every((permission) =>
      this.can(
        user,
        permission,
        context
      )
    )
  },
}