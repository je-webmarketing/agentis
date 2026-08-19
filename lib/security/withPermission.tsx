"use client"

import type {
  ComponentType,
  ReactNode,
} from "react"

import { PermissionService } from "./PermissionService"
import type {
  PermissionCheckContext,
  PermissionKey,
  SecurityUser,
} from "./types"

export type WithPermissionProps = {
  securityUser: SecurityUser | null
  securityContext?: PermissionCheckContext
  securityFallback?: ReactNode
}

export function withPermission<TProps extends object>(
  permission: PermissionKey,
  Component: ComponentType<TProps>
) {
  function ProtectedComponent(
    props: TProps & WithPermissionProps
  ) {
    const {
      securityUser,
      securityContext = {},
      securityFallback = null,
      ...componentProps
    } = props

    const allowed = PermissionService.can(
      securityUser,
      permission,
      securityContext
    )

    if (!allowed) {
      return <>{securityFallback}</>
    }

    return (
      <Component
        {...(componentProps as TProps)}
      />
    )
  }

  ProtectedComponent.displayName =
    `withPermission(${Component.displayName || Component.name || "Component"})`

  return ProtectedComponent
}