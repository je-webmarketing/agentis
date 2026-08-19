import type {
  PermissionKey,
  SecurityRoleKey,
} from "./types"

export const ROLE_PERMISSIONS: Record<
  SecurityRoleKey,
  PermissionKey[]
> = {
  /*
   * SUPER ADMIN
   * Accès absolu à toute l'application.
   */
  super_admin: ["*"],

  /*
   * ADMINISTRATEUR RH
   * Gestion RH globale.
   * Pas d'accès à l'administration technique.
   */
  admin_rh: [
    "dashboard.view",

    "planning.view",
    "planning.create",
    "planning.edit",
    "planning.delete",
    "planning.export",

    "supervision.view",
    "supervision.manage",

    "agents.view",
    "agents.create",
    "agents.edit",
    "agents.export",

    "absences.view",
    "absences.create",
    "absences.edit",
    "absences.delete",
    "absences.export",

    "documents.view",
    "documents.create",
    "documents.edit",
    "documents.delete",
    "documents.export",

    "formations.view",
    "formations.create",
    "formations.edit",
    "formations.delete",
    "formations.export",

    "habilitations.view",
    "habilitations.create",
    "habilitations.edit",
    "habilitations.delete",
    "habilitations.export",

    "visites_medicales.view",
    "visites_medicales.create",
    "visites_medicales.edit",
    "visites_medicales.delete",
    "visites_medicales.export",

    "temps.view",
    "temps.edit",
    "temps.export",

    "rapports.view",
    "rapports.export",

    "sites.view",
    "services.view",
    "postes.view",
    "structures.view",
  ],

  /*
   * RESPONSABLE RH
   * Gestion opérationnelle RH.
   * Pas d'administration système.
   */
  responsable_rh: [
    "dashboard.view",

    "planning.view",
    "planning.create",
    "planning.edit",
    "planning.export",

    "supervision.view",

    "agents.view",
    "agents.create",
    "agents.edit",
    "agents.export",

    "absences.view",
    "absences.create",
    "absences.edit",
    "absences.export",

    "documents.view",
"documents.create",
"documents.edit",
"documents.delete",
"documents.export",

    "formations.view",
    "formations.create",
    "formations.edit",
    "formations.export",

    "habilitations.view",
    "habilitations.create",
    "habilitations.edit",
    "habilitations.export",

    "visites_medicales.view",
    "visites_medicales.create",
    "visites_medicales.edit",
    "visites_medicales.export",

    "temps.view",
    "temps.edit",
    "temps.export",

    "rapports.view",
    "rapports.export",

    "sites.view",
    "services.view",
    "postes.view",
    "structures.view",
  ],

  /*
   * RESPONSABLE DE SITE
   * Les données devront ensuite être limitées
   * à son site via SecurityScope.
   */
  responsable_site: [
    "dashboard.view",

    "planning.view",
    "planning.create",
    "planning.edit",

    "supervision.view",

    "agents.view",

    "absences.view",
    "absences.create",
    "absences.edit",

    "documents.view",
"documents.create",
"documents.edit",

    "formations.view",
    "habilitations.view",
    "visites_medicales.view",

    "temps.view",

    "rapports.view",

    "sites.view",
    "services.view",
    "postes.view",
  ],

  /*
   * CHEF DE SERVICE
   * Accès opérationnel limité à son service.
   */
  chef_service: [
    "dashboard.view",

    "planning.view",
    "planning.create",
    "planning.edit",

    "supervision.view",

    "agents.view",

    "absences.view",
    "absences.create",
    "absences.edit",

    "documents.view",
"documents.create",
"documents.edit",

    "formations.view",
    "habilitations.view",
    "visites_medicales.view",

    "temps.view",

    "rapports.view",

    "services.view",
    "postes.view",
  ],

  /*
   * AGENT
   * Accès personnel uniquement.
   * Le scope "self" assurera ensuite
   * qu'il ne consulte que ses propres données.
   */
  agent: [
    "dashboard.view",

    "planning.view",

    "absences.view",

    "documents.view",

    "formations.view",
    "habilitations.view",
    "visites_medicales.view",

    "temps.view",
  ],
}

export function getRolePermissions(
  role: SecurityRoleKey
): PermissionKey[] {
  return ROLE_PERMISSIONS[role] ?? []
}

export function roleHasPermission(
  role: SecurityRoleKey,
  permission: PermissionKey
): boolean {
  const permissions =
    getRolePermissions(role)

  return (
    permissions.includes("*") ||
    permissions.includes(permission)
  )
}

export const ALL_PERMISSIONS: PermissionKey[] =
  Array.from(
    new Set(
      Object.values(ROLE_PERMISSIONS)
        .flat()
        .filter(
          (permission): permission is PermissionKey =>
            permission !== "*"
        )
    )
  ).sort()