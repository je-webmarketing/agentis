import {
  NextRequest,
  NextResponse,
} from "next/server"

import { supabaseAdmin } from "@/lib/supabase-admin"

import {
  getRolePermissions,
} from "@/lib/security/RolePermissions"

import type {
  PermissionKey,
  SecurityRoleKey,
  SecurityScope,
  SecurityScopeType,
} from "@/lib/security/types"

export const dynamic =
  "force-dynamic"

function getBearerToken(
  request: NextRequest
) {
  const authorization =
    request.headers.get(
      "authorization"
    )

  if (
    !authorization?.startsWith(
      "Bearer "
    )
  ) {
    return null
  }

  return (
    authorization
      .slice(7)
      .trim() || null
  )
}

function isSecurityRole(
  value: unknown
): value is SecurityRoleKey {
  return (
    value === "super_admin" ||
    value === "admin_rh" ||
    value === "responsable_rh" ||
    value === "responsable_site" ||
    value === "chef_service" ||
    value === "agent"
  )
}

function getRoleLabel(
  role: SecurityRoleKey
) {
  switch (role) {
    case "super_admin":
      return "Super administrateur"

    case "admin_rh":
      return "Administrateur RH"

    case "responsable_rh":
      return "Responsable RH"

    case "responsable_site":
      return "Responsable de site"

    case "chef_service":
      return "Chef de service"

    case "agent":
      return "Agent"

    default:
      return "Utilisateur"
  }
}

function buildScope(
  profile: {
    role: SecurityRoleKey
    structure_id:
      | string
      | number
      | null
    site_id:
      | string
      | number
      | null
    service_id:
      | string
      | number
      | null
    agent_id:
      | string
      | number
      | null
  },
  customScopeType?:
    | SecurityScopeType
    | null
): SecurityScope {
  const scopeType =
    customScopeType ??
    (() => {
      switch (profile.role) {
        case "super_admin":
        case "admin_rh":
          return "global"

        case "responsable_rh":
          return "structure"

        case "responsable_site":
          return "site"

        case "chef_service":
          return "service"

        case "agent":
          return "self"

        default:
          return "self"
      }
    })()

  switch (scopeType) {
    case "global":
      return {
        type: "global",
      }

    case "structure":
      return {
        type: "structure",

        structureIds:
          profile.structure_id !==
          null
            ? [
                profile.structure_id,
              ]
            : [],
      }

    case "site":
      return {
        type: "site",

        siteIds:
          profile.site_id !== null
            ? [
                profile.site_id,
              ]
            : [],
      }

    case "service":
      return {
        type: "service",

        serviceIds:
          profile.service_id !==
          null
            ? [
                profile.service_id,
              ]
            : [],
      }

    case "self":
      return {
        type: "self",

        agentId:
          profile.agent_id ??
          null,
      }

    default:
      return {
        type: "self",
        agentId: null,
      }
  }
}

export async function GET(
  request: NextRequest
) {
  try {
    const token =
      getBearerToken(request)

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Authentification requise.",
        },
        { status: 401 }
      )
    }

    const {
      data: { user },
      error: authError,
    } =
      await supabaseAdmin.auth.getUser(
        token
      )

    if (
      authError ||
      !user
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Session invalide.",
        },
        { status: 401 }
      )
    }

    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        email,
        nom,
        prenom,
        role,
        custom_role_id,
        agent_id,
        structure_id,
        site_id,
        service_id,
        actif
      `)
      .eq(
        "id",
        user.id
      )
      .maybeSingle()

    if (profileError) {
      throw profileError
    }

    if (
      !profile ||
      profile.actif !== true
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Compte utilisateur indisponible.",
        },
        { status: 403 }
      )
    }

    if (
      !isSecurityRole(
        profile.role
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Rôle utilisateur invalide.",
        },
        { status: 403 }
      )
    }

    const systemRole =
      profile.role

    let displayRole =
      getRoleLabel(
        systemRole
      )

    let permissions:
      PermissionKey[] =
      getRolePermissions(
        systemRole
      )

    let customScopeType:
      | SecurityScopeType
      | null = null

    let customRole:
      | {
          id: number
          key: string
          name: string
          base_role:
            SecurityRoleKey
          scope_type:
            SecurityScopeType
        }
      | null = null

    if (
      profile.custom_role_id
    ) {
      const {
        data: role,
        error: roleError,
      } = await supabaseAdmin
        .from(
          "security_roles"
        )
        .select(`
          id,
          key,
          name,
          base_role,
          scope_type,
          active
        `)
        .eq(
          "id",
          profile.custom_role_id
        )
        .maybeSingle()

      if (roleError) {
        throw roleError
      }

      /*
       * Un rôle personnalisé
       * absent ou désactivé
       * ne doit accorder aucun droit.
       */
      if (
        !role ||
        role.active !== true ||
        !isSecurityRole(
          role.base_role
        )
      ) {
        permissions = []

        return NextResponse.json({
          ok: true,

          user: {
            id:
              profile.id,

            email:
              profile.email,

            system_role:
              systemRole,

            display_role:
              displayRole,

            custom_role_id:
              profile.custom_role_id,

            custom_role:
              null,

            active:
              true,

            permissions,

            scope:
              buildScope(
                profile
              ),
          },
        })
      }

      customRole = {
        id:
          role.id,

        key:
          role.key,

        name:
          role.name,

        base_role:
          role.base_role,

        scope_type:
          role.scope_type,
      }

      displayRole =
        role.name

      customScopeType =
        role.scope_type

      const {
        data:
          permissionRows,
        error:
          permissionsError,
      } =
        await supabaseAdmin
          .from(
            "security_role_permissions"
          )
          .select(
            "permission_key"
          )
          .eq(
            "role_id",
            role.id
          )
          .order(
            "permission_key",
            {
              ascending:
                true,
            }
          )

      if (
        permissionsError
      ) {
        throw permissionsError
      }

      const customPermissions =
        (
          permissionRows ??
          []
        ).map(
          (row) =>
            row.permission_key as
              PermissionKey
        )

      /*
       * Si aucune permission
       * personnalisée n'existe,
       * héritage du rôle parent.
       */
      permissions =
        customPermissions.length >
        0
          ? customPermissions
          : getRolePermissions(
              role.base_role
            )
    }

    const displayName = [
      profile.prenom,
      profile.nom,
    ]
      .filter(Boolean)
      .join(" ")
      .trim()

    return NextResponse.json({
      ok: true,

      user: {
        id:
          profile.id,

        email:
          profile.email,

        display_name:
          displayName ||
          profile.email,

        system_role:
          systemRole,

        display_role:
          displayRole,

        custom_role_id:
          profile.custom_role_id,

        custom_role:
          customRole,

        active:
          profile.actif,

        permissions,

        scope:
          buildScope(
            profile,
            customScopeType
          ),
      },
    })
  } catch (
    error: unknown
  ) {
    console.error(
      "SECURITY ME GET ERROR",
      error
    )

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Impossible de charger le contexte de sécurité.",
      },
      { status: 500 }
    )
  }
}