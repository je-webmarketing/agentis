"use client"

import type { ReactNode } from "react"

import { PermissionService } from "@/lib/security/PermissionService"
import type {
  PermissionCheckContext,
  PermissionKey,
  SecurityUser,
} from "@/lib/security/types"

type PermissionGateProps = {
  user: SecurityUser | null
  permission: PermissionKey
  context?: PermissionCheckContext
  children: ReactNode
  fallback?: ReactNode
}

export default function PermissionGate({
  user,
  permission,
  context = {},
  children,
  fallback = null,
}: PermissionGateProps) {
  const allowed = PermissionService.can(
    user,
    permission,
    context
  )

  if (!allowed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}