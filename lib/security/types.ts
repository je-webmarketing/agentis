export type SecurityRoleKey =
  | "super_admin"
  | "admin_rh"
  | "responsable_rh"
  | "responsable_site"
  | "chef_service"
  | "agent"

export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "export"
  | "manage"

export type PermissionModule =
  | "dashboard"
  | "planning"
  | "supervision"
  | "agents"
  | "absences"
  | "documents"
  | "formations"
  | "habilitations"
  | "visites_medicales"
  | "temps"
  | "rapports"
  | "sites"
  | "services"
  | "postes"
  | "structures"
  | "administration"
  | "utilisateurs"
  | "roles"
  | "permissions"
  | "parametres"
  | "journaux"
  | "securite"

export type PermissionKey =
  | `${PermissionModule}.${PermissionAction}`
  | "*"

export type SecurityScopeType =
  | "global"
  | "structure"
  | "site"
  | "service"
  | "self"

export type SecurityScope = {
  type: SecurityScopeType
  structureIds?: Array<string | number>
  siteIds?: Array<string | number>
  serviceIds?: Array<string | number>
  agentId?: string | number | null
}

export type SecurityUser = {
  id: string
  email?: string | null
  displayName?: string | null
  role: SecurityRoleKey
  active: boolean
  permissions: PermissionKey[]
  scope: SecurityScope
}

export type PermissionCheckContext = {
  structureId?: string | number | null
  siteId?: string | number | null
  serviceId?: string | number | null
  agentId?: string | number | null
}

export type PermissionCheckResult = {
  allowed: boolean
  reason:
    | "allowed"
    | "unauthenticated"
    | "inactive"
    | "missing_permission"
    | "outside_scope"
}

export type SecurityState = {
  loading: boolean
  user: SecurityUser | null
}